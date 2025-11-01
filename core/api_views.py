from decimal import Decimal
from datetime import datetime, time
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils.timezone import now, localdate, make_aware, get_current_timezone
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.views import obtain_auth_token
from drf_spectacular.utils import (
    extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
)

from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry, GeneticPredisposition, MedicalDocument
from .serializers import (
    PatientReadSerializer, PatientWriteSerializer, PatientDetailSerializer,
    AppointmentSerializer, PaymentSerializer,
    WaitingRoomEntrySerializer, WaitingRoomEntryDetailSerializer,
    DashboardSummarySerializer,
    GeneticPredispositionSerializer, MedicalDocumentSerializer,
    AppointmentPendingSerializer
)


login_view = obtain_auth_token


# --- Utilidades ---
class GeneticPredispositionViewSet(viewsets.ModelViewSet):
    queryset = GeneticPredisposition.objects.all().order_by("name")
    serializer_class = GeneticPredispositionSerializer

def safe_json(value):
    return float(value) if isinstance(value, Decimal) else value

# --- Serializers auxiliares para PATCH/POST ---
class AppointmentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField()

class AppointmentNotesUpdateSerializer(serializers.Serializer):
    notes = serializers.CharField()

class WaitingRoomStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField()

class RegisterArrivalSerializer(serializers.Serializer):
    patient_id = serializers.IntegerField()
    appointment_id = serializers.IntegerField(required=False)
    is_emergency = serializers.BooleanField(required=False)

class RegisterWalkinSerializer(serializers.Serializer):
    patient_id = serializers.IntegerField()

@extend_schema(responses={200: OpenApiResponse(description="Métricas del día")})
@api_view(["GET"])
def metrics_api(request):
    today = localdate()
    data = {
        "totalPatients": Patient.objects.count(),
        "todayAppointments": Appointment.objects.filter(appointment_date=today).count(),
        "pendingPayments": Payment.objects.filter(status="pending").count(),
        "waivedConsultations": Payment.objects.filter(status="waived").count(),
        "appointmentStatusToday": list(
            Appointment.objects.filter(appointment_date=today).values("status").annotate(total=Count("id"))
        ),
        "paymentMethodsTotals": list(Payment.objects.values("method").annotate(total=Sum("amount"))),
    }
    return JsonResponse(data)

@extend_schema(
    parameters=[
        OpenApiParameter("start_date", str, OpenApiParameter.QUERY),
        OpenApiParameter("end_date", str, OpenApiParameter.QUERY),
        OpenApiParameter("status", str, OpenApiParameter.QUERY),
    ],
    responses={200: DashboardSummarySerializer}
)
@api_view(["GET"])
def dashboard_summary_api(request):
    # ... lógica de filtros, totales y tendencias ...
    return Response({})  # placeholder

@extend_schema(parameters=[OpenApiParameter("q", str, OpenApiParameter.QUERY)], responses={200: PatientReadSerializer(many=True)})
@api_view(["GET"])
def patient_search_api(request):
    query = request.GET.get("q", "")
    if not query:
        return Response([], status=200)
    patients = Patient.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(middle_name__icontains=query) |
        Q(second_last_name__icontains=query) |
        Q(id__icontains=query)
    )[:10]
    serializer = PatientReadSerializer(patients, many=True)
    return Response(serializer.data)

@extend_schema(responses={200: AppointmentSerializer(many=True)})
@api_view(["GET"])
def daily_appointments_api(request):
    today = localdate()
    appointments = (
        Appointment.objects
        .filter(appointment_date=today)
        .select_related("patient")
        .order_by("arrival_time")
    )
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data, status=200)

@extend_schema(
    responses={200: AppointmentSerializer},
    description="Devuelve la cita que actualmente está en estado 'in_consultation'."
)
@api_view(["GET"])
def current_consultation_api(request):
    today = localdate()
    appointment = (
        Appointment.objects
        .filter(appointment_date=today, status="in_consultation")
        .select_related("patient")
        .first()
    )
    if not appointment:
        return Response({"detail": "No hay paciente en consulta actualmente."}, status=404)
    return Response(AppointmentSerializer(appointment).data, status=200)

@extend_schema(request=AppointmentStatusUpdateSerializer, responses={200: AppointmentSerializer})
@api_view(["PATCH"])
def update_appointment_status(request, pk):
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found"}, status=404)
    new_status = request.data.get("status")
    if not new_status:
        return Response({"error": "Missing status"}, status=400)
    if new_status == "in_consultation":
        today = localdate()
        already_in = Appointment.objects.filter(appointment_date=today, status="in_consultation").exclude(id=appointment.id).exists()
        if already_in:
            return Response({"error": "Ya existe un paciente en consulta."}, status=400)
    if appointment.can_transition(new_status):
        appointment.update_status(new_status)
        return Response(AppointmentSerializer(appointment).data)
    return Response({"error": f"No se puede pasar de {appointment.status} a {new_status}"}, status=400)

