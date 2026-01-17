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
from typing import Dict, Any, cast, List, Tuple
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
    Patient, Appointment, Payment, Event, WaitingRoomEntry, GeneticPredisposition, MedicalDocument, Diagnosis, Treatment, Prescription, ChargeOrder, ChargeItem, InstitutionSettings, DoctorOperator, BCVRateCache, MedicalReport, ICD11Entry, MedicalTest, MedicalReferral, Specialty, DocumentCategory, DocumentSource, PersonalHistory, FamilyHistory, Surgery, Habit, Vaccine, VaccinationSchedule, PatientVaccination, Allergy, MedicalHistory, ClinicalAlert, Country, State, Municipality, City, Parish, Neighborhood, VitalSigns
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
    CitySerializer, ParishSerializer, NeighborhoodSerializer, VitalSignsSerializer,
)

from core.utils.search_normalize import normalize, normalize_token
from .choices import UNIT_CHOICES, ROUTE_CHOICES, FREQUENCY_CHOICES
from . import services


login_view = obtain_auth_token


# --- Mixin Táctico para Auditoría ---
class AuditMixin:
    """
    MOTOR DE AUDITORÍA INSTITUCIONAL:
    Centraliza la creación de eventos. Soporta metadatos manuales o automáticos.
    """
    def log_event(self, instance, action, metadata=None, severity="info", notify=False):
        # 1. Preparar metadatos base
        if metadata is None:
            metadata = {}

        # 2. Lógica de extracción automática por tipo de objeto (si no hay metadata manual)
        if not metadata:
            # Caso: Prescripciones
            if hasattr(instance, 'components'):
                metadata['components'] = [
                    {"substance": c.substance, "dosage": str(c.dosage), "unit": c.unit}
                    for c in instance.components.all()
                ]
            # Caso: Citas
            elif instance.__class__.__name__ == 'Appointment':
                metadata['status'] = instance.status
                metadata['date'] = str(instance.appointment_date)
            # Caso: Signos Vitales
            elif instance.__class__.__name__ == 'VitalSigns':
                metadata['metrics'] = {
                    "bp": f"{getattr(instance, 'blood_pressure_sys', '')}/{getattr(instance, 'blood_pressure_dia', '')}",
                    "temp": str(getattr(instance, 'temperature', '')),
                    "weight": str(getattr(instance, 'weight', ''))
                }

        # 3. Creación del evento con seguridad de actor
        try:
            from .models import Event
            return Event.objects.create(
                entity=instance.__class__.__name__,
                entity_id=str(instance.id),
                action=action,
                actor=str(self.request.user) if self.request.user.is_authenticated else "system",
                metadata=metadata,
                severity=severity,
                notify=notify
            )
        except Exception as e:
            print(f"❌ Error en Auditoría: {e}")
            return None


# --- Utilidades ---
class GeneticPredispositionViewSet(viewsets.ModelViewSet):
    queryset = GeneticPredisposition.objects.all().order_by("name")
    serializer_class = GeneticPredispositionSerializer


audit = logging.getLogger("audit")


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    SISTEMA DE AUDITORÍA Y NOTIFICACIONES:
    Punto central para el monitoreo de integridad y alertas institucionales.
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Filtros avanzados para que el admin pueda investigar incidentes
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'entity': ['exact'],
        'action': ['exact'],
        'severity': ['exact'],
        'notify': ['exact'],
        'timestamp': ['gte', 'lte'],
    }
    search_fields = ['actor', 'metadata', 'entity_id']
    ordering = ['-timestamp']

    def get_queryset(self):
        # Por defecto, limitamos para optimizar rendimiento si no hay filtros
        return super().get_queryset()

    @action(detail=False, methods=['get'])
    def notifications(self, request):
        """
        GET /events/notifications/
        Versión optimizada de tu notifications_api.
        """
        window = timezone.now() - timedelta(days=7)
        # Traemos eventos que requieren notificación en la ventana de tiempo
        recent = self.get_queryset().filter(
            notify=True, 
            timestamp__gte=window
        )[:15] # Expandimos un poco el rango para el centro de notificaciones
        
        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-entity/(?P<entity_name>\w+)/(?P<entity_id>\d+)')
    def by_entity(self, request, entity_name=None, entity_id=None):
        """
        GET /events/by-entity/Patient/45/
        Trae la línea de tiempo específica de cualquier objeto del sistema.
        """
        events = self.get_queryset().filter(
            entity=entity_name, 
            entity_id=entity_id
        )
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)


