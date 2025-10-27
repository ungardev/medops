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

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
)

from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry
from .serializers import (
    PatientReadSerializer, PatientWriteSerializer, PatientDetailSerializer,
    AppointmentSerializer, PaymentSerializer,
    WaitingRoomEntrySerializer, WaitingRoomEntryDetailSerializer,
    DashboardSummarySerializer
)

# --- Utilidades ---
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

@extend_schema(request=RegisterArrivalSerializer, responses={201: WaitingRoomEntrySerializer})
@api_view(["POST"])
def register_arrival(request):
    serializer = RegisterArrivalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    from typing import cast, Dict, Any
    validated = cast(Dict[str, Any], serializer.validated_data)

    patient_id = validated["patient_id"]
    appointment_id = validated.get("appointment_id")
    is_emergency = validated.get("is_emergency", False)

    patient = get_object_or_404(Patient, pk=patient_id)
    appointment = Appointment.objects.filter(pk=appointment_id).first() if appointment_id else None

    entry = WaitingRoomEntry.objects.create(
        patient=patient,
        appointment=appointment,
        is_emergency=is_emergency,
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


@extend_schema(responses={200: OpenApiResponse(description="Auditoría por paciente")})
@api_view(["GET"])
def audit_by_patient(request, patient_id):
    events = Event.objects.filter(entity="Patient", entity_id=patient_id).order_by("-timestamp")
    data = [{"action": e.action, "actor": e.actor, "timestamp": e.timestamp} for e in events]
    return Response(data)


# --- ViewSets ---
class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return PatientReadSerializer
        if self.action == "retrieve":
            return PatientDetailSerializer
        if self.action in ["create", "update", "partial_update"]:
            return PatientWriteSerializer
        return PatientReadSerializer

    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        patient = self.get_object()
        payments = Payment.objects.filter(appointment__patient=patient)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class WaitingRoomEntryViewSet(viewsets.ModelViewSet):
    queryset = WaitingRoomEntry.objects.all()
    serializer_class = WaitingRoomEntrySerializer
