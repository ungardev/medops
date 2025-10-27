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
    start_date = parse_date(request.GET.get("start_date")) if request.GET.get("start_date") else None
    end_date = parse_date(request.GET.get("end_date")) if request.GET.get("end_date") else None
    status_filter = request.GET.get("status")

    filters = Q()
    if start_date:
        filters &= Q(appointment_date__gte=start_date)
    if end_date:
        filters &= Q(appointment_date__lte=end_date)
    if status_filter:
        filters &= Q(status=status_filter)

    total_patients = Patient.objects.count()
    total_appointments = Appointment.objects.filter(filters).count()
    completed_appointments = Appointment.objects.filter(filters & Q(status="completed")).count()
    pending_appointments = Appointment.objects.filter(filters & Q(status="pending")).count()
    total_payments = Payment.objects.filter(appointment__in=Appointment.objects.filter(filters)).count()
    total_events = Event.objects.count()
    total_waived = Payment.objects.filter(status="waived", appointment__in=Appointment.objects.filter(filters)).count()

    total_payments_amount = Payment.objects.filter(
        appointment__in=Appointment.objects.filter(filters)
    ).aggregate(total=Sum("amount"))["total"] or 0
    estimated_waived_amount = total_waived * 50
    financial_balance = total_payments_amount - estimated_waived_amount

    appointments_by_month = (
        Appointment.objects.filter(filters)
        .annotate(month=TruncMonth("appointment_date"))
        .values("month").annotate(total=Count("id")).order_by("month")
    )
    appointments_trend = [
        {"month": a["month"].strftime("%b %Y"), "citas": a["total"]}
        for a in appointments_by_month if a["month"]
    ]

    payments_by_week = (
        Payment.objects.filter(appointment__in=Appointment.objects.filter(filters))
        .annotate(week=TruncWeek("received_at"))
        .values("week").annotate(total=Sum("amount")).order_by("week")
    )
    payments_trend = [
        {"week": p["week"].strftime("W%U %Y"), "pagos": safe_json(p["total"] or 0)}
        for p in payments_by_week if p["week"]
    ]

    waived_by_week = (
        Payment.objects.filter(status="waived", appointment__in=Appointment.objects.filter(filters))
        .annotate(week=TruncWeek("received_at"))
        .values("week").annotate(total=Count("id")).order_by("week")
    )
    waived_dict = {w["week"]: w["total"] * 50 for w in waived_by_week if w["week"]}

    balance_trend = []
    for p in payments_by_week:
        week = p["week"]
        if week:
            pagos = safe_json(p["total"] or 0)
            exoneraciones = waived_dict.get(week, 0)
            balance_trend.append({"week": week.strftime("W%U %Y"), "balance": pagos - exoneraciones})

    data = {
        "total_patients": int(total_patients),
        "total_appointments": int(total_appointments),
        "completed_appointments": int(completed_appointments),
        "pending_appointments": int(pending_appointments),
        "total_payments": int(total_payments),
        "total_events": int(total_events),
        "total_waived": int(total_waived),
        "total_payments_amount": safe_json(total_payments_amount),
        "estimated_waived_amount": safe_json(estimated_waived_amount),
        "financial_balance": safe_json(financial_balance),
        "appointments_trend": appointments_trend,
        "payments_trend": payments_trend,
        "balance_trend": balance_trend,
    }
    serializer = DashboardSummarySerializer(instance=data)
    return JsonResponse(serializer.data, safe=False)

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
        already_in = Appointment.objects.filter(
            appointment_date=today, status="in_consultation"
        ).exclude(id=appointment.id).exists()
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

    Event.objects.create(
        entity="Appointment",
        action="update_notes",
        actor=str(request.user) if request.user.is_authenticated else "system",
        timestamp=now(),
    )
    return Response(AppointmentSerializer(appointment).data)


