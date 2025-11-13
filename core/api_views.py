from decimal import Decimal, InvalidOperation
from datetime import datetime, date, timedelta
from django.conf import settings
from django.core.files import File
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
from django.template.loader import render_to_string
import calendar
import requests
import time
import re
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

# Excel
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.worksheet.worksheet import Worksheet
from openpyxl.drawing.image import Image as XLImage

# PDF
import io
import os
import logging
import tempfile
import traceback
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
)
from reportlab.lib.styles import getSampleStyleSheet

from rest_framework import viewsets, status, serializers, permissions
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.views import obtain_auth_token
from drf_spectacular.utils import (
    extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
)

from .models import (Patient, Appointment, Payment, Event, WaitingRoomEntry, GeneticPredisposition, MedicalDocument, Diagnosis, Treatment, Prescription, ChargeOrder, ChargeItem, InstitutionSettings, DoctorOperator, BCVRateCache, MedicalReport, ICD11Entry, MedicalTest, MedicalReferral, Specialty
)

from .serializers import (
    PatientReadSerializer, PatientWriteSerializer, PatientDetailSerializer,
    AppointmentSerializer, PaymentSerializer,
    WaitingRoomEntrySerializer, WaitingRoomEntryDetailSerializer,
    DashboardSummarySerializer,
    GeneticPredispositionSerializer, MedicalDocumentReadSerializer, MedicalDocumentWriteSerializer,
    AppointmentPendingSerializer, DiagnosisSerializer, TreatmentSerializer, PrescriptionSerializer,
    AppointmentDetailSerializer, ChargeOrderSerializer, ChargeItemSerializer, ChargeOrderPaymentSerializer,
    EventSerializer, ReportRowSerializer, ReportFiltersSerializer, ReportExportSerializer, InstitutionSettingsSerializer,
    DoctorOperatorSerializer, MedicalReportSerializer, ICD11EntrySerializer, DiagnosisWriteSerializer,
    MedicalTestSerializer, MedicalReferralSerializer, PrescriptionWriteSerializer, TreatmentWriteSerializer,
    MedicalTestWriteSerializer, MedicalReferralWriteSerializer, SpecialtySerializer
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


audit = logging.getLogger("audit")

# --- Scraping helpers ---
def fetch_bcv_html() -> str | None:
    """Obtiene el HTML de la página del BCV usando Playwright."""
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ]
        )
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            locale="es-VE",
            viewport={"width": 1366, "height": 900},
            timezone_id="America/Caracas",
        )
        page = context.new_page()
        try:
            page.goto("https://www.bcv.org.ve/", wait_until="networkidle", timeout=60000)
            page.wait_for_selector("#dolar .centrado strong", timeout=30000)
            html = page.content()
        except Exception as e:
            audit.error(f"BCV: error al obtener HTML → {e}")
            html = None
        finally:
            try:
                with open("/tmp/bcv_dump.html", "w", encoding="utf-8") as f:
                    f.write(html or "NO HTML CAPTURADO")
            except Exception as dump_err:
                audit.error(f"BCV: error al guardar dump HTML → {dump_err}")
            browser.close()
        return html

def extract_bcv_rate(html: str) -> Decimal | None:
    """Extrae la tasa USD desde el bloque #dolar."""
    soup = BeautifulSoup(html, "html.parser")
    dolar = soup.select_one("#dolar .centrado strong")
    raw = dolar.get_text(strip=True) if dolar else None

    if not raw:
        # fallback regex dentro del HTML
        m = re.search(r"\d{2,3}(?:\.\d{3})*,\d{2,8}", html)
        if not m:
            return None
        raw = m.group(1)

    normalized = raw.replace(".", "").replace(",", ".")
    try:
        rate = Decimal(normalized)
        if rate <= 0:
            return None
        return rate
    except (InvalidOperation, Exception):
        return None

def get_bcv_rate() -> Decimal:
    """Función principal: devuelve la tasa BCV, sin fallback."""
    html = fetch_bcv_html()
    if not html:
        audit.error("BCV: no se pudo obtener HTML")
        raise RuntimeError("BCV: no se pudo obtener HTML")

    rate = extract_bcv_rate(html)
    if not rate:
        audit.error("BCV: no se pudo extraer tasa")
        raise RuntimeError("BCV: no se pudo extraer tasa")

    audit.info(f"BCV: tasa capturada {rate} Bs/USD (real)")
    return rate


@api_view(["GET"])
def bcv_rate_api(request):
    """
    Endpoint REST para consultar la tasa oficial BCV.
    Devuelve JSON desde cache diario.
    """
    today = date.today()
    try:
        cache = BCVRateCache.objects.get(date=today)
        data = {
            "source": "BCV",
            "date": today.isoformat(),
            "value": float(cache.value),
            "unit": "VES_per_USD",
            "precision": 8,
            "is_fallback": False,
        }
        return Response(data, status=200)
    except BCVRateCache.DoesNotExist:
        audit.error("BCV: no se encontró tasa cacheada para hoy")
        return Response(
            {
                "error": "No se encontró tasa cacheada para hoy",
                "source": "BCV",
                "date": today.isoformat(),
            },
            status=status.HTTP_404_NOT_FOUND
        )


