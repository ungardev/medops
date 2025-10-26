from decimal import Decimal
from django.http import JsonResponse
from django.utils.timezone import now
from django.utils.dateparse import parse_date
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.core.paginator import Paginator
from django.utils import timezone
from django.utils.timezone import make_aware, localdate
from datetime import datetime, time
from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry
from .serializers import (
    PatientReadSerializer,
    PatientWriteSerializer,
    AppointmentSerializer,
    PaymentSerializer,
    WaitingRoomEntrySerializer,
    WaitingRoomEntryDetailSerializer,  # 👈 agrega esta línea
    DashboardSummarySerializer,
)

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response


def safe_json(value):
    """Convierte valores a tipos JSON-serializables"""
    if isinstance(value, Decimal):
        return float(value)
    return value

# --- Dashboard / métricas ---
def metrics_api(request):
    today = timezone.localdate()
    data = {
        "totalPatients": Patient.objects.count(),
        "todayAppointments": Appointment.objects.filter(appointment_date=today).count(),
        "pendingPayments": Payment.objects.filter(status="pending").count(),
        "waivedConsultations": Payment.objects.filter(status="waived").count(),
        "appointmentStatusToday": list(
            Appointment.objects.filter(appointment_date=today)
            .values("status")
            .annotate(total=Count("id"))
        ),
        "paymentMethodsTotals": list(
            Payment.objects.values("method").annotate(total=Sum("amount"))
        ),
    }
    return JsonResponse(data)

# --- Dashboard resumen ejecutivo ---
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
        .values("month")
        .annotate(total=Count("id"))
        .order_by("month")
    )
    appointments_trend = [
        {"month": a["month"].strftime("%b %Y"), "citas": a["total"]}
        for a in appointments_by_month if a["month"]
    ]

    payments_by_week = (
        Payment.objects.filter(appointment__in=Appointment.objects.filter(filters))
        .annotate(week=TruncWeek("received_at"))
        .values("week")
        .annotate(total=Sum("amount"))
        .order_by("week")
    )
    payments_trend = [
        {"week": p["week"].strftime("W%U %Y"), "pagos": safe_json(p["total"] or 0)}
        for p in payments_by_week if p["week"]
    ]

    waived_by_week = (
        Payment.objects.filter(status="waived", appointment__in=Appointment.objects.filter(filters))
        .annotate(week=TruncWeek("received_at"))
        .values("week")
        .annotate(total=Count("id"))
        .order_by("week")
    )
    waived_dict = {w["week"]: w["total"] * 50 for w in waived_by_week if w["week"]}

    balance_trend = []
    for p in payments_by_week:
        week = p["week"]
        if week:
            pagos = safe_json(p["total"] or 0)
            exoneraciones = waived_dict.get(week, 0)
            balance_trend.append({
                "week": week.strftime("W%U %Y"),
                "balance": pagos - exoneraciones
            })

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

# --- Pacientes ---
def patients_api(request):
    patients = Patient.objects.all().values(
        "id", "first_name", "middle_name", "last_name", "second_last_name", "birthdate", "gender", "contact_info"
    )
    results = []
    for p in patients:
        full_name = " ".join(filter(None, [p["first_name"], p["middle_name"], p["last_name"], p["second_last_name"]]))
        results.append({
            "id": p["id"],
            "full_name": full_name,
            "birthdate": p["birthdate"],
            "gender": p["gender"],
            "contact_info": p["contact_info"],
        })
    return JsonResponse(results, safe=False)

# --- Pacientes: búsqueda (para autocomplete en Sala de Espera) ---
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


# --- Citas del día ---
def daily_appointments_api(request):
    today = timezone.localdate()
    appointments = (
        Appointment.objects
        .filter(appointment_date=today)
        .select_related("patient")
        .order_by("arrival_time")
    )
    serializer = AppointmentSerializer(appointments, many=True)
    return JsonResponse(serializer.data, safe=False)

# --- Resumen de pagos ---
def payment_summary_api(request):
    summary = (
        Payment.objects.values("method", "status")
        .annotate(total_transactions=Count("id"), total_amount=Sum("amount"))
        .order_by("method", "status")
    )
    return JsonResponse(list(summary), safe=False)

# --- Consultas exoneradas ---
def waived_consultations_api(request):
    waived = Payment.objects.filter(status="waived").select_related("appointment__patient")
    results = []
    for w in waived:
        results.append({
            "id": w.id,
            "appointment_id": w.appointment_id,
            "patient_name": str(w.appointment.patient),
            "amount": w.amount,
            "method": w.method,
            "status": w.status,
        })
    return JsonResponse(results, safe=False)

