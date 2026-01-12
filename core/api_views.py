from decimal import Decimal, InvalidOperation
from datetime import datetime, date, timedelta
from django.conf import settings
from django.core.files import File
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Count, Sum, Q, F, Value, CharField
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek, Coalesce, Cast, Concat
from django_filters.rest_framework import DjangoFilterBackend
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
from weasyprint import HTML
import hashlib
import base64
import qrcode
import io
from io import BytesIO
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

from rest_framework.views import APIView
from rest_framework import viewsets, status, serializers, permissions, filters
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import parser_classes
from rest_framework.authtoken.views import obtain_auth_token
from drf_spectacular.utils import (
    extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
)

from .models import (
    Patient, Appointment, Payment, Event, WaitingRoomEntry, GeneticPredisposition, MedicalDocument, Diagnosis, Treatment, Prescription, ChargeOrder, ChargeItem, InstitutionSettings, DoctorOperator, BCVRateCache, MedicalReport, ICD11Entry, MedicalTest, MedicalReferral, Specialty, DocumentCategory, DocumentSource, PersonalHistory, FamilyHistory, Surgery, Habit, Vaccine, VaccinationSchedule, PatientVaccination, Allergy, MedicalHistory, ClinicalAlert, Country, State, Municipality, City, Parish, Neighborhood
)

from .serializers import (
    PatientReadSerializer, PatientWriteSerializer, PatientDetailSerializer,
    PatientListSerializer, AppointmentSerializer, PaymentSerializer,
    WaitingRoomEntrySerializer, WaitingRoomEntryDetailSerializer,
    DashboardSummarySerializer,
    GeneticPredispositionSerializer, MedicalDocumentReadSerializer, MedicalDocumentWriteSerializer,
    AppointmentPendingSerializer, DiagnosisSerializer, TreatmentSerializer, PrescriptionSerializer,
    AppointmentDetailSerializer, ChargeOrderSerializer, ChargeItemSerializer, ChargeOrderPaymentSerializer,
    EventSerializer, ReportRowSerializer, ReportFiltersSerializer, ReportExportSerializer, InstitutionSettingsSerializer,
    DoctorOperatorSerializer, MedicalReportSerializer, ICD11EntrySerializer, DiagnosisWriteSerializer,
    MedicalTestSerializer, MedicalReferralSerializer, PrescriptionWriteSerializer, TreatmentWriteSerializer,
    MedicalTestWriteSerializer, MedicalReferralWriteSerializer, SpecialtySerializer,
    PersonalHistorySerializer, FamilyHistorySerializer, SurgerySerializer, HabitSerializer,
    VaccineSerializer, VaccinationScheduleSerializer, PatientVaccinationSerializer, PatientClinicalProfileSerializer,
    AllergySerializer, MedicalHistorySerializer, ClinicalAlertSerializer, CountrySerializer, StateSerializer, MunicipalitySerializer,
    CitySerializer, ParishSerializer, NeighborhoodSerializer
)

from core.utils.search_normalize import normalize, normalize_token
from .choices import UNIT_CHOICES, ROUTE_CHOICES, FREQUENCY_CHOICES


login_view = obtain_auth_token


def get_doctor_context() -> dict:
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []
    return {
        "full_name": doctor.full_name if doctor else "",
        "colegiado_id": doctor.colegiado_id if doctor else "",
        "specialties": specialties if specialties else ["No especificadas"],
        "signature": doctor.signature if (doctor and doctor.signature) else None,
    }

def get_patient_serialized(patient) -> dict:
    return dict(PatientDetailSerializer(patient).data)

def make_qr_data_uri(payload: str) -> str:
    img = qrcode.make(payload)
    buf = BytesIO()
    img.save(buf, "PNG")
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"


# --- Utilidades ---
class GeneticPredispositionViewSet(viewsets.ModelViewSet):
    queryset = GeneticPredisposition.objects.all().order_by("name")
    serializer_class = GeneticPredispositionSerializer

def safe_json(value):
    return float(value) if isinstance(value, Decimal) else value