@extend_schema(
    parameters=[
        OpenApiParameter("start_date", str, OpenApiParameter.QUERY),
        OpenApiParameter("end_date", str, OpenApiParameter.QUERY),
        OpenApiParameter("status", str, OpenApiParameter.QUERY),
        OpenApiParameter("range", str, OpenApiParameter.QUERY, description="day|week|month"),
        OpenApiParameter("currency", str, OpenApiParameter.QUERY, description="USD|VES"),
    ],
    responses={200: DashboardSummarySerializer}
)
@api_view(["GET"])
def dashboard_summary_api(request):
    try:
        today = localdate()

        # --- Parámetros y rango ---
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        range_param = request.GET.get("range")
        currency = request.GET.get("currency", "USD")

        def parse_d(d):
            try:
                return parse_date(str(d))
            except Exception:
                return None

        try:
            if range_param == "day":
                start = end = today
            elif range_param == "week":
                start = today - timedelta(days=today.weekday())
                end = start + timedelta(days=6)
            elif range_param == "month":
                first_day = today.replace(day=1)
                last_day = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
                start = first_day
                end = last_day
            else:
                start = parse_d(start_date) or (today - timedelta(days=6))
                end = parse_d(end_date) or today
        except Exception:
            # Fallback defensivo de rango
            start = today - timedelta(days=6)
            end = today

        # --- Finanzas (blindadas) ---
        try:
            orders_qs = ChargeOrder.objects.exclude(status="void")
            total_amount = orders_qs.aggregate(s=Sum("total")).get("s") or Decimal("0")
            confirmed_amount = Payment.objects.filter(status="confirmed").aggregate(s=Sum("amount")).get("s") or Decimal("0")
            balance_due = orders_qs.aggregate(s=Sum("balance_due")).get("s") or Decimal("0")

            waived_qs = ChargeOrder.objects.filter(status="waived")
            total_waived = waived_qs.count()
            estimated_waived_amount = waived_qs.aggregate(s=Sum("total")).get("s") or Decimal("0")
        except Exception:
            total_amount = Decimal("0")
            confirmed_amount = Decimal("0")
            balance_due = Decimal("0")
            total_waived = 0
            estimated_waived_amount = Decimal("0")

        # --- Clínico-operativo (blindado) ---
        try:
            appts_qs = Appointment.objects.filter(appointment_date__range=(start, end))
            total_appointments = appts_qs.count()
            completed_appointments = appts_qs.filter(status="completed").count()
            pending_appointments = appts_qs.exclude(status__in=["completed", "canceled"]).count()
            active_appointments = appts_qs.filter(status__in=["arrived", "in_consultation", "completed"]).count()
        except Exception:
            total_appointments = 0
            completed_appointments = 0
            pending_appointments = 0
            active_appointments = 0

        try:
            waiting_room_count = WaitingRoomEntry.objects.filter(
                arrival_time__date__range=(start, end),
                status__in=["waiting", "in_consultation"]
            ).count()
        except Exception:
            waiting_room_count = 0

        try:
            active_consultations = Appointment.objects.filter(
                appointment_date__range=(start, end),
                status="in_consultation"
            ).count()
        except Exception:
            active_consultations = 0

        # --- Tendencias (blindadas) ---
        try:
            appt_trend_qs = (
                Appointment.objects.filter(appointment_date__range=(start, end), status="completed")
                .annotate(date=TruncDate("appointment_date"))
                .values("date")
                .annotate(value=Count("id"))
                .order_by("date")
            )
            appt_trend = [{"date": str(row["date"]), "value": int(row["value"] or 0)} for row in appt_trend_qs]
        except Exception:
            appt_trend = []

        try:
            pay_trend_qs = (
                Payment.objects.filter(status="confirmed", received_at__date__range=(start, end))
                .annotate(date=TruncDate("received_at"))
                .values("date")
                .annotate(value=Sum("amount"))
                .order_by("date")
            )
            pay_trend = [{"date": str(row["date"]), "value": Decimal(str(row["value"] or "0"))} for row in pay_trend_qs]
        except Exception:
            pay_trend = []

        try:
            balance_trend_qs = (
                ChargeOrder.objects.filter(issued_at__date__range=(start, end))
                .annotate(date=TruncDate("issued_at"))
                .values("date")
                .annotate(
                    total=Sum("total"),
                    balance=Sum("balance_due"),
                )
                .order_by("date")
            )
            balance_trend = []
            for row in balance_trend_qs:
                total_v = Decimal(str(row.get("total") or "0"))
                bal_v = Decimal(str(row.get("balance") or "0"))
                val = max(total_v - bal_v, Decimal("0"))
                balance_trend.append({"date": str(row["date"]), "value": val})
        except Exception:
            balance_trend = []

        # --- Tasa BCV con cache diario (blindado) ---
        try:
            cache = BCVRateCache.objects.get(date=today)
            bcv_rate = Decimal(str(cache.value))
            is_fallback = False
        except BCVRateCache.DoesNotExist:
            bcv_rate = Decimal("1")
            is_fallback = True
        except Exception:
            bcv_rate = Decimal("1")
            is_fallback = True

        # --- Normalización de decimales ---
        try:
            total_amount = Decimal(str(total_amount or "0"))
            confirmed_amount = Decimal(str(confirmed_amount or "0"))
            balance_due = Decimal(str(balance_due or "0"))
            estimated_waived_amount = Decimal(str(estimated_waived_amount or "0"))
        except Exception:
            total_amount = Decimal("0")
            confirmed_amount = Decimal("0")
            balance_due = Decimal("0")
            estimated_waived_amount = Decimal("0")

        # --- Conversión de moneda (solo al final, con Decimal) ---
        try:
            if currency == "VES":
                confirmed_amount = confirmed_amount * bcv_rate
                estimated_waived_amount = estimated_waived_amount * bcv_rate
                total_amount = total_amount * bcv_rate
                balance_due = balance_due * bcv_rate

                for p in pay_trend:
                    p["value"] = (Decimal(str(p["value"])) * bcv_rate) if p else Decimal("0")

                for b in balance_trend:
                    b["value"] = (Decimal(str(b["value"])) * bcv_rate) if b else Decimal("0")
        except Exception:
            # Si algo falla en conversión, mantenemos valores en USD
            pass

        # --- Totales (blindados) ---
        try:
            total_patients = Patient.objects.count()
        except Exception:
            total_patients = 0

        try:
            total_payments = Payment.objects.count()
        except Exception:
            total_payments = 0

        try:
            total_events = Event.objects.count()
        except Exception:
            total_events = 0

        # --- Auditoría institucional (alineada con actor) ---
        try:
            event_log_qs = Event.objects.order_by("-timestamp").values(
                "id", "timestamp", "entity", "action", "actor",  # ✅ actor en vez de user
                "severity", "notify", "metadata"                  # ✅ extendido
            )[:10]
            event_log = list(event_log_qs)
        except Exception:
            event_log = []

        # --- Payload blindado (convertir a float al final)
        data = {
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "active_appointments": active_appointments,
            "completed_appointments": completed_appointments,
            "pending_appointments": pending_appointments,
            "waiting_room_count": waiting_room_count,
            "active_consultations": active_consultations,
            "total_payments": total_payments,
            "total_events": total_events,
            "total_waived": total_waived,
            "total_payments_amount": float(confirmed_amount),
            "estimated_waived_amount": float(estimated_waived_amount),
            "financial_balance": float(max(total_amount - balance_due, Decimal("0"))),
            "appointments_trend": appt_trend,
            "payments_trend": [{"date": p["date"], "value": float(p["value"])} for p in pay_trend],
            "balance_trend": [{"date": b["date"], "value": float(b["value"])} for b in balance_trend],
            "bcv_rate": {
                "value": float(bcv_rate),
                "unit": "VES_per_USD",
                "precision": 8,
                "is_fallback": is_fallback,
            },
            "event_log": event_log,
        }

        return Response(data, status=200)

    except Exception as e:
        print("🔥 ERROR EN DASHBOARD SUMMARY 🔥")
        traceback.print_exc()
        # En lugar de 500, devolvemos un payload mínimo para no romper el frontend
        return Response({
            "error": str(e),
            "total_patients": 0,
            "total_appointments": 0,
            "active_appointments": 0,
            "completed_appointments": 0,
            "pending_appointments": 0,
            "waiting_room_count": 0,
            "active_consultations": 0,
            "total_payments": 0,
            "total_events": 0,
            "total_waived": 0,
            "total_payments_amount": 0.0,
            "estimated_waived_amount": 0.0,
            "financial_balance": 0.0,
            "appointments_trend": [],
            "payments_trend": [],
            "balance_trend": [],
            "bcv_rate": {"value": 1.0, "unit": "VES_per_USD", "precision": 8, "is_fallback": True},
            "event_log": [],
        }, status=200)


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
    - POST /documents/ (multipart) → subir documento clínico
    - Los PDFs institucionales se registran con metadatos blindados automáticamente.
    """
    queryset = MedicalDocument.objects.all().order_by("-uploaded_at")
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MedicalDocumentWriteSerializer
        return MedicalDocumentReadSerializer

    def perform_create(self, serializer):
        """
        Al crear un documento:
        - Calcula checksum SHA256
        - Guarda tamaño y mime_type
        - Setea source, origin_panel, template_version
        - Asigna uploaded_by y generated_by
        """
        user = self.request.user if self.request.user.is_authenticated else None
        file = self.request.FILES.get("file")

        extra_data = {}
        if file:
            extra_data["mime_type"] = file.content_type or "application/octet-stream"
            extra_data["size_bytes"] = file.size

            import hashlib
            sha256 = hashlib.sha256()
            for chunk in file.chunks():
                sha256.update(chunk)
            extra_data["checksum_sha256"] = sha256.hexdigest()

        extra_data["source"] = "user_uploaded"
        extra_data["origin_panel"] = "admin_or_api"
        extra_data["template_version"] = "v1.0"
        extra_data["uploaded_by"] = user
        extra_data["generated_by"] = user

        serializer.save(**extra_data)

    def perform_update(self, serializer):
        """
        Al actualizar un documento:
        - Recalcula checksum si cambia el archivo
        - Actualiza tamaño y mime_type
        """
        file = self.request.FILES.get("file")
        extra_data = {}
        if file:
            extra_data["mime_type"] = file.content_type or "application/octet-stream"
            extra_data["size_bytes"] = file.size

            import hashlib
            sha256 = hashlib.sha256()
            for chunk in file.chunks():
                sha256.update(chunk)
            extra_data["checksum_sha256"] = sha256.hexdigest()

        serializer.save(**extra_data)


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
    try:
        today = timezone.localdate()

        # 🔹 Query blindado: incluye todas las entradas de hoy
        qs = (
            WaitingRoomEntry.objects.filter(
                Q(appointment__appointment_date=today)
                | Q(arrival_time__date=today)   # 👈 más seguro que range
                | Q(created_at__date=today)     # 👈 incluye walk-ins
            )
            .select_related("patient", "appointment")
            .order_by("order", "arrival_time")
        )

        serializer = WaitingRoomEntrySerializer(qs, many=True)
        return Response(serializer.data, status=200)

    except Exception as e:
        print("🔥 ERROR EN WAITING ROOM ENTRIES 🔥", e)
        return Response([], status=200)


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

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return DiagnosisWriteSerializer
        return DiagnosisSerializer

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

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TreatmentWriteSerializer
        return TreatmentSerializer

    def perform_create(self, serializer):
        treatment = serializer.save()
        Event.objects.create(
            entity="Treatment",
            entity_id=treatment.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "diagnosis_id": treatment.diagnosis_id,
                "treatment_type": treatment.treatment_type,
                "status": treatment.status,
            },
            severity="info",
            notify=True,
        )


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all().select_related("diagnosis")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PrescriptionWriteSerializer
        return PrescriptionSerializer

    def perform_create(self, serializer):
        prescription = serializer.save()
        Event.objects.create(
            entity="Prescription",
            entity_id=prescription.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "diagnosis_id": prescription.diagnosis_id,
                "medication": prescription.medication,
                "dosage": str(prescription.dosage),
                "unit": prescription.unit,
                "route": prescription.route,
                "frequency": prescription.frequency,
            },
            severity="info",
            notify=True,
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


logger = logging.getLogger(__name__)

@extend_schema(
    request=ReportExportSerializer,
    responses={200: OpenApiResponse(description="Archivo PDF/Excel exportado")},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reports_export_api(request):
    try:
        serializer = ReportExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated: Dict[str, Any] = cast(Dict[str, Any], serializer.validated_data)
        export_format = validated["format"]
        filters = validated.get("filters", {})

        # --- Configuración institucional y médico operador ---
        inst = InstitutionSettings.objects.first()
        doc_op = DoctorOperator.objects.first()

        # --- Construcción de datos de reporte ---
        report_type = filters.get("type")
        serialized = []

        if report_type == "financial":
            from .models import Payment
            rows = Payment.objects.all()
            for p in rows:
                serialized.append({
                    "id": p.id,
                    "date": p.received_at.date() if p.received_at else None,
                    "type": "financial",
                    "entity": f"Appt {p.appointment_id} / Order {p.charge_order_id}",
                    "status": p.status,
                    "amount": float(p.amount),
                    "currency": p.currency,
                })

        elif report_type == "clinical":
            from .models import Appointment
            rows = Appointment.objects.all()
            for a in rows:
                serialized.append({
                    "id": a.id,
                    "date": a.appointment_date,
                    "type": "clinical",
                    "entity": str(a.patient),
                    "status": a.status,
                    "amount": float(a.expected_amount),
                    "currency": "USD",
                })

        else:  # combinado
            from .models import Payment, Appointment
            for p in Payment.objects.all():
                serialized.append({
                    "id": p.id,
                    "date": p.received_at.date() if p.received_at else None,
                    "type": "financial",
                    "entity": f"Appt {p.appointment_id} / Order {p.charge_order_id}",
                    "status": p.status,
                    "amount": float(p.amount),
                    "currency": p.currency,
                })
            for a in Appointment.objects.all():
                serialized.append({
                    "id": a.id,
                    "date": a.appointment_date,
                    "type": "clinical",
                    "entity": str(a.patient),
                    "status": a.status,
                    "amount": float(a.expected_amount),
                    "currency": "USD",
                })

        # --- Export PDF ---
        if export_format == "pdf":
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            elements = []
            styles = getSampleStyleSheet()

            if inst:
                elements.append(Paragraph(f"<b>{inst.name}</b>", styles["Title"]))
                elements.append(Paragraph(f"Dirección: {inst.address}", styles["Normal"]))
                elements.append(Paragraph(f"Tel: {inst.phone} • RIF: {inst.tax_id}", styles["Normal"]))
                elements.append(Spacer(1, 12))

            if doc_op:
                elements.append(Paragraph(
                    f"Médico operador: {doc_op.full_name} • Colegiado: {doc_op.colegiado_id} • {doc_op.specialty or ''}",
                    styles["Normal"]
                ))
                elements.append(Spacer(1, 8))

            elements.append(Paragraph("<b>Reporte Institucional</b>", styles["Heading2"]))
            elements.append(Paragraph(f"Filtros aplicados: {filters}", styles["Normal"]))
            elements.append(Spacer(1, 12))

            data = [["ID", "Fecha", "Tipo", "Entidad", "Estado", "Monto", "Moneda"]]
            for r in serialized:
                data.append([
                    r.get("id"),
                    str(r.get("date")),
                    r.get("type"),
                    r.get("entity"),
                    r.get("status"),
                    f"{float(r.get('amount', 0) or 0):.2f}",
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

            elements.append(Paragraph("__________________________", styles["Normal"]))
            elements.append(Paragraph("Firma Digital", styles["Italic"]))
            elements.append(Spacer(1, 12))

            user = str(request.user) if request.user.is_authenticated else "system"
            elements.append(Paragraph(f"Generado por: {user}", styles["Normal"]))
            elements.append(Paragraph(f"Fecha de generación: {now().strftime('%Y-%m-%d %H:%M:%S')}", styles["Normal"]))

            doc.build(elements)
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename="reporte.pdf")

        # --- Export Excel ---
        elif export_format == "excel":
            buffer = io.BytesIO()
            wb = Workbook()
            ws: Worksheet = cast(Worksheet, wb.active)
            ws.title = "Reporte Institucional"

            if inst:
                ws["C1"] = inst.name
                ws["C1"].font = Font(bold=True, size=14)
                ws["C2"] = f"Dirección: {inst.address}"
                ws["C3"] = f"Tel: {inst.phone} • RIF: {inst.tax_id}"
            if doc_op:
                ws["C4"] = f"Médico operador: {doc_op.full_name} • Colegiado: {doc_op.colegiado_id} • {doc_op.specialty or ''}"
            ws["C6"] = f"Filtros aplicados: {filters}"

            headers = ["ID", "Fecha", "Tipo", "Entidad", "Estado", "Monto", "Moneda"]
            ws.append([])
            ws.append(headers)

            for r in serialized:
                ws.append([
                    r.get("id"),
                    str(r.get("date")),
                    r.get("type"),
                    r.get("entity"),
                    r.get("status"),
                    float(r.get("amount", 0) or 0),
                    r.get("currency", "VES")
                ])

            header_row = ws.max_row - len(serialized)
            for cell in ws[header_row]:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.alignment = Alignment(horizontal="center")
                cell.fill = PatternFill(start_color="003366", end_color="003366", fill_type="solid")

            for row_idx, row in enumerate(ws.iter_rows(min_row=header_row+1, max_row=ws.max_row), start=0):
                fill_color = "F2F2F2" if row_idx % 2 == 0 else "FFFFFF"
                for cell in row:
                    cell.fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")

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

            user = str(request.user) if request.user.is_authenticated else "system"
            ws.append([])
            ws.append([f"Generado por: {user}"])
            ws.append([f"Fecha de generación: {now().strftime('%Y-%m-%d %H:%M:%S')}"])

            wb.save(buffer)
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename="reporte.xlsx")

        return Response({"error": "Formato no soportado"}, status=400)

    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Export error: {e}\n{tb}")
        return Response(
            {"error": str(e), "traceback": tb},
            status=500,
            content_type="application/json"
        )


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


@extend_schema(
    parameters=[
        OpenApiParameter("limit", int, OpenApiParameter.QUERY, description="Número máximo de eventos a devolver"),
    ],
    responses={200: "Lista de eventos de auditoría"}
)
@api_view(["GET"])
def audit_log_api(request):
    try:
        limit = int(request.GET.get("limit", 10))

        events_qs = Event.objects.order_by("-timestamp").values(
            "id",
            "timestamp",
            "actor",
            "entity",
            "action",
            "severity",
            "notify",
            "metadata",
        )[:limit]

        return Response(list(events_qs), status=200)

    except Exception as e:
        print("🔥 ERROR EN AUDIT LOG 🔥", e)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_pdf_from_html(html: str, filename: str = "informe.pdf") -> File:
    """
    Convierte HTML en PDF y retorna un archivo Django File listo para guardar en un FileField.
    - Usa archivo temporal seguro.
    - Compatible con MedicalDocument.file.
    """
    from weasyprint import HTML
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        # Renderizar PDF desde HTML
        HTML(string=html).write_pdf(tmp.name)
        tmp.seek(0)
        # Retornar como File listo para guardar
        return File(tmp, name=filename)

@extend_schema(
    request=None,
    responses={201: MedicalReportSerializer}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_report(request, pk: int):
    """
    Genera un informe médico oficial en PDF para la consulta indicada.
    Devuelve el objeto MedicalReport con file_url.
    """
    appointment = get_object_or_404(Appointment, pk=pk)

    if appointment.status not in ["in_consultation", "completed"]:
        return Response(
            {"detail": "La consulta debe estar en curso o finalizada para generar informe"},
            status=400
        )

    # Idempotencia: si ya existe informe con archivo, devolverlo
    existing = MedicalReport.objects.filter(appointment=appointment).first()
    if existing and existing.file_url:
        return Response(MedicalReportSerializer(existing).data, status=200)

    # 🔹 Datos institucionales
    institution = InstitutionSettings.objects.first()
    doctor = DoctorOperator.objects.first()  # luego filtrar por usuario si aplica

    # 🔹 Construcción del contenido clínico
    diagnoses = appointment.diagnoses.all()
    treatments = Treatment.objects.filter(diagnosis__appointment=appointment)
    prescriptions = Prescription.objects.filter(diagnosis__appointment=appointment)

    # 🔹 Renderizar PDF (puedes usar WeasyPrint, xhtml2pdf, ReportLab, etc.)
    html = render_to_string("pdf/medical_report.html", {
        "appointment": appointment,
        "patient": appointment.patient,
        "institution": institution,
        "doctor": doctor,
        "diagnoses": diagnoses,
        "treatments": treatments,
        "prescriptions": prescriptions,
        "notes": appointment.notes,
        "generated_at": timezone.now(),
    })

    pdf_file = generate_pdf_from_html(html)  # 👈 función utilitaria que retorna archivo

    # 🔹 Guardar como MedicalDocument
    doc = MedicalDocument.objects.create(
        patient=appointment.patient,
        appointment=appointment,
        file=pdf_file,
        description=f"Informe de consulta del {appointment.appointment_date}",
        category="Informe Médico",
        uploaded_by=str(request.user),
    )

    # 🔹 Crear MedicalReport y asociar file_url
    report, _ = MedicalReport.objects.get_or_create(
        appointment=appointment,
        defaults={
            "patient": appointment.patient,
            "created_at": timezone.now(),
            "status": "generated",
        }
    )
    report.file_url = doc.file.url
    report.save(update_fields=["file_url"])

    # 🔹 Auditoría
    Event.objects.create(
        entity="MedicalReport",
        entity_id=report.id,
        action="generated",
        actor=str(request.user),
        metadata={"appointment_id": appointment.id, "document_id": doc.id},
        severity="info",
        notify=True
    )

    return Response(MedicalReportSerializer(report).data, status=201)


@extend_schema(
    responses={201: MedicalReportSerializer},
    description="Genera un informe médico para la consulta indicada, crea PDF y lo registra como documento clínico."
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_medical_report(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)

    # Crear el informe médico institucional
    report = MedicalReport.objects.create(
        appointment=appointment,
        patient=appointment.patient,
        status="generated"
    )

    institution = InstitutionSettings.objects.first()
    doctor = DoctorOperator.objects.first()

    context = {
        "appointment": appointment,
        "patient": appointment.patient,
        "diagnoses": appointment.diagnoses.all(),
        "treatments": Treatment.objects.filter(diagnosis__appointment=appointment),
        "prescriptions": Prescription.objects.filter(diagnosis__appointment=appointment),
        "institution": institution,
        "doctor": doctor,
        "report": report,
        "generated_at": timezone.now(),
    }

    # Renderizar HTML → PDF
    html_string = render_to_string("pdf/medical_report.html", context)
    from weasyprint import HTML
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    # Guardar PDF en storage
    filename = f"medical_report_{report.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    # Actualizar MedicalReport con URL del archivo
    report.file_url = file_path
    report.save(update_fields=["file_url"])

    # Crear MedicalDocument blindado
    from django.core.files import File
    django_file = File(open(full_path, "rb"), name=filename)

    import hashlib
    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    doc = MedicalDocument.objects.create(
        patient=appointment.patient,
        appointment=appointment,
        diagnosis=None,
        description="Informe Médico generado automáticamente",
        category="medical_report",          # 🔹 ahora con choice institucional
        source="system_generated",          # 🔹 origen blindado
        origin_panel="consultation",        # 🔹 panel origen
        template_version="v1.1",            # 🔹 versión de plantilla
        generated_by=request.user,          # 🔹 usuario autenticado
        uploaded_by=request.user,           # 🔹 también como uploader
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
    )

    # Evento de auditoría
    Event.objects.create(
        entity="MedicalReport",
        entity_id=report.id,
        action="generated",
        actor=str(request.user),
        metadata={"appointment_id": appointment.id, "patient_id": appointment.patient.id, "document_id": doc.id},
        severity="info",
        notify=True
    )

    serializer = MedicalReportSerializer(report)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    responses={201: PrescriptionSerializer},
    description="Genera una prescripción en PDF y la registra como documento clínico."
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_prescription_pdf(request, pk):
    prescription = get_object_or_404(Prescription, pk=pk)
    diagnosis = prescription.diagnosis
    appointment = diagnosis.appointment
    patient = appointment.patient

    context = {
        "prescription": prescription,
        "diagnosis": diagnosis,
        "appointment": appointment,
        "patient": patient,
        "doctor": request.user,
        "institution": InstitutionSettings.objects.first(),
    }

    html_string = render_to_string("pdf/prescription.html", context)
    from weasyprint import HTML
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    filename = f"prescription_{prescription.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    from django.core.files import File
    django_file = File(open(full_path, "rb"), name=filename)

    import hashlib
    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    doc = MedicalDocument.objects.create(
        patient=patient,
        appointment=appointment,
        diagnosis=diagnosis,
        description="Prescripción generada automáticamente",
        category="prescription",
        source="system_generated",
        origin_panel="prescription_panel",
        template_version="v1.1",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
    )

    Event.objects.create(
        entity="MedicalDocument",
        entity_id=doc.id,
        action="generate_prescription",
        actor=str(request.user),
        metadata={"appointment_id": appointment.id, "patient_id": patient.id, "prescription_id": prescription.id},
        severity="info",
        notify=True
    )

    return Response(PrescriptionSerializer(prescription).data, status=status.HTTP_201_CREATED)


@extend_schema(
    responses={201: TreatmentSerializer},
    description="Genera un plan de tratamiento en PDF y lo registra como documento clínico."
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_treatment_pdf(request, pk):
    treatment = get_object_or_404(Treatment, pk=pk)
    diagnosis = treatment.diagnosis
    appointment = diagnosis.appointment
    patient = appointment.patient

    context = {
        "treatment": treatment,
        "diagnosis": diagnosis,
        "appointment": appointment,
        "patient": patient,
        "doctor": request.user,
        "institution": InstitutionSettings.objects.first(),
    }

    html_string = render_to_string("pdf/treatment.html", context)
    from weasyprint import HTML
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    filename = f"treatment_{treatment.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    from django.core.files import File
    django_file = File(open(full_path, "rb"), name=filename)

    import hashlib
    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    doc = MedicalDocument.objects.create(
        patient=patient,
        appointment=appointment,
        diagnosis=diagnosis,
        description="Plan de tratamiento generado automáticamente",
        category="treatment_plan",
        source="system_generated",
        origin_panel="treatment_panel",
        template_version="v1.1",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
    )

    Event.objects.create(
        entity="MedicalDocument",
        entity_id=doc.id,
        action="generate_treatment",
        actor=str(request.user),
        metadata={"appointment_id": appointment.id, "patient_id": patient.id, "treatment_id": treatment.id},
        severity="info",
        notify=True
    )

    return Response(TreatmentSerializer(treatment).data, status=status.HTTP_201_CREATED)


@extend_schema(
    responses={201: MedicalReferralSerializer},
    description="Genera una referencia médica en PDF y la registra como documento clínico."
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_referral_pdf(request, pk):
    referral = get_object_or_404(MedicalReferral, pk=pk)
    diagnosis = referral.diagnosis
    appointment = referral.appointment
    patient = appointment.patient

    context = {
        "referral": referral,
        "diagnosis": diagnosis,
        "appointment": appointment,
        "patient": patient,
        "doctor": request.user,
        "institution": InstitutionSettings.objects.first(),
    }

    html_string = render_to_string("pdf/referral.html", context)
    from weasyprint import HTML
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    filename = f"referral_{referral.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    from django.core.files import File
    django_file = File(open(full_path, "rb"), name=filename)

    import hashlib
    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    doc = MedicalDocument.objects.create(
        patient=patient,
        appointment=appointment,
        diagnosis=diagnosis,
        description="Referencia médica generada automáticamente",
        category="medical_referral",
        source="system_generated",
        origin_panel="referral_panel",
        template_version="v1.1",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
    )

    Event.objects.create(
        entity="MedicalDocument",
        entity_id=doc.id,
        action="generate_referral",
        actor=str(request.user),
        metadata={"appointment_id": appointment.id, "patient_id": patient.id, "referral_id": referral.id},
        severity="info",
        notify=True
    )

    return Response(MedicalReferralSerializer(referral).data, status=status.HTTP_201_CREATED)


@extend_schema(
    responses={201: ChargeOrderSerializer},
    description="Genera un comprobante financiero en PDF y lo registra como documento clínico."
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_chargeorder_pdf(request, pk):
    charge_order = get_object_or_404(ChargeOrder, pk=pk)
    patient = charge_order.patient
    appointment = charge_order.appointment

    context = {
        "charge_order": charge_order,
        "items": charge_order.items.all(),
        "payments": charge_order.payments.all(),
        "patient": patient,
        "appointment": appointment,
        "doctor": request.user,
        "institution": InstitutionSettings.objects.first(),
    }

    # Renderizar HTML → PDF
    html_string = render_to_string("pdf/charge_order.html", context)
    from weasyprint import HTML
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    # Guardar PDF en storage
    filename = f"chargeorder_{charge_order.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    from django.core.files import File
    django_file = File(open(full_path, "rb"), name=filename)

    import hashlib
    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    # Crear MedicalDocument blindado
    doc = MedicalDocument.objects.create(
        patient=patient,
        appointment=appointment,
        diagnosis=None,
        description="Comprobante financiero generado automáticamente",
        category="charge_order",
        source="system_generated",
        origin_panel="finance_panel",
        template_version="v1.1",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
    )

    # Evento de auditoría
    Event.objects.create(
        entity="MedicalDocument",
        entity_id=doc.id,
        action="generate_chargeorder",
        actor=str(request.user),
        metadata={"charge_order_id": charge_order.id, "patient_id": patient.id},
        severity="info",
        notify=True
    )

    return Response(ChargeOrderSerializer(charge_order).data, status=status.HTTP_201_CREATED)


@extend_schema(
    parameters=[OpenApiParameter("q", str, OpenApiParameter.QUERY)],
    responses={200: ICD11EntrySerializer(many=True)}
)
@api_view(["GET"])
def icd_search_api(request):
    """
    Endpoint institucional para búsqueda ICD-11 local.
    """
    q = request.GET.get("q", "").strip()
    if not q:
        return Response([], status=200)

    # Buscar por título
    qs = ICD11Entry.objects.filter(title__icontains=q)[:50]
    if not qs.exists():
        # fallback: buscar por código
        qs = ICD11Entry.objects.filter(icd_code__icontains=q)[:50]

    serializer = ICD11EntrySerializer(qs, many=True)
    return Response(serializer.data, status=200)


class MedicalTestViewSet(viewsets.ModelViewSet):
    """
    API endpoint para gestionar órdenes de exámenes médicos (MedicalTest).
    """
    queryset = MedicalTest.objects.all().select_related("appointment", "diagnosis").order_by("-id")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MedicalTestWriteSerializer
        return MedicalTestSerializer

    def perform_create(self, serializer):
        test = serializer.save(created_by=self.request.user)
        Event.objects.create(
            entity="MedicalTest",
            entity_id=test.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "appointment_id": test.appointment_id,
                "diagnosis_id": test.diagnosis_id,
                "test_type": test.test_type,
                "urgency": test.urgency,
                "status": test.status,
            },
            severity="info",
            notify=True,
        )

    def perform_update(self, serializer):
        test = serializer.save(updated_by=self.request.user)
        Event.objects.create(
            entity="MedicalTest",
            entity_id=test.id,
            action="update",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "test_type": test.test_type,
                "urgency": test.urgency,
                "status": test.status,
            },
            severity="info",
            notify=True,
        )


class MedicalReferralViewSet(viewsets.ModelViewSet):
    queryset = MedicalReferral.objects.all().select_related("appointment", "diagnosis").order_by("-id")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        # Unificamos para soportar specialty_ids (M2M) en escritura
        return MedicalReferralSerializer

    def perform_create(self, serializer):
        referral = serializer.save(created_by=self.request.user)
        Event.objects.create(
            entity="MedicalReferral",
            entity_id=referral.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "appointment_id": referral.appointment_id,
                "diagnosis_id": referral.diagnosis_id,
                "specialty_ids": [s.id for s in referral.specialties.all()],
                "urgency": referral.urgency,
                "status": referral.status,
            },
            severity="info",
            notify=True,
        )

    def perform_update(self, serializer):
        referral = serializer.save(updated_by=self.request.user)
        Event.objects.create(
            entity="MedicalReferral",
            entity_id=referral.id,
            action="update",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "specialty_ids": [s.id for s in referral.specialties.all()],
                "urgency": referral.urgency,
                "status": referral.status,
            },
            severity="info",
            notify=True,
        )


class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialty.objects.all().order_by("name")
    serializer_class = SpecialtySerializer


# --- Endpoints para exponer choices al frontend ---

@api_view(["GET"])
def treatment_choices_api(request):
    return Response({
        "treatment_types": [{"key": k, "label": v} for k, v in Treatment.TREATMENT_TYPE_CHOICES],
        "statuses": [{"key": k, "label": v} for k, v in Treatment.STATUS_CHOICES],
    })


@api_view(["GET"])
def prescription_choices_api(request):
    return Response({
        "routes": [{"key": k, "label": v} for k, v in Prescription.ROUTE_CHOICES],
        "frequencies": [{"key": k, "label": v} for k, v in Prescription.FREQUENCY_CHOICES],
        "units": [{"key": k, "label": v} for k, v in Prescription.UNIT_CHOICES],
    })


@api_view(["GET"])
def medicaltest_choices_api(request):
    return Response({
        "test_types": [{"key": k, "label": v} for k, v in MedicalTest.TEST_TYPE_CHOICES],
        "urgencies": [{"key": k, "label": v} for k, v in MedicalTest.URGENCY_CHOICES],
        "statuses": [{"key": k, "label": v} for k, v in MedicalTest.STATUS_CHOICES],
    })


@api_view(["GET"])
def medicalreferral_choices_api(request):
    return Response({
        "specialties": [{"key": k, "label": v} for k, v in MedicalReferral.SPECIALTY_CHOICES],
        "urgencies": [{"key": k, "label": v} for k, v in MedicalReferral.URGENCY_CHOICES],
        "statuses": [{"key": k, "label": v} for k, v in MedicalReferral.STATUS_CHOICES],
    })


@api_view(["GET"])
def specialty_choices_api(request):
    """
    Devuelve el catálogo institucional de especialidades médicas.
    - Si se pasa ?q=, filtra por nombre o código.
    - Ordenado por nombre.
    - Incluye id, code y name.
    """
    q = request.GET.get("q", "").strip()
    qs = Specialty.objects.all().order_by("name")

    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(code__icontains=q))

    serializer = SpecialtySerializer(qs, many=True)
    return Response(serializer.data)