# --- Auditoría: lista + filtros + paginación ---
def event_log_api(request):
    events = Event.objects.all().order_by("-timestamp").values(
        "id", "entity", "action", "timestamp", "actor"
    )
    paginator = Paginator(events, 20)
    page_number = request.GET.get("page", 1)
    page_obj = paginator.get_page(page_number)

    data = {
        "results": list(page_obj),
        "page": page_obj.number,
        "num_pages": paginator.num_pages,
        "total": paginator.count,
    }
    return JsonResponse(data, safe=False)

# --- Auditoría: agregados para gráficos ---
def audit_dashboard_api(request):
    entity_data = list(
        Event.objects.values("entity").annotate(total=Count("id")).order_by("-total")
    )
    action_data = list(
        Event.objects.values("action").annotate(total=Count("id")).order_by("-total")
    )
    timeline_data = list(
        Event.objects.annotate(day=TruncDate("timestamp"))
        .values("day")
        .annotate(total=Count("id"))
        .order_by("day")
    )
    return JsonResponse({
        "entity_data": entity_data,
        "action_data": action_data,
        "timeline_data": timeline_data,
    })

# --- Auditoría: historial por cita ---
@api_view(["GET"])
def audit_by_appointment(request, appointment_id):
    events = Event.objects.filter(entity="Appointment", entity_id=appointment_id).order_by("-timestamp").values(
        "id", "entity", "entity_id", "action", "timestamp", "actor"
    )
    return Response(list(events))

# --- Auditoría: historial por paciente ---
@api_view(["GET"])
def audit_by_patient(request, patient_id):
    events = Event.objects.filter(entity="Patient", entity_id=patient_id).order_by("-timestamp").values(
        "id", "entity", "entity_id", "action", "timestamp", "actor"
    )
    return Response(list(events))

# --- Sala de Espera: listar entradas ---
def waitingroom_list_api(request):
    entries = WaitingRoomEntry.objects.select_related("patient", "appointment").all()
    serializer = WaitingRoomEntrySerializer(entries, many=True)
    return JsonResponse(serializer.data, safe=False)