def generate_audit_code(appointment, patient):
    """
    Genera un código de auditoría único y trazable para documentos clínicos.
    Combina ID de consulta, ID de paciente y timestamp.
    """
    raw = f"{appointment.id}-{patient.id}-{timezone.now().isoformat()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12]  # 12 caracteres

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
        OpenApiParameter("status", str, OpenApiParameter.QUERY, description="Filtrar citas por estado"),
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
        status_param = request.GET.get("status")

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
            start = today - timedelta(days=6)
            end = today

        # --- Finanzas ---
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
        # --- Clínico-operativo ---
        try:
            total_appointments = Appointment.objects.filter(appointment_date__range=(start, end)).count()
            pending_appointments = Appointment.objects.filter(appointment_date__range=(start, end), status="pending").count()
            completed_appointments = Appointment.objects.filter(appointment_date__range=(start, end), status="completed").count()
            active_consultations = Appointment.objects.filter(appointment_date__range=(start, end), status="in_consultation").count()
            canceled_appointments = Appointment.objects.filter(appointment_date__range=(start, end), status="canceled").count()
            arrived_appointments = Appointment.objects.filter(appointment_date__range=(start, end), status="arrived").count()
            waiting_room_count = WaitingRoomEntry.objects.filter(arrival_time__date__range=(start, end), status="waiting").count()
        except Exception:
            total_appointments = pending_appointments = completed_appointments = active_consultations = 0
            canceled_appointments = arrived_appointments = waiting_room_count = 0

        # --- Tendencias ---
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
            pay_trend = [{"date": str(row["date"]), "value": float(row["value"] or 0)} for row in pay_trend_qs]
        except Exception:
            pay_trend = []

        try:
            balance_trend_qs = (
                ChargeOrder.objects.filter(issued_at__date__range=(start, end))
                .annotate(date=TruncDate("issued_at"))
                .values("date")
                .annotate(total=Sum("total"), balance=Sum("balance_due"))
                .order_by("date")
            )
            balance_trend = []
            for row in balance_trend_qs:
                total_v = float(row.get("total") or 0)
                bal_v = float(row.get("balance") or 0)
                val = max(total_v - bal_v, 0)
                balance_trend.append({"date": str(row["date"]), "value": val})
        except Exception:
            balance_trend = []

        # --- Totales ---
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
        try:
            total_canceled_orders = ChargeOrder.objects.filter(
                issued_at__date__range=(start, end),
                status="void"
            ).count()
        except Exception:
            total_canceled_orders = 0
        # --- BCV Rate ---
        try:
            latest_rate = BCVRateCache.objects.order_by("-created_at").first()
            if latest_rate:
                rate_value = float(latest_rate.value)
                bcv_rate = {
                    "value": rate_value,
                    "unit": "VES_per_USD",
                    "precision": 8,
                    "is_fallback": False,
                }
            else:
                rate_value = 1.0
                bcv_rate = {
                    "value": rate_value,
                    "unit": "VES_per_USD",
                    "precision": 8,
                    "is_fallback": True,
                }
        except Exception:
            rate_value = 1.0
            bcv_rate = {
                "value": rate_value,
                "unit": "VES_per_USD",
                "precision": 8,
                "is_fallback": True,
            }

        def convert_amount(amount, rate, currency):
            try:
                if currency == "VES":
                    return float(amount) * rate
                return float(amount)
            except Exception:
                return float(amount)

        # --- Payload ---
        data = {
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "completed_appointments": completed_appointments,
            "pending_appointments": pending_appointments,
            "active_consultations": active_consultations,
            "canceled_appointments": canceled_appointments,
            "arrived_appointments": arrived_appointments,
            "waiting_room_count": waiting_room_count,
            "total_payments": total_payments,
            "total_events": total_events,
            "total_canceled_orders": total_canceled_orders,
            "total_waived": total_waived,
            "total_payments_amount": convert_amount(confirmed_amount, rate_value, currency),
            "estimated_waived_amount": convert_amount(estimated_waived_amount, rate_value, currency),
            "financial_balance": convert_amount(max(total_amount - balance_due, Decimal("0")), rate_value, currency),
            "appointments_trend": appt_trend,
            "payments_trend": pay_trend,
            "balance_trend": balance_trend,
            "bcv_rate": bcv_rate,
            "event_log": [],
        }
        return Response(data, status=200)

    except Exception as e:
        traceback.print_exc()
        return Response({
            "error": str(e),
            "total_patients": 0,
            "total_appointments": 0,
            "completed_appointments": 0,
            "pending_appointments": 0,
            "active_consultations": 0,
            "canceled_appointments": 0,
            "arrived_appointments": 0,
            "waiting_room_count": 0,
            "total_payments": 0,
            "total_events": 0,
            "total_canceled_orders": 0,
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


@extend_schema(
    parameters=[OpenApiParameter("q", str, OpenApiParameter.QUERY)],
    responses={200: PatientReadSerializer(many=True)}
)
@api_view(["GET"])
def patient_search_api(request):
    query = request.GET.get("q", "").strip()

    if not query:
        return Response([], status=200)

    # Normalizar tokens del usuario
    raw_tokens = [t.strip() for t in query.split() if t.strip()]
    tokens = [normalize_token(t) for t in raw_tokens]

    if not tokens:
        return Response([], status=200)

    # ============================================================
    # ANNOTATE NORMALIZADO
    # ============================================================
    qs = (
        Patient.objects
        .filter(active=True)
        .annotate(
            first_name_norm=normalize(F("first_name")),
            last_name_norm=normalize(F("last_name")),
            middle_name_norm=normalize(F("middle_name")),
            second_last_name_norm=normalize(F("second_last_name")),
            national_id_norm=normalize(F("national_id")),
        )
    )

    # ============================================================
    # FILTRO ACENTO-INSENSIBLE
    # ============================================================
    q = Q()
    for token in tokens:
        q |= Q(first_name_norm__icontains=token)
        q |= Q(last_name_norm__icontains=token)
        q |= Q(middle_name_norm__icontains=token)
        q |= Q(second_last_name_norm__icontains=token)
        q |= Q(national_id_norm__icontains=token)

        # búsqueda exacta por folio
        if token.isdigit():
            q |= Q(id=int(token))

    qs = qs.filter(q).order_by("id")[:10]

    # ============================================================
    # SERIALIZACIÓN SIMPLE (sin paginación)
    # ============================================================
    serializer = PatientReadSerializer(qs, many=True)
    return Response(serializer.data, status=200)


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

    # 🔹 Guardar las notas en la cita
    appointment.notes = notes
    appointment.save(update_fields=["notes"])

    # 🔹 Registrar evento de auditoría (sin timestamp manual)
    Event.objects.create(
        entity="Appointment",
        entity_id=appointment.id,
        action="update_notes",
        actor=str(request.user) if request.user.is_authenticated else "system",
        metadata={"notes": notes},   # opcional: guardar el contenido
        severity="info",
        notify=True
    )

    # 🔹 Devolver cita actualizada
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
    # 🔹 Ventana institucional: últimos 7 días
    now = timezone.now()
    window_start = now - timedelta(days=7)

    # 🔹 Eventos críticos y recientes
    recent_events = (
        Event.objects
        .filter(notify=True, timestamp__gte=window_start)
        .order_by("-timestamp")[:3]  # 🔹 directamente los 3 más recientes
    )

    serializer = EventSerializer(recent_events, many=True)
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


@extend_schema(
    parameters=[
        OpenApiParameter("prescription_id", int, OpenApiParameter.PATH, description="ID de la prescripción"),
    ],
    responses={200: EventSerializer(many=True)},
    description="Historial de auditoría de una prescripción específica."
)
@api_view(["GET"])
def audit_by_prescription(request, prescription_id):
    events = Event.objects.filter(
        entity="Prescription",
        entity_id=prescription_id
    ).order_by("-timestamp")

    serializer = EventSerializer(events, many=True)
    return Response(serializer.data, status=200)


@extend_schema(
    parameters=[
        OpenApiParameter("patient_id", int, OpenApiParameter.PATH, description="ID del paciente"),
    ],
    responses={200: OpenApiResponse(description="Eventos clínicos y financieros de un paciente")},
    description="Auditoría completa de un paciente: prescripciones, tratamientos, pagos y órdenes."
)
@api_view(["GET"])
def audit_full_by_patient(request, patient_id):
    # 🔹 Eventos clínicos: prescripciones y tratamientos
    clinical_events = Event.objects.filter(
        entity__in=["Prescription", "Treatment"],
        metadata__contains={"patient_id": patient_id}
    ).order_by("-timestamp")

    # 🔹 Eventos financieros: pagos y órdenes
    financial_events = Event.objects.filter(
        entity__in=["Payment", "ChargeOrder"],
        metadata__contains={"patient_id": patient_id}
    ).order_by("-timestamp")

    # 🔹 Eventos generales del paciente
    patient_events = Event.objects.filter(
        entity="Patient",
        entity_id=patient_id
    ).order_by("-timestamp")

    serializer = EventSerializer(list(clinical_events) + list(financial_events) + list(patient_events), many=True)
    return Response(serializer.data, status=200)


@extend_schema(
    parameters=[
        OpenApiParameter("patient_id", int, OpenApiParameter.PATH, description="ID del paciente"),
    ],
    responses={200: OpenApiResponse(description="Resumen de auditoría por paciente (últimos 10 eventos por categoría)")},
    description="Devuelve los últimos eventos clínicos, financieros y generales de un paciente."
)
@api_view(["GET"])
def audit_summary_by_patient(request, patient_id):
    # 🔹 Últimos 10 eventos clínicos (prescripciones y tratamientos)
    clinical_events = Event.objects.filter(
        entity__in=["Prescription", "Treatment"],
        metadata__contains={"patient_id": patient_id}
    ).order_by("-timestamp")[:10]

    # 🔹 Últimos 10 eventos financieros (pagos y órdenes)
    financial_events = Event.objects.filter(
        entity__in=["Payment", "ChargeOrder"],
        metadata__contains={"patient_id": patient_id}
    ).order_by("-timestamp")[:10]

    # 🔹 Últimos 10 eventos generales del paciente
    patient_events = Event.objects.filter(
        entity="Patient",
        entity_id=patient_id
    ).order_by("-timestamp")[:10]

    serializer = EventSerializer(list(clinical_events) + list(financial_events) + list(patient_events), many=True)

    return Response({
        "clinical_events": EventSerializer(clinical_events, many=True).data,
        "financial_events": EventSerializer(financial_events, many=True).data,
        "patient_events": EventSerializer(patient_events, many=True).data,
        "all_events": serializer.data,  # 🔹 consolidado
    }, status=200)


@extend_schema(
    responses={200: EventSerializer(many=True)},
    description="Devuelve los últimos eventos globales de auditoría (clínicos y financieros) para todo el sistema."
)
@api_view(["GET"])
def audit_global_summary(request):
    # 🔹 Últimos 10 eventos clínicos (prescripciones y tratamientos)
    clinical_events = Event.objects.filter(
        entity__in=["Prescription", "Treatment"]
    ).order_by("-timestamp")[:10]

    # 🔹 Últimos 10 eventos financieros (pagos y órdenes)
    financial_events = Event.objects.filter(
        entity__in=["Payment", "ChargeOrder"]
    ).order_by("-timestamp")[:10]

    # 🔹 Últimos 10 eventos generales (pacientes, citas, sala de espera)
    general_events = Event.objects.filter(
        entity__in=["Patient", "Appointment", "WaitingRoomEntry"]
    ).order_by("-timestamp")[:10]

    return Response({
        "clinical_events": EventSerializer(clinical_events, many=True).data,
        "financial_events": EventSerializer(financial_events, many=True).data,
        "general_events": EventSerializer(general_events, many=True).data,
        "all_events": EventSerializer(
            list(clinical_events) + list(financial_events) + list(general_events),
            many=True
        ).data,
    }, status=200)


@extend_schema(
    parameters=[
        OpenApiParameter("start_date", str, OpenApiParameter.QUERY, description="Fecha inicial (YYYY-MM-DD)"),
        OpenApiParameter("end_date", str, OpenApiParameter.QUERY, description="Fecha final (YYYY-MM-DD)"),
        OpenApiParameter("entity", str, OpenApiParameter.QUERY, description="Entidad: Prescription|Treatment|Payment|ChargeOrder|Appointment|Patient|WaitingRoomEntry"),
        OpenApiParameter("severity", str, OpenApiParameter.QUERY, description="Severidad: info|warning|critical"),
        OpenApiParameter("actor", str, OpenApiParameter.QUERY, description="Usuario/actor que ejecutó la acción"),
    ],
    responses={200: EventSerializer(many=True)},
    description="Eventos de auditoría global filtrados por rango de fechas, entidad, severidad o actor."
)
@api_view(["GET"])
def audit_global_filtered(request):
    qs = Event.objects.all().order_by("-timestamp")

    # --- Filtros dinámicos ---
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    entity = request.GET.get("entity")
    severity = request.GET.get("severity")
    actor = request.GET.get("actor")

    if start_date:
        qs = qs.filter(timestamp__date__gte=start_date)
    if end_date:
        qs = qs.filter(timestamp__date__lte=end_date)
    if entity:
        qs = qs.filter(entity=entity)
    if severity:
        qs = qs.filter(severity=severity)
    if actor:
        qs = qs.filter(actor__icontains=actor)

    # 🔹 Limitamos a 100 eventos para no sobrecargar
    events = qs[:100]
    serializer = EventSerializer(events, many=True)
    return Response(serializer.data, status=200)


# --- ViewSets ---
class MedicalDocumentViewSet(viewsets.ModelViewSet):
    """
    CRUD de documentos clínicos.
    - GET /documents/?patient={id}&appointment={id}&category={code}
    - POST /documents/ (multipart) → subir documento clínico
    - DELETE /documents/{id}/ → eliminar documento clínico
    - Los PDFs institucionales se registran con metadatos blindados automáticamente.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = MedicalDocument.objects.select_related("patient", "appointment", "diagnosis")
        patient_id = self.request.query_params.get("patient")
        appointment_id = self.request.query_params.get("appointment")
        category = self.request.query_params.get("category")

        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if appointment_id:
            qs = qs.filter(appointment_id=appointment_id)
        if category:
            qs = qs.filter(category=category)

        return qs.order_by("-uploaded_at")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MedicalDocumentWriteSerializer
        return MedicalDocumentReadSerializer

    def perform_create(self, serializer):
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

        # Metadatos institucionales
        extra_data["source"] = "user_uploaded"
        extra_data["origin_panel"] = "consultation_or_patient"
        extra_data["template_version"] = "v1.0"
        extra_data["uploaded_by"] = user
        extra_data["generated_by"] = user

        # Guardar documento
        document = serializer.save(**extra_data)

        # 🔹 Auditoría
        from core.models import Event
        Event.objects.create(
            entity="MedicalDocument",
            entity_id=document.id,
            action="create",
            actor=str(user) if user else "system",
            metadata={
                "patient_id": document.patient_id,
                "appointment_id": document.appointment_id,
                "diagnosis_id": document.diagnosis_id,
                "category": document.category,
                "description": document.description,
                "checksum": document.checksum_sha256,
            },
            severity="info",
            notify=True,
        )

    def perform_update(self, serializer):
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

        document = serializer.save(**extra_data)

        # 🔹 Auditoría
        from core.models import Event
        Event.objects.create(
            entity="MedicalDocument",
            entity_id=document.id,
            action="update",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "patient_id": document.patient_id,
                "appointment_id": document.appointment_id,
                "diagnosis_id": document.diagnosis_id,
                "category": document.category,
                "description": document.description,
                "checksum": document.checksum_sha256,
            },
            severity="info",
            notify=True,
        )

    def perform_destroy(self, instance):
        """
        DELETE → elimina documento clínico con auditoría.
        """
        user = self.request.user if self.request.user.is_authenticated else None
        doc_id = instance.id
        patient_id = instance.patient_id
        appointment_id = instance.appointment_id

        # 🔹 Auditoría antes de borrar
        from core.models import Event
        Event.objects.create(
            entity="MedicalDocument",
            entity_id=doc_id,
            action="delete",
            actor=str(user) if user else "system",
            metadata={
                "patient_id": patient_id,
                "appointment_id": appointment_id,
                "category": instance.category,
                "description": instance.description,
            },
            severity="warning",
            notify=True,
        )

        instance.delete()


class PatientPagination(PageNumberPagination):
    page_size = 10                # tamaño por defecto
    page_size_query_param = "page_size"  # permite override desde querystring
    max_page_size = 100


class PatientViewSet(viewsets.ModelViewSet):
    # 🔒 Paginación institucional
    pagination_class = PatientPagination
    permission_classes = [permissions.IsAuthenticated]

    # 🔒 Queryset dinámico: siempre solo activos en listados
    def get_queryset(self):
        return Patient.objects.filter(active=True).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        if self.action == "retrieve":
            # 👇 Devuelve el perfil clínico completo (incluye predisposiciones y secciones)
            return PatientClinicalProfileSerializer
        if self.action in ["create", "update", "partial_update"]:
            # 👇 Escritura (persistencia M2M vía .set())
            return PatientWriteSerializer
        # Opcional: lectura simple para otras acciones
        return PatientDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        """
        GET → Devuelve el perfil clínico completo del paciente.
        Blindaje: si el paciente no existe, devuelve 404 en vez de 500.
        """
        patient = get_object_or_404(Patient, pk=kwargs.get("pk"), active=True)
        serializer = PatientClinicalProfileSerializer(patient)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        """
        GET → Lista paginada de pacientes activos.
        Blindaje explícito para evitar incluir inactivos por cache o queryset estático.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH → Actualización parcial con persistencia ManyToMany via PatientWriteSerializer.
        Devuelve el perfil clínico completo para sincronizar UI inmediatamente.
        """
        instance = self.get_object()
        serializer = PatientWriteSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        # 👇 responder con perfil clínico completo
        read_serializer = PatientClinicalProfileSerializer(instance)
        return Response(read_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """
        DELETE → Soft delete: marca active=False y devuelve 204 No Content.
        """
        patient = self.get_object()
        patient.delete()  # 👈 override del modelo: active=False
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def profile(self, request, pk=None):
        """
        GET → Devuelve el perfil clínico completo del paciente,
        incluyendo antecedentes personales, familiares y predisposiciones genéticas.
        """
        patient = self.get_object()
        serializer = PatientClinicalProfileSerializer(patient)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        patient = self.get_object()
        payments = Payment.objects.filter(appointment__patient=patient)
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def documents(self, request, pk=None):
        """
        GET → Lista auditable de documentos clínicos del paciente.
        POST → Permite subir un documento manualmente.
        """
        patient = self.get_object()

        if request.method == "GET":
            docs = patient.documents.all().order_by("-uploaded_at", "-id")
            data = []
            for doc in docs:
                try:
                    file_url = doc.file.url
                except Exception:
                    file_url = f"/media/{doc.file.name}" if getattr(doc.file, "name", None) else None

                data.append({
                    "id": doc.id,
                    "category": doc.category,
                    "description": doc.description,
                    "audit_code": doc.audit_code,
                    "file_url": file_url,
                    "appointment_id": getattr(doc.appointment, "id", None),
                    "uploaded_at": doc.uploaded_at,
                    "source": doc.source,
                    "origin_panel": doc.origin_panel,
                    "is_signed": doc.is_signed,
                    "mime_type": doc.mime_type,
                    "size_bytes": doc.size_bytes,
                })
            return Response(data, status=200)

        if request.method == "POST":
            serializer = MedicalDocumentWriteSerializer(data=request.data, context={"request": request})
            if serializer.is_valid():
                doc = serializer.save(patient=patient)
                try:
                    file_url = doc.file.url
                except Exception:
                    file_url = f"/media/{doc.file.name}" if getattr(doc.file, "name", None) else None

                return Response({
                    "id": doc.id,
                    "category": doc.category,
                    "description": doc.description,
                    "audit_code": doc.audit_code,
                    "file_url": file_url,
                    "appointment_id": getattr(doc.appointment, "id", None),
                    "uploaded_at": doc.uploaded_at,
                    "source": doc.source,
                    "origin_panel": doc.origin_panel,
                    "is_signed": doc.is_signed,
                    "mime_type": doc.mime_type,
                    "size_bytes": doc.size_bytes,
                }, status=201)
            return Response(serializer.errors, status=400)

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """
        GET → Buscar pacientes activos por nombre o documento.
        """
        q = request.query_params.get("q", "").strip()
        queryset = Patient.objects.filter(active=True)

        if q:
            queryset = queryset.filter(
                Q(first_name__icontains=q) |
                Q(middle_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(second_last_name__icontains=q) |
                Q(national_id__icontains=q)
            )

        page = self.paginate_queryset(queryset)
        serializer = PatientListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=["delete"], url_path=r"documents/(?P<document_id>\d+)")
    def delete_document(self, request, pk=None, document_id=None):
        """
        DELETE → Elimina un documento del paciente validando pertenencia.
        Ruta: /patients/{pk}/documents/{document_id}/
        """
        doc = get_object_or_404(MedicalDocument, id=document_id, patient_id=pk)
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def completed_appointments(self, request, pk=None):
        patient = self.get_object()
        appointments = Appointment.objects.filter(
            patient=patient,
            status="completed"
        ).order_by("-appointment_date")
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def pending_appointments(self, request, pk=None):
        patient = self.get_object()
        appointments = Appointment.objects.filter(
            patient=patient,
            status__in=["pending", "arrived", "in_consultation"]
        ).order_by("appointment_date")
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def waitingroom_entries_today_api(request):
    import time
    start = time.time()

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

        end = time.time()
        print(f"⏱️ Tiempo de ejecución waitingroom_entries_today_api: {end - start:.2f} segundos")

        return Response(serializer.data, status=200)

    except Exception as e:
        end = time.time()
        print(f"🔥 ERROR EN WAITING ROOM ENTRIES 🔥 {e} (duró {end - start:.2f} segundos)")
        return Response([], status=200)


@extend_schema(
    responses={200: AppointmentPendingSerializer(many=True)},
    description="Devuelve citas con saldo pendiente (expected_amount > suma de pagos confirmados), incluyendo estado financiero."
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
            if p.status == "confirmed":  # 🔹 antes estaba "paid"
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
    """
    API endpoint para gestionar citas médicas (Appointment).
    Incluye acción custom para manejar órdenes de cobro asociadas.
    Adaptado para entorno mono-médico: sin relación directa con doctor.
    """

    def get_queryset(self):
        qs = Appointment.objects.select_related("patient")  # ✅ solo patient, no doctor
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            try:
                patient_id = int(patient_id)
                qs = qs.filter(patient_id=patient_id)
            except (ValueError, TypeError):
                return Appointment.objects.none()
        return qs

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
                currency="USD",
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


# --- Prescripciones con auditoría completa ---
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
                "medication_catalog": prescription.medication_catalog_id,
                "medication_text": prescription.medication_text,
                "route": prescription.route,
                "frequency": prescription.frequency,
                "duration": prescription.duration,
                # 🔹 ahora auditamos los componentes
                "components": [
                    {
                        "substance": c.substance,
                        "dosage": str(c.dosage),
                        "unit": c.unit,
                    }
                    for c in prescription.components.all()
                ],
            },
            severity="info",
            notify=True,
        )

    def perform_update(self, serializer):
        prescription = serializer.save()
        Event.objects.create(
            entity="Prescription",
            entity_id=prescription.id,
            action="update",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "diagnosis_id": prescription.diagnosis_id,
                "medication_catalog": prescription.medication_catalog_id,
                "medication_text": prescription.medication_text,
                "route": prescription.route,
                "frequency": prescription.frequency,
                "duration": prescription.duration,
                "components": [
                    {
                        "substance": c.substance,
                        "dosage": str(c.dosage),
                        "unit": c.unit,
                    }
                    for c in prescription.components.all()
                ],
            },
            severity="info",
            notify=True,
        )

    def perform_destroy(self, instance):
        Event.objects.create(
            entity="Prescription",
            entity_id=instance.id,
            action="delete",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "diagnosis_id": instance.diagnosis_id,
                "medication_catalog": instance.medication_catalog_id,
                "medication_text": instance.medication_text,
            },
            severity="warning",
            notify=True,
        )
        instance.delete()


class ChargeOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    # Queryset base sin side effects
    queryset = (
        ChargeOrder.objects
        .select_related("appointment", "patient")
        .prefetch_related("items", "payments")
    )

    # Filtros, búsqueda y orden institucional
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["patient__full_name", "id"]

    # 🔹 Campos de ordenamiento reales (sin alias inventados)
    ordering_fields = ["appointment__appointment_date", "issued_at", "id", "status", "total", "balance_due"]

    # 🔹 Orden por defecto: más recientes primero
    ordering = ["-appointment__appointment_date", "-issued_at", "-id"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .order_by("-appointment__appointment_date", "-issued_at", "-id")
        )

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
    

    @action(detail=False, methods=["get"])
    def summary(self, request):
        qs = self.get_queryset()
        total = qs.aggregate(total=Sum("total"))["total"] or 0
        confirmed = qs.filter(status="paid").aggregate(s=Sum("total"))["s"] or 0
        pending = qs.filter(status__in=["open", "partially_paid"]).aggregate(s=Sum("total"))["s"] or 0
        failed = qs.filter(status__in=["void", "waived"]).aggregate(s=Sum("total"))["s"] or 0

        return Response({
            "total": float(total),
            "confirmed": float(confirmed),
            "pending": float(pending),
            "failed": float(failed),
        })
        

    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        order = self.get_object()
        data = []
        for e in Event.objects.filter(entity="ChargeOrder", entity_id=order.id).order_by("-timestamp"):
            notes = e.metadata or {}
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
            status="confirmed"
        )

        # Recalcular totales y estado de la orden (solo en mutaciones)
        order.recalc_totals()
        if order.balance_due <= 0:
            order.status = "paid"
        elif order.payments.filter(status="confirmed").exists():
            order.status = "partially_paid"
        else:
            order.status = "open"
        order.save(update_fields=["total", "balance_due", "status"])

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

            paciente = str(order.patient) if order.patient else f"Paciente #{order.patient_id or '—'}"
            fecha = order.created_at.strftime("%d/%m/%Y %H:%M") if order.created_at else "—"

            elements.append(Paragraph(f"<b>Orden de Pago #{order.id}</b>", styles["Title"]))
            elements.append(Paragraph(f"Paciente: {paciente}", styles["Normal"]))
            elements.append(Paragraph(f"Fecha: {fecha}", styles["Normal"]))
            elements.append(Spacer(1, 12))

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

            total = order.total or Decimal("0")
            paid = order.payments.filter(status="confirmed").aggregate(s=Sum("amount")).get("s") or Decimal("0")
            pending = total - paid

            elements.append(Paragraph(f"<b>Total:</b> ${total:.2f}", styles["Normal"]))
            elements.append(Paragraph(f"<b>Pagado:</b> ${paid:.2f}", styles["Normal"]))
            elements.append(Paragraph(f"<b>Pendiente:</b> ${pending:.2f}", styles["Normal"]))
            elements.append(Spacer(1, 24))

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
        OpenApiExample(
            "Ejemplo de filtros",
            value={"start_date": "2025-11-01", "end_date": "2025-11-07", "type": "financial"},
            request_only=True,
        ),
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
        # 🔹 Solo pagos con fecha de confirmación registrada
        qs = Payment.objects.select_related("appointment__patient").filter(received_at__isnull=False)

        if start and end:
            qs = qs.filter(received_at__date__range=(start, end))
        elif start:
            qs = qs.filter(received_at__date__gte=start)
        elif end:
            qs = qs.filter(received_at__date__lte=end)

        for p in qs:
            data.append({
                "id": p.id,
                "date": p.received_at.date().isoformat(),  # 🔹 Fecha real de confirmación
                "type": "financial",
                "entity": str(p.appointment.patient) if p.appointment else "—",
                "status": p.status,
                "amount": float(p.amount or 0),
            })

    elif report_type == "clinical":
        qs = Appointment.objects.select_related("patient")

        if start and end:
            qs = qs.filter(appointment_date__range=(start, end))
        elif start:
            qs = qs.filter(appointment_date__gte=start)
        elif end:
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
        payments = Payment.objects.select_related("appointment__patient").filter(received_at__isnull=False)
        appointments = Appointment.objects.select_related("patient")

        if start and end:
            payments = payments.filter(received_at__date__range=(start, end))
            appointments = appointments.filter(appointment_date__range=(start, end))
        elif start:
            payments = payments.filter(received_at__date__gte=start)
            appointments = appointments.filter(appointment_date__gte=start)
        elif end:
            payments = payments.filter(received_at__date__lte=end)
            appointments = appointments.filter(appointment_date__lte=end)

        for p in payments:
            data.append({
                "id": p.id,
                "date": p.received_at.date().isoformat(),  # 🔹 Fecha real de confirmación
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
    # Import local para evitar encabezados de import
    from decimal import Decimal, ROUND_HALF_UP

    try:
        serializer = ReportExportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated: Dict[str, Any] = cast(Dict[str, Any], serializer.validated_data)
        export_format = validated["format"]
        filters = validated.get("filters", {})
        serialized = validated.get("data", [])

        # 🔹 Blindaje: evitar exportaciones vacías
        if not serialized:
            return Response({"error": "No hay datos para exportar"}, status=400)

        # --- Configuración institucional y médico operador ---
        inst = InstitutionSettings.objects.first()
        doc_op = DoctorOperator.objects.first()

        # Preparar especialidades del médico operador
        specialty_str = ""
        if doc_op and hasattr(doc_op, "specialties"):
            try:
                specialty_str = ", ".join([str(s) for s in doc_op.specialties.all()])
            except Exception:
                specialty_str = str(doc_op.specialties or "")

        # --- Switch multimoneda (todo en Decimal) ---
        target_currency = validated.get("currency", "USD")
        rate: Decimal = Decimal("1.0")
        if target_currency == "VES":
            try:
                # get_bcv_rate debe devolver Decimal
                rate_val = get_bcv_rate()
                rate = rate_val if isinstance(rate_val, Decimal) else Decimal(str(rate_val))
            except Exception:
                obj = BCVRateCache.objects.order_by("-date").first()
                cache_val = (obj.value if obj else Decimal("1.0"))
                rate = cache_val if isinstance(cache_val, Decimal) else Decimal(str(cache_val))

        # --- Export PDF ---
        if export_format == "pdf":
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            elements = []
            styles = getSampleStyleSheet()

            if inst:
                elements.append(Paragraph(f"<b>{inst.name or ''}</b>", styles["Title"]))
                elements.append(Paragraph(f"Dirección: {inst.address or ''}", styles["Normal"]))
                elements.append(Paragraph(f"Tel: {inst.phone or ''} • RIF: {inst.tax_id or ''}", styles["Normal"]))
                elements.append(Spacer(1, 12))

            if doc_op:
                elements.append(Paragraph(
                    f"Médico operador: {doc_op.full_name or ''} • Colegiado: {doc_op.colegiado_id or ''} • {specialty_str}",
                    styles["Normal"]
                ))
                elements.append(Spacer(1, 8))

            elements.append(Paragraph("<b>Reporte Institucional</b>", styles["Heading2"]))
            elements.append(Paragraph(f"Filtros aplicados: {filters}", styles["Normal"]))
            elements.append(Spacer(1, 12))

            data = [["ID", "Fecha", "Tipo", "Entidad", "Estado", "Monto", "Moneda"]]
            for r in serialized:
                safe_date = r.get("date")
                try:
                    safe_date_str = safe_date.strftime("%Y-%m-%d")
                except Exception:
                    safe_date_str = str(safe_date or "")

                amount_dec = Decimal(str(r.get("amount") or "0"))
                amount_val = (amount_dec * rate).quantize(Decimal("0.01"), ROUND_HALF_UP)
                currency_val = target_currency

                data.append([
                    str(r.get("id") or ""),
                    safe_date_str,
                    str(r.get("type") or ""),
                    str(r.get("entity") or ""),
                    str(r.get("status") or ""),
                    f"{float(amount_val):.2f}",
                    currency_val,
                ])

            if len(data) == 1:
                return Response({"error": "No hay filas para exportar"}, status=400)

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
                ws["C1"] = inst.name or ""
                ws["C1"].font = Font(bold=True, size=14)
                ws["C2"] = f"Dirección: {inst.address or ''}"
                ws["C3"] = f"Tel: {inst.phone or ''} • RIF: {inst.tax_id or ''}"
            if doc_op:
                ws["C4"] = f"Médico operador: {doc_op.full_name or ''} • Colegiado: {doc_op.colegiado_id or ''} • {specialty_str}"
            ws["C6"] = f"Filtros aplicados: {filters}"

            headers = ["ID", "Fecha", "Tipo", "Entidad", "Estado", "Monto", "Moneda"]
            ws.append([])
            ws.append(headers)

            excel_rows_count = 0
            for r in serialized:
                safe_date = r.get("date")
                try:
                    safe_date_str = safe_date.strftime("%Y-%m-%d")
                except Exception:
                    safe_date_str = str(safe_date or "")

                amount_dec = Decimal(str(r.get("amount") or "0"))
                amount_val = (amount_dec * rate).quantize(Decimal("0.01"), ROUND_HALF_UP)
                currency_val = target_currency

                ws.append([
                    str(r.get("id") or ""),
                    safe_date_str,
                    str(r.get("type") or ""),
                    str(r.get("entity") or ""),
                    str(r.get("status") or ""),
                    float(amount_val),  # Excel maneja float, ya cuantizado a 2 decimales
                    currency_val,
                ])
                excel_rows_count += 1

            if excel_rows_count == 0:
                return Response({"error": "No hay filas para exportar"}, status=400)

            header_row_index = ws.max_row - excel_rows_count
            for cell in ws[header_row_index]:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.alignment = Alignment(horizontal="center")
                cell.fill = PatternFill(start_color="003366", end_color="003366", fill_type="solid")

            for row_idx, row in enumerate(ws.iter_rows(min_row=header_row_index + 1, max_row=ws.max_row), start=0):
                fill_color = "F2F2F2" if row_idx % 2 == 0 else "FFFFFF"
                for cell in row:
                    cell.fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")

            for col in ws.columns:
                max_length = 0
                col_letter = col[0].column_letter
                for cell in col:
                    try:
                        if cell.value is not None:
                            max_length = max(max_length, len(str(cell.value)))
                    except Exception:
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
        return Response(
            {"error": str(e), "traceback": tb},
            status=500,
            content_type="application/json"
        )


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def institution_settings_api(request):
    # Obtenemos el registro único (ID=1)
    settings_obj, _ = InstitutionSettings.objects.get_or_create(id=1)

    if request.method == "GET":
        serializer = InstitutionSettingsSerializer(settings_obj)
        return Response(serializer.data)

    # El PATCH procesará el neighborhood_id y el logo sin problemas
    serializer = InstitutionSettingsSerializer(
        settings_obj, data=request.data, partial=True
    )
    
    if serializer.is_valid():
        # Pasamos el updated_by directamente al save
        serializer.save(updated_by=request.user)
        return Response(serializer.data)
    
    # Si hay error (ej: ID de sector no existe), lo veremos aquí
    return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def doctor_operator_settings_api(request):
    """
    GET → devuelve la configuración del médico operador
    PUT/PATCH → actualiza la configuración del médico operador
    """
    # ⚠️ Usa el primero existente, no crees uno vacío cada vez
    obj = DoctorOperator.objects.first()

    if request.method == "GET":
        serializer = DoctorOperatorSerializer(obj)
        return Response(serializer.data)

    serializer = DoctorOperatorSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()  # 👈 sin campos extra, solo guarda lo que viene
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
    Devuelve el objeto MedicalReport con file_url (idempotente si ya existe).
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

    # Crear/obtener reporte
    report, _ = MedicalReport.objects.get_or_create(
        appointment=appointment,
        defaults={
            "patient": appointment.patient,
            "created_at": timezone.now(),
            "status": "generated",
        }
    )

    # Datos institucionales y médico
    institution = InstitutionSettings.objects.first()
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []

    # Serializar base del reporte
    serializer = MedicalReportSerializer(report)
    context = dict(serializer.data)

    # Serializar paciente completo
    patient_serialized = PatientDetailSerializer(appointment.patient).data
    context["patient"] = patient_serialized

    # Reforzar contexto
    context.update({
        "appointment": appointment,
        "institution": institution,
        "doctor": {
            "full_name": getattr(doctor, "full_name", ""),
            "colegiado_id": getattr(doctor, "colegiado_id", ""),
            "specialties": specialties if specialties else ["No especificadas"],
            "signature": getattr(doctor, "signature", None),
        },
        "treatments": Treatment.objects.filter(diagnosis__appointment=appointment),
        "generated_at": timezone.now(),
        "report": report,
    })

    # Renderizar PDF con base_url defensivo
    html = render_to_string("pdf/medical_report.html", context)
    pdf_bytes = HTML(string=html, base_url=settings.MEDIA_ROOT).write_pdf()

    # Guardar PDF
    filename = f"medical_report_{report.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    django_file = File(open(full_path, "rb"), name=filename)
    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    doc = MedicalDocument.objects.create(
        patient=appointment.patient,
        appointment=appointment,
        file=django_file,
        description=f"Informe de consulta del {appointment.appointment_date}",
        category=DocumentCategory.MEDICAL_REPORT,
        source=DocumentSource.SYSTEM_GENERATED,
        origin_panel="consultation",
        template_version="v1.0",
        uploaded_by=request.user,
        generated_by=request.user,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
    )

    report.file_url = doc.file.name
    report.save(update_fields=["file_url"])

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

    # Idempotencia: si ya existe informe con archivo y MedicalDocument, devolverlo
    existing = MedicalReport.objects.filter(appointment=appointment).first()
    if existing and existing.file_url:
        doc_exists = MedicalDocument.objects.filter(
            appointment=appointment,
            category="medical_report"
        ).exists()
        if doc_exists:
            return Response(MedicalReportSerializer(existing).data, status=200)

    # Crear informe institucional
    report = MedicalReport.objects.create(
        appointment=appointment,
        patient=appointment.patient,
        status="generated"
    )

    institution = InstitutionSettings.objects.first()
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []
    patient_serialized = PatientDetailSerializer(appointment.patient).data

    # QuerySets
    diagnoses_qs = Diagnosis.objects.filter(appointment=appointment).order_by("id")
    treatments_qs = Treatment.objects.filter(diagnosis__appointment=appointment).order_by("id")
    prescriptions_qs = Prescription.objects.filter(
        diagnosis__appointment=appointment
    ).select_related("medication_catalog").prefetch_related("components").order_by("id")
    tests_qs = MedicalTest.objects.filter(appointment=appointment).order_by("id")
    referrals_qs = MedicalReferral.objects.filter(
        appointment=appointment
    ).prefetch_related("specialties").order_by("id")

    # Adaptadores con labels amigables
    def unit_label(val): return dict(UNIT_CHOICES).get(val, val)
    def route_label(val): return dict(ROUTE_CHOICES).get(val, val)
    def freq_label(val): return dict(FREQUENCY_CHOICES).get(val, val)

    diagnoses = [{"icd_code": d.icd_code, "title": d.title, "description": d.description} for d in diagnoses_qs]
    treatments = [{"plan": t.plan} for t in treatments_qs]

    prescriptions = []
    for p in prescriptions_qs:
        med_name = ""
        if p.medication_catalog:
            med_name = getattr(p.medication_catalog, "name", "") or getattr(p.medication_catalog, "title", "")
        if not med_name:
            med_name = p.medication_text or ""

        comps = []
        for comp in p.components.all():
            comps.append({
                "substance": comp.substance,
                "dosage": comp.dosage,
                "unit": unit_label(comp.unit),
            })

        prescriptions.append({
            "medication": med_name,
            "route": route_label(p.route),
            "frequency": freq_label(p.frequency),
            "duration": p.duration,
            "components": comps,
        })

    tests = [{
        "name": t.test_type,
        "notes": t.description,
        "urgency": getattr(t, "get_urgency_display", lambda: t.urgency)(),
        "status": getattr(t, "get_status_display", lambda: t.status)(),
    } for t in tests_qs]

    referrals = []
    for r in referrals_qs:
        spec_names = [s.name for s in r.specialties.all()] if hasattr(r, "specialties") else []
        referrals.append({
            "notes": r.reason or r.notes,
            "referred_to": r.referred_to,
            "urgency": getattr(r, "get_urgency_display", lambda: r.urgency)(),
            "status": getattr(r, "get_status_display", lambda: r.status)(),
            "specialties": spec_names,
        })

    # Audit code + QR
    audit_code = generate_audit_code(appointment, appointment.patient)
    qr_payload = f"Consulta:{appointment.id}|Audit:{audit_code}"
    qr_code_url = make_qr_data_uri(qr_payload)

    # Contexto final
    context = dict(MedicalReportSerializer(report).data)
    context.update({
        "appointment": appointment,
        "patient": patient_serialized,
        "institution": institution,
        "doctor": {
            "full_name": getattr(doctor, "full_name", ""),
            "colegiado_id": getattr(doctor, "colegiado_id", ""),
            "specialties": specialties if specialties else ["No especificadas"],
            "signature": getattr(doctor, "signature", None),
        },
        "diagnoses": diagnoses,
        "treatments": treatments,
        "prescriptions": prescriptions,
        "tests": tests,
        "referrals": referrals,
        "generated_at": timezone.now(),
        "report": report,
        "audit_code": audit_code,
        "qr_code_url": qr_code_url,
    })

    # Renderizar HTML → PDF
    html_string = render_to_string("pdf/medical_report.html", context)
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    # Guardar PDF en storage
    filename = f"medical_report_{report.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    django_file = File(open(full_path, "rb"), name=filename)
    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    # Crear MedicalDocument blindado
    doc = MedicalDocument.objects.create(
        patient=appointment.patient,
        appointment=appointment,
        diagnosis=None,
        description="Informe Médico generado automáticamente",
        category="medical_report",
        source="system_generated",
        origin_panel="consultation",
        template_version="v1.1",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
        audit_code=audit_code,
    )

    # ✅ Actualizar MedicalReport con file_url absoluto bajo /api/media/
    try:
        report.file_url = request.build_absolute_uri(f"/api{doc.file.url}")
    except Exception:
        report.file_url = request.build_absolute_uri(f"/api/media/{doc.file.name}")
    report.save(update_fields=["file_url"])

    # Evento de auditoría
    Event.objects.create(
        entity="MedicalReport",
        entity_id=report.id,
        action="generated",
        actor=str(request.user),
        metadata={
            "appointment_id": appointment.id,
            "patient_id": appointment.patient.id,
            "document_id": doc.id,
            "audit_code": audit_code,
        },
        severity="info",
        notify=True
    )

    return Response(MedicalReportSerializer(report).data, status=status.HTTP_201_CREATED)


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
    institution = InstitutionSettings.objects.first()

    # Doctor institucional (alineado con el informe)
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []

    # Serializar paciente al estilo del informe (dict para evitar warnings de tipado)
    patient_serialized = dict(PatientDetailSerializer(patient).data)

    # Normalización de labels
    def unit_label(val): return dict(Prescription.UNIT_CHOICES).get(val, val)
    def route_label(val): return dict(Prescription.ROUTE_CHOICES).get(val, val)
    def freq_label(val): return dict(Prescription.FREQUENCY_CHOICES).get(val, val)

    # Construcción de items
    items = []
    rel_items = getattr(prescription, "items", None)
    if callable(rel_items):
        rel_items = rel_items.all()
    if rel_items:
        for it in rel_items:
            med_name = ""
            if getattr(it, "medication_catalog", None):
                med_name = getattr(it.medication_catalog, "name", "") or getattr(it.medication_catalog, "title", "")
            if not med_name:
                med_name = getattr(it, "medication_text", "") or getattr(it, "medication", "")
            items.append({
                "medication": med_name,
                "dosage": it.dosage,
                "unit": unit_label(it.unit),
                "route": route_label(it.route),
                "frequency": freq_label(it.frequency),
                "duration": it.duration,
                "notes": getattr(it, "notes", ""),
            })
    else:
        med_name = ""
        if getattr(prescription, "medication_catalog", None):
            med_name = getattr(prescription.medication_catalog, "name", "") or getattr(prescription.medication_catalog, "title", "")
        if not med_name:
            med_name = getattr(prescription, "medication_text", "") or getattr(prescription, "medication", "")
        items.append({
            "medication": med_name,
            "dosage": prescription.dosage,
            "unit": unit_label(prescription.unit),
            "route": route_label(prescription.route),
            "frequency": freq_label(prescription.frequency),
            "duration": prescription.duration,
            "notes": getattr(prescription, "notes", ""),
        })

    generated_at = timezone.now()
    audit_code = prescription.id

    # QR embebido
    qr_payload = f"Consulta:{appointment.id}|Prescription:{prescription.id}|Audit:{audit_code}"
    qr_img = qrcode.make(qr_payload)
    buffer = BytesIO()
    qr_img.save(buffer, "PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_code_url = f"data:image/png;base64,{qr_base64}"

    context = {
        "appointment": appointment,
        "patient": patient_serialized,
        "institution": institution,
        "doctor": {
            "full_name": doctor.full_name if doctor else "",
            "colegiado_id": doctor.colegiado_id if doctor else "",
            "specialties": specialties if specialties else ["No especificadas"],
            "signature": doctor.signature if (doctor and doctor.signature) else None,
        },
        "items": items,
        "generated_at": generated_at,
        "audit_code": audit_code,
        "qr_code_url": qr_code_url,
    }

    html_string = render_to_string("documents/prescription.html", context)
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    filename = f"prescription_{prescription.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    django_file = File(open(full_path, "rb"), name=filename)

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
        template_version="v1.3",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
        audit_code=str(audit_code),
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
    responses={201: MedicalTestSerializer},
    description="Genera una orden de examen médico en PDF y la registra como documento clínico."
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_medical_test_order_pdf(request, pk):
    medical_test = get_object_or_404(MedicalTest, pk=pk)
    appointment = medical_test.appointment
    patient = appointment.patient
    diagnosis = medical_test.diagnosis
    institution = InstitutionSettings.objects.first()

    # Doctor institucional (igual que en el informe)
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []

    # Paciente serializado (dict para evitar warnings de tipado)
    patient_serialized = dict(PatientDetailSerializer(patient).data)

    # QuerySet completo de tests de la consulta
    tests_qs = appointment.medical_tests.all().order_by("id")

    # Adaptadores de labels
    def urgency_label(val): return dict(MedicalTest.URGENCY_CHOICES).get(val, val)
    def status_label(val): return dict(MedicalTest.STATUS_CHOICES).get(val, val)
    def type_label(val): return dict(MedicalTest.TEST_TYPE_CHOICES).get(val, val)

    # Separar en laboratorios e imágenes
    lab_tests, image_tests = [], []
    for t in tests_qs:
        test_data = {
            "type": type_label(t.test_type),
            "description": t.description or "Sin descripción",
            "urgency": urgency_label(t.urgency),
            "status": status_label(t.status),
        }
        if t.test_type in ["blood_test", "urine_test", "stool_test", "microbiology_culture", "biopsy", "genetic_test"]:
            lab_tests.append(test_data)
        elif t.test_type in ["xray", "ultrasound", "ct_scan", "mri", "ecg"]:
            image_tests.append(test_data)

    generated_at = timezone.now()
    audit_code = medical_test.id

    # QR institucional embebido
    qr_payload = f"Consulta:{appointment.id}|Test:{medical_test.id}|Audit:{audit_code}"
    qr_img = qrcode.make(qr_payload)
    buffer = BytesIO()
    qr_img.save(buffer, "PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_code_url = f"data:image/png;base64,{qr_base64}"

    # Contexto final
    context = {
        "appointment": appointment,
        "patient": patient_serialized,
        "institution": institution,
        "doctor": {
            "full_name": doctor.full_name if doctor else "",
            "colegiado_id": doctor.colegiado_id if doctor else "",
            "specialties": specialties if specialties else ["No especificadas"],
            "signature": doctor.signature if (doctor and doctor.signature) else None,
        },
        "lab_tests": lab_tests,
        "image_tests": image_tests,
        "generated_at": generated_at,
        "audit_code": audit_code,
        "qr_code_url": qr_code_url,
    }

    # Renderizar HTML → PDF
    html_string = render_to_string("documents/medical_test_order.html", context)
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    # Guardar PDF en storage
    filename = f"medical_test_order_{medical_test.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    # Crear MedicalDocument blindado
    django_file = File(open(full_path, "rb"), name=filename)

    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    doc = MedicalDocument.objects.create(
        patient=patient,
        appointment=appointment,
        diagnosis=diagnosis,
        description="Orden de examen médico generada automáticamente",
        category="medical_test_order",
        source="system_generated",
        origin_panel="medical_tests_panel",
        template_version="v1.2",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
        audit_code=str(audit_code),
    )

    # Evento de auditoría
    Event.objects.create(
        entity="MedicalDocument",
        entity_id=doc.id,
        action="generate_medical_test_order",
        actor=str(request.user),
        metadata={
            "appointment_id": appointment.id,
            "patient_id": patient.id,
            "medical_test_id": medical_test.id,
            "document_id": doc.id
        },
        severity="info",
        notify=True
    )

    return Response(MedicalTestSerializer(medical_test).data, status=status.HTTP_201_CREATED)


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
    institution = InstitutionSettings.objects.first()

    # Doctor institucional (igual que en el informe)
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []

    # Paciente serializado (dict para evitar warnings de tipado)
    patient_serialized = dict(PatientDetailSerializer(patient).data)

    # Items del plan
    items = []
    rel_items = getattr(treatment, "items", None)
    if callable(rel_items):
        rel_items = rel_items.all()
    if rel_items:
        for it in rel_items:
            items.append({
                "description": getattr(it, "description", ""),
                "notes": getattr(it, "notes", ""),
            })
    else:
        plan_text = getattr(treatment, "plan", "") or getattr(treatment, "description", "")
        items = [{"description": plan_text, "notes": getattr(treatment, "notes", "")}]

    generated_at = timezone.now()
    audit_code = treatment.id

    # QR institucional embebido
    qr_payload = f"Consulta:{appointment.id}|Treatment:{treatment.id}|Audit:{audit_code}"
    qr_img = qrcode.make(qr_payload)
    buffer = BytesIO()
    qr_img.save(buffer, "PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_code_url = f"data:image/png;base64,{qr_base64}"

    # Contexto final
    context = {
        "appointment": appointment,
        "patient": patient_serialized,
        "institution": institution,
        "doctor": {
            "full_name": doctor.full_name if doctor else "",
            "colegiado_id": doctor.colegiado_id if doctor else "",
            "specialties": specialties if specialties else ["No especificadas"],
            "signature": doctor.signature if (doctor and doctor.signature) else None,
        },
        "items": items,
        "generated_at": generated_at,
        "audit_code": audit_code,
        "qr_code_url": qr_code_url,
    }

    # Renderizar HTML → PDF
    html_string = render_to_string("documents/treatment.html", context)
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    # Guardar PDF
    filename = f"treatment_{treatment.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    django_file = File(open(full_path, "rb"), name=filename)

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
        template_version="v1.3",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
        audit_code=str(audit_code),
    )

    # Evento de auditoría
    Event.objects.create(
        entity="MedicalDocument",
        entity_id=doc.id,
        action="generate_treatment",
        actor=str(request.user),
        metadata={
            "appointment_id": appointment.id,
            "patient_id": patient.id,
            "treatment_id": treatment.id,
            "document_id": doc.id
        },
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
    description="Genera una orden de cobro en PDF y la registra como documento clínico."
)
@api_view(["GET", "POST"])   # 👈 acepta GET y POST
@permission_classes([IsAuthenticated])
def generate_chargeorder_pdf(request, pk):
    charge_order = get_object_or_404(ChargeOrder, pk=pk)
    patient = charge_order.patient
    appointment = charge_order.appointment

    # Recalcular totales antes de exportar
    charge_order.recalc_totals()
    charge_order.save()

    # Doctor institucional
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []

    # Institution settings
    institution = InstitutionSettings.objects.first()

    # Generar audit_code institucional
    audit_code = generate_audit_code(appointment, patient)

    # Generar QR con payload trazable
    qr_payload = f"Consulta:{appointment.id}|ChargeOrder:{charge_order.id}|Audit:{audit_code}"
    qr_img = qrcode.make(qr_payload)
    buffer = BytesIO()
    qr_img.save(buffer, "PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_code_url = f"data:image/png;base64,{qr_base64}"

    # 🔹 Ítems con campos correctos
    items = [{
        "code": i.code,
        "description": i.description or "",
        "qty": i.qty,
        "unit_price": getattr(i, "unit_price", Decimal("0.00")),
        "subtotal": getattr(i, "subtotal", Decimal("0.00")),
    } for i in charge_order.items.all()]

    # 🔹 Pagos con campos relevantes
    payments = [{
        "received_at": p.received_at,
        "method": p.method,
        "reference": p.reference_number or "",
        "amount": p.amount,
        "status": p.status,
    } for p in charge_order.payments.all()]

    # 🔹 Calcular monto pagado confirmado
    paid_amount = sum(p["amount"] for p in payments if p["status"] == "confirmed")

    # Contexto para plantilla
    context = {
        "charge_order": charge_order,
        "items": items,
        "payments": payments,
        "patient": patient,
        "appointment": appointment,
        "doctor": {
            "full_name": doctor.full_name if doctor else "",
            "colegiado_id": doctor.colegiado_id if doctor else "",
            "specialties": specialties if specialties else ["No especificadas"],
            "signature": doctor.signature if (doctor and doctor.signature) else None,
        },
        "institution": institution,
        "audit_code": audit_code,
        "qr_code_url": qr_code_url,
        "generated_at": timezone.now(),
        # 🔹 Totales financieros
        "subtotal": charge_order.total,
        "total": charge_order.total,
        "paid_amount": paid_amount,
        "balance_due": charge_order.balance_due,
    }

    # Renderizar HTML → PDF
    html_string = render_to_string("pdf/charge_order.html", context)
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    # Guardar PDF en storage
    filename = f"chargeorder_{charge_order.id}.pdf"
    file_path = os.path.join("medical_documents", filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "wb") as f:
        f.write(pdf_bytes or b"")

    django_file = File(open(full_path, "rb"), name=filename)

    sha256 = hashlib.sha256()
    for chunk in django_file.chunks():
        sha256.update(chunk)

    # Crear MedicalDocument blindado
    doc = MedicalDocument.objects.create(
        patient=patient,
        appointment=appointment,
        diagnosis=None,
        description="Orden de Cobro generada automáticamente",
        category="charge_order",
        source="system_generated",
        origin_panel="payments_panel",
        template_version="v1.1",
        generated_by=request.user,
        uploaded_by=request.user,
        file=django_file,
        mime_type="application/pdf",
        size_bytes=django_file.size,
        checksum_sha256=sha256.hexdigest(),
        audit_code=audit_code,
    )

    # Evento de auditoría
    Event.objects.create(
        entity="ChargeOrder",
        entity_id=charge_order.id,
        action="export_pdf",
        actor=str(request.user),
        metadata={
            "charge_order_id": charge_order.id,
            "patient_id": patient.id,
            "document_id": doc.id,
            "audit_code": audit_code,
        },
        severity="info",
        notify=True
    )

    # ✅ Devolver el PDF binario
    return FileResponse(open(full_path, "rb"), content_type="application/pdf", as_attachment=True, filename=filename)


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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = MedicalTest.objects.select_related("appointment", "diagnosis")
        appt_id = self.request.query_params.get("appointment")
        if appt_id:
            qs = qs.filter(appointment_id=appt_id)
        return qs.order_by("-id")

    def get_serializer_class(self):
        # 🔹 Usamos el serializer de escritura para create/update,
        # pero devolvemos el de lectura en la respuesta para incluir los *_display
        if self.action in ["create", "update", "partial_update"]:
            return MedicalTestWriteSerializer
        return MedicalTestSerializer

    # ✅ Blindaje institucional: forzamos que list() siempre use el serializer de lectura
    def list(self, request, *args, **kwargs):
        self.serializer_class = MedicalTestSerializer
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        test = serializer.save()

        # 🔍 Trazabilidad institucional: confirmamos que appointment se asoció correctamente
        print(f"🧪 Examen creado → ID: {test.id} | appointment_id: {test.appointment_id} | tipo: {test.test_type}")

        Event.objects.create(
            entity="MedicalTest",
            entity_id=test.id,
            action="create",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "appointment_id": test.appointment_id,
                "diagnosis_id": getattr(test, "diagnosis_id", None),
                "test_type": test.test_type,
                "test_type_display": test.get_test_type_display(),
                "description": getattr(test, "description", None),
                "urgency": test.urgency,
                "urgency_display": test.get_urgency_display(),
                "status": test.status,
                "status_display": test.get_status_display(),
            },
            severity="info",
            notify=True,
        )

    def perform_update(self, serializer):
        test = serializer.save()

        # 🔍 Trazabilidad institucional: confirmamos que appointment sigue asociado
        print(f"🧪 Examen actualizado → ID: {test.id} | appointment_id: {test.appointment_id} | tipo: {test.test_type}")

        Event.objects.create(
            entity="MedicalTest",
            entity_id=test.id,
            action="update",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "appointment_id": test.appointment_id,
                "diagnosis_id": getattr(test, "diagnosis_id", None),
                "test_type": test.test_type,
                "test_type_display": test.get_test_type_display(),
                "description": getattr(test, "description", None),
                "urgency": test.urgency,
                "urgency_display": test.get_urgency_display(),
                "status": test.status,
                "status_display": test.get_status_display(),
            },
            severity="info",
            notify=True,
        )


class MedicalReferralViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = MedicalReferral.objects.select_related("appointment", "diagnosis")
        appt_id = self.request.query_params.get("appointment")
        if appt_id:
            qs = qs.filter(appointment_id=appt_id)
        return qs.order_by("-id")

    def get_serializer_class(self):
        return MedicalReferralSerializer

    def perform_create(self, serializer):
        referral = serializer.save()
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
                "referred_to": getattr(referral, "referred_to", None),
                "reason": referral.reason,
            },
            severity="info",
            notify=True,
        )

    def perform_update(self, serializer):
        referral = serializer.save()
        Event.objects.create(
            entity="MedicalReferral",
            entity_id=referral.id,
            action="update",
            actor=str(self.request.user) if self.request.user.is_authenticated else "system",
            metadata={
                "appointment_id": referral.appointment_id,
                "diagnosis_id": referral.diagnosis_id,
                "specialty_ids": [s.id for s in referral.specialties.all()],
                "urgency": referral.urgency,
                "status": referral.status,
                "referred_to": getattr(referral, "referred_to", None),
                "reason": referral.reason,
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

    data = [
        {"id": s.id, "code": s.code, "name": s.name}
        for s in qs
    ]
    return Response(data)


def generate_pdf_document(category: str, queryset, appointment):
    patient = appointment.patient
    institution = InstitutionSettings.objects.first()
    doctor = DoctorOperator.objects.first()
    specialties = list(doctor.specialties.values_list("name", flat=True)) if doctor else []

    # Paciente serializado
    patient_serialized = dict(PatientDetailSerializer(patient).data)

    # Generar audit code y QR
    audit_code = generate_audit_code(appointment, patient)
    qr_payload = f"Consulta:{appointment.id}|Category:{category}|Audit:{audit_code}"
    qr_img = qrcode.make(qr_payload)
    buffer = BytesIO()
    qr_img.save(buffer, "PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_code_url = f"data:image/png;base64,{qr_base64}"

    # Helper defensivo
    def safe(val, default=""):
        return val if val is not None else default

    # Normalización de items según categoría
    items = []
    lab_tests, image_tests = [], []

    if category == "prescription":
        # Usar constantes globales, no atributos inexistentes en Prescription
        def route_label(val): return dict(ROUTE_CHOICES).get(val, val)
        def freq_label(val): return dict(FREQUENCY_CHOICES).get(val, val)
        def unit_label(val): return dict(UNIT_CHOICES).get(val, val)

        for p in queryset:
            med_name = ""
            if getattr(p, "medication_catalog", None):
                med_name = getattr(p.medication_catalog, "name", "") or getattr(p.medication_catalog, "title", "")
            if not med_name:
                med_name = safe(getattr(p, "medication_text", None))

            components = []
            for c in p.components.all():
                components.append({
                    "substance": c.substance,
                    "dosage": c.dosage,
                    "unit": unit_label(safe(c.unit)),
                })

            items.append({
                "medication": med_name or "Medicamento no especificado",
                "components": components,
                "route": route_label(safe(p.route)),
                "frequency": freq_label(safe(p.frequency)),
                "duration": safe(p.duration),
            })

    elif category == "treatment":
        for t in queryset:
            items.append({
                "description": safe(getattr(t, "plan", None)) or safe(getattr(t, "description", None)),
                "notes": safe(getattr(t, "notes", None)),
            })

    elif category == "medical_test_order":
        def urgency_label(val): return dict(MedicalTest.URGENCY_CHOICES).get(val, val)
        def status_label(val): return dict(MedicalTest.STATUS_CHOICES).get(val, val)
        def type_label(val): return dict(MedicalTest.TEST_TYPE_CHOICES).get(val, val)
        for t in queryset:
            row = {
                "type": type_label(safe(t.test_type)),
                "description": safe(t.description, "Sin descripción"),
                "urgency": urgency_label(safe(t.urgency)),
                "status": status_label(safe(t.status)),
            }
            if t.test_type in ["blood_test", "urine_test", "stool_test", "microbiology_culture", "biopsy", "genetic_test"]:
                lab_tests.append(row)
            elif t.test_type in ["xray", "ultrasound", "ct_scan", "mri", "ecg"]:
                image_tests.append(row)

    elif category == "medical_referral":
        for r in queryset:
            spec_names = [s.name for s in r.specialties.all()] if hasattr(r, "specialties") else []
            items.append({
                "notes": safe(r.reason) or safe(getattr(r, "notes", None)),
                "referred_to": safe(r.referred_to),
                "urgency": getattr(r, "get_urgency_display", lambda: safe(r.urgency))(),
                "status": getattr(r, "get_status_display", lambda: safe(r.status))(),
                "specialties": spec_names or [],
            })

    # Mapear categoría a template real
    template_map = {
        "treatment": "documents/treatment.html",
        "prescription": "documents/prescription.html",
        "medical_test_order": "documents/medical_test_order.html",
        "medical_referral": "documents/medical_referral.html",
    }
    tpl = template_map.get(category)
    if not tpl:
        raise ValueError(f"No existe template para la categoría {category}")

    context = {
        "appointment": appointment,
        "patient": patient_serialized,
        "institution": institution,
        "doctor": {
            "full_name": doctor.full_name if doctor else "",
            "colegiado_id": doctor.colegiado_id if doctor else "",
            "specialties": specialties if specialties else ["No especificadas"],
            "signature": doctor.signature if (doctor and doctor.signature) else None,
        },
        "items": items,
        "lab_tests": lab_tests,
        "image_tests": image_tests,
        "generated_at": timezone.now(),
        "audit_code": audit_code,
        "qr_code_url": qr_code_url,
    }

    html_string = render_to_string(tpl, context)
    pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()

    # ✅ Devuelve siempre un tuple (pdf_file, audit_code)
    return ContentFile(pdf_bytes or b"", name=f"{category}_{appointment.id}.pdf"), audit_code


@extend_schema(
    request=None,
    responses={201: OpenApiResponse(description="Clinical documents generated for the consultation")}
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_used_documents(request, pk):
    try:
        appointment = get_object_or_404(Appointment, pk=pk)
        patient = appointment.patient
        user = request.user if request.user.is_authenticated else None

        generated = []
        skipped = []
        errors = []

        def safe_content_file(pdf_bytes, name):
            # Nombre estable y único por categoría-cita, con timestamp para evitar colisiones.
            ts = timezone.now().strftime("%Y%m%d%H%M%S")
            fname = f"{name}_{appointment.id}_{ts}.pdf"
            return ContentFile(bytes(pdf_bytes), name=fname)

        def compute_sha256(django_file_field):
            try:
                fh = django_file_field.open("rb")
                h = hashlib.sha256()
                for chunk in iter(lambda: fh.read(8192), b""):
                    h.update(chunk)
                fh.close()
                return h.hexdigest()
            except Exception:
                return None

        def normalize_pdf_input(pdf_file, category):
            # Acepta bytes, ContentFile, o File; devuelve un objeto apto para FileField.
            if isinstance(pdf_file, (bytes, bytearray)):
                return safe_content_file(pdf_file, category)
            return pdf_file  # ya debería ser ContentFile o File

        def resolve_file_url(doc, request):
            try:
                # Construir URL absoluta bajo /api/media/
                return request.build_absolute_uri(f"/api{doc.file.url}")
            except Exception:
                if getattr(doc.file, "name", None):
                    return request.build_absolute_uri(f"/api/media/{doc.file.name}")
                return None

        def register_document(pdf_file, audit_code, category, diagnosis_obj=None, description=None):
            if not pdf_file:
                raise ValueError(f"PDF generator returned empty file for category={category}")

            django_file = normalize_pdf_input(pdf_file, category)
            doc = MedicalDocument.objects.create(
                patient=patient,
                appointment=appointment,
                diagnosis=diagnosis_obj,
                category=category,
                description=description or f"{category} document for appointment {appointment.id}",
                file=django_file,
                source="system_generated",
                origin_panel="consultation",
                template_version="v1.1",
                uploaded_by=user if user else None,
                generated_by=user if user else None,
                audit_code=audit_code,
                mime_type="application/pdf",
            )

            # Post-procesos: tamaño y checksum
            try:
                doc.size_bytes = doc.file.size
            except Exception:
                doc.size_bytes = None

            doc.checksum_sha256 = compute_sha256(doc.file)
            doc.save(update_fields=["size_bytes", "checksum_sha256"])

            Event.objects.create(
                entity="MedicalDocument",
                entity_id=doc.id,
                action="generate_pdf",
                actor=str(user) if user else "system",
                metadata={
                    "patient_id": patient.id,
                    "appointment_id": appointment.id,
                    "diagnosis_id": getattr(diagnosis_obj, "id", None),
                    "category": category,
                    "checksum_sha256": doc.checksum_sha256,
                    "audit_code": audit_code,
                },
                severity="info",
                notify=True,
            )

            return {
                "id": doc.id,
                "category": doc.category,
                "description": doc.description,
                "file_url": resolve_file_url(doc, request),
                "audit_code": audit_code,
            }

        # Treatment
        try:
            treatments = Treatment.objects.filter(diagnosis__appointment=appointment)
            if treatments.exists():
                pdf_file, audit_code = generate_pdf_document("treatment", treatments, appointment)
                first_item = treatments.first()
                diagnosis_obj = getattr(first_item, "diagnosis", None)
                generated.append(
                    register_document(pdf_file, audit_code, "treatment", diagnosis_obj, "Plan de Tratamiento")
                )
            else:
                skipped.append("treatment")
        except Exception as e:
            skipped.append("treatment")
            errors.append({"category": "treatment", "error": str(e)})

        # Prescription
        try:
            prescriptions = Prescription.objects.filter(diagnosis__appointment=appointment)
            if prescriptions.exists():
                pdf_file, audit_code = generate_pdf_document("prescription", prescriptions, appointment)
                first_item = prescriptions.first()
                diagnosis_obj = getattr(first_item, "diagnosis", None)
                generated.append(
                    register_document(pdf_file, audit_code, "prescription", diagnosis_obj, "Documento de Prescripciones")
                )
            else:
                skipped.append("prescription")
        except Exception as e:
            skipped.append("prescription")
            errors.append({"category": "prescription", "error": str(e)})

        # Medical test orders
        try:
            orders = MedicalTest.objects.filter(appointment=appointment)
            if orders.exists():
                pdf_file, audit_code = generate_pdf_document("medical_test_order", orders, appointment)
                first_item = orders.first()
                diagnosis_obj = getattr(first_item, "diagnosis", None)
                generated.append(
                    register_document(pdf_file, audit_code, "medical_test_order", diagnosis_obj, "Orden de Examen Médico")
                )
            else:
                skipped.append("medical_test_order")
        except Exception as e:
            skipped.append("medical_test_order")
            errors.append({"category": "medical_test_order", "error": str(e)})

        # Medical referrals
        try:
            referrals = MedicalReferral.objects.filter(appointment=appointment)
            if referrals.exists():
                pdf_file, audit_code = generate_pdf_document("medical_referral", referrals, appointment)
                first_item = referrals.first()
                diagnosis_obj = getattr(first_item, "diagnosis", None)
                generated.append(
                    register_document(pdf_file, audit_code, "medical_referral", diagnosis_obj, "Referencia Médica")
                )
            else:
                skipped.append("medical_referral")
        except Exception as e:
            skipped.append("medical_referral")
            errors.append({"category": "medical_referral", "error": str(e)})

        # Importante: medical_report NO se genera aquí; se genera en /consultations/<id>/generate-report/

        from django.utils.timezone import now
        return Response({
            "consultation_id": appointment.id,
            "audit_code": generated[-1]["audit_code"] if generated else None,
            "generated_at": now().isoformat(),
            "documents": [
                {
                    "category": doc["category"],
                    "title": doc["description"],
                    "filename": (doc["file_url"].split("/")[-1] if doc["file_url"] else None),
                    "audit_code": doc["audit_code"],
                    "file_url": doc["file_url"],
                }
                for doc in generated
            ],
            "skipped": skipped,
            "errors": errors,  # diagnóstico visible para cerrar circuitos
        }, status=201)

    except Exception as e:
        # Auditoría de error del endpoint completo
        try:
            Event.objects.create(
                entity="Consultation",
                entity_id=pk,
                action="generate_documents_error",
                actor=str(request.user),
                metadata={"error": str(e)},
                severity="error",
                notify=True,
            )
        except Exception:
            pass

        import traceback
        return Response({
            "detail": "Error generating consultation documents",
            "error": str(e),
            "traceback": traceback.format_exc(),
        }, status=500)


@extend_schema(responses={200: AppointmentDetailSerializer})
@api_view(["GET"])
def appointment_detail_api(request, pk):
    """
    Devuelve los detalles completos de una cita por ID.
    """
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found"}, status=404)

    serializer = AppointmentDetailSerializer(appointment)
    return Response(serializer.data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def documents_api(request):
    patient_id = request.GET.get("patient")
    appointment_id = request.GET.get("appointment")

    if not patient_id:
        return Response({"error": "Missing patient ID"}, status=400)

    qs = MedicalDocument.objects.filter(patient_id=patient_id)
    if appointment_id:
        qs = qs.filter(appointment_id=appointment_id)

    # 🔹 Ordenar por fecha de subida, no por created_at
    qs = qs.order_by("-uploaded_at")

    payload = []
    for doc in qs:
        try:
            file_url = request.build_absolute_uri(doc.file.url) if doc.file else None
        except Exception:
            file_url = None

        payload.append({
            "id": doc.id,
            "category": getattr(doc, "category", "unknown"),
            "description": getattr(doc, "description", "Documento"),
            "file_url": file_url,
            "audit_code": getattr(doc, "audit_code", "N/A"),
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        })

    return Response({"documents": payload, "skipped": []}, status=200)


@api_view(["GET"])
def search(request):
    query = request.GET.get("query", "").strip()

    if not query:
        return Response({
            "patients": [],
            "appointments": [],
            "orders": []
        })

    # Normalizar tokens del usuario
    raw_tokens = [t.strip() for t in query.split() if t.strip()]
    tokens = [normalize_token(t) for t in raw_tokens]

    if not tokens:
        return Response({
            "patients": [],
            "appointments": [],
            "orders": []
        })

    # ============================================================
    # PACIENTES
    # ============================================================
    patients = (
        Patient.objects
        .annotate(
            first_name_norm=normalize(F("first_name")),
            last_name_norm=normalize(F("last_name")),
            national_id_norm=normalize(F("national_id")),
        )
    )

    patient_q = Q()
    for token in tokens:
        patient_q |= Q(first_name_norm__icontains=token)
        patient_q |= Q(last_name_norm__icontains=token)
        patient_q |= Q(national_id_norm__icontains=token)

    patients = patients.filter(patient_q).values(
        "id", "first_name", "last_name", "national_id"
    )[:10]

    patients_data = list(patients)

    # ============================================================
    # CITAS
    # ============================================================
    appointments = (
        Appointment.objects
        .annotate(
            status_norm=normalize(F("status")),
            patient_first_name_norm=normalize(F("patient__first_name")),
            patient_last_name_norm=normalize(F("patient__last_name")),
        )
        .select_related("patient")
    )

    appointment_q = Q()
    for token in tokens:
        appointment_q |= Q(patient_first_name_norm__icontains=token)
        appointment_q |= Q(patient_last_name_norm__icontains=token)
        appointment_q |= Q(status_norm__icontains=token)

    appointments = appointments.filter(appointment_q)[:10]
    appointments_data = AppointmentSerializer(appointments, many=True).data

    # ============================================================
    # ÓRDENES
    # ============================================================
    orders = (
        ChargeOrder.objects
        .annotate(
            status_norm=normalize(F("status")),
            patient_first_name_norm=normalize(F("patient__first_name")),
            patient_last_name_norm=normalize(F("patient__last_name")),
        )
        .select_related("patient")
    )

    order_q = Q()
    for token in tokens:
        order_q |= Q(patient_first_name_norm__icontains=token)
        order_q |= Q(patient_last_name_norm__icontains=token)
        order_q |= Q(status_norm__icontains=token)

    orders = orders.filter(order_q)[:10]
    orders_data = ChargeOrderSerializer(orders, many=True).data

    return Response({
        "patients": patients_data,
        "appointments": appointments_data,
        "orders": orders_data,
    })


@extend_schema(
    parameters=[OpenApiParameter("q", str, OpenApiParameter.QUERY)],
    responses={200: AppointmentSerializer(many=True)}
)
@api_view(["GET"])
def appointment_search_api(request):
    query = request.GET.get("q", "").strip()

    if not query:
        return Response([], status=200)

    raw_tokens = [t.strip() for t in query.split() if t.strip()]
    tokens = [normalize_token(t) for t in raw_tokens]

    if not tokens:
        return Response([], status=200)

    qs = (
        Appointment.objects
        .select_related("patient")
        .annotate(
            patient_first_name_norm = normalize(
                Coalesce(F("patient__first_name"), Value(""), output_field=CharField())
            ),
            patient_last_name_norm = normalize(
                Coalesce(F("patient__last_name"), Value(""), output_field=CharField())
            ),
            status_norm = normalize(
                Coalesce(F("status"), Value(""), output_field=CharField())
            ),
            type_norm = normalize(
                Coalesce(F("appointment_type"), Value(""), output_field=CharField())
            ),
            notes_norm = normalize(
                Coalesce(F("notes"), Value(""), output_field=CharField())
            ),
            date_norm = normalize(
                Coalesce(
                    Cast(F("appointment_date"), output_field=CharField()),
                    Value(""),
                    output_field=CharField()
                )
            ),
        )
    )

    q = Q()
    for token in tokens:
        q |= Q(patient_first_name_norm__icontains=token)
        q |= Q(patient_last_name_norm__icontains=token)
        q |= Q(status_norm__icontains=token)
        q |= Q(type_norm__icontains=token)
        q |= Q(notes_norm__icontains=token)
        q |= Q(date_norm__icontains=token)

        if token.isdigit():
            q |= Q(id=int(token))

    qs = qs.filter(q).order_by("-appointment_date")[:10]

    serializer = AppointmentSerializer(qs, many=True)
    return Response(serializer.data, status=200)


@extend_schema(
    parameters=[OpenApiParameter("q", str, OpenApiParameter.QUERY)],
    responses={200: ChargeOrderPaymentSerializer(many=True)}
)
@api_view(["GET"])
def chargeorder_search_api(request):
    query = request.GET.get("q", "").strip()

    if not query:
        return Response([], status=200)

    raw_tokens = [t.strip() for t in query.split() if t.strip()]
    tokens = [normalize_token(t) for t in raw_tokens]

    if not tokens:
        return Response([], status=200)

    # 🔹 Construcción real del nombre completo usando Concat (seguro en Django 5)
    full_name_expr = Concat(
        Coalesce(F("patient__first_name"), Value(""), output_field=CharField()),
        Value(" "),
        Coalesce(F("patient__middle_name"), Value(""), output_field=CharField()),
        Value(" "),
        Coalesce(F("patient__last_name"), Value(""), output_field=CharField()),
        Value(" "),
        Coalesce(F("patient__second_last_name"), Value(""), output_field=CharField()),
        output_field=CharField(),
    )

    qs = (
        ChargeOrder.objects
        .select_related("patient", "appointment")
        .annotate(
            patient_name_norm=normalize(full_name_expr),
            status_norm=normalize(
                Coalesce(F("status"), Value(""), output_field=CharField())
            ),
            total_norm=normalize(
                Coalesce(Cast(F("total"), CharField()), Value(""), output_field=CharField())
            ),
            balance_norm=normalize(
                Coalesce(Cast(F("balance_due"), CharField()), Value(""), output_field=CharField())
            ),
            date_norm=normalize(
                Coalesce(Cast(F("appointment__appointment_date"), CharField()), Value(""), output_field=CharField())
            ),
            id_norm=normalize(
                Cast(F("id"), CharField())
            ),
        )
    )

    q = Q()
    for token in tokens:
        q |= Q(patient_name_norm__icontains=token)
        q |= Q(status_norm__icontains=token)
        q |= Q(total_norm__icontains=token)
        q |= Q(balance_norm__icontains=token)
        q |= Q(date_norm__icontains=token)
        q |= Q(id_norm__icontains=token)

        if token.isdigit():
            q |= Q(id=int(token))

    qs = qs.filter(q).order_by(
        "-appointment__appointment_date",
        "-issued_at",
        "-id"
    )[:10]

    serializer = ChargeOrderPaymentSerializer(qs, many=True)
    return Response(serializer.data, status=200)


class PersonalHistoryViewSet(viewsets.ModelViewSet):
    queryset = PersonalHistory.objects.all()
    serializer_class = PersonalHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            return PersonalHistory.objects.filter(patient_id=patient_id)
        return super().get_queryset()


class FamilyHistoryViewSet(viewsets.ModelViewSet):
    queryset = FamilyHistory.objects.all()
    serializer_class = FamilyHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            return FamilyHistory.objects.filter(patient_id=patient_id)
        return super().get_queryset()


class SurgeryViewSet(viewsets.ModelViewSet):
    queryset = Surgery.objects.all()
    serializer_class = SurgerySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            return Surgery.objects.filter(patient_id=patient_id)
        return super().get_queryset()


class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.kwargs.get("patient_pk")
        if patient_id:
            return Habit.objects.filter(patient_id=patient_id)
        return Habit.objects.all()

    def perform_create(self, serializer):
        patient_id = self.kwargs.get("patient_pk")
        serializer.save(patient_id=patient_id)


class VaccineViewSet(viewsets.ModelViewSet):
    queryset = Vaccine.objects.all()
    serializer_class = VaccineSerializer
    permission_classes = [permissions.IsAuthenticated]


class VaccinationScheduleViewSet(viewsets.ModelViewSet):
    queryset = VaccinationSchedule.objects.all()
    serializer_class = VaccinationScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # ← desactiva la paginación en este endpoint

    def get_queryset(self):
        country = self.request.query_params.get("country")
        if country:
            return VaccinationSchedule.objects.filter(country=country)
        return super().get_queryset()


class PatientVaccinationViewSet(viewsets.ModelViewSet):
    queryset = PatientVaccination.objects.all()
    serializer_class = PatientVaccinationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            return PatientVaccination.objects.filter(patient_id=patient_id)
        return super().get_queryset()


class PatientClinicalProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientClinicalProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["get"])
    def profile(self, request, pk=None):
        patient = self.get_object()
        serializer = PatientClinicalProfileSerializer(patient)
        return Response(serializer.data)


class AllergyViewSet(viewsets.ModelViewSet):
    serializer_class = AllergySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.kwargs.get("patient_pk")
        return Allergy.objects.filter(patient_id=patient_id).order_by("-created_at")

    def perform_create(self, serializer):
        patient_id = self.kwargs.get("patient_pk")
        serializer.save(patient_id=patient_id)



class MedicalHistoryViewSet(viewsets.ModelViewSet):
    serializer_class = MedicalHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        patient_id = self.kwargs.get("patient_pk")
        return MedicalHistory.objects.filter(patient_id=patient_id).order_by("-created_at")

    def perform_create(self, serializer):
        patient_id = self.kwargs.get("patient_pk")
        serializer.save(patient_id=patient_id)


class ClinicalAlertViewSet(viewsets.ModelViewSet):
    serializer_class = ClinicalAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        patient_id = self.kwargs["patient_id"]
        return ClinicalAlert.objects.filter(patient_id=patient_id)

    def perform_create(self, serializer):
        patient_id = self.kwargs["patient_id"]
        serializer.save(patient_id=patient_id)


# --- Endpoint unificado para antecedentes clínicos ---
class ClinicalBackgroundViewSet(viewsets.ModelViewSet):
    """
    Endpoint unificado para antecedentes clínicos:
    - type = personal → PersonalHistory
    - type = familiar → FamilyHistory
    - type = genetico → GeneticPredisposition asociado al paciente (M2M)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        patient_id = self.request.query_params.get("patient")
        type_param = self.request.query_params.get("type")

        if type_param == "personal":
            qs = PersonalHistory.objects.all()
            if patient_id:
                qs = qs.filter(patient_id=patient_id)
            return qs

        elif type_param == "familiar":
            qs = FamilyHistory.objects.all()
            if patient_id:
                qs = qs.filter(patient_id=patient_id)
            return qs

        elif type_param == "genetico":
            # La relación es ManyToMany: filtrar por pacientes__id
            qs = GeneticPredisposition.objects.all()
            if patient_id:
                qs = qs.filter(patients__id=patient_id)
            return qs

        return PersonalHistory.objects.none()

    def get_serializer_class(self):
        type_param = self.request.query_params.get("type")
        if type_param == "personal":
            return PersonalHistorySerializer
        elif type_param == "familiar":
            return FamilyHistorySerializer
        elif type_param == "genetico":
            return GeneticPredispositionSerializer
        return PersonalHistorySerializer

    def perform_create(self, serializer):
        # Validar y recuperar paciente
        patient_id = self.request.data.get("patient")
        if not patient_id:
            raise ValidationError({"patient": "Campo requerido"})

        try:
            patient_instance = Patient.objects.get(pk=patient_id)
        except Patient.DoesNotExist:
            raise ValidationError({"patient": f"Paciente {patient_id} no existe"})

        type_param = self.request.query_params.get("type")

        # Copia controlada de los datos y limpieza
        # Nota: serializer.validated_data existe y podemos mutarla antes de save()
        # para evitar conflictos con kwargs.
        vd = dict(serializer.validated_data)
        vd.pop("patient", None)   # evitar duplicar el argumento 'patient'
        vd.pop("type", None)      # 'type' del body no debe ir a serializers (solo query decide)

        if type_param == "genetico":
            # GeneticPredisposition no tiene FK al paciente;
            # es una M2M desde Patient. Creamos/obtenemos la predisposición y la asociamos.
            # El serializer debe tener 'name' y 'description'.
            # Si llega 'condition' desde algún cliente, mapear a 'description'.
            if "condition" in vd and "description" not in vd:
                vd["description"] = vd.pop("condition")

            # Si viene 'id', buscamos; si no, usamos 'name' como clave de idempotencia
            gp_instance = None
            gp_id = self.request.data.get("id")
            if gp_id:
                gp_instance = GeneticPredisposition.objects.get(pk=gp_id)
                # Si además hay descripción, actualizamos
                if "description" in vd:
                    gp_instance.description = vd["description"]
                    gp_instance.save(update_fields=["description"])
            else:
                name = vd.get("name")
                if not name:
                    raise ValidationError({"name": "Campo requerido para predisposición genética"})
                gp_instance, _created = GeneticPredisposition.objects.get_or_create(
                    name=name,
                    defaults={"description": vd.get("description")}
                )
                # Si ya existía y viene nueva descripción, opcionalmente actualizar
                if not _created and "description" in vd:
                    gp_instance.description = vd["description"]
                    gp_instance.save(update_fields=["description"])

            # Asociar al paciente
            patient_instance.genetic_predispositions.add(gp_instance)
            # No retornamos nada aquí; DRF espera que save() haya creado una instancia:
            # Para consistencia de respuesta, podemos setear serializer.instance.
            serializer.instance = gp_instance
            return

        # Tipos con FK directa al paciente (personal / familiar):
        if type_param == "personal":
            # Asegurar mapeo correcto: description presente, type con choice válido
            # (el modal ya envía personalType, pero si no, hacemos fallback)
            if "description" not in vd and "condition" in vd:
                vd["description"] = vd.pop("condition")

            if "type" not in vd:
                # Fallback defensivo: si no llega 'type' del modelo, asumimos 'patologico'
                vd["type"] = "patologico"

            # Quitar campos no usados por PersonalHistory
            for k in ("status", "relation", "name"):
                vd.pop(k, None)

        elif type_param == "familiar":
            # Asegurar campos mínimos
            if "condition" not in vd and "description" in vd:
                vd["condition"] = vd.pop("description")
            # 'relative' debe existir; si no, validación explícita
            if "relative" not in vd or not vd["relative"]:
                raise ValidationError({"relative": "Campo requerido para antecedente familiar"})

            # Quitar campos no usados por FamilyHistory
            for k in ("type", "name", "status", "date"):
                vd.pop(k, None)

        # Mutar validated_data antes de save para evitar conflicto del 'patient'
        serializer.validated_data.clear()
        serializer.validated_data.update(vd)

        # Guardar con instancia de Patient correctamente
        serializer.save(patient=patient_instance)


# --- Direcciones ---
class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.all().order_by("name")
    serializer_class = CountrySerializer
    permission_classes = [AllowAny]   # ⚡ acceso público
    pagination_class = None           # ⚡ sin paginación


class StateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StateSerializer
    permission_classes = [AllowAny]   # ⚡ acceso público
    pagination_class = None           # ⚡ sin paginación

    def get_queryset(self):
        qs = State.objects.select_related("country").order_by("name")
        country_id = self.request.query_params.get("country")
        return qs.filter(country_id=country_id) if country_id else qs


class MunicipalityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MunicipalitySerializer
    permission_classes = [AllowAny]   # ⚡ acceso público
    pagination_class = None           # ⚡ sin paginación

    def get_queryset(self):
        qs = Municipality.objects.select_related("state", "state__country").order_by("name")
        state_id = self.request.query_params.get("state")
        return qs.filter(state_id=state_id) if state_id else qs


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CitySerializer
    permission_classes = [AllowAny]   # ⚡ acceso público
    pagination_class = None           # ⚡ sin paginación

    def get_queryset(self):
        qs = City.objects.select_related("state", "state__country").order_by("name")
        state_id = self.request.query_params.get("state")
        return qs.filter(state_id=state_id) if state_id else qs


class ParishViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ParishSerializer
    permission_classes = [AllowAny]   # ⚡ acceso público
    pagination_class = None           # ⚡ sin paginación

    def get_queryset(self):
        qs = Parish.objects.select_related(
            "municipality", "municipality__state", "municipality__state__country"
        ).order_by("name")
        municipality_id = self.request.query_params.get("municipality")
        return qs.filter(municipality_id=municipality_id) if municipality_id else qs



class NeighborhoodViewSet(viewsets.ModelViewSet):
    queryset = Neighborhood.objects.select_related(
        "parish",
        "parish__municipality",
        "parish__municipality__state",
        "parish__municipality__state__country",
    ).order_by("name")
    serializer_class = NeighborhoodSerializer
    permission_classes = [AllowAny]   # ⚡ acceso público
    pagination_class = None           # ⚡ sin paginación

    def get_queryset(self):
        qs = Neighborhood.objects.select_related(
            "parish",
            "parish__municipality",
            "parish__municipality__state",
            "parish__municipality__state__country",
        ).order_by("name")
        parish_id = self.request.query_params.get("parish")
        return qs.filter(parish_id=parish_id) if parish_id else qs


class AddressChainView(APIView):
    permission_classes = [AllowAny]   # ⚡ acceso público

    def get(self, request):
        nid = request.query_params.get("neighborhood_id")
        if not nid:
            return Response({"detail": "neighborhood_id requerido"}, status=400)
        try:
            n = Neighborhood.objects.select_related(
                "parish",
                "parish__municipality",
                "parish__municipality__state",
                "parish__municipality__state__country",
            ).get(id=nid)
        except Neighborhood.DoesNotExist:
            return Response({"detail": "Barrio no encontrado"}, status=404)

        p = n.parish
        m = p.municipality if p else None
        s = m.state if m else None
        c = s.country if s else None

        return Response({
            "country": {"id": c.id, "name": c.name} if c else {"id": None, "name": "SIN-PAÍS"},
            "state": {"id": s.id, "name": s.name, "country_id": c.id if c else None} if s else {"id": None, "name": "SIN-ESTADO"},
            "municipality": {"id": m.id, "name": m.name, "state_id": s.id if s else None} if m else {"id": None, "name": "SIN-MUNICIPIO"},
            "parish": {"id": p.id, "name": p.name, "municipality_id": m.id if m else None} if p else {"id": None, "name": "SIN-PARROQUIA"},
            "neighborhood": {"id": n.id, "name": n.name, "parish_id": p.id if p else None},
        })


# --- Buscador jerárquico de barrios ---
class NeighborhoodSearchView(APIView):
    permission_classes = [AllowAny]   # ⚡ acceso público

    def get(self, request):
        country_id = request.query_params.get("country")
        state_id = request.query_params.get("state")
        municipality_id = request.query_params.get("municipality")
        parish_id = request.query_params.get("parish")

        qs = Neighborhood.objects.select_related(
            "parish__municipality__state__country"
        ).order_by("name")

        if parish_id:
            qs = qs.filter(parish_id=parish_id)
        if municipality_id:
            qs = qs.filter(parish__municipality_id=municipality_id)
        if state_id:
            qs = qs.filter(parish__municipality__state_id=state_id)
        if country_id:
            qs = qs.filter(parish__municipality__state__country_id=country_id)

        return Response(NeighborhoodSerializer(qs, many=True).data)
