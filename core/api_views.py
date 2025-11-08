from decimal import Decimal
from datetime import datetime, time
from django.conf import settings
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.http import JsonResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from django.utils.timezone import now, localdate, make_aware
from django.core.paginator import Paginator
from django.core.exceptions import ValidationError
from typing import Dict, Any, cast

# Excel
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.worksheet.worksheet import Worksheet
from openpyxl.drawing.image import Image as XLImage

# PDF
import io
import os
import logging
import traceback
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
)
from reportlab.lib.styles import getSampleStyleSheet

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.views import obtain_auth_token
from drf_spectacular.utils import (
    extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
)

from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry, GeneticPredisposition, MedicalDocument, Diagnosis, Treatment, Prescription, ChargeOrder, ChargeItem, InstitutionSettings, DoctorOperator

from .serializers import (
    PatientReadSerializer, PatientWriteSerializer, PatientDetailSerializer,
    AppointmentSerializer, PaymentSerializer,
    WaitingRoomEntrySerializer, WaitingRoomEntryDetailSerializer,
    DashboardSummarySerializer,
    GeneticPredispositionSerializer, MedicalDocumentSerializer,
    AppointmentPendingSerializer, DiagnosisSerializer, TreatmentSerializer, PrescriptionSerializer,
    AppointmentDetailSerializer, ChargeOrderSerializer, ChargeItemSerializer, ChargeOrderPaymentSerializer,
    EventSerializer, ReportRowSerializer, ReportFiltersSerializer, ReportExportSerializer, InstitutionSettingsSerializer,
    DoctorOperatorSerializer
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
    # Rango de fechas
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    today = localdate()

    # Defaults: últimos 7 días
    if not start_date or not end_date:
        end_date = today
        start_date = today - timezone.timedelta(days=6)

    # Parse seguro
    def parse_d(d):
        try:
            return parse_date(str(d))
        except Exception:
            return None

    start = parse_d(start_date) or (today - timezone.timedelta(days=6))
    end = parse_d(end_date) or today

    # Finanzas
    orders_qs = ChargeOrder.objects.exclude(status="void")
    total_amount = orders_qs.aggregate(s=Sum("total")).get("s") or Decimal("0")
    confirmed_amount = Payment.objects.filter(status="confirmed").aggregate(s=Sum("amount")).get("s") or Decimal("0")
    balance_due = orders_qs.aggregate(s=Sum("balance_due")).get("s") or Decimal("0")
    # Fallidos: si luego implementamos pagos fallidos; por ahora 0
    failed_amount = Decimal("0")

    # 🔹 Exoneradas (waived)
    waived_qs = ChargeOrder.objects.filter(status="waived")
    total_waived = waived_qs.count()
    estimated_waived_amount = waived_qs.aggregate(s=Sum("total")).get("s") or Decimal("0")

    # Clínico-operativo (día)
    appts_today = Appointment.objects.filter(appointment_date=today)
    total_appointments = appts_today.count()
    completed_appointments = appts_today.filter(status="completed").count()
    pending_appointments = appts_today.exclude(status__in=["completed", "canceled"]).count()

    # Tendencias (últimos 7 días)
    def date_range(d1, d2):
        delta = (d2 - d1).days
        return [d1 + timezone.timedelta(days=i) for i in range(delta + 1)]

    days = date_range(start, end)
    # Citas completadas por día
    appt_trend = []
    for d in days:
        cnt = Appointment.objects.filter(appointment_date=d, status="completed").count()
        appt_trend.append({"date": d.isoformat(), "value": cnt})

    # Pagos confirmados por día
    pay_trend = []
    for d in days:
        amt = Payment.objects.filter(status="confirmed", received_at__date=d).aggregate(s=Sum("amount")).get("s") or Decimal("0")
        pay_trend.append({"date": d.isoformat(), "value": float(amt)})

    # Balance acumulado (total - balance_due) como indicador
    balance_trend = []
    for d in days:
        total_d = ChargeOrder.objects.filter(issued_at__date=d).aggregate(s=Sum("total")).get("s") or Decimal("0")
        balance_d = ChargeOrder.objects.filter(issued_at__date=d).aggregate(s=Sum("balance_due")).get("s") or Decimal("0")
        balance_trend.append({"date": d.isoformat(), "value": float(max(total_d - balance_d, Decimal("0")))})

    # Totales de apoyo
    total_patients = Patient.objects.count()
    total_payments = Payment.objects.count()
    total_events = Event.objects.count()

    data = {
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "completed_appointments": completed_appointments,
        "pending_appointments": pending_appointments,
        "total_payments": total_payments,
        "total_events": total_events,
        "total_waived": total_waived,  # 👈 ahora real
        "total_payments_amount": float(confirmed_amount),
        "estimated_waived_amount": float(estimated_waived_amount),  # 👈 ahora real
        "financial_balance": float(max(total_amount - balance_due, Decimal("0"))),
        "appointments_trend": appt_trend,
        "payments_trend": pay_trend,
        "balance_trend": balance_trend,
    }
    return Response(data, status=200)


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
    responses={200: AppointmentDetailSerializer},
    description="Devuelve la cita que actualmente está en estado 'in_consultation'."
)
@api_view(["GET"])
def current_consultation_api(request):
    today = localdate()
    appointment = (
        Appointment.objects
        .filter(appointment_date=today, status="in_consultation")
        .select_related("patient")
        .prefetch_related("diagnoses__treatments", "diagnoses__prescriptions")
        .first()
    )

    if not appointment:
        return Response(status=status.HTTP_204_NO_CONTENT)

    return Response(AppointmentDetailSerializer(appointment).data, status=status.HTTP_200_OK)


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

    # 🔹 Validación: solo un paciente en consulta a la vez
    if new_status == "in_consultation":
        today = localdate()
        already_in = Appointment.objects.filter(
            appointment_date=today,
            status="in_consultation"
        ).exclude(id=appointment.id).exists()
        if already_in:
            return Response({"error": "Ya existe un paciente en consulta."}, status=400)

    # 🔹 Transición de estado
    if appointment.can_transition(new_status):
        appointment.update_status(new_status)

        # 🔹 Sincronizar WaitingRoomEntry asociado
        WaitingRoomEntry.objects.filter(appointment=appointment).update(status=new_status)

        return Response(AppointmentSerializer(appointment).data)

    return Response(
        {"error": f"No se puede pasar de {appointment.status} a {new_status}"},
        status=400
    )
    

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
    is_emergency = validated.get("is_emergency", False)

    patient = get_object_or_404(Patient, pk=patient_id)
    appointment = Appointment.objects.filter(pk=appointment_id).first() if appointment_id else None

    today = localdate()

    # 🔹 Validación: evitar duplicados en la Sala de Espera
    existing = WaitingRoomEntry.objects.filter(
        patient=patient,
        created_at__date=today
    ).exclude(status__in=["completed", "canceled"])

    if existing.exists():
        return Response(
            {"detail": "El paciente ya está en la sala de espera"},
            status=400
        )

    # 🔹 Caso 1: cita programada → usar mark_arrived
    if appointment:
        appointment.mark_arrived(
            priority="emergency" if is_emergency else "normal",
            source_type="scheduled"
        )

    # 🔹 Caso 2: walk‑in → crear Appointment en arrived con hora de llegada
    else:
        appointment = Appointment.objects.create(
            patient=patient,
            appointment_date=today,
            status="arrived",
            arrival_time=timezone.now().time(),
            appointment_type="general",
        )

    # 🔹 Crear entrada en sala de espera con arrival_time explícito
    entry = WaitingRoomEntry.objects.create(
        patient=patient,
        appointment=appointment,
        status="waiting",
        priority="emergency" if is_emergency else "normal",
        source_type="walkin" if not appointment_id else "scheduled",
        arrival_time=timezone.now(),   # 👈 explícito
    )

    # 🔹 Registrar evento de auditoría con severidad y notificación
    Event.objects.create(
        entity="WaitingRoomEntry",
        entity_id=entry.id,
        action="patient_arrived",
        actor=str(request.user) if request.user.is_authenticated else "system",
        metadata={
            "patient_id": patient.id,
            "appointment_id": appointment.id if appointment else None,
            "priority": "emergency" if is_emergency else "normal"
        },
        severity="info",   # evento informativo
        notify=True        # visible en notificaciones del Dashboard
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


@extend_schema(responses={200: EventSerializer(many=True)})
@api_view(["GET"])
def event_log_api(request):
    events = Event.objects.all().order_by("-timestamp")[:100]
    serializer = EventSerializer(events, many=True)
    return Response(serializer.data, status=200)


@extend_schema(responses={200: EventSerializer(many=True)})
@api_view(["GET"])
def notifications_api(request):
    critical = Event.objects.filter(notify=True).order_by("-timestamp")[:50]
    serializer = EventSerializer(critical, many=True)
    return Response(serializer.data, status=200)


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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def waitingroom_entries_today_api(request):
    tz = timezone.get_current_timezone()
    today = timezone.localdate()

    start = datetime.combine(today, time.min)
    end = datetime.combine(today, time.max)

    if timezone.is_naive(start):
        start = timezone.make_aware(start, tz)
    if timezone.is_naive(end):
        end = timezone.make_aware(end, tz)

    qs = (
        WaitingRoomEntry.objects
        .filter(
            Q(appointment__appointment_date=today) |
            Q(arrival_time__range=(start, end)) |
            Q(created_at__date=today)   # 👈 clave para no perder walk‑ins
        )
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
    # Traemos pacientes y pagos relacionados en una sola consulta
    appointments = Appointment.objects.select_related("patient").prefetch_related("payments")

    pending = []
    for appt in appointments:
        try:
            expected_val = float(appt.expected_amount or 0)
        except (TypeError, ValueError):
            expected_val = 0.0

        total_paid = 0.0
        for p in appt.payments.all():
            if p.status == "paid":
                try:
                    total_paid += float(p.amount or 0)
                except (TypeError, ValueError):
                    continue

        if expected_val > total_paid:
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
        if self.action in ["list", "retrieve"]:
            return AppointmentDetailSerializer
        return AppointmentSerializer

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="charge-order",
        permission_classes=[IsAuthenticated],
    )
    def charge_order(self, request, pk=None):
        """
        GET  → devuelve la orden vigente asociada a la cita (404 si no existe).
        POST → crea una nueva orden solo si no hay una vigente (open/partially_paid).
        """
        appointment = self.get_object()

        # --- GET: devolver la última orden activa ---
        if request.method == "GET":
            order = appointment.charge_orders.exclude(status="void").order_by("-issued_at").first()
            if not order:
                return Response({"detail": "No charge order"}, status=status.HTTP_404_NOT_FOUND)
            serializer = ChargeOrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # --- POST: crear orden si no existe una vigente ---
        if request.method == "POST":
            existing = appointment.charge_orders.filter(status__in=["open", "partially_paid"]).first()
            if existing:
                return Response(
                    {"detail": "Charge order already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order = ChargeOrder.objects.create(
                appointment=appointment,
                patient=appointment.patient,
                currency="USD",   # ajusta según tu lógica
                status="open",
            )
            serializer = ChargeOrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar pagos.
    Permite crear, listar, confirmar y rechazar pagos.
    """
    queryset = Payment.objects.select_related("appointment", "charge_order")
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().order_by("-received_at")
        appt = self.request.query_params.get("appointment")
        order = self.request.query_params.get("charge_order")
        patient = self.request.query_params.get("patient")
        if appt:
            qs = qs.filter(appointment_id=appt)
        if order:
            qs = qs.filter(charge_order_id=order)
        if patient:
            qs = qs.filter(appointment__patient_id=patient)
        return qs

    def perform_create(self, serializer):
        """
        Al crear un pago, recalcula totales de la orden asociada.
        """
        payment = serializer.save()
        order = payment.charge_order
        order.recalc_totals()
        order.save(update_fields=["total", "balance_due", "status"])
        return payment

    def perform_update(self, serializer):
        """
        Al actualizar un pago, recalcula totales de la orden asociada.
        """
        payment = serializer.save()
        order = payment.charge_order
        order.recalc_totals()
        order.save(update_fields=["total", "balance_due", "status"])
        return payment

    def perform_destroy(self, instance):
        """
        Al eliminar un pago, recalcula totales de la orden asociada.
        """
        order = instance.charge_order
        instance.delete()
        order.recalc_totals()
        order.save(update_fields=["total", "balance_due", "status"])

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        """
        Confirma un pago pendiente y actualiza la orden asociada.
        """
        payment = self.get_object()
        actor = getattr(request.user, "username", "")
        note = request.data.get("note", "")
        payment.confirm(actor=actor, note=note)
        return Response({"status": "confirmed"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """
        Rechaza un pago pendiente y actualiza la orden asociada.
        """
        payment = self.get_object()
        actor = getattr(request.user, "username", "")
        reason = request.data.get("reason", "")
        payment.reject(actor=actor, reason=reason)
        return Response({"status": "rejected"}, status=status.HTTP_200_OK)


class WaitingRoomEntryViewSet(viewsets.ModelViewSet):
    queryset = WaitingRoomEntry.objects.all()
    serializer_class = WaitingRoomEntrySerializer


class DiagnosisViewSet(viewsets.ModelViewSet):
    queryset = Diagnosis.objects.all().select_related("appointment")
    serializer_class = DiagnosisSerializer

    def perform_create(self, serializer):
        diagnosis = serializer.save()
        # Audit trail
        Event.objects.create(
            entity="Diagnosis",
            entity_id=diagnosis.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
        )

class TreatmentViewSet(viewsets.ModelViewSet):
    queryset = Treatment.objects.all().select_related("diagnosis")
    serializer_class = TreatmentSerializer

    def perform_create(self, serializer):
        treatment = serializer.save()
        Event.objects.create(
            entity="Treatment",
            entity_id=treatment.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
        )

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all().select_related("diagnosis")
    serializer_class = PrescriptionSerializer

    def perform_create(self, serializer):
        prescription = serializer.save()
        Event.objects.create(
            entity="Prescription",
            entity_id=prescription.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
        )


class ChargeOrderViewSet(viewsets.ModelViewSet):
    queryset = ChargeOrder.objects.select_related("appointment", "patient").prefetch_related("items", "payments")
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        # 🔹 Forzar recálculo de cada orden antes de serializar
        for order in qs:
            order.recalc_totals()
            order.save(update_fields=["total", "balance_due", "status"])
        return qs

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ChargeOrderPaymentSerializer
        return ChargeOrderSerializer

    @action(detail=True, methods=["post"])
    def void(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get("reason", "")
        actor = getattr(request.user, "username", "")
        order.mark_void(reason=reason, actor=actor)
        return Response({"status": "void"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def waive(self, request, pk=None):
        """
        Exonerar (waive) una orden de cobro.
        """
        order = self.get_object()
        reason = request.data.get("reason", "")
        actor = getattr(request.user, "username", "")
        order.mark_waived(reason=reason, actor=actor)
        return Response({"status": "waived"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        order = self.get_object()
        data = []
        for e in Event.objects.filter(entity="ChargeOrder", entity_id=order.id).order_by("-timestamp"):
            notes = e.metadata or {}
            # 🔹 Formateo elegante de notas
            if isinstance(notes, dict):
                if e.action == "payment_registered":
                    notes_str = f"Pago #{notes.get('payment_id')} registrado por ${notes.get('amount')}"
                elif e.action == "void":
                    notes_str = f"Orden anulada. Motivo: {notes.get('reason', '—')}"
                elif e.action == "waived":
                    notes_str = f"Orden exonerada. Motivo: {notes.get('reason', '—')}"
                else:
                    notes_str = ", ".join(f"{k}: {v}" for k, v in notes.items())
            else:
                notes_str = str(notes) if notes else None

            data.append({
                "id": e.id,
                "action": e.action,
                "actor": e.actor,
                "timestamp": e.timestamp,
                "severity": e.severity,
                "notify": e.notify,
                "notes": notes_str,
            })
        return Response(data)

    @action(detail=True, methods=["post"])
    def payments(self, request, pk=None):
        """
        Registrar un pago asociado a esta orden de cobro.
        Siempre se guarda como 'confirmed'.
        """
        order = self.get_object()
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = serializer.save(
            charge_order=order,
            appointment=order.appointment,
            status="confirmed"  # 👈 blindamos aquí
        )

        # 🔹 Recalcular totales y estado de la orden
        order.recalc_totals()
        if order.balance_due <= 0:
            order.status = "paid"
        elif order.payments.filter(status="confirmed").exists():
            order.status = "partially_paid"
        else:
            order.status = "open"
        order.save(update_fields=["total", "balance_due", "status"])

        # 🔹 Registrar evento de auditoría (notificación crítica)
        Event.objects.create(
            entity="ChargeOrder",
            entity_id=order.id,
            action="payment_registered",
            actor=getattr(request.user, "username", None),
            metadata={"payment_id": payment.id, "amount": str(payment.amount)},
            severity="info",
            notify=True,
        )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def export(self, request, pk=None):
        order = self.get_object()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        try:
            # 🔹 Logo institucional con proporción sobria
            logo_path = os.path.join(settings.BASE_DIR, "core", "static", "core", "img", "medops-logo.png")
            if os.path.exists(logo_path):
                try:
                    img = Image(logo_path)
                    img._restrictSize(100, 100)
                    elements.append(img)
                except Exception:
                    elements.append(Paragraph("MedOps", styles["Title"]))
            else:
                elements.append(Paragraph("MedOps", styles["Title"]))
            elements.append(Spacer(1, 12))

            # 🔹 Encabezado
            paciente = str(order.patient) if order.patient else f"Paciente #{order.patient_id or '—'}"
            fecha = order.created_at.strftime("%d/%m/%Y %H:%M") if order.created_at else "—"

            elements.append(Paragraph(f"<b>Orden de Pago #{order.id}</b>", styles["Title"]))
            elements.append(Paragraph(f"Paciente: {paciente}", styles["Normal"]))
            elements.append(Paragraph(f"Fecha: {fecha}", styles["Normal"]))
            elements.append(Spacer(1, 12))

            # 🔹 Tabla de cargos
            data = [["Código", "Descripción", "Cant.", "Precio", "Subtotal"]]
            for item in order.items.all():
                code = item.code or "—"
                desc = item.description or "—"
                qty = item.qty if item.qty is not None else Decimal("0")
                unit_price = item.unit_price if item.unit_price is not None else Decimal("0")
                subtotal = item.subtotal if item.subtotal is not None else Decimal("0")
                data.append([code, desc, str(qty), f"${unit_price:.2f}", f"${subtotal:.2f}"])

            if len(data) == 1:
                data.append(["—", "Sin cargos", "—", "—", "—"])

            table = Table(data, colWidths=[70, 200, 50, 80, 80])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 12))

            # 🔹 Totales
            total = order.total or Decimal("0")
            paid = order.payments.filter(status="confirmed").aggregate(s=Sum("amount")).get("s") or Decimal("0")
            pending = total - paid

            elements.append(Paragraph(f"<b>Total:</b> ${total:.2f}", styles["Normal"]))
            elements.append(Paragraph(f"<b>Pagado:</b> ${paid:.2f}", styles["Normal"]))
            elements.append(Paragraph(f"<b>Pendiente:</b> ${pending:.2f}", styles["Normal"]))
            elements.append(Spacer(1, 24))

            # 🔹 Estado y firma
            estado = order.status.upper() if order.status else "—"
            elements.append(Paragraph(f"Estado de la orden: <b>{estado}</b>", styles["Normal"]))
            elements.append(Spacer(1, 36))

            firma_path = os.path.join(settings.BASE_DIR, "core", "static", "core", "img", "firma.png")
            if os.path.exists(firma_path):
                try:
                    img = Image(firma_path)
                    img._restrictSize(100, 50)
                    elements.append(img)
                except Exception:
                    elements.append(Paragraph("__________________________", styles["Normal"]))
                    elements.append(Paragraph("Firma Digital", styles["Italic"]))
            else:
                elements.append(Paragraph("__________________________", styles["Normal"]))
                elements.append(Paragraph("Firma Digital", styles["Italic"]))

            elements.append(Spacer(1, 12))
            elements.append(Paragraph("Documento generado automáticamente por MedOps", styles["Italic"]))

            # Construir PDF
            doc.build(elements)
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename=f"orden-{order.id}.pdf")

        except Exception as e:
            print("ERROR EXPORT:", e)
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)


class ChargeItemViewSet(viewsets.ModelViewSet):
    """
    CRUD de ítems de una orden de cobro.
    - GET /charge-items/ → lista todos los ítems
    - POST /charge-items/ → crea un ítem
    - GET /charge-items/{id}/ → detalle de un ítem
    - PUT/PATCH /charge-items/{id}/ → actualizar ítem
    - DELETE /charge-items/{id}/ → eliminar ítem
    """
    queryset = ChargeItem.objects.all().select_related("order")
    serializer_class = ChargeItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Al crear un ítem, recalcula automáticamente los totales de la orden.
        """
        item = serializer.save()
        order = item.order
        order.recalc_totals()
        order.save(update_fields=["total", "balance_due"])
        return item

    def perform_update(self, serializer):
        """
        Al actualizar un ítem, recalcula totales.
        """
        item = serializer.save()
        order = item.order
        order.recalc_totals()
        order.save(update_fields=["total", "balance_due"])
        return item

    def perform_destroy(self, instance):
        """
        Al eliminar un ítem, recalcula totales.
        """
        order = instance.order
        instance.delete()
        order.recalc_totals()
        order.save(update_fields=["total", "balance_due"])


@extend_schema(
    request=ReportFiltersSerializer,
    responses={200: ReportRowSerializer(many=True)},
    examples=[
        # Ejemplo de request
        OpenApiExample(
            "Ejemplo de filtros",
            value={"start_date": "2025-11-01", "end_date": "2025-11-07", "type": "financial"},
            request_only=True,
        ),
        # Ejemplo de respuesta financiera
        OpenApiExample(
            "Reporte financiero",
            value=[
                {
                    "id": 1,
                    "date": "2025-11-07",
                    "type": "financial",
                    "entity": "Paciente Demo",
                    "status": "confirmed",
                    "amount": 50.0
                },
                {
                    "id": 2,
                    "date": "2025-11-07",
                    "type": "financial",
                    "entity": "Paciente Demo 2",
                    "status": "pending",
                    "amount": 30.0
                }
            ],
            response_only=True,
        ),
        # Ejemplo de respuesta clínica
        OpenApiExample(
            "Reporte clínico",
            value=[
                {
                    "id": 10,
                    "date": "2025-11-06",
                    "type": "clinical",
                    "entity": "Paciente Demo",
                    "status": "completed",
                    "amount": 0.0
                },
                {
                    "id": 11,
                    "date": "2025-11-06",
                    "type": "clinical",
                    "entity": "Paciente Demo 2",
                    "status": "pending",
                    "amount": 0.0
                }
            ],
            response_only=True,
        ),
    ]
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports_api(request):
    """
    Endpoint institucional de reportes.
    Devuelve datos financieros, clínicos o combinados según filtros.
    """
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    report_type = request.GET.get("type", "financial")

    # 🔹 Parse seguro de fechas
    start = parse_date(start_date) if start_date else None
    end = parse_date(end_date) if end_date else None

    data = []

    if report_type == "financial":
        qs = Payment.objects.all().select_related("appointment__patient")
        if start:
            qs = qs.filter(received_at__date__gte=start)
        if end:
            qs = qs.filter(received_at__date__lte=end)
        for p in qs:
            data.append({
                "id": p.id,
                "date": p.received_at.date().isoformat() if p.received_at else None,
                "type": "financial",
                "entity": str(p.appointment.patient) if p.appointment else "—",
                "status": p.status,
                "amount": float(p.amount or 0),
            })

    elif report_type == "clinical":
        qs = Appointment.objects.all().select_related("patient")
        if start:
            qs = qs.filter(appointment_date__gte=start)
        if end:
            qs = qs.filter(appointment_date__lte=end)
        for a in qs:
            data.append({
                "id": a.id,
                "date": a.appointment_date.isoformat() if a.appointment_date else None,
                "type": "clinical",
                "entity": str(a.patient),
                "status": a.status,
                "amount": float(a.expected_amount or 0),
            })

    else:  # combined
        payments = Payment.objects.all().select_related("appointment__patient")
        appointments = Appointment.objects.all().select_related("patient")
        if start:
            payments = payments.filter(received_at__date__gte=start)
            appointments = appointments.filter(appointment_date__gte=start)
        if end:
            payments = payments.filter(received_at__date__lte=end)
            appointments = appointments.filter(appointment_date__lte=end)

        for p in payments:
            data.append({
                "id": p.id,
                "date": p.received_at.date().isoformat() if p.received_at else None,
                "type": "financial",
                "entity": str(p.appointment.patient) if p.appointment else "—",
                "status": p.status,
                "amount": float(p.amount or 0),
            })
        for a in appointments:
            data.append({
                "id": a.id,
                "date": a.appointment_date.isoformat() if a.appointment_date else None,
                "type": "clinical",
                "entity": str(a.patient),
                "status": a.status,
                "amount": float(a.expected_amount or 0),
            })

    serializer = ReportRowSerializer(data, many=True)
    return Response(serializer.data, status=200)


# --- Funciones auxiliares para escalar imágenes ---
def scaled_image(path: str, max_width: int, max_height: int) -> Image:
    img = Image(path)
    iw, ih = img.drawWidth, img.drawHeight
    scale = min(max_width / iw, max_height / ih)
    img.drawWidth = iw * scale
    img.drawHeight = ih * scale
    return img

def scaled_excel_image(path: str, max_width: int, max_height: int) -> XLImage:
    img = XLImage(path)
    iw, ih = img.width, img.height
    scale = min(max_width / iw, max_height / ih)
    img.width = int(iw * scale)
    img.height = int(ih * scale)
    return img


@extend_schema(
    request=ReportExportSerializer,
    responses={200: OpenApiResponse(description="Archivo PDF/Excel exportado")},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reports_export_api(request):
    """
    Exporta un reporte en PDF o Excel según los filtros.
    Layout institucional con logo, encabezado, tabla y pie de auditoría.
    """
    serializer = ReportExportSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    validated: Dict[str, Any] = cast(Dict[str, Any], serializer.validated_data)
    export_format = validated["format"]
    filters = validated.get("filters", {})

    # --- Configuración institucional y médico operador ---
    inst = InstitutionSettings.objects.first()
    doc_op = None
    try:
        from .models import DoctorOperator, Report
        doc_op = DoctorOperator.objects.first()
    except Exception:
        from .models import Report
        pass

    # --- Query de reportes con serializer ---
    rows = Report.objects.filter(**filters)
    serialized = ReportRowSerializer(rows, many=True).data

    if export_format == "pdf":
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # --- Logo institucional ---
        if inst and inst.logo and os.path.exists(inst.logo.path):
            logo = scaled_image(inst.logo.path, max_width=120, max_height=120)
            elements.append(logo)
            elements.append(Spacer(1, 12))

        # --- Encabezado institucional ---
        if inst:
            elements.append(Paragraph(f"<b>{inst.name}</b>", styles["Title"]))
            elements.append(Paragraph(f"Dirección: {inst.address}", styles["Normal"]))
            elements.append(Paragraph(f"Tel: {inst.phone} • RIF: {inst.tax_id}", styles["Normal"]))
            elements.append(Spacer(1, 12))

        # --- Identidad del médico operador ---
        if doc_op:
            elements.append(Paragraph(
                f"Médico operador: {doc_op.full_name} • Colegiado: {doc_op.colegiado_id} • {doc_op.specialty or ''}",
                styles["Normal"]
            ))
            elements.append(Spacer(1, 8))

        # --- Título del reporte ---
        elements.append(Paragraph("<b>Reporte Institucional</b>", styles["Heading2"]))
        elements.append(Paragraph(f"Filtros aplicados: {filters}", styles["Normal"]))
        elements.append(Spacer(1, 12))

        # --- Tabla de datos reales con serializer ---
        data = [["ID", "Fecha", "Tipo", "Entidad", "Estado", "Monto", "Moneda"]]
        for r in serialized:
            data.append([
                r["id"],
                r["date"],
                r["type"],
                r["entity"],
                r["status"],
                f"{r['amount']:.2f}",
                r.get("currency", "VES")
            ])
        table = Table(data, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#003366")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 24))

        # --- Firma del médico ---
        if doc_op and doc_op.signature and os.path.exists(doc_op.signature.path):
            sig_img = scaled_image(doc_op.signature.path, max_width=100, max_height=50)
            elements.append(sig_img)
        else:
            elements.append(Paragraph("__________________________", styles["Normal"]))
            elements.append(Paragraph("Firma Digital", styles["Italic"]))
        elements.append(Spacer(1, 12))

        # --- Pie de auditoría ---
        user = str(request.user) if request.user.is_authenticated else "system"
        elements.append(Paragraph(f"Generado por: {user}", styles["Normal"]))
        elements.append(Paragraph(f"Fecha de generación: {now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))

        doc.build(elements)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename="reporte.pdf")

    elif export_format == "excel":
        buffer = io.BytesIO()
        wb = Workbook()
        ws: Worksheet = cast(Worksheet, wb.active)
        ws.title = "Reporte Institucional"

        # --- Logo institucional ---
        if inst and inst.logo and os.path.exists(inst.logo.path):
            img = scaled_excel_image(inst.logo.path, max_width=120, max_height=120)
            ws.add_image(img, "A1")

        # --- Encabezado institucional ---
        if inst:
            ws["C1"] = inst.name
            ws["C1"].font = Font(bold=True, size=14)
            ws["C2"] = f"Dirección: {inst.address}"
            ws["C3"] = f"Tel: {inst.phone} • RIF: {inst.tax_id}"
        if doc_op:
            ws["C4"] = f"Médico operador: {doc_op.full_name} • Colegiado: {doc_op.colegiado_id} • {doc_op.specialty or ''}"
        ws["C6"] = f"Filtros aplicados: {filters}"

        # --- Tabla de datos reales con serializer ---
        headers = ["ID", "Fecha", "Tipo", "Entidad", "Estado", "Monto", "Moneda"]
        ws.append([])
        ws.append(headers)

        for r in serialized:
            ws.append([
                r["id"],
                r["date"],
                r["type"],
                r["entity"],
                r["status"],
                r["amount"],
                r.get("currency", "VES")
            ])

        # Estilo de encabezados
        header_row = ws.max_row - len(serialized)
        for cell in ws[header_row]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.alignment = Alignment(horizontal="center")
            cell.fill = PatternFill(start_color="003366", end_color="003366", fill_type="solid")

        # Colores alternos en filas
        for row_idx, row in enumerate(ws.iter_rows(min_row=header_row+1, max_row=ws.max_row), start=0):
            fill_color = "F2F2F2" if row_idx % 2 == 0 else "FFFFFF"
            for cell in row:
                cell.fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")

        # Ajuste automático de columnas
        for col in ws.columns:
            max_length = 0
            col_letter = col[0].column_letter
            for cell in col:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass
            ws.column_dimensions[col_letter].width = max_length + 2

        # --- Pie de auditoría ---
        user = str(request.user) if request.user.is_authenticated else "system"
        ws.append([])
        ws.append([f"Generado por: {user}"])
        ws.append([f"Fecha de generación: {now().strftime('%Y-%m-%d %H:%M:%S')}"])

        wb.save(buffer)
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename="reporte.xlsx")

    return Response({"error": "Formato no soportado"}, status=400)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def institution_settings_api(request):
    """
    GET → devuelve la configuración institucional actual
    PUT/PATCH → actualiza la configuración institucional
    """
    settings_obj, _ = InstitutionSettings.objects.get_or_create(id=1)

    if request.method == "GET":
        serializer = InstitutionSettingsSerializer(settings_obj)
        return Response(serializer.data)

    # PUT o PATCH → actualización parcial
    serializer = InstitutionSettingsSerializer(
        settings_obj, data=request.data, partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save(updated_by=request.user)
    return Response(serializer.data)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def doctor_operator_settings_api(request):
    """
    GET → devuelve la configuración del médico operador
    PUT/PATCH → actualiza la configuración del médico operador
    """
    obj, _ = DoctorOperator.objects.get_or_create(id=1)

    if request.method == "GET":
        serializer = DoctorOperatorSerializer(obj)
        return Response(serializer.data)

    # PUT o PATCH → actualización parcial
    serializer = DoctorOperatorSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(updated_by=request.user)
    return Response(serializer.data)


    serializer = DoctorOperatorSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(updated_by=request.user)
    return Response(serializer.data)