@extend_schema(request=AppointmentNotesUpdateSerializer, responses={200: AppointmentSerializer})
@api_view(["PATCH"])
def update_appointment_notes(request, pk):
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found"}, status=404)
    notes = request.data.get("notes")
    if notes is None:
        return Response({"error": "Missing notes"}, status=400)
    appointment.notes = notes
    appointment.save(update_fields=["notes"])
    Event.objects.create(entity="Appointment", action="update_notes", actor=str(request.user) if request.user.is_authenticated else "system", timestamp=now())
    return Response(AppointmentSerializer(appointment).data)

@extend_schema(request=WaitingRoomStatusUpdateSerializer, responses={200: WaitingRoomEntrySerializer})
@api_view(["PATCH"])
def update_waitingroom_status(request, pk):
    entry = get_object_or_404(WaitingRoomEntry, pk=pk)
    new_status = request.data.get("status")
    if not new_status:
        return Response({"error": "Missing status"}, status=400)
    entry.status = new_status
    entry.save(update_fields=["status"])
    return Response(WaitingRoomEntrySerializer(entry).data)

@extend_schema(
    request=RegisterArrivalSerializer,
    responses={201: WaitingRoomEntrySerializer}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register_arrival(request):
    serializer = RegisterArrivalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    from typing import Any, Dict, cast
    validated = cast(Dict[str, Any], serializer.validated_data)

    patient_id = validated["patient_id"]
    appointment_id = validated.get("appointment_id")

    patient = get_object_or_404(Patient, pk=patient_id)
    appointment = Appointment.objects.filter(pk=appointment_id).first() if appointment_id else None

    # 🔹 Validación: evitar duplicados en la Sala de Espera
    from django.utils.timezone import localdate
    existing = WaitingRoomEntry.objects.filter(
        patient=patient,
        created_at__date=localdate()
    ).exclude(status__in=["completed", "canceled"])

    if existing.exists():
        return Response(
            {"detail": "El paciente ya está en la sala de espera"},
            status=400
        )

    # Crear nueva entrada
    entry = WaitingRoomEntry.objects.create(
        patient=patient,
        appointment=appointment,
        status="waiting"
    )

    return Response(WaitingRoomEntrySerializer(entry).data, status=201)

@extend_schema(
    responses={200: OpenApiResponse(description="Grupos de sala de espera para hoy (por estado y prioridad)")}
)
@api_view(["GET"])
def waitingroom_groups_today_api(request):
    today = localdate()

    # 🔹 Agrupación por estado
    groups_by_status = (
        WaitingRoomEntry.objects
        .filter(arrival_time__date=today)
        .values("status")
        .annotate(total=Count("id"))
        .order_by("status")
    )

    # 🔹 Agrupación por prioridad
    groups_by_priority = (
        WaitingRoomEntry.objects
        .filter(arrival_time__date=today)
        .values("priority")
        .annotate(total=Count("id"))
        .order_by("priority")
    )

    return Response({
        "by_status": list(groups_by_status),
        "by_priority": list(groups_by_priority),
    })

@extend_schema(responses={200: PaymentSerializer(many=True)})
@api_view(["GET"])
def payment_summary_api(request):
    payments = Payment.objects.values("method").annotate(total=Sum("amount"))
    return Response(list(payments))

@extend_schema(responses={200: PaymentSerializer(many=True)})
@api_view(["GET"])
def waived_consultations_api(request):
    waived = Payment.objects.filter(status="waived")
    serializer = PaymentSerializer(waived, many=True)
    return Response(serializer.data)

@extend_schema(
    responses={200: OpenApiResponse(description="Resumen agregado de auditoría")}
)
@api_view(["GET"])
def audit_dashboard_api(request):
    data = {
        "total_events": Event.objects.count(),
        "by_entity": list(Event.objects.values("entity").annotate(total=Count("id"))),
        "by_action": list(Event.objects.values("action").annotate(total=Count("id"))),
    }
    return Response(data)


@extend_schema(responses={200: OpenApiResponse(description="Eventos de auditoría")})
@api_view(["GET"])
def event_log_api(request):
    events = Event.objects.all().order_by("-timestamp")[:100]
    data = [
        {"entity": e.entity, "action": e.action, "actor": e.actor, "timestamp": e.timestamp}
        for e in events
    ]
    return Response(data)


@extend_schema(responses={200: OpenApiResponse(description="Auditoría por cita")})
@api_view(["GET"])
def audit_by_appointment(request, appointment_id):
    events = Event.objects.filter(entity="Appointment", entity_id=appointment_id).order_by("-timestamp")
    data = [{"action": e.action, "actor": e.actor, "timestamp": e.timestamp} for e in events]
    return Response(data)


@extend_schema(responses={200: "Eventos de auditoría por paciente"})
@api_view(["GET"])
def audit_by_patient(request, patient_id):
    from .serializers import EventSerializer
    events = Event.objects.filter(entity="Patient", entity_id=patient_id).order_by("-timestamp")
    serializer = EventSerializer(events, many=True)
    return Response(serializer.data)


# --- ViewSets ---
class MedicalDocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD de documentos clínicos.
    - GET /documents/?patient={id} → lista documentos de un paciente
    - POST /documents/ (multipart) → subir documento
    - DELETE /documents/{id}/ → eliminar documento
    """
    queryset = MedicalDocument.objects.all().order_by("-uploaded_at")
    serializer_class = MedicalDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        file = self.request.FILES.get("file")
        if not file:
            raise ValidationError({"file": "Debe adjuntar un archivo."})

        # Validación de extensión
        allowed_extensions = ["pdf", "jpg", "jpeg", "png"]
        filename = getattr(file, "name", None)
        if not filename:
            raise ValidationError({"file": "El archivo no tiene nombre válido."})

        ext = filename.rsplit(".", 1)[-1].lower()
        if ext not in allowed_extensions:
            raise ValidationError({"file": f"Formato no permitido: .{ext}"})

        # Validación de tamaño (ej. 10 MB)
        size = getattr(file, "size", None)
        if size is None:
            raise ValidationError({"file": "No se pudo determinar el tamaño del archivo."})

        max_size = 10 * 1024 * 1024
        if size > max_size:
            raise ValidationError({"file": "El archivo excede el tamaño máximo de 10 MB."})

        # 👇 Aquí está la clave: asignamos patient y uploaded_by
        patient_id = self.request.data.get("patient")
        if not patient_id:
            raise ValidationError({"patient": "Debe especificar el paciente."})

        serializer.save(
            patient_id=patient_id,
            uploaded_by=str(self.request.user),
        )



class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        from .serializers import (
            PatientListSerializer,
            PatientDetailSerializer,
            PatientWriteSerializer,
            PatientReadSerializer,
        )
        if self.action == "list":
            return PatientListSerializer
        if self.action == "retrieve":
            return PatientDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return PatientWriteSerializer
        return PatientReadSerializer

    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        patient = self.get_object()
        from .serializers import PaymentSerializer
        payments = Payment.objects.filter(appointment__patient=patient)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def documents(self, request, pk=None):
        patient = self.get_object()
        from .serializers import MedicalDocumentSerializer

        if request.method == "GET":
            docs = patient.documents.all().order_by("-uploaded_at")
            serializer = MedicalDocumentSerializer(docs, many=True)
            return Response(serializer.data)

        if request.method == "POST":
            serializer = MedicalDocumentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(patient=patient, uploaded_by=str(request.user))
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=["get"])
    def completed_appointments(self, request, pk=None):
        patient = self.get_object()
        from .serializers import AppointmentSerializer
        appointments = Appointment.objects.filter(
            patient=patient,
            status="completed"
        ).order_by("-appointment_date")
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def pending_appointments(self, request, pk=None):
        patient = self.get_object()
        from .serializers import AppointmentSerializer
        appointments = Appointment.objects.filter(
            patient=patient,
            status__in=["pending", "arrived", "in_consultation"]
        ).order_by("appointment_date")
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)


@extend_schema(
    responses={200: WaitingRoomEntrySerializer(many=True)},
    description="Devuelve todas las entradas de la sala de espera del día actual."
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def waitingroom_entries_today_api(request):
    today = localdate()
    qs = (
        WaitingRoomEntry.objects
        .filter(arrival_time__date=today)
        .select_related("patient", "appointment")
        .order_by("order", "arrival_time")
    )
    serializer = WaitingRoomEntrySerializer(qs, many=True)
    return Response(serializer.data, status=200)


@extend_schema(
    responses={200: AppointmentPendingSerializer(many=True)},
    description="Devuelve citas con saldo pendiente (expected_amount > suma de pagos pagados), incluyendo estado financiero."
)
@api_view(["GET"])
def appointments_pending_api(request):
    appointments = Appointment.objects.select_related("patient").prefetch_related("payment_set")

    pending = []
    for appt in appointments:
        expected = appt.expected_amount or 0
        total_paid = sum(
            [float(p.amount) for p in appt.payment_set.all() if p.status == "paid"]
        )
        if float(expected) > total_paid:
            pending.append(appt)

    serializer = AppointmentPendingSerializer(pending, many=True)
    return Response(serializer.data, status=200)


def recalc_appointment_status(appointment: Appointment):
    expected = Decimal(appointment.expected_amount or 0)
    total_paid = Payment.objects.filter(
        appointment=appointment, status="paid"
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")

    if total_paid >= expected and expected > 0:
        appointment.status = "paid"
    else:
        appointment.status = "pending"
    appointment.save(update_fields=["status"])
    


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()

    def get_serializer_class(self):
        from .serializers import AppointmentSerializer, AppointmentDetailSerializer
        if self.action in ["list", "retrieve"]:
            return AppointmentDetailSerializer
        return AppointmentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def perform_create(self, serializer):
        payment = serializer.save()
        recalc_appointment_status(payment.appointment)

    def perform_update(self, serializer):
        payment = serializer.save()
        recalc_appointment_status(payment.appointment)

    def perform_destroy(self, instance):
        appointment = instance.appointment
        super().perform_destroy(instance)
        recalc_appointment_status(appointment)


class WaitingRoomEntryViewSet(viewsets.ModelViewSet):
    queryset = WaitingRoomEntry.objects.all()
    serializer_class = WaitingRoomEntrySerializer