class DashboardAnalyticsView(APIView):
    """
    INTELIGENCIA ESTRATÉGICA:
    Calcula métricas de rendimiento hospitalario en tiempo real.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = localdate()
        month_start = today.replace(day=1)

        # 1. Citas: Hoy vs Mes
        appointment_stats = Appointment.objects.aggregate(
            today_total=Count('id', filter=Q(appointment_date=today)),
            today_confirmed=Count('id', filter=Q(appointment_date=today, status='confirmed')),
            month_total=Count('id', filter=Q(appointment_date__gte=month_start))
        )

        # 2. Finanzas: Ingresos del mes
        revenue_stats = ChargeOrder.objects.filter(
            status='paid', 
            issued_at__gte=month_start
        ).aggregate(total_revenue=Sum('total'))

        # 3. Pacientes: Nuevos registros
        new_patients = Patient.objects.filter(created_at__gte=month_start).count()

        # 4. Alertas Críticas (vía Event)
        critical_alerts = Event.objects.filter(
            severity='critical', 
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).count()

        return Response({
            "appointments": appointment_stats,
            "financials": {
                "month_revenue": float(revenue_stats['total_revenue'] or 0),
                "currency": "USD"
            },
            "growth": {
                "new_patients_month": new_patients
            },
            "security": {
                "critical_incidents_24h": critical_alerts
            }
        })


# --- ViewSets ---
class MedicalDocumentViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    CENTRO DE DOCUMENTACIÓN CLÍNICA:
    1. CRUD de archivos subidos manualmente (Multipart).
    2. Generación automática de documentos institucionales (PDF con QR).
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = MedicalDocument.objects.select_related("patient", "appointment", "diagnosis")
        params = self.request.query_params
        
        filters = Q()
        if params.get("patient"): filters &= Q(patient_id=params.get("patient"))
        if params.get("appointment"): filters &= Q(appointment_id=params.get("appointment"))
        if params.get("category"): filters &= Q(category=params.get("category"))
        
        return qs.filter(filters).order_by("-uploaded_at")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MedicalDocumentWriteSerializer
        return MedicalDocumentReadSerializer

    # --- ACCIÓN: GENERAR DOCUMENTO INSTITUCIONAL ---
    @action(detail=False, methods=['get'], url_path='generate-institutional')
    def generate_institutional(self, request):
        """
        Genera, guarda y descarga un PDF clínico (Receta, Orden, etc.)
        GET /api/documents/generate-institutional/?category=prescription&appointment=10
        """
        category = request.query_params.get('category')
        appt_id = request.query_params.get('appointment')

        if not category or not appt_id:
            return Response({"error": "Faltan parámetros: category y appointment"}, status=400)

        appointment = get_object_or_404(Appointment, id=appt_id)
        
        # 1. Determinar el Queryset según la categoría
        model_map = {
            "prescription": Prescription,
            "treatment": Treatment,
            "medical_test_order": MedicalTest,
            "medical_referral": MedicalReferral,
        }
        
        model = model_map.get(category)
        if not model:
            return Response({"error": "Categoría inválida"}, status=400)
            
        items_qs = model.objects.filter(appointment=appointment)

        # 2. Llamar al motor de PDF (tu función generate_pdf_document)
        # Asumimos que esta función está en services.py o accesible aquí
        pdf_file, audit_code = services.generate_pdf_document(category, items_qs, appointment)

        # 3. Guardar automáticamente en la base de datos para el historial
        doc_instance = MedicalDocument.objects.create(
            patient=appointment.patient,
            appointment=appointment,
            category=category,
            file=pdf_file,
            description=f"Generado automáticamente: {category} - Cita {appt_id}",
            mime_type="application/pdf",
            size_bytes=pdf_file.size,
            checksum_sha256=hashlib.sha256(pdf_file.read()).hexdigest(),
            source="system_generated",
            template_version="v1.0",
            generated_by=request.user
        )
        pdf_file.seek(0) # Reset para la respuesta

        self.log_event(doc_instance, "generate", metadata={"audit_code": audit_code})

        return FileResponse(
            pdf_file, 
            as_attachment=True, 
            filename=f"{category}_{appointment.patient.last_name}.pdf"
        )

    # --- LÓGICA DE CREACIÓN MANUAL (Multipart) ---
    def perform_create(self, serializer):
        file = self.request.FILES.get("file")
        extra_data = self._build_file_metadata(file)
        extra_data["source"] = "user_uploaded"
        extra_data["uploaded_by"] = self.request.user
        
        instance = serializer.save(**extra_data)
        self.log_event(instance, "create")

    def perform_update(self, serializer):
        file = self.request.FILES.get("file")
        extra_data = self._build_file_metadata(file) if file else {}
        
        instance = serializer.save(**extra_data)
        self.log_event(instance, "update")

    def perform_destroy(self, instance):
        self.log_event(instance, "delete", severity="warning")
        instance.delete()

    # --- HELPERS ---
    def _build_file_metadata(self, file):
        if not file: return {}
        sha256 = hashlib.sha256()
        for chunk in file.chunks():
            sha256.update(chunk)
        return {
            "mime_type": file.content_type or "application/octet-stream",
            "size_bytes": file.size,
            "checksum_sha256": sha256.hexdigest(),
        }


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


class AppointmentViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    CENTRO DE CONTROL DE CITAS (FULL):
    Gestiona el ciclo de vida completo: Agendamiento, Check-in, Consulta, 
    Auditoría, Búsqueda Avanzada y Exportación Administrativa.
    """
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['patient', 'status', 'appointment_date', 'appointment_type']
    search_fields = ['patient__first_name', 'patient__last_name', 'patient__national_id', 'notes']
    ordering = ['appointment_date', 'start_time']

    def get_queryset(self):
        return Appointment.objects.select_related('patient', 'institution')\
                                  .prefetch_related('charge_orders')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AppointmentDetailSerializer
        return AppointmentSerializer

    # --- BÚSQUEDA AVANZADA (Sustituye a appointment_search_api) ---
    @action(detail=False, methods=['get'], url_path='search-advanced')
    def search_advanced(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        # Tokenización y Normalización
        raw_tokens = [t.strip() for t in query.split() if t.strip()]
        tokens = [normalize_token(t) for t in raw_tokens]

        qs = self.get_queryset().annotate(
            patient_fn_norm=normalize(Coalesce(F("patient__first_name"), Value(""), output_field=CharField())),
            patient_ln_norm=normalize(Coalesce(F("patient__last_name"), Value(""), output_field=CharField())),
            notes_norm=normalize(Coalesce(F("notes"), Value(""), output_field=CharField())),
            date_str=Cast(F("appointment_date"), CharField())
        )

        q_objects = Q()
        for t in tokens:
            q_objects |= Q(patient_fn_norm__icontains=t) | Q(patient_ln_norm__icontains=t) | \
                         Q(notes_norm__icontains=t) | Q(date_str__icontains=t)
            if t.isdigit():
                q_objects |= Q(id=int(t))

        results = qs.filter(q_objects).order_by("-appointment_date")[:15]
        return Response(AppointmentSerializer(results, many=True).data)

    # --- EXPORTACIÓN (Sustituye a export_appointments_excel) ---
    @action(detail=False, methods=['get'], url_path='export-excel')
    def export_excel(self, request):
        """Genera reporte administrativo. Corregido para evitar errores de Pylance."""
        queryset = self.filter_queryset(self.get_queryset())
        
        wb = Workbook()
        # Forzamos validación de la hoja activa para que Pylance no marque 'None'
        ws: Worksheet = wb.active # type: ignore
        
        if ws is None:
            return Response({"error": "Error interno al generar el libro de Excel"}, status=500)

        ws.title = "Reporte de Citas"
        
        # Estética de Excel
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")
        
        headers = ['ID', 'Paciente', 'Cédula', 'Fecha', 'Estado', 'Tipo', 'Notas']
        ws.append(headers)

        # Dar formato a la primera fila (Headers)
        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

        for appt in queryset:
            # Validaciones de seguridad para datos nulos
            full_name = f"{appt.patient.first_name} {appt.patient.last_name}" if appt.patient else "N/A"
            national_id = appt.patient.national_id if appt.patient else "N/A"
            date_str = appt.appointment_date.strftime('%d/%m/%Y %H:%M') if appt.appointment_date else "N/A"
            status_label = appt.get_status_display() if hasattr(appt, 'get_status_display') else str(appt.status)

            ws.append([
                appt.id,
                full_name,
                national_id,
                date_str,
                status_label,
                appt.appointment_type,
                appt.notes or ""
            ])

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        
        self.log_event(None, "excel_export", metadata={"record_count": queryset.count()})
        
        return FileResponse(
            buffer, 
            as_attachment=True, 
            filename=f"Citas_{timezone.localdate()}.xlsx",
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    # --- CAMBIO DE ESTADO (Sustituye a update_appointment_status) ---
    @action(detail=True, methods=['patch'], url_path='update-status')
    def status_update(self, request, pk=None):
        appointment = self.get_object()
        new_status = request.data.get("status")
        old_status = appointment.status
        
        appointment.status = new_status
        appointment.save(update_fields=['status'])
        
        self.log_event(appointment, "status_change", 
                      metadata={"from": old_status, "to": new_status})
        return Response({"status": "updated", "new_status": new_status})

    # --- CHECK-IN Y SALA DE ESPERA ---
    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        appointment = self.get_object()
        with transaction.atomic():
            appointment.status = 'arrived'
            appointment.arrival_time = timezone.now()
            appointment.save()

            entry, created = WaitingRoomEntry.objects.update_or_create(
                appointment=appointment,
                defaults={
                    'patient': appointment.patient,
                    'status': 'waiting',
                    'priority': request.data.get('priority', 'normal'),
                    'source_type': 'appointment'
                }
            )
            self.log_event(appointment, "patient_checkin")
        return Response({"status": "arrived", "waiting_room_id": entry.id})

    # --- FLUJO CLÍNICO (Inicio y Cierre) ---
    @action(detail=True, methods=['post'], url_path='start-consultation')
    def start_consultation(self, request, pk=None):
        appointment = self.get_object()
        with transaction.atomic():
            appointment.status = 'in_consultation'
            appointment.started_at = timezone.now()
            appointment.save()
            
            WaitingRoomEntry.objects.filter(appointment=appointment).update(status='called')
            ClinicalNote.objects.get_or_create(appointment=appointment)
            
            self.log_event(appointment, "consultation_started")
        return Response({"status": "in_consultation"})

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        appointment = self.get_object()
        note = getattr(appointment, 'note', None)
        if not note:
            return Response({"error": "No existe nota clínica para cerrar."}, status=400)

        with transaction.atomic():
            note.is_locked = True
            note.locked_at = timezone.now()
            note.save()
            
            appointment.status = 'completed'
            appointment.completed_at = timezone.now()
            appointment.save()
            
            WaitingRoomEntry.objects.filter(appointment=appointment).update(status='finished')
            self.log_event(appointment, "consultation_completed")
        return Response({"status": "completed"})

    # --- AUDITORÍA (Sustituye a audit_by_appointment) ---
    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        appointment = self.get_object()
        events = Event.objects.filter(
            entity="Appointment", 
            entity_id=appointment.id
        ).order_by("-timestamp")
        
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("charge_order")
    serializer_class = PaymentSerializer

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        payment = self.get_object()
        payment.confirm(actor=str(request.user))
        payment.charge_order.sync_financials()
        return Response({"status": "confirmed"})


class WaitingRoomEntryViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    GESTIÓN DE SALA DE ESPERA:
    Controla el flujo de pacientes desde su llegada hasta que entran a consulta.
    Absorbe 'register_arrival' y 'update_waitingroom_status'.
    """
    queryset = WaitingRoomEntry.objects.select_related('patient', 'appointment').all()
    serializer_class = WaitingRoomEntrySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'patient']
    ordering = ['-arrived_at']

    # --- ABSORCIÓN: register_arrival (Walk-ins o Registro Manual) ---
    @action(detail=False, methods=['post'], url_path='register-arrival')
    def register_arrival(self, request):
        """
        Sustituye a la función register_arrival.
        Permite registrar a un paciente que llega sin cita o forzar entrada.
        """
        patient_id = request.data.get("patient_id")
        appointment_id = request.data.get("appointment_id") # Opcional
        
        with transaction.atomic():
            # Si hay cita, la vinculamos y actualizamos su estado
            appointment = None
            if appointment_id:
                appointment = get_object_or_404(Appointment, id=appointment_id)
                appointment.status = 'arrived'
                appointment.arrival_time = timezone.now()
                appointment.save()

            entry, created = WaitingRoomEntry.objects.get_or_create(
                patient_id=patient_id,
                appointment=appointment,
                status='waiting',
                defaults={
                    'priority': request.data.get('priority', 'normal'),
                    'source_type': 'walk_in' if not appointment else 'appointment',
                    'arrived_at': timezone.now()
                }
            )
            
            self.log_event(entry, "patient_arrived", 
                          metadata={"method": "manual_register", "has_appointment": bool(appointment)})

        return Response(self.get_serializer(entry).data, status=status.HTTP_201_CREATED)

    # --- ABSORCIÓN: update_waitingroom_status ---
    @action(detail=True, methods=['patch'], url_path='update-status')
    def status_update(self, request, pk=None):
        """
        Sustituye a la función update_waitingroom_status.
        Maneja transiciones: 'waiting' -> 'called' -> 'in_consultation' -> 'finished'.
        """
        entry = self.get_object()
        new_status = request.data.get("status")
        old_status = entry.status

        with transaction.atomic():
            entry.status = new_status
            
            # Lógica automática según el estado
            if new_status == 'called':
                entry.called_at = timezone.now()
            elif new_status == 'in_consultation':
                if entry.appointment:
                    entry.appointment.status = 'in_consultation'
                    entry.appointment.started_at = timezone.now()
                    entry.appointment.save()
            
            entry.save()
            
            self.log_event(entry, "status_change", 
                          metadata={"from": old_status, "to": new_status})

        return Response({"status": "updated", "new_status": new_status})

    # --- ACCIÓN: LLAMAR PACIENTE (Integración con Pantallas/Voz) ---
    @action(detail=True, methods=['post'], url_path='call')
    def call_patient(self, request, pk=None):
        """Acción rápida para el recepcionista: marca como llamado y registra hora."""
        entry = self.get_object()
        entry.status = 'called'
        entry.called_at = timezone.now()
        entry.save()
        
        # Aquí podrías disparar un evento de WebSocket para la pantalla de la sala
        self.log_event(entry, "patient_called_to_consultation", notify=True)
        
        return Response({"status": "called", "at": entry.called_at})


class DiagnosisViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    Controlador de Juicio Clínico.
    Validación: Impide cambios si la cita está cerrada.
    """
    queryset = Diagnosis.objects.select_related("appointment__note")

    def get_serializer_class(self):
        return DiagnosisWriteSerializer if self.action in ["create", "update", "partial_update"] else DiagnosisSerializer

    def perform_create(self, serializer):
        appointment = serializer.validated_data.get('appointment')
        # Regla de Oro: Si la nota está bloqueada, no se toca el diagnóstico
        if hasattr(appointment, 'note') and appointment.note.is_locked:
            raise ValidationError("La consulta está cerrada. No se pueden añadir diagnósticos.")
        
        diagnosis = serializer.save()
        self.log_event(diagnosis, "create")


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
class PrescriptionViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    Motor de Recetario.
    Maneja la lógica compleja de componentes y auditoría severa.
    """
    queryset = Prescription.objects.select_related("diagnosis__appointment__note")

    def get_serializer_class(self):
        return PrescriptionWriteSerializer if self.action in ["create", "update", "partial_update"] else PrescriptionSerializer

    def perform_create(self, serializer):
        diagnosis = serializer.validated_data.get('diagnosis')
        # Protección legal
        if diagnosis.appointment.note.is_locked:
            raise ValidationError("La consulta está cerrada. No se pueden emitir recetas nuevas.")
        
        with transaction.atomic():
            prescription = serializer.save()
            # La auditoría ahora es una sola línea
            self.log_event(prescription, "create", notify=True)

    def perform_update(self, serializer):
        prescription = serializer.save()
        self.log_event(prescription, "update", notify=True)

    def perform_destroy(self, instance):
        # Auditoría de advertencia antes de borrar
        self.log_event(instance, "delete", severity="warning", notify=True)
        instance.delete()


class ChargeOrderViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    CONTROLADOR FINANCIERO: Gestiona el ciclo de vida del cobro.
    """
    queryset = ChargeOrder.objects.select_related("appointment", "patient")\
                                  .prefetch_related("items", "payments")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["patient__first_name", "patient__last_name", "id"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return ChargeOrderPaymentSerializer
        return ChargeOrderSerializer

    @action(detail=True, methods=["post"])
    def void(self, request, pk=None):
        """Anulación oficial con rastro de auditoría."""
        order = self.get_object()
        with transaction.atomic():
            order.mark_void(
                reason=request.data.get("reason", ""), 
                actor=str(request.user)
            )
            self.log_event(order, "void", severity="warning", notify=True)
        return Response({"status": "void"})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        """Métricas de flujo de caja para el Dashboard."""
        qs = self.filter_queryset(self.get_queryset())
        # Optimizamos en una sola consulta de agregación
        stats = qs.aggregate(
            total_gen=Sum("total"),
            paid=Sum("total", filter=Q(status="paid")),
            pending=Sum("balance_due", filter=Q(status__in=["open", "partially_paid"])),
            voided=Sum("total", filter=Q(status="void"))
        )
        return Response({k: float(v or 0) for k, v in stats.items()})

    @action(detail=True, methods=["post"], url_path='register-payment')
    def register_payment(self, request, pk=None):
        """
        Punto de entrada único para pagos desde la orden.
        """
        order = self.get_object()
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            payment = serializer.save(
                charge_order=order,
                appointment=order.appointment,
                status="confirmed"
            )
            # El recálculo ahora ocurre dentro de un método del modelo
            order.sync_financials() 
            self.log_event(order, "payment_registered", notify=True)

        return Response(PaymentSerializer(payment).data, status=201)

    @action(detail=True, methods=["get"])
    def export_pdf(self, request, pk=None):
        """
        Genera la factura/orden en PDF delegando la carga pesada.
        """
        order = self.get_object()
        # Delegamos a una función externa para mantener el ViewSet en < 50 líneas
        return generate_order_pdf(order)


class ChargeItemViewSet(viewsets.ModelViewSet):
    queryset = ChargeItem.objects.all()
    serializer_class = ChargeItemSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            item = serializer.save()
            item.order.sync_financials() # Automatizado

    def perform_destroy(self, instance):
        order = instance.order
        with transaction.atomic():
            instance.delete()
            order.sync_financials()


logger = logging.getLogger(__name__)


class MedicalTestViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    CENTRO DE ÓRDENES: Laboratorios e Imágenes.
    """
    queryset = MedicalTest.objects.select_related("appointment", "diagnosis")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['appointment', 'status', 'urgency']
    search_fields = ['test_type', 'description']

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MedicalTestWriteSerializer
        return MedicalTestSerializer

    def perform_create(self, serializer):
        # Validación de integridad de nota bloqueada
        appointment = serializer.validated_data.get('appointment')
        if hasattr(appointment, 'note') and appointment.note.is_locked:
            raise ValidationError("Consulta bloqueada. No se pueden ordenar nuevos exámenes.")
            
        test = serializer.save()
        # La auditoría ahora es limpia
        self.log_event(test, "create", notify=True)

    def perform_update(self, serializer):
        test = serializer.save()
        self.log_event(test, "update")


class MedicalReferralViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    CONTROL DE INTERCONSULTAS: Derivaciones a especialistas.
    """
    queryset = MedicalReferral.objects.select_related("appointment", "diagnosis")\
                                      .prefetch_related("specialties")
    serializer_class = MedicalReferralSerializer

    def perform_create(self, serializer):
        appointment = serializer.validated_data.get('appointment')
        if hasattr(appointment, 'note') and appointment.note.is_locked:
            raise ValidationError("Consulta bloqueada. No se pueden crear referencias.")
            
        referral = serializer.save()
        self.log_event(referral, "create", notify=True)


class SpecialtyViewSet(viewsets.ReadOnlyModelViewSet):
    """Catálogo global de especialidades médicas."""
    queryset = Specialty.objects.all().order_by("name")
    serializer_class = SpecialtySerializer
    pagination_class = None # Catálogo pequeño, mejor enviarlo completo para dropdowns


class GlobalSearchView(APIView):
    """
    EL MOTOR DE BÚSQUEDA CENTRAL:
    Normaliza, tokeniza y busca en todo el ecosistema hospitalario en una sola llamada.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("query", "").strip()
        if not query:
            return Response({"patients": [], "appointments": [], "orders": []})

        # Reutilizamos tu lógica de normalización
        raw_tokens = [t.strip() for t in query.split() if t.strip()]
        tokens = [normalize_token(t) for t in raw_tokens]

        if not tokens:
            return Response({"patients": [], "appointments": [], "orders": []})

        results = {}

        # 1. Búsqueda de Pacientes
        patient_qs = Patient.objects.annotate(
            first_name_norm=normalize(F("first_name")),
            last_name_norm=normalize(F("last_name")),
            national_id_norm=normalize(F("national_id")),
        )
        p_q = Q()
        for t in tokens:
            p_q |= Q(first_name_norm__icontains=t) | Q(last_name_norm__icontains=t) | Q(national_id_norm__icontains=t)
        
        results["patients"] = patient_qs.filter(p_q).values(
            "id", "first_name", "last_name", "national_id"
        )[:10]

        # 2. Búsqueda de Citas
        appt_qs = Appointment.objects.select_related("patient").annotate(
            patient_fn_norm=normalize(F("patient__first_name")),
            patient_ln_norm=normalize(F("patient__last_name")),
        )
        a_q = Q()
        for t in tokens:
            a_q |= Q(patient_fn_norm__icontains=t) | Q(patient_ln_norm__icontains=t)
        
        results["appointments"] = AppointmentSerializer(appt_qs.filter(a_q)[:10], many=True).data

        # 3. Búsqueda de Órdenes de Cobro
        order_qs = ChargeOrder.objects.select_related("patient").annotate(
            patient_fn_norm=normalize(F("patient__first_name")),
            patient_ln_norm=normalize(F("patient__last_name")),
        )
        o_q = Q()
        for t in tokens:
            o_q |= Q(patient_fn_norm__icontains=t) | Q(patient_ln_norm__icontains=t)
        
        results["orders"] = ChargeOrderSerializer(order_qs.filter(o_q)[:10], many=True).data

        return Response(results)


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


class VitalSignsViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    MONITOR BIOMÉTRICO: Gestiona tensión, peso, saturación, etc.
    Optimizado para series de tiempo.
    """
    queryset = VitalSigns.objects.select_related('appointment__patient')
    serializer_class = VitalSignsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['appointment', 'appointment__patient']
    ordering = ['-measured_at']

    def perform_create(self, serializer):
        appointment = serializer.validated_data.get('appointment')
        # Si la cita está cerrada, los signos ya no se tocan (Integridad Histórica)
        if hasattr(appointment, 'note') and appointment.note.is_locked:
            raise ValidationError("No se pueden registrar signos en una cita finalizada.")
            
        instance = serializer.save()
        self.log_event(instance, "create")

    @action(detail=False, methods=['get'], url_path='latest-by-patient')
    def latest_by_patient(self, request):
        """Devuelve el último set de signos vitales de un paciente para comparación."""
        patient_id = request.query_params.get('patient')
        if not patient_id:
            return Response({"error": "patient_id requerido"}, status=400)
            
        latest = VitalSigns.objects.filter(appointment__patient_id=patient_id).first()
        if not latest:
            return Response({"detail": "No hay registros previos"}, status=404)
        return Response(VitalSignsSerializer(latest).data)


class ICD11ViewSet(viewsets.ReadOnlyModelViewSet):
    """
    CATÁLOGO UNIVERSAL ICD-11:
    Diccionario de diagnósticos estandarizados.
    """
    queryset = ICD11Entry.objects.all()
    serializer_class = ICD11EntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # DRF maneja la búsqueda de forma mucho más eficiente que los if/else manuales
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'icd_code']

    def get_queryset(self):
        # Optimizamos para que no traiga miles de registros por error
        return super().get_queryset()[:100]


class MedicalReportViewSet(AuditMixin, viewsets.ModelViewSet):
    """
    CENTRO DE DOCUMENTACIÓN MÉDICA:
    Gestiona informes y genera PDFs con sellos de seguridad QR.
    """
    queryset = MedicalReport.objects.select_related('appointment', 'appointment__patient').all()
    serializer_class = MedicalReportSerializer

    @action(detail=True, methods=['get'], url_path='pdf')
    def generate_pdf(self, request, pk=None):
        """
        Sustituye a la función generate_medical_report_pdf.
        Genera un PDF oficial con QR de validación.
        """
        report = self.get_object()
        appointment = report.appointment
        patient = appointment.patient

        # 1. Generar QR de Validación (Seguridad)
        qr_data = f"Report-ID: {report.id} | Patient: {patient.national_id} | Date: {report.created_at.strftime('%Y-%m-%d')}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img_qr = qr.make_image(fill_color="black", back_color="white")
        
        buffer_qr = BytesIO()
        img_qr.save(buffer_qr, format="PNG")
        qr_base64 = base64.b64encode(buffer_qr.getvalue()).decode()

        # 2. Renderizado de Plantilla
        context = {
            'report': report,
            'appointment': appointment,
            'patient': patient,
            'qr_code': qr_base64,
            'generated_at': timezone.now(),
        }
        
        html_string = render_to_string('medical_report_pdf.html', context)
        
        # 3. Generación del PDF (WeasyPrint)
        buffer_pdf = BytesIO()
        HTML(string=html_string).write_pdf(target=buffer_pdf)
        buffer_pdf.seek(0)

        self.log_event(report, "pdf_generated", severity="info")
        
        return FileResponse(
            buffer_pdf, 
            as_attachment=True, 
            filename=f"Informe_Medico_{patient.last_name}_{report.id}.pdf"
        )


class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    SISTEMA GEOGRÁFICO UNIFICADO:
    Consolida la jerarquía de direcciones y búsquedas en un solo ViewSet.
    Sustituye a AddressChainView y NeighborhoodSearchView.
    """
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [AllowAny] # Mantenemos el acceso público para registros

    @action(detail=False, methods=['get'], url_path='chain')
    def address_chain(self, request):
        """
        Dada una Neighborhood ID, devuelve toda la cadena ascendente.
        Sustituye a AddressChainView.
        """
        nid = request.query_params.get("neighborhood_id")
        if not nid:
            return Response({"detail": "neighborhood_id requerido"}, status=400)
            
        try:
            n = Neighborhood.objects.select_related(
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

    @action(detail=False, methods=['get'], url_path='neighborhood-search')
    def neighborhood_search(self, request):
        """
        Buscador jerárquico de barrios filtrado por cualquier nivel.
        Sustituye a NeighborhoodSearchView.
        """
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


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def global_metadata_api(request):
    """
    EL DICCIONARIO MAESTRO:
    Sustituye a specialty_choices_api, treatment_choices_api, prescription_choices_api, etc.
    Reduce la latencia de carga del frontend al centralizar todos los catálogos.
    """
    return Response({
        # 1. Catálogos de Base de Datos
        "specialties": SpecialtySerializer(Specialty.objects.all().order_by("name"), many=True).data,
        
        # 2. Choices de Tratamientos
        "treatments": {
            "types": [{"key": k, "label": v} for k, v in Treatment.TREATMENT_TYPE_CHOICES],
            "statuses": [{"key": k, "label": v} for k, v in Treatment.STATUS_CHOICES],
        },

        # 3. Choices de Prescripciones (Rutas, Frecuencias, Unidades)
        "prescriptions": {
            "routes": [{"key": k, "label": v} for k, v in Prescription.ROUTE_CHOICES],
            "frequencies": [{"key": k, "label": v} for k, v in Prescription.FREQUENCY_CHOICES],
            "units": [{"key": k, "label": v} for k, v in Prescription.UNIT_CHOICES],
        },

        # 4. Choices de Exámenes Médicos
        "medical_tests": {
            "types": [{"key": k, "label": v} for k, v in MedicalTest.TEST_TYPE_CHOICES],
            "urgencies": [{"key": k, "label": v} for k, v in MedicalTest.URGENCY_CHOICES],
            "statuses": [{"key": k, "label": v} for k, v in MedicalTest.STATUS_CHOICES],
        },

        # 5. Choices de Referencias Médicas
        "medical_referrals": {
            "urgencies": [{"key": k, "label": v} for k, v in MedicalReferral.URGENCY_CHOICES],
            "statuses": [{"key": k, "label": v} for k, v in MedicalReferral.STATUS_CHOICES],
        },

        # 6. Configuración Financiera
        "finance": {
            "currencies": ["USD", "VES"],
            "payment_methods": ["Efectivo", "Transferencia", "Pago Móvil", "Zelle"],
        }
    })


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
@permission_classes([IsAuthenticated])
def dashboard_summary_api(request):
    """
    Punto de entrada de la API para el Dashboard.
    Delega toda la lógica pesada al motor de servicios.
    """
    # 1. Recolectamos lo que el cliente pide
    params = {
        "start_date": request.GET.get("start_date"),
        "end_date": request.GET.get("end_date"),
        "range_param": request.GET.get("range"),
        "currency": request.GET.get("currency", "USD"),
        "status_param": request.GET.get("status"),
    }

    try:
        # 2. Llamamos al cerebro (services.py)
        # Importamos aquí mismo para evitar cualquier posible importación circular futura
        from . import services
        data = services.get_dashboard_summary_data(**params)
        
        # 3. Respondemos con éxito
        return Response(data, status=200)
    
    except Exception as e:
        # Logueamos el error completo en consola para debugging
        traceback.print_exc()
        # Pero al cliente le damos una respuesta segura
        return Response({"error": "Error interno al procesar estadísticas", "detail": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bcv_rate_api(request):
    """
    Endpoint para obtener la tasa BCV.
    No contiene lógica de scraping, solo entrega el resultado del servicio.
    """
    from . import services
    try:
        data = services.get_bcv_rate_logic()
        return Response(data, status=200)
    except Exception as e:
        return Response({
            "error": str(e),
            "detail": "El servicio de tasa de cambio no está disponible temporalmente."
        }, status=503) # 503 Service Unavailable


@extend_schema(
    request=ReportExportSerializer,
    responses={200: OpenApiResponse(description="Archivo exportado")},
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reports_export_api(request):
    """
    VISTA REFACTORIZADA: Delega la generación del archivo al servicio.
    """
    serializer = ReportExportSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # Blindaje contra errores de tipo 'None' u 'Optional'
    vd = cast(Dict[str, Any], serializer.validated_data)
    
    try:
        # Llamamos al servicio con tipos garantizados
        result: Tuple[io.BytesIO, str, str] = services.export_institutional_report(
            data_serialized=cast(List[Dict[str, Any]], vd.get("data", [])),
            export_format=str(vd.get("format", "pdf")),
            filters=vd.get("filters", {}),
            target_currency=str(vd.get("currency", "USD")),
            user_name=str(request.user)
        )
        
        buffer, content_type, filename = result
        
        return FileResponse(
            buffer, 
            as_attachment=True, 
            filename=filename, 
            content_type=content_type
        )

    except ValueError as ve:
        return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        traceback.print_exc()
        return Response(
            {"error": "Error interno al generar el archivo", "detail": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# --- ENDPOINTS DE AUDITORÍA ---

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_dashboard_api(request):
    data = services.get_audit_logic(filters={"dashboard_stats": True})
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_summary_by_patient_api(request, patient_id):
    # Combina clínica, finanzas y general en un solo llamado
    data = services.get_audit_logic(patient_id=patient_id, split_by_category=True, limit=10)
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_global_summary_api(request):
    # Resumen global categorizado
    data = services.get_audit_logic(split_by_category=True, limit=10)
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_global_filtered_api(request):
    # Filtros dinámicos desde la URL
    data = services.get_audit_logic(filters=request.GET, limit=100)
    return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_by_prescription_api(request, prescription_id):
    data = services.get_audit_logic(entity="Prescription", entity_id=prescription_id)
    return Response(data)


@api_view(["POST"])
def generate_report_view(request, pk):
    # 1. Obtener datos (Lógica de vista)
    appointment = get_object_or_404(Appointment, pk=pk)
    
    # 2. Llamar al servicio para generar el contenido (Lógica de negocio)
    # (Supongamos que creaste services.build_report_pdf_content)
    pdf_bytes, filename = services.build_report_pdf_content(appointment)
    
    # 3. Guardar documento vía servicio
    doc = services.create_medical_document(
        patient=appointment.patient,
        appointment=appointment,
        file_content=pdf_bytes,
        filename=filename,
        category=DocumentCategory.MEDICAL_REPORT,
        user=request.user
    )
    
    # 4. Responder (Lógica de transporte)
    return Response(MedicalDocumentReadSerializer(doc).data, status=201)


@extend_schema(responses={201: MedicalReferralSerializer}, tags=["Consultation"])
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_referral_pdf(request, pk):
    """Vista para generar y registrar una referencia médica."""
    referral = get_object_or_404(MedicalReferral, pk=pk)
    
    # Se añade request.user para cumplir con la firma del servicio
    pdf_bytes, filename = services.build_referral_pdf(referral, request.user)
    
    services.create_medical_document_from_pdf(
        patient=referral.appointment.patient,
        appointment=referral.appointment,
        pdf_bytes=pdf_bytes,
        filename=filename,
        category="medical_referral",
        user=request.user, 
        diagnosis=referral.diagnosis,
        origin_panel="referral_panel"
    )
    
    return Response(MedicalReferralSerializer(referral).data, status=status.HTTP_201_CREATED)


@extend_schema(responses={201: ChargeOrderSerializer}, tags=["Payments"])
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def generate_chargeorder_pdf(request, pk):
    """Vista para generar y descargar una orden de cobro."""
    charge_order = get_object_or_404(ChargeOrder, pk=pk)
    
    # CORRECCIÓN: Se añade request.user como segundo argumento
    pdf_bytes, filename, audit_code = services.build_chargeorder_pdf(charge_order, request.user)
    
    services.create_medical_document_from_pdf(
        patient=charge_order.patient,
        appointment=charge_order.appointment,
        pdf_bytes=pdf_bytes,
        filename=filename,
        category="charge_order",
        user=request.user,
        audit_code=audit_code,
        origin_panel="payments_panel"
    )

    full_path = os.path.join(settings.MEDIA_ROOT, "medical_documents", filename)
    
    if request.method == "POST":
        return Response(ChargeOrderSerializer(charge_order).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_used_documents(request, pk):
    """
    Orquestador que utiliza servicios para generar múltiples documentos de una cita.
    """
    appointment = get_object_or_404(Appointment, pk=pk)
    # Aquí llamarías a una función en services.py que itere sobre Treatment, Prescription, etc.
    # y devuelva la lista de documentos generados.
    result = services.bulk_generate_appointment_docs(appointment, request.user)
    
    return Response(result, status=status.HTTP_201_CREATED)


@extend_schema(responses={200: OpenApiResponse(description="Métricas del día")}, tags=["Dashboard"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def metrics_api(request):
    """Endpoint para obtener las métricas diarias."""
    data = services.get_daily_metrics()
    return Response(data)


@extend_schema(responses={200: AppointmentDetailSerializer}, tags=["Consultation"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def appointment_detail_api(request, pk):
    """Detalles completos de una cita."""
    appointment = get_object_or_404(Appointment, pk=pk)
    serializer = AppointmentDetailSerializer(appointment)
    return Response(serializer.data)


@extend_schema(responses={200: MedicalDocumentReadSerializer(many=True)}, tags=["Documents"])
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def documents_api(request):
    """Lista documentos de un paciente o cita."""
    patient_id = request.GET.get("patient")
    appointment_id = request.GET.get("appointment")

    if not patient_id:
        return Response({"error": "Missing patient ID"}, status=status.HTTP_400_BAD_REQUEST)

    qs = MedicalDocument.objects.filter(patient_id=patient_id)
    if appointment_id:
        qs = qs.filter(appointment_id=appointment_id)

    qs = qs.order_by("-uploaded_at")
    
    # CORRECCIÓN: Uso de MedicalDocumentReadSerializer
    serializer = MedicalDocumentReadSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)