@extend_schema(request=WaitingRoomStatusUpdateSerializer, responses={200: WaitingRoomEntrySerializer})
@api_view(["PATCH"])
def update_waitingroom_status(request, pk):
    try:
        entry = WaitingRoomEntry.objects.get(pk=pk)
    except WaitingRoomEntry.DoesNotExist:
        return Response({"error": "WaitingRoomEntry not found"}, status=404)

    new_status = request.data.get("status")
    if not new_status:
        return Response({"error": "Missing status"}, status=400)

    if new_status == "in_consultation":
        today = localdate()
        already_in = WaitingRoomEntry.objects.filter(
            appointment__appointment_date=today, status="in_consultation"
        ).exclude(id=entry.id).exists()
        if already_in:
            return Response({"error": "Ya existe un paciente en consulta."}, status=400)

    if entry.can_transition(new_status):
        entry.update_status(new_status)
        return Response(WaitingRoomEntrySerializer(entry).data)
    return Response({"error": f"No se puede pasar de {entry.status} a {new_status}"}, status=400)


@extend_schema(request=RegisterWalkinSerializer, responses={201: WaitingRoomEntrySerializer})
@api_view(["POST"])
def register_walkin_api(request):
    patient_id = request.data.get("patient_id")
    if not patient_id:
        return Response({"error": "Missing patient_id"}, status=400)

    today = localdate()
    appointment = Appointment.objects.create(
        patient_id=patient_id, appointment_date=today, status="pending"
    )
    entry = WaitingRoomEntry.objects.create(
        patient_id=patient_id,
        appointment=appointment,
        status="waiting",
        priority="walkin",
        arrival_time=now()
    )
    return Response(WaitingRoomEntrySerializer(entry).data, status=201)


@extend_schema(request=RegisterArrivalSerializer, responses={200: WaitingRoomEntryDetailSerializer})
@api_view(["POST"])
@transaction.atomic
def register_arrival(request):
    patient_id = request.data.get("patient_id")
    appointment_id = request.data.get("appointment_id")
    is_emergency = request.data.get("is_emergency", False)

    if not patient_id:
        return Response({"error": "patient_id requerido"}, status=400)

    patient = get_object_or_404(Patient, id=patient_id)
    today = localdate()

    if appointment_id:
        appointment = get_object_or_404(Appointment, id=appointment_id, patient=patient)
        appointment.mark_arrived(is_emergency=is_emergency, is_walkin=False)
        entry = WaitingRoomEntry.objects.filter(appointment=appointment).first()
    else:
        existing_appt = Appointment.objects.filter(
            patient=patient, appointment_date=today
        ).exclude(status="completed").first()

        if existing_appt:
            existing_appt.mark_arrived(is_emergency=is_emergency, is_walkin=False)
            entry = WaitingRoomEntry.objects.filter(appointment=existing_appt).first()
        else:
            appointment = Appointment.objects.create(
                patient=patient, appointment_date=today, status="pending"
            )
            priority = "emergency" if is_emergency else "walkin"
            entry = WaitingRoomEntry.objects.create(
                patient=patient,
                appointment=appointment,
                status="waiting",
                priority=priority,
                arrival_time=now(),
            )
    return Response(WaitingRoomEntryDetailSerializer(entry).data, status=200)


@extend_schema(responses={200: OpenApiResponse(description="Eventos por cita")})
@api_view(["GET"])
def audit_by_appointment(request, appointment_id):
    events = Event.objects.filter(entity="Appointment", entity_id=appointment_id).order_by("-timestamp").values(
        "id", "entity", "entity_id", "action", "timestamp", "actor"
    )
    return Response(list(events))


@extend_schema(responses={200: OpenApiResponse(description="Eventos por paciente")})
@api_view(["GET"])
def audit_by_patient(request, patient_id):
    events = Event.objects.filter(entity="Patient", entity_id=patient_id).order_by("-timestamp").values(
        "id", "entity", "entity_id", "action", "timestamp", "actor"
    )
    return Response(list(events))


# --- ViewSets (Swagger los documenta automáticamente) ---
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