# --- Sala de Espera: actualizar estado de una cita ---
@api_view(["PATCH"])
def update_appointment_status(request, pk):
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    if not new_status:
        return Response({"error": "Missing status"}, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 Validación: solo un paciente puede estar en consulta
    if new_status == "in_consultation":
        today = timezone.localdate()
        already_in = Appointment.objects.filter(
            appointment_date=today,
            status="in_consultation"
        ).exclude(id=appointment.id).exists()

        if already_in:
            return Response(
                {"error": "Ya existe un paciente en consulta. Solo se permite uno a la vez."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if appointment.can_transition(new_status):
        appointment.update_status(new_status)
        return Response(AppointmentSerializer(appointment).data)
    else:
        return Response(
            {"error": f"No se puede pasar de {appointment.status} a {new_status}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


# --- Sala de Espera: actualizar estado de una entrada ---
@api_view(["PATCH"])
def update_waitingroom_status(request, pk):
    try:
        entry = WaitingRoomEntry.objects.get(pk=pk)
    except WaitingRoomEntry.DoesNotExist:
        return Response({"error": "WaitingRoomEntry not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get("status")
    if not new_status:
        return Response({"error": "Missing status"}, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 Validación: solo un paciente puede estar en consulta
    if new_status == "in_consultation":
        today = timezone.localdate()
        already_in = WaitingRoomEntry.objects.filter(
            appointment__appointment_date=today,
            status="in_consultation"
        ).exclude(id=entry.id).exists()

        if already_in:
            return Response(
                {"error": "Ya existe un paciente en consulta. Solo se permite uno a la vez."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if entry.can_transition(new_status):
        entry.update_status(new_status)
        return Response(WaitingRoomEntrySerializer(entry).data)
    else:
        return Response(
            {"error": f"No se puede pasar de {entry.status} a {new_status}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


# --- Consulta: actualizar notas ---
@api_view(["PATCH"])
def update_appointment_notes(request, pk):
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found"}, status=status.HTTP_404_NOT_FOUND)

    notes = request.data.get("notes")
    if notes is None:
        return Response({"error": "Missing notes"}, status=status.HTTP_400_BAD_REQUEST)

    appointment.notes = notes
    appointment.save(update_fields=["notes"])

    Event.objects.create(
        entity="Appointment",
        action="update_notes",
        actor=str(request.user) if request.user.is_authenticated else "system",
        timestamp=now(),
    )

    return Response(AppointmentSerializer(appointment).data)

# --- DRF ViewSets (CRUD básicos) ---
class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PatientWriteSerializer
        return PatientReadSerializer

    # 🔹 Endpoint: GET /patients/<id>/payments/
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

    @action(detail=True, methods=["patch"])
    def promote_to_emergency(self, request, pk=None):
        """
        Promueve un paciente a emergencia (Grupo A).
        """
        entry = self.get_object()
        entry.priority = "emergency"
        entry.save(update_fields=["priority"])

        Event.objects.create(
            entity="WaitingRoomEntry",
            entity_id=entry.id,
            actor=str(request.user) if request.user.is_authenticated else "system",
            action="promote_to_emergency",
            timestamp=now(),
            metadata={"patient": str(entry.patient)}
        )

        return Response(
            WaitingRoomEntrySerializer(entry).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"])
    def confirm(self, request, pk=None):
        """
        Confirma la llegada de un paciente:
        - pending/scheduled → waiting/scheduled (Grupo A).
        - waiting/walkin → waiting/scheduled (Grupo A).
        """
        try:
            entry = self.get_object()
        except WaitingRoomEntry.DoesNotExist:
            return Response({"error": "WaitingRoomEntry not found"}, status=status.HTTP_404_NOT_FOUND)

        if entry.status == "pending" and entry.priority == "scheduled":
            entry.status = "waiting"
            entry.priority = "scheduled"
        elif entry.status == "waiting" and entry.priority == "walkin":
            entry.status = "waiting"
            entry.priority = "scheduled"
        else:
            return Response(
                {"error": f"No se puede confirmar entrada con estado={entry.status}, prioridad={entry.priority}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        entry.save(update_fields=["status", "priority"])

        Event.objects.create(
            entity="WaitingRoomEntry",
            entity_id=entry.id,
            actor=str(request.user) if request.user.is_authenticated else "system",
            action="confirm",
            timestamp=now(),
            metadata={"patient": str(entry.patient)}
        )

        return Response(WaitingRoomEntrySerializer(entry).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def close_day(self, request):
        """
        Cierra la jornada laboral:
        - Si existe algún paciente en 'in_consultation', se bloquea la acción.
        - Todos los pacientes que no estén en 'completed' → 'canceled'.
        """
        # 🔒 Validación: no permitir cierre si hay pacientes en consulta
        if WaitingRoomEntry.objects.filter(status="in_consultation").exists():
            return Response(
                {"error": "No se puede cerrar la jornada mientras haya un paciente en consulta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Cancelar todo lo que no esté completado
        updated_entries = WaitingRoomEntry.objects.exclude(status="completed")
        count = updated_entries.count()
        updated_entries.update(status="canceled")

        Event.objects.create(
            entity="WaitingRoomEntry",
            action="close_day",
            actor=str(request.user) if request.user.is_authenticated else "system",
            timestamp=now(),
            metadata={"canceled_count": count}
        )

        return Response(
            {"message": f"{count} pacientes fueron cancelados al cierre de jornada."},
            status=status.HTTP_200_OK,
        )


# --- Consulta actual en curso ---
@api_view(["GET"])
def current_consultation_api(request):
    appointment = (
        Appointment.objects
        .filter(status="in_consultation")
        .select_related("patient")
        .order_by("-appointment_date", "-id")
        .first()
    )
    if appointment:
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data, status=200)
    return Response({"detail": "No hay consulta corriendo actualmente."}, status=200)

def waitingroom_groups_today_api(request):
    today = localdate()  # fecha local (Caracas)
    start = make_aware(datetime.combine(today, time.min))
    end = make_aware(datetime.combine(today, time.max))

    # Grupo A: confirmados en espera, en consulta o completados (scheduled/emergency)
    grupo_a = WaitingRoomEntry.objects.filter(
        arrival_time__range=(start, end),
        status__in=["waiting", "in_consultation", "completed"],
        priority__in=["scheduled", "emergency"]
    ).select_related("patient", "appointment")

    # Grupo B: pendientes de confirmar (citas del día) + walk-ins en espera
    grupo_b = WaitingRoomEntry.objects.filter(
        arrival_time__range=(start, end)
    ).filter(
        (Q(status="pending", priority="scheduled")) |
        (Q(status="waiting", priority="walkin"))
    ).exclude(
        priority="scheduled"
    ).select_related("patient", "appointment")

    return JsonResponse({
        "grupo_a": WaitingRoomEntryDetailSerializer(grupo_a, many=True).data,
        "grupo_b": WaitingRoomEntryDetailSerializer(grupo_b, many=True).data,
    })


@api_view(["POST"])
def register_walkin_api(request):
    """
    Registra la llegada de un paciente walk-in (sin cita previa).
    Crea un Appointment para hoy y lo ubica en Grupo B.
    """
    patient_id = request.data.get("patient_id")
    if not patient_id:
        return Response({"error": "Missing patient_id"}, status=status.HTTP_400_BAD_REQUEST)

    today = timezone.localdate()

    # Crear appointment para hoy
    appointment = Appointment.objects.create(
        patient_id=patient_id,
        appointment_date=today,
        status="pending"  # aún no confirmado
    )

    # Crear entrada en sala de espera
    entry = WaitingRoomEntry.objects.create(
        patient_id=patient_id,
        appointment=appointment,
        status="waiting",       # en espera
        priority="walkin",      # walk-in
        arrival_time=timezone.now()
    )

    return Response(WaitingRoomEntrySerializer(entry).data, status=status.HTTP_201_CREATED)