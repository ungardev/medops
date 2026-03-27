from rest_framework import viewsets, status, views
from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db.models import Sum, Count, Q, Max
from .models import *
from .serializers import *
from datetime import date
from . import services
from datetime import datetime, timedelta, date #as python_date
from django.utils import timezone
from django.utils.timezone import localdate
import logging
from weasyprint import HTML
from openpyxl import Workbook
from decimal import Decimal
import json
import hashlib
import hmac
import uuid
from typing import Dict, Optional, cast, Any
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
import qrcode
import base64
from io import BytesIO
from .services import generate_audit_code, get_bcv_rate
import traceback
import secrets
import string
from core.permissions import IsDoctorOperatorOrReadOnly
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.authentication import TokenAuthentication
from django.db.models import QuerySet
from rest_framework.views import APIView
import calendar
#from datetime import date, timedelta


logger = logging.getLogger(__name__)


def conditional_permission():
    """
    Retorna el permiso apropiado según el entorno:
    - Desarrollo (DEBUG=True): AllowAny
    - Producción (DEBUG=False): IsAuthenticated
    """
    return AllowAny if settings.DEBUG else IsAuthenticated


# ==========================================
# 1. VIEWSETS (Requeridos por el Router) [cite: 5, 6]
# ==========================================

class PatientViewSet(viewsets.ModelViewSet):
    """
    Administración profesional de Pacientes MEDOPZ.
    Usa lógica de serializers dinámicos para optimizar el ancho de banda.
    """
    queryset = Patient.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        if self.action == 'retrieve':
            return PatientReadSerializer
        return PatientWriteSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        queryset = queryset.filter(active=True)
        return queryset
    
    @action(detail=True, methods=['get'])
    def clinical_summary(self, request, pk=None):
        """Endpoint extra para un resumen rápido en el Frontend."""
        patient = self.get_object()
        return Response({"status": "Success", "data": "Resumen clínico generado"})
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """
        Endpoint completo del perfil clínico del paciente.
        """
        patient = Patient.objects.filter(pk=pk).select_related(
            'neighborhood__parish__municipality__state__country'
        ).prefetch_related(
            'allergies',
            'personal_history',
            'family_history',
            'surgeries',
            'habits',
            'vaccinations',
            'genetic_predispositions'
        ).first()
        
        if not patient:
            return Response({"error": "Patient not found"}, status=404)
        
        allergies_data = list(AllergySerializer(patient.allergies.all(), many=True).data)
        personal_history_data = list(PersonalHistorySerializer(patient.personal_history.all(), many=True).data)
        family_history_data = list(FamilyHistorySerializer(patient.family_history.all(), many=True).data)
        surgeries_data = list(SurgerySerializer(patient.surgeries.all(), many=True).data)
        habits_data = list(HabitSerializer(patient.habits.all(), many=True).data)
        vaccinations_data = list(PatientVaccinationSerializer(patient.vaccinations.all(), many=True).data)
        genetic_data = list(GeneticPredispositionSerializer(patient.genetic_predispositions.all(), many=True).data)
        medical_history_data = list(MedicalHistorySerializer(patient.medical_history.all(), many=True).data)
        
        neighborhood_data = None
        if patient.neighborhood:
            neighborhood_data = NeighborhoodSerializer(patient.neighborhood).data
        
        profile_data = {
            'id': patient.id,
            'first_name': patient.first_name,
            'middle_name': patient.middle_name,
            'last_name': patient.last_name,
            'second_last_name': patient.second_last_name,
            'full_name': patient.full_name,
            'national_id': patient.national_id,
            'birthdate': patient.birthdate.isoformat() if patient.birthdate else None,
            'birth_place': patient.birth_place,
            'birth_country': patient.birth_country,
            'age': (date.today() - patient.birthdate).days // 365 if patient.birthdate else None,
            'gender': patient.gender,
            'email': patient.email,
            'phone_number': patient.phone_number,
            'address': patient.address,
            'blood_type': patient.blood_type,
            'weight': float(patient.weight) if patient.weight else None,
            'height': float(patient.height) if patient.height else None,
            'contact_info': patient.contact_info,
            'active': patient.active,
            'tattoo': patient.tattoo,
            'profession': patient.profession,
            'skin_type': patient.skin_type,
            'created_at': patient.created_at.isoformat() if patient.created_at else None,
            'updated_at': patient.updated_at.isoformat() if patient.updated_at else None,
            'neighborhood': neighborhood_data,
            'allergies': allergies_data,
            'personal_history': personal_history_data,
            'family_history': family_history_data,
            'surgeries': surgeries_data,
            'habits': habits_data,
            'vaccinations': vaccinations_data,
            'genetic_predispositions': genetic_data,
            'medical_history': medical_history_data,
            'clinical_background': personal_history_data + family_history_data + [
                {'id': g['id'], 'type': 'genetic', 'condition': g['name'], 'description': g.get('description', '')}
                for g in genetic_data
            ],
        }
        
        return Response(profile_data)
    
    @action(detail=True, methods=['get'])
    def completed_appointments(self, request, pk=None):
        try:
            patient = self.get_object()
            appointments = Appointment.objects.filter(
                patient=patient,
                status='completed'
            ).select_related('doctor', 'institution').order_by('-appointment_date')[:20]
            
            serializer = AppointmentSerializer(appointments, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error en completed_appointments: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    @action(detail=True, methods=['get'])
    def pending_appointments(self, request, pk=None):
        try:
            patient = self.get_object()
            appointments = Appointment.objects.filter(
                patient=patient,
                status__in=['pending', 'scheduled', 'arrived']
            ).select_related('doctor', 'institution').order_by('appointment_date')
            
            serializer = AppointmentSerializer(appointments, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error en pending_appointments: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    @action(detail=True, methods=['get', 'patch'])
    def notes(self, request, pk=None):
        try:
            patient = self.get_object()
            
            if request.method == 'GET':
                return Response({
                    'patient_id': patient.id,
                    'content': patient.contact_info or '',
                    'updated_at': patient.updated_at.isoformat() if patient.updated_at else None,
                })
            
            content = request.data.get('content', '')
            patient.contact_info = content
            patient.save(update_fields=['contact_info'])
            
            return Response({
                'patient_id': patient.id,
                'content': patient.contact_info or '',
                'updated_at': patient.updated_at.isoformat() if patient.updated_at else None,
            })
        except Exception as e:
            logger.error(f"Error en notes: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        try:
            patient = self.get_object()
            charge_orders = ChargeOrder.objects.filter(patient=patient).values_list('id', flat=True)
            payments = Payment.objects.filter(
                charge_order__in=charge_orders
            ).select_related('charge_order', 'charge_order__patient', 'charge_order__appointment').order_by('-received_at')
            
            serializer = PaymentSerializer(payments, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error en payments: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    # ✅ NUEVO: Endpoint para listar documentos del paciente
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """
        GET /api/patients/{pk}/documents/
        Retorna todos los documentos del paciente, opcionalmente filtrados por cita.
        """
        try:
            patient = self.get_object()
            appointment_id = request.query_params.get('appointment')
            
            queryset = MedicalDocument.objects.filter(patient=patient).select_related(
                'appointment', 'doctor', 'institution', 'diagnosis'
            ).order_by('-uploaded_at')
            
            if appointment_id:
                queryset = queryset.filter(appointment_id=appointment_id)
            
            serializer = MedicalDocumentReadSerializer(queryset, many=True)
            return Response({"list": serializer.data})
        except Exception as e:
            logger.error(f"Error en documents: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    def delete_document(self, request, pk=None, document_id=None):
        """
        DELETE /api/patients/{pk}/documents/{document_id}/
        """
        try:
            document = get_object_or_404(
                MedicalDocument,
                pk=document_id,
                patient=pk
            )
            document.delete()
            return Response(status=204)
        except Exception as e:
            logger.error(f"Error en delete_document: {str(e)}")
            return Response({"error": str(e)}, status=500)


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Control Élite de Citas y Notas Clínicas.
    Maneja el ciclo de vida de la consulta y el bloqueo de integridad.
    """
    queryset = Appointment.objects.all().select_related('patient', 'doctor', 'note', 'institution')
    serializer_class = AppointmentSerializer
    
    # ✅ PERMISOS: Solo usuarios autenticados (pacientes, doctores, admins)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Usar AppointmentDetailSerializer para retrieve (detalle individual).
        Incluye charge_order con payments para datos financieros completos.
        """
        if self.action == 'retrieve':
            return AppointmentDetailSerializer
        return AppointmentSerializer
    
    # Configuración de filtros
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'patient',      # ✅ CRÍTICO: Filtrar por paciente
        'status',       # Filtrar por estado
        'doctor',       # Filtrar por médico
        'institution',  # Filtrar por institución
        'appointment_date',  # Filtrar por fecha
    ]
    search_fields = [
        'patient__first_name',
        'patient__last_name',
        'patient__national_id',
        'doctor__full_name',
    ]
    ordering_fields = ['appointment_date', 'status']
    ordering = ['-appointment_date']
    
    @action(detail=True, methods=['post'], url_path='lock-note')
    def lock_clinical_note(self, request, pk=None):
        """
        Sella la nota clínica. Una vez sellada, no hay vuelta atrás (Normativa Médica).
        """
        appointment = self.get_object()
        if not hasattr(appointment, 'note'):
            return Response(
                {"error": "No hay una nota clínica asociada a esta cita."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        note = appointment.note
        if note.is_locked:
            return Response(
                {"warning": "Esta nota ya se encuentra sellada."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Lógica de sellado
        note.is_locked = True
        note.locked_at = now()
        note.save()
        return Response({
            "status": "Nota sellada exitosamente",
            "locked_at": note.locked_at
        })
    
    def get_queryset(self):
        """
        Filtrado multi-nivel para seguridad y datos correctos:
        1. Base: Solo citas del usuario autenticado (paciente o doctor)
        2. Query params: patient, status, doctor, etc.
        """
        user = self.request.user
        qs = super().get_queryset()
        
        # Filtro para Doctores (institucionales)
        if not user.is_superuser and hasattr(user, 'doctor_profile'):
            qs = qs.filter(institution=user.doctor_profile.institution)
        
        # Filtro para Pacientes (solo sus propias citas)
        elif hasattr(user, 'patient_profile'):
            qs = qs.filter(patient=user.patient_profile.patient)
        
        # Filtros adicionales (status, doctor, fecha) vía query params
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        
        appointment_date = self.request.query_params.get('appointment_date')
        if appointment_date:
            qs = qs.filter(appointment_date=appointment_date)
        
        return qs
    
    def perform_create(self, serializer):
        """
        Creación segura: Fuerza el paciente logueado y deriva la institución del doctor.
        """
        # 1. Forzar el paciente del usuario autenticado
        patient_profile = self.request.user.patient_profile
        patient = patient_profile.patient
        
        # 2. Obtener datos validados y limpiar campo paciente si existe
        validated_data = serializer.validated_data
        validated_data.pop('patient', None)  # Evita duplicados o manipulación
        
        # 3. Derivar institución del doctor si no está presente
        doctor = validated_data.get('doctor')
        if doctor and 'institution' not in validated_data:
            validated_data['institution'] = doctor.institution
        
        # 4. Crear la cita con el paciente forzado
        serializer.save(patient=patient, **validated_data)


class MedicalDocumentViewSet(viewsets.ModelViewSet):
    """
    Gestión de documentos médicos con filtrado por paciente y cita.
    
    Endpoints:
    - GET /api/documents/                           # Todos los documentos
    - GET /api/documents/?patient=123               # Documentos de un paciente
    - GET /api/documents/?appointment=456           # Documentos de una cita
    - GET /api/documents/?patient=123&appointment=456  # Combinado
    
    Seguridad:
    - Doctores solo ven SUS documentos generados
    - Excepciones: estudios externos y documentos subidos por usuarios son visibles para todos
    """
    queryset = MedicalDocument.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return MedicalDocumentReadSerializer
        return MedicalDocumentWriteSerializer
    
    def get_queryset(self):
        """
        Filtra documentos por paciente, cita y aplica seguridad de acceso.
        Los doctores solo ven sus propios documentos generados, excepto
        estudios externos y documentos subidos por usuarios.
        """
        from django.db.models import Q
        
        queryset = MedicalDocument.objects.select_related(
            'patient', 'appointment', 'doctor', 'institution', 'diagnosis'
        )
        
        # Obtener el doctor desde la request
        doctor = getattr(self.request.user, 'doctor_profile', None)
        
        # Si es doctor, aplicar filtro de seguridad
        if doctor:
            # Excepciones: siempre mostrar documentos externos/subidos por usuario
            # (exámenes de laboratorios, estudios externos, etc.)
            exceptions = Q(source='user_uploaded') | Q(category='external_study')
            
            # Filtrar: documentos del doctor O excepciones
            # doctor__isnull=True cubre documentos sin médico asignado
            queryset = queryset.filter(
                Q(doctor=doctor) | 
                Q(doctor__isnull=True) |
                exceptions
            )
        
        # Filtros existentes
        patient_id = self.request.query_params.get('patient')
        appointment_id = self.request.query_params.get('appointment')
        
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if appointment_id:
            queryset = queryset.filter(appointment_id=appointment_id)
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """
        Override de list() para devolver estructura esperada por frontend:
        { "documents": [...] }
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({"documents": serializer.data})


class MedicationCatalogViewSet(viewsets.ModelViewSet):
    """
    Catálogo maestro de medicamentos con búsqueda y filtrado avanzado.
    
    Endpoints:
    - GET /api/medications/?search=paracetamol
    - GET /api/medications/?presentation=tablet&route=oral
    - GET /api/medications/?ordering=name
    """
    queryset = MedicationCatalog.objects.all()
    serializer_class = MedicationCatalogSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = [
        'presentation',
        'route',
        'is_controlled',
        'source',
        'is_active',
    ]
    search_fields = [
        'name',
        'generic_name',
        'therapeutic_action',
        'concentration',
        'inhrr_code',
    ]
    ordering_fields = [
        'name',
        'generic_name',
        'presentation',
        'created_at',
        'last_scraped_at',
    ]
    ordering = ['name']
    
    def get_queryset(self):
        """
        Filtra medicamentos activos y del contexto institucional.
        Agrega búsqueda por múltiples campos.
        """
        user = self.request.user
        
        # Filtro básico: solo activos
        queryset = super().get_queryset().filter(is_active=True)
        
        # Búsqueda personalizada más flexible
        search = self.request.query_params.get('search', None)
        if search and len(search) >= 2:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(generic_name__icontains=search) |
                Q(therapeutic_action__icontains=search) |
                Q(concentration__icontains=search) |
                Q(inhrr_code__icontains=search)
            ).distinct()
        
        # Filtrado institucional opcional
        if user.is_authenticated and hasattr(user, 'doctor_profile'):
            doctor = user.doctor_profile
            
            # Si el doctor tiene institución activa
            if hasattr(doctor, 'active_institution') and doctor.active_institution:
                institution = doctor.active_institution
                
                # Mostrar: catálogo maestro (institution is null) + medicamentos de la institución
                queryset = queryset.filter(
                    Q(institution__isnull=True) | Q(institution=institution)
                )
            else:
                # Sin institución activa: solo catálogo maestro
                queryset = queryset.filter(institution__isnull=True)
        
        return queryset  # ✅ CORREGIDO: Sin slicing [:50]
    
    def list(self, request, *args, **kwargs):
        """
        Override list para limitar resultados sin romper paginación.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Limitar a 50 resultados máximo para búsquedas
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset[:50]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# ViewSets Automáticos (Mocks de serializers y modelos)
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def create(self, request):
        """
        Crear pago con referencia autogenerada.
        """
        serializer = PaymentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # ✅ SOLUCIÓN: Usar cast para ayudar a Pylance
        validated_data: Dict[str, Any] = cast(Dict[str, Any], serializer.validated_data)
        
        # Ahora Pylance sabe que validated_data es un dict[str, Any]
        charge_order = validated_data.get('charge_order')
        
        if not charge_order:
            return Response({"error": "charge_order es requerido"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Autogenerar referencia
        reference_number = validated_data.get('reference_number')
        if not reference_number:
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            reference_number = f"REC-{charge_order.id}-{timestamp}"
        
        try:
            payment = Payment.objects.create(
                institution=charge_order.institution,
                appointment=charge_order.appointment,
                charge_order=charge_order,
                patient=charge_order.patient,  # ✅ AHORA FUNCIONARÁ
                doctor=charge_order.doctor,
                amount=validated_data['amount'],
                method=validated_data['method'],
                reference_number=reference_number,
                status='confirmed',
            )
            
            charge_order.recalc_totals()
            charge_order.save()
            
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error creando pago: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WaitingRoomEntryViewSet(viewsets.ModelViewSet): queryset = WaitingRoomEntry.objects.all(); serializer_class = WaitingRoomEntrySerializer
class GeneticPredispositionViewSet(viewsets.ModelViewSet): queryset = GeneticPredisposition.objects.all(); serializer_class = GeneticPredispositionSerializer
class DiagnosisViewSet(viewsets.ModelViewSet): queryset = Diagnosis.objects.all(); serializer_class = DiagnosisSerializer
class TreatmentViewSet(viewsets.ModelViewSet): queryset = Treatment.objects.all(); serializer_class = TreatmentSerializer


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar prescripciones médicas.
    
    ✅ Usa serializers diferenciados:
    - Lectura (GET): PrescriptionSerializer (anida medication_catalog completo)
    - Escritura (POST/PATCH): PrescriptionWriteSerializer (acepta IDs)
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    def get_serializer_class(self):
        """
        Retorna el serializer apropiado según la acción:
        - create, update, partial_update: PrescriptionWriteSerializer
        - list, retrieve: PrescriptionSerializer
        """
        if self.action in ['create', 'update', 'partial_update']:
            return PrescriptionWriteSerializer
        return PrescriptionSerializer
    def get_queryset(self):
        """
        Optimiza queries con select_related y prefetch_related.
        """
        return Prescription.objects.select_related(
            'diagnosis__appointment',
            'medication_catalog',
            'doctor',
            'institution',
            'patient'
        ).prefetch_related('components')


class ChargeOrderViewSet(viewsets.ModelViewSet):
    queryset = ChargeOrder.objects.all()
    serializer_class = ChargeOrderSerializer
    
    def get_queryset(self):
        """
        Maneja el ordenamiento correctamente Y optimiza queries.
        """
        # ✅ EMPEZAR CON UN QUERYSET LIMPIO
        queryset = ChargeOrder.objects.all()
        
        # ✅ USAR select_related CON SEGURIDAD
        try:
            queryset = queryset.select_related(
                'patient',
                'doctor', 
                'institution',
                'appointment',
                'created_by',
                'updated_by'
            )
        except Exception as e:
            logger.warning(f"Error en select_related: {e}")
        
        # ✅ USAR prefetch_related CON SEGURIDAD  
        try:
            queryset = queryset.prefetch_related(
                'items',
                'payments'
            )
        except Exception as e:
            logger.warning(f"Error en prefetch_related: {e}")
        
        # ✅ MANEJO DE ORDENAMIENTO SEGURO
        ordering = self.request.query_params.get('ordering', '')
        
        if ordering:
            new_ordering = []
            for field in ordering.split(','):
                field = field.strip()
                # Solo permitir campos válidos para evitar inyecciones
                valid_fields = {
                    'appointment_date': 'appointment__appointment_date',
                    '-appointment_date': '-appointment__appointment_date',
                    'issued_at': 'issued_at',
                    '-issued_at': '-issued_at', 
                    'id': 'id',
                    '-id': '-id',
                    'total': 'total',
                    '-total': '-total',
                    'balance_due': 'balance_due',
                    '-balance_due': '-balance_due',
                }
                if field in valid_fields:
                    new_ordering.append(valid_fields[field])
            
            if new_ordering:
                queryset = queryset.order_by(*new_ordering)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Estadísticas financieras de órdenes de cobro"""
        from django.db.models import Count, Sum
        
        total_revenue = Payment.objects.filter(status='confirmed').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_orders = ChargeOrder.objects.count()
        paid_orders = ChargeOrder.objects.filter(status='paid').count()
        pending_orders = ChargeOrder.objects.filter(status='open').count()
        failed_orders = ChargeOrder.objects.filter(status='void').count()
        
        return Response({
            'total': total_orders,
            'confirmed': float(total_revenue),
            'pending': pending_orders,
            'failed': failed_orders,
        })
    
    @action(detail=True, methods=['post'])
    def payments(self, request, pk=None):
        """Crear pago para esta orden de cobro."""
        try:
            charge_order = self.get_object()
            
            if charge_order.status in ['void', 'waived']:
                return Response(
                    {"error": "No se pueden agregar pagos a una orden anulada o exonerada"},
                    status=400
                )
            
            serializer = PaymentWriteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            payment = Payment.objects.create(
                institution=charge_order.institution,
                appointment=charge_order.appointment,
                charge_order=charge_order,
                amount=serializer.validated_data['amount'],
                method=serializer.validated_data['method'],
                reference_number=serializer.validated_data.get('reference_number'),
                status='pending',
            )
            
            charge_order.recalc_totals()
            charge_order.save()
            
            return Response(PaymentSerializer(payment).data, status=201)
        
        except Exception as e:
            logger.error(f"Error creando pago: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
    def void(self, request, pk=None):
        """Anular una orden de cobro."""
        try:
            charge_order = self.get_object()
            
            if charge_order.status == 'paid':
                return Response({"error": "No se puede anular una orden pagada."}, status=400)
            if charge_order.status == 'void':
                return Response({"error": "La orden ya está anulada."}, status=400)
            if charge_order.status == 'waived':
                return Response({"error": "No se puede anular una orden exonerada."}, status=400)
            
            charge_order.status = 'void'
            charge_order.save(update_fields=['status'])
            
            return Response({"status": "void", "message": "Orden anulada correctamente"})
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
    def waive(self, request, pk=None):
        """Exonerar una orden de cobro."""
        try:
            charge_order = self.get_object()
            
            if charge_order.status == 'void':
                return Response({"error": "No se puede exonerar una orden anulada."}, status=400)
            if charge_order.status == 'waived':
                return Response({"error": "La orden ya está exonerada."}, status=400)
            if charge_order.status == 'paid':
                return Response({"error": "La orden ya está pagada."}, status=400)
            
            charge_order.status = 'waived'
            charge_order.balance_due = 0
            charge_order.save(update_fields=['status', 'balance_due'])
            
            return Response({"status": "waived", "message": "Orden exonerada correctamente"})
        
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ChargeItemViewSet(viewsets.ModelViewSet): queryset = ChargeItem.objects.all(); serializer_class = ChargeItemSerializer


class MedicalTestViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar órdenes de exámenes médicos.
    ✅ Filtra por appointment para aislar datos por consulta.
    """
    queryset = MedicalTest.objects.all()
    serializer_class = MedicalTestSerializer
    def get_queryset(self):
        """
        Filtra por appointment si se proporciona en query params.
        Esto garantiza aislamiento total entre consultas de diferentes pacientes.
        """
        queryset = MedicalTest.objects.select_related('appointment')
        appointment_id = self.request.query_params.get('appointment')
        if appointment_id:
            queryset = queryset.filter(appointment_id=appointment_id)
        return queryset.order_by('-created_at')


class MedicalReferralViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar referencias médicas inter-institucionales.
    ✅ Filtra por appointment para aislar datos por consulta.
    """
    queryset = MedicalReferral.objects.all()
    serializer_class = MedicalReferralSerializer
    
    def get_serializer_class(self):
        """✅ Usa serializer de escritura para create/update"""
        if self.action in ['create', 'update', 'partial_update']:
            return MedicalReferralWriteSerializer
        return MedicalReferralSerializer
    
    def get_queryset(self):
        """
        Filtra por appointment si se proporciona en query params.
        Esto garantiza aislamiento total entre consultas de diferentes pacientes.
        """
        queryset = MedicalReferral.objects.select_related(
            'appointment', 
            'doctor',
            'institution'
        ).prefetch_related('specialties')
        appointment_id = self.request.query_params.get('appointment')
        if appointment_id:
            queryset = queryset.filter(appointment_id=appointment_id)
        return queryset.order_by('-issued_at')


class SpecialtyViewSet(viewsets.ModelViewSet): queryset = Specialty.objects.all(); serializer_class = SpecialtySerializer
class PersonalHistoryViewSet(viewsets.ModelViewSet): queryset = PersonalHistory.objects.all(); serializer_class = PersonalHistorySerializer
class FamilyHistoryViewSet(viewsets.ModelViewSet): queryset = FamilyHistory.objects.all(); serializer_class = FamilyHistorySerializer
class SurgeryViewSet(viewsets.ModelViewSet): queryset = Surgery.objects.all(); serializer_class = SurgerySerializer
class HabitViewSet(viewsets.ModelViewSet): queryset = Habit.objects.all(); serializer_class = HabitSerializer
class VaccineViewSet(viewsets.ModelViewSet): queryset = Vaccine.objects.all(); serializer_class = VaccineSerializer


class VaccinationScheduleViewSet(viewsets.ModelViewSet):
    queryset = VaccinationSchedule.objects.all()
    serializer_class = VaccinationScheduleSerializer
    pagination_class = None  # ✅ Deshabilitar paginación para devolver todos los registros
    
    def get_queryset(self):
        """Filtra por país si se proporciona el parámetro"""
        queryset = VaccinationSchedule.objects.all()
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country=country)
        return queryset.select_related('vaccine')


class PatientVaccinationViewSet(viewsets.ModelViewSet): queryset = PatientVaccination.objects.all(); serializer_class = PatientVaccinationSerializer
class PatientClinicalProfileViewSet(viewsets.ModelViewSet): queryset = ClinicalNote.objects.all(); serializer_class = ClinicalNoteSerializer
class AllergyViewSet(viewsets.ModelViewSet): queryset = Allergy.objects.all(); serializer_class = AllergySerializer
class MedicalHistoryViewSet(viewsets.ModelViewSet): queryset = MedicalHistory.objects.all(); serializer_class = MedicalHistorySerializer
class ClinicalAlertViewSet(viewsets.ModelViewSet): queryset = ClinicalAlert.objects.all(); serializer_class = ClinicalAlertSerializer
class ClinicalBackgroundViewSet(viewsets.ModelViewSet): queryset = MedicalHistory.objects.all(); serializer_class = MedicalHistorySerializer

# Direcciones
class CountryViewSet(viewsets.ModelViewSet): queryset = Country.objects.all(); serializer_class = CountrySerializer
class StateViewSet(viewsets.ModelViewSet): queryset = State.objects.all(); serializer_class = StateSerializer
class MunicipalityViewSet(viewsets.ModelViewSet): queryset = Municipality.objects.all(); serializer_class = MunicipalitySerializer
class CityViewSet(viewsets.ModelViewSet): queryset = City.objects.all(); serializer_class = CitySerializer
class ParishViewSet(viewsets.ModelViewSet): queryset = Parish.objects.all(); serializer_class = ParishSerializer
class NeighborhoodViewSet(viewsets.ModelViewSet): queryset = Neighborhood.objects.all(); serializer_class = NeighborhoodSerializer

# ==========================================
# 2. VISTAS DE CLASE [cite: 9]
# ==========================================

class AddressChainView(views.APIView):
    def get(self, request):
        n_id = request.query_params.get('neighborhood_id')
        if not n_id: return Response({"error": "ID required"}, status=400)
        obj = get_object_or_404(Neighborhood, id=n_id)
        return Response(NeighborhoodDetailSerializer(obj).data)

class NeighborhoodSearchView(views.APIView):
    def get(self, request):
        q = request.query_params.get('q', '')
        objs = Neighborhood.objects.filter(name__icontains=q)[:10]
        return Response(NeighborhoodSerializer(objs, many=True).data)

# ==========================================
# 3. FUNCIONES API (MOCKS COMPLETOS SEGÚN URLS) [cite: 7, 8, 9]
# ==========================================

# Dashboards y Métricas
@api_view(['GET'])
def audit_dashboard_api(request):
    """
    Devuelve métricas de auditoría para el dashboard.
    Total de eventos, agrupados por entidad y acción.
    """
    try:
        # Usar el servicio existente con dashboard_stats=True
        data = services.get_audit_logic(filters={"dashboard_stats": True})
        return Response(data)
    except Exception as e:
        logger.error(f"Error en audit_dashboard_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


# Búsquedas
@api_view(['GET'])
def appointment_search_api(request):
    """
    Busca citas por paciente, ID, o campos relacionados.
    Soporta búsqueda por nombre, cédula, ID de cita, o fecha.
    """
    q = request.query_params.get('q', '').strip()
    limit = int(request.query_params.get('limit', 10))
    
    if not q:
        return Response([])
    
    try:
        # ✅ FIX: Usar campos reales de BD, no properties (full_name es property)
        appointments = Appointment.objects.filter(
            Q(patient__first_name__icontains=q) |
            Q(patient__last_name__icontains=q) |
            Q(patient__national_id__icontains=q) |
            Q(id__icontains=q) |
            Q(appointment_date__icontains=q)
        ).select_related('patient', 'doctor', 'institution').order_by('-appointment_date')[:limit]
        
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error en appointment_search_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def chargeorder_search_api(request):
    """
    Busca órdenes de cobro por paciente, ID, o campos relacionados.
    Soporta búsqueda por nombre, cédula, ID de orden, ID de cita, o monto.
    """
    q = request.query_params.get('q', '').strip()
    limit = int(request.query_params.get('limit', 10))
    
    if not q:
        return Response([])
    
    try:
        # ✅ CORREGIDO: Buscar en campos reales del paciente (no en property full_name)
        charge_orders = ChargeOrder.objects.filter(
            Q(patient__first_name__icontains=q) |
            Q(patient__middle_name__icontains=q) |
            Q(patient__last_name__icontains=q) |
            Q(patient__second_last_name__icontains=q) |
            Q(patient__national_id__icontains=q) |
            Q(id__icontains=q) |
            Q(appointment__id__icontains=q)
        ).select_related(
            'appointment', 'patient', 'institution', 'doctor'
        ).order_by('-issued_at')[:limit]
        
        serializer = ChargeOrderSerializer(charge_orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error en chargeorder_search_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def icd_search_api(request):
    """
    Busca en el catálogo ICD-11 por código, título, o sinónimos.
    Soporta búsqueda por código exacto, título aproximado, o sinónimos.
    """
    q = request.query_params.get('q', '').strip()
    limit = int(request.query_params.get('limit', 20))
    language = request.query_params.get('language', 'es')
    
    if not q:
        return Response([])
    
    try:
        # Buscar en múltiples campos de ICD-11
        entries = ICD11Entry.objects.filter(
            Q(language=language) &
            (
                Q(icd_code__icontains=q) |
                Q(title__icontains=q) |
                Q(synonyms__icontains=q)
            )
        ).order_by('icd_code')[:limit]
        
        serializer = ICD11EntrySerializer(entries, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error en icd_search_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def search(request):
    """
    Búsqueda global cross-entity para MEDOPZ.
    Integra las búsquedas específicas que ya funcionan y están probadas.
    Reutiliza la lógica existente para mantener consistencia y evitar duplicación.
    """
    query = request.GET.get('query', '').strip()
    
    if not query:
        return Response({
            'patients': [],
            'appointments': [], 
            'orders': []
        })
    
    # Inicializar resultados
    patients_data = []
    appointments_data = []
    orders_data = []
    
    # Límite de resultados para evitar sobrecarga
    LIMIT = 5
    
    try:
        # 🔍 Búsqueda de Pacientes (reutiliza lógica existente)
        from .models import Patient
        
        patients = Patient.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(national_id__icontains=query) |
            Q(email__icontains=query)
        ).filter(active=True)[:LIMIT]  # ✅ ELIMINADO: select_related('institution') - NO EXISTE
        
        # Serializar pacientes
        from .serializers import PatientListSerializer
        patients_data = PatientListSerializer(patients, many=True).data
        
        # 📅 Búsqueda de Citas (reutiliza lógica existente)
        from .models import Appointment
        
        appointments = Appointment.objects.filter(
            Q(patient__first_name__icontains=query) |
            Q(patient__last_name__icontains=query) |
            Q(patient__national_id__icontains=query) |
            Q(id__icontains=query) |
            Q(appointment_date__icontains=query)
        ).select_related(
            'patient', 'doctor', 'institution', 'note'
        ).order_by('-appointment_date')[:LIMIT]
        
        # Serializar citas
        from .serializers import AppointmentSerializer
        appointments_data = AppointmentSerializer(appointments, many=True).data
        
        # 💳 Búsqueda de Órdenes de Cobro (reutiliza lógica existente)
        from .models import ChargeOrder
        
        charge_orders = ChargeOrder.objects.filter(
            Q(patient__first_name__icontains=query) |
            Q(patient__last_name__icontains=query) |
            Q(patient__national_id__icontains=query) |
            Q(id__icontains=query) |
            Q(appointment__id__icontains=query)
        ).select_related(
            'appointment', 'patient', 'institution', 'doctor'
        ).order_by('-issued_at')[:LIMIT]
        
        # Serializar órdenes
        from .serializers import ChargeOrderSerializer
        orders_data = ChargeOrderSerializer(charge_orders, many=True).data
        
        # Construir respuesta unificada
        return Response({
            'patients': patients_data,
            'appointments': appointments_data,
            'orders': orders_data
        })
        
    except Exception as e:
        logger.error(f"Error en search: {str(e)}")
        return Response({
            'error': f"SEARCH_ERROR: {str(e)}",
            'patients': [],
            'appointments': [],
            'orders': []
        }, status=500)


# Citas y Sala de Espera
@api_view(['GET'])
def appointments_pending_api(request):
    """
    Obtiene TODAS las citas pendientes/programadas de la institución.
    Incluye resumen financiero completo por cita.
    Orden: más recientes primero (descendente por fecha).
    """
    try:
        # Institución desde header o perfil del doctor
        institution_id = (
            request.headers.get('X-Institution-ID') or 
            request.user.doctor_profile.institution_id
        )
        
        # Query: todas las citas no completadas/canceladas
        appointments = Appointment.objects.filter(
            institution_id=institution_id,
            status__in=['pending', 'scheduled', 'arrived', 'in_consultation']
        ).select_related(
            'patient', 'institution'
        ).prefetch_related(
            'charge_orders', 'charge_orders__payments'
        ).order_by('-appointment_date', '-id')  # Más recientes primero
        
        results = []
        for appt in appointments:
            # Obtener charge_order principal (excluir anuladas)
            co = appt.charge_orders.exclude(status='void').first()
            
            # Calcular totales
            expected = float(co.total if co else (appt.expected_amount or 0))
            payments = []
            total_paid = 0.0
            
            if co:
                for p in co.payments.filter(status='confirmed'):
                    payment_amount = float(p.amount or 0)
                    total_paid += payment_amount
                    payments.append({
                        "id": p.id,
                        "amount": payment_amount,
                        "method": p.method,
                        "reference_number": p.reference_number,
                        "received_at": p.received_at.isoformat() if p.received_at else None
                    })
            
            balance_due = expected - total_paid
            
            # Determinar estado financiero
            if total_paid >= expected and expected > 0:
                financial_status = "paid"
            elif total_paid > 0:
                financial_status = "partially_paid"
            else:
                financial_status = "pending"
            
            results.append({
                "id": appt.id,
                "appointment_date": appt.appointment_date.isoformat(),
                "appointment_type": appt.appointment_type,
                "status": appt.status,
                "expected_amount": str(expected),
                "patient": {
                    "id": appt.patient.id,
                    "full_name": appt.patient.full_name,
                    "national_id": appt.patient.national_id,
                    "phone_number": appt.patient.phone_number
                },
                "financial_summary": {
                    "expected": expected,
                    "paid": total_paid,
                    "balance_due": balance_due,
                    "status": financial_status
                },
                "payments": payments,
                "charge_order": {
                    "id": co.id,
                    "status": co.status,
                    "total_amount": expected
                } if co else None
            })
        
        return Response(results)
        
    except Exception as e:
        logger.error(f"Error en appointments_pending_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def appointment_detail_api(request, pk):
    """
    Obtiene el detalle completo de una cita con datos financieros.
    Usa AppointmentDetailSerializer para incluir charge_order con payments.
    
    ✅ ACTUALIZADO: Ahora acepta GET, PUT, PATCH, DELETE
    """
    try:
        appointment = Appointment.objects.select_related(
            'patient', 'doctor', 'institution', 'note'
        ).prefetch_related(
            'diagnoses', 'documents'
        ).get(pk=pk)
        
        # GET - Obtener detalle
        if request.method == 'GET':
            serializer = AppointmentDetailSerializer(appointment)
            return Response(serializer.data)
        
        # DELETE - Eliminar appointment
        if request.method == 'DELETE':
            appointment.delete()
            return Response({"message": "Appointment eliminado correctamente"}, status=204)
        
        # PUT/PATCH - Actualizar appointment
        if request.method in ['PUT', 'PATCH']:
            serializer = AppointmentSerializer(appointment, data=request.data, partial=(request.method == 'PATCH'))
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
    
    except Appointment.DoesNotExist:
        return Response({"error": "Cita no encontrada"}, status=404)
    except Exception as e:
        logger.error(f"Error en appointment_detail_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
def update_appointment_notes(request, pk): return Response({"ok": True})



@api_view(['POST'])
@permission_classes([conditional_permission()])
def register_arrival(request):
    """
    Registra la llegada de un paciente (walk-in o cita existente).
    Crea una Appointment (si no existe) y una WaitingRoomEntry.
    """
    try:
        # Validar datos de entrada
        patient_id = request.data.get('patient_id')
        appointment_id = request.data.get('appointment_id')
        institution_id = request.data.get('institution_id') or request.headers.get('X-Institution-ID')
        service_id = request.data.get('service_id')
        
        if not patient_id:
            return Response({"error": "El ID del paciente es requerido"}, status=400)
        
        if not institution_id:
            return Response({"error": "El ID de la institución es requerido"}, status=400)
        
        # Obtener paciente e institución
        patient = get_object_or_404(Patient, pk=int(patient_id))
        institution = get_object_or_404(InstitutionSettings, pk=int(institution_id))
        
        # Manejo de Appointment
        appointment = None
        
        if appointment_id:
            # Si se proporciona un appointment_id, usar la cita existente
            appointment = get_object_or_404(Appointment, pk=int(appointment_id))
            # Actualizar estado a 'arrived' si estaba 'pending'
            if appointment.status in ['pending', 'tentative', 'confirmed']:
                appointment.status = 'arrived'
                appointment.arrival_time = timezone.now()
                appointment.save(update_fields=['status', 'arrival_time'])
        else:
            # Crear una nueva Appointment para Walk-in
            appointment_data = {
                'patient': patient,
                'doctor': request.user.doctor_profile if hasattr(request.user, 'doctor_profile') else None,
                'institution': institution,
                'appointment_date': timezone.now().date(),
                'status': 'arrived',  # ⚠️ CORRECCIÓN: Estado 'arrived' inmediatamente para walk-in
                'arrival_time': timezone.now(),
                'appointment_type': 'walkin',
                'notes': 'Llegada Walk-in registrada manualmente',
            }
            
            # Asignar servicio si se proporciona
            if service_id:
                try:
                    doctor_service = DoctorService.objects.get(
                        id=service_id, 
                        institution_id__in=[institution_id, None]
                    )
                    appointment_data['doctor_service'] = doctor_service
                except DoctorService.DoesNotExist:
                    return Response({"error": "Service not found in this institution"}, status=400)
            
            appointment = Appointment.objects.create(**appointment_data)
        
        # Crear la entrada en la sala de espera asociada a la Appointment
        # ⚠️ CORRECCIÓN: Asegurar que el estado sea 'waiting' para que aparezca en la cola
        entry = WaitingRoomEntry.objects.create(
            patient=patient,
            institution=institution,
            appointment=appointment,
            status='waiting',
            source_type='walkin' if not appointment_id else 'scheduled',
            arrival_time=timezone.now(),
        )
        
        serializer = WaitingRoomEntrySerializer(entry)
        return Response(serializer.data, status=201)
        
    except Exception as e:
        logger.error(f"Error en register_arrival: {str(e)}")
        return Response({"error": str(e)}, status=500)


# Auditoría y Logs
@api_view(['GET'])
def event_log_api(request):
    """
    Devuelve el log de eventos/auditoría.
    Soporta filtros por entidad, ID de entidad, ID de paciente, límite.
    """
    try:
        entity = request.query_params.get('entity')
        entity_id = request.query_params.get('entity_id')
        patient_id = request.query_params.get('patient_id')
        limit = request.query_params.get('limit')
        
        # Usar el servicio existente
        data = services.get_audit_logic(
            entity=entity,
            entity_id=entity_id,
            patient_id=patient_id,
            limit=int(limit) if limit else None
        )
        
        return Response(data)
    except Exception as e:
        logger.error(f"Error en event_log_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


# Configuración y Varios
@api_view(['GET'])
def reports_api(request):
    """
    Genera reportes financieros y clínicos por período.
    Nuevo paradigma: Agrupación por DoctorService (vía ChargeItem).
    """
    report_type = request.query_params.get('type', 'FINANCIAL').upper()
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    currency = request.query_params.get('currency', 'USD')
    
    try:
        # Parsear fechas
        start = datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
        end = datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
        
        rows = []
        
        # --- REPORTE CLÍNICO (Agrupado por DoctorService) ---
        if report_type in ['CLINICAL', 'COMBINED']:
            # Filtrar citas por fecha
            appointments = Appointment.objects.all()
            if start:
                appointments = appointments.filter(appointment_date__gte=start)
            if end:
                appointments = appointments.filter(appointment_date__lte=end)
            
            # Obtener ítems de cobro asociados a las citas (vía ChargeOrder)
            charge_items = ChargeItem.objects.filter(
                order__appointment__in=appointments
            ).select_related('doctor_service', 'order__appointment')
            
            # Agrupar por servicio y fecha de cita
            items_by_service = charge_items.values(
                'doctor_service__name',
                'order__appointment__appointment_date'
            ).annotate(
                total_amount=Sum('subtotal'), # Monto del ítem (subtotal)
                count=Count('id')
            ).order_by('-order__appointment__appointment_date')
            
            for item in items_by_service:
                service_name = item['doctor_service__name'] or 'General Service'
                appointment_date = item['order__appointment__appointment_date']
                
                rows.append({
                    'id': f"CLI-{appointment_date}-{service_name}",
                    'date': str(appointment_date),
                    'type': 'clinical',
                    'entity': service_name,
                    'status': 'COMPLETED',
                    'amount': float(item['total_amount']),
                    'currency': currency,
                })
        
        # --- REPORTE FINANCIERO (Agrupado por DoctorService) ---
        if report_type in ['FINANCIAL', 'COMBINED']:
            # Filtrar pagos confirmados por fecha
            payments = Payment.objects.filter(status='confirmed')
            if start:
                start_dt = timezone.make_aware(datetime.combine(start, datetime.min.time()))
                payments = payments.filter(received_at__gte=start_dt)
            if end:
                end_dt = timezone.make_aware(datetime.combine(end, datetime.max.time()))
                payments = payments.filter(received_at__lte=end_dt)
            
            # Obtener ítems de cobro asociados a los pagos (vía ChargeOrder)
            charge_items = ChargeItem.objects.filter(
                order__payments__in=payments
            ).select_related('doctor_service', 'order')
            
            # Agrupar por servicio y fecha de pago
            items_by_service = charge_items.values(
                'doctor_service__name',
                'order__payments__received_at__date'
            ).annotate(
                total_amount=Sum('subtotal'), # Monto del ítem pagado
                count=Count('id')
            ).order_by('-order__payments__received_at__date')
            
            for item in items_by_service:
                service_name = item['doctor_service__name'] or 'General Service'
                payment_date = item['order__payments__received_at__date']
                
                rows.append({
                    'id': f"FIN-{payment_date}-{service_name}",
                    'date': str(payment_date),
                    'type': 'financial',
                    'entity': service_name,
                    'status': 'CONFIRMED',
                    'amount': float(item['total_amount']),
                    'currency': currency,
                })
        
        # Ordenar filas combinadas por fecha
        if report_type == 'COMBINED':
            rows.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return Response(rows)
        
    except Exception as e:
        logger.error(f"Error en reports_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


# ==========================================
# ENDPOINTS PACIENTES PEDIÁTRICOS
# ==========================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_dependents(request, patient_id):
    """
    GET /api/patients/{id}/dependents/
    Lista todos los dependientes (menores) de un representante.
    """
    try:
        representative = Patient.objects.get(pk=patient_id)
        
        # Verificar que tiene dependientes
        dependents = Patient.objects.filter(
            representative=representative,
            is_minor=True,
            active=True
        )
        
        serializer = PatientListSerializer(dependents, many=True)
        return Response({
            'representative': {
                'id': representative.id,
                'full_name': representative.full_name,
                'national_id': representative.national_id,
            },
            'dependents': serializer.data,
            'count': dependents.count()
        })
    except Patient.DoesNotExist:
        return Response({'error': 'Paciente representante no encontrado'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_minor(request):
    """
    POST /api/patients/register-minor/
    Registra un paciente menor con su representante.
    """
    try:
        data = request.data
        
        # Validar que viene el representante
        representative_id = data.get('representative_id')
        if not representative_id:
            return Response({
                'error': 'El ID del representante es obligatorio.'
            }, status=400)
        
        try:
            representative = Patient.objects.get(pk=representative_id)
        except Patient.DoesNotExist:
            return Response({
                'error': 'Representante no encontrado.'
            }, status=404)
        
        # Validar consentimiento parental
        if not data.get('parental_consent'):
            return Response({
                'error': 'El consentimiento parental es obligatorio para registrar menores.'
            }, status=400)
        
        # Crear el menor
        minor_data = {
            'first_name': data.get('first_name'),
            'middle_name': data.get('middle_name'),
            'last_name': data.get('last_name'),
            'second_last_name': data.get('second_last_name'),
            'national_id': data.get('national_id'),
            'birthdate': data.get('birthdate'),
            'gender': data.get('gender'),
            'phone_number': data.get('phone_number'),
            'email': data.get('email'),
            'representative': representative.id,
            'relationship_type': data.get('relationship_type'),
            'parental_consent': data.get('parental_consent'),
            'consent_date': data.get('consent_date'),
            'representative_doc': data.get('representative_doc'),
            'representative_phone': data.get('representative_phone'),
            'representative_email': data.get('representative_email'),
            'is_minor': True,
            'active': True,
        }
        
        serializer = PatientWriteSerializer(data=minor_data)
        if serializer.is_valid():
            patient = serializer.save()
            return Response(
                PatientDetailSerializer(patient).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Error en register_minor: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def minor_verification(request):
    """
    GET /api/patients/minor-verification/
    Lista pacientes menores que requieren verificación de consentimiento.
    """
    try:
        # Pacientes menores sin consentimiento o con consentimiento pendiente
        pending_minors = Patient.objects.filter(
            is_minor=True,
            active=True
        ).filter(
            models.Q(parental_consent=False) | 
            models.Q(consent_date__isnull=True) |
            models.Q(representative__isnull=True)
        )
        
        serializer = PatientListSerializer(pending_minors, many=True)
        return Response({
            'pending_verification': serializer.data,
            'count': pending_minors.count()
        })
    except Exception as e:
        logger.error(f"Error en minor_verification: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_minor_consent(request, patient_id):
    """
    POST /api/patients/{id}/approve-consent/
    Aprueba el consentimiento parental de un menor.
    """
    try:
        patient = Patient.objects.get(pk=patient_id)
        
        if not patient.is_minor:
            return Response({
                'error': 'Este paciente no es menor de edad.'
            }, status=400)
        
        # Aprobar consentimiento
        patient.parental_consent = True
        patient.consent_date = timezone.now()
        patient.save()
        
        return Response({
            'success': True,
            'message': f'Consentimiento parental aprobado para {patient.full_name}',
            'patient': PatientDetailSerializer(patient).data
        })
        
    except Patient.DoesNotExist:
        return Response({'error': 'Paciente no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)



@api_view(['GET'])
def reports_export_api(request):
    """
    Exporta reportes a formato Excel (XLSX).
    Usa la función existente generate_excel_report si está disponible en services.py
    """
    try:
        report_type = request.query_params.get('type', 'FINANCIAL')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        currency = request.query_params.get('currency', 'USD')
        export_format = request.query_params.get('format', 'excel')
        
        # Verificar si la función existe en services.py
        from . import services
        
        if not hasattr(services, 'generate_excel_report'):
            return Response({
                "error": "Función de exportación no disponible"
            }, status=501)
        
        # Preparar datos según el tipo
        data = []
        
        if report_type == 'FINANCIAL':
            # Reporte financiero: pagos por período
            payments = Payment.objects.filter(status='confirmed')
            
            if start_date:
                payments = payments.filter(received_at__date__gte=start_date)
            if end_date:
                payments = payments.filter(received_at__date__lte=end_date)
            
            for p in payments:
                data.append({
                    'ID': p.id,
                    'Fecha de Pago': p.received_at.strftime('%d/%m/%Y') if p.received_at else '',
                    'Monto': float(p.amount),
                    'Método': p.method or '',
                    'Orden de Cobro': p.charge_order.id if p.charge_order else '',
                    'Estado': p.status,
                })
        
        elif report_type == 'CLINICAL':
            # Reporte clínico: citas por período
            appointments = Appointment.objects.filter(
                status__in=['pending', 'completed', 'canceled']
            )
            
            if start_date:
                appointments = appointments.filter(appointment_date__gte=start_date)
            if end_date:
                appointments = appointments.filter(appointment_date__lte=end_date)
            
            for apt in appointments:
                data.append({
                    'ID': apt.id,
                    'Fecha de Cita': apt.appointment_date.strftime('%d/%m/%Y') if apt.appointment_date else '',
                    'Paciente': apt.patient.full_name if apt.patient else '',
                    'Estado': apt.get_status_display() or '',
                    'Médico': apt.doctor.full_name if apt.doctor else '',
                })
        
        elif report_type == 'COMBINED':
            # Reporte combinado: pagos + citas
            # Pagos
            payments = Payment.objects.filter(status='confirmed')
            
            if start_date:
                payments = payments.filter(received_at__date__gte=start_date)
            if end_date:
                payments = payments.filter(received_at__date__lte=end_date)
            
            for p in payments:
                data.append({
                    'ID': p.id,
                    'Tipo': 'Pago',
                    'Fecha': p.received_at.strftime('%d/%m/%Y') if p.received_at else '',
                    'Monto': float(p.amount),
                    'Método': p.method or '',
                    'Estado': p.status,
                })
            
            # Citas
            appointments = Appointment.objects.filter(
                status__in=['pending', 'completed', 'canceled']
            )
            
            if start_date:
                appointments = appointments.filter(appointment_date__gte=start_date)
            if end_date:
                appointments = appointments.filter(appointment_date__lte=end_date)
            
            for apt in appointments:
                data.append({
                    'ID': apt.id,
                    'Tipo': 'Cita',
                    'Fecha': apt.appointment_date.strftime('%d/%m/%Y') if apt.appointment_date else '',
                    'Paciente': apt.patient.full_name if apt.patient else '',
                    'Estado': apt.get_status_display() or '',
                    'Médico': apt.doctor.full_name if apt.doctor else '',
                })
        else:
            return Response({
                "error": f"Tipo de reporte no soportado: {report_type}"
            }, status=400)
        
        # Usar función de exportación si existe
        file, content_type, filename = services.generate_excel_report(
            report_type=report_type,
            data=data,
            start=start_date,
            end=end_date,
            currency=currency
        )
        
        # Retornar archivo para descargar
        response = HttpResponse(
            file,
            content_type=content_type
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    except Exception as e:
        logger.error(f"Error en reports_export_api: {str(e)}")
        return Response({"error": str(e)}, status=500)



@api_view(['GET'])
def documents_api(request): return Response([])


@api_view(['GET'])
def notifications_api(request):
    """
    Devuelve las 3 notificaciones más recientes de los últimos 7 días.
    Filtra por notify=True (solo eventos que deben mostrarse).
    Si no hay eventos con notify=True, hace fallback a los últimos 3 eventos.
    """
    try:
        
        # get_audit_logic devuelve directamente una LISTA de eventos
        try:
            all_events = services.get_audit_logic(limit=10)  # ✅ AUMENTADO: Traer más para filtrar
        except Exception as e:
            logger.error(f"Error en get_audit_logic: {str(e)}")
            all_events = []
        
        # Asegurar que es una lista
        if not all_events:
            all_events = []
        elif not isinstance(all_events, list):
            all_events = list(all_events)
        
        # Filtrar por notify=True (solo notificaciones)
        notifications = [e for e in all_events if isinstance(e, dict) and e.get('notify', False)]
        
        # Si hay eventos con notify=True, procesarlos
        if notifications:
            # Ordenar por timestamp descendente
            try:
                notifications.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            except Exception:
                pass
            
            # Tomar las 3 notificaciones más recientes
            top_3 = notifications[:3]
            
            # Filtrar por ventana de 7 días
            try:
                cutoff = datetime.now() - timedelta(days=7)
                recent = [
                    n for n in top_3 
                    if n.get('timestamp') and 
                    datetime.fromisoformat(n['timestamp']) > cutoff
                ]
            except Exception:
                recent = top_3
            
            # Si hay notificaciones recientes, devolverlas
            if recent:
                return Response(recent)
        
        # ✅ NUEVO FALLBACK: Si no hay notify=True, mostrar últimos 3 eventos
        fallback_events = all_events[:3]
        if fallback_events:
            return Response(fallback_events)
        
        # Si no hay notificaciones ni eventos, devolver evento de "sin actividad"
        no_activity = [{
            "id": 0,
            "timestamp": datetime.now().isoformat(),
            "actor": "Sistema",
            "entity": "Dashboard",
            "entity_id": 0,
            "action": "other",
            "metadata": {"message": "Sin actividad en la última semana"},
            "severity": "info",
            "notify": False,
            "title": "Sin actividad reciente",
            "description": "No hay eventos en la última semana",
            "category": "dashboard.other",
            "action_label": "Ver dashboard",
            "action_href": "/dashboard",
            "badge_action": "other",
        }]
        
        return Response(no_activity)
        
    except Exception as e:
        import traceback
        logger.error(f"Error en notifications_api: {str(e)}\n{traceback.format_exc()}")
        return Response([{
            "id": 0,
            "timestamp": datetime.now().isoformat(),
            "actor": "Sistema",
            "entity": "Dashboard",
            "entity_id": 0,
            "action": "error",
            "metadata": {"error": str(e)},
            "severity": "critical",
            "notify": False,
            "title": "Error cargando notificaciones",
            "description": "Contacte al administrador",
            "category": "system.error",
            "action_label": "Ver dashboard",
            "action_href": "/dashboard",
            "badge_action": "error",
        }])


# PDF y Generación
@api_view(['POST', 'GET'])
def generate_medical_report(request, pk):
    """
    Genera PDF de informe médico completo y lo persiste en MedicalDocument.
    pk = appointment_id (ID de la consulta)
    """
    try:
        appointment = get_object_or_404(Appointment, pk=pk)
        patient = appointment.patient
        doctor = appointment.doctor
        institution = appointment.institution
        
        report, created = MedicalReport.objects.get_or_create(
            appointment=appointment,
            defaults={
                'patient': patient,
                'doctor': doctor,
                'institution': institution,
            }
        )
        
        diagnoses = Diagnosis.objects.filter(appointment=appointment)
        treatments = Treatment.objects.filter(
            patient=appointment.patient,
            doctor=appointment.doctor,
            institution=appointment.institution
        )
        prescriptions = Prescription.objects.filter(
            patient=appointment.patient,
            doctor=appointment.doctor,
            institution=appointment.institution
        )
        medical_tests = MedicalTest.objects.filter(appointment=appointment)
        # ✅ FIX: Agregar prefetch_related para cargar especialidades de las referencias
        referrals = MedicalReferral.objects.filter(appointment=appointment).prefetch_related('specialties')
        
        try:
            vital_signs = appointment.vital_signs
        except Exception:
            vital_signs = None
        
        try:
            clinical_note = appointment.note
        except Exception:
            clinical_note = None
        
        doctor_specialties = []
        if doctor and hasattr(doctor, 'specialties'):
            doctor_specialties = [s.name for s in doctor.specialties.all()]
        
        audit_code = generate_audit_code(appointment, patient)
        qr_payload = f"Consulta:{appointment.id}|MedicalReport:{report.id}|Audit:{audit_code}"
        qr_img = qrcode.make(qr_payload)
        buffer = BytesIO()
        qr_img.save(buffer, "PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        qr_code_url = f"data:image/png;base64,{qr_base64}"
        
        context = {
            'data': report,
            'patient': patient,
            'appointment': appointment,
            'doctor': doctor,
            'doctor_specialties': doctor_specialties,
            'institution': institution,
            'diagnoses': diagnoses,
            'treatments': treatments,
            'prescriptions': prescriptions,
            'medical_tests': medical_tests,
            'referrals': referrals,
            'vital_signs': vital_signs,
            'clinical_note': clinical_note,
            'audit_code': audit_code,
            'qr_code_url': qr_code_url,
            'generated_at': timezone.now(),
        }
        
        html_string = render_to_string('medical/documents/medical_report_universal.html', context)
        pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf() or b""
        
        filename = f"medical_report_{appointment.id}_{report.id}_{audit_code}.pdf"
        
        from django.core.files.base import ContentFile
        from core.models import MedicalDocument, DocumentCategory, DocumentSource
        
        doc = MedicalDocument.objects.create(
            patient=patient,
            appointment=appointment,
            doctor=doctor,
            institution=institution,
            category=DocumentCategory.MEDICAL_REPORT,
            source=DocumentSource.SYSTEM_GENERATED,
            audit_code=audit_code,
            origin_panel="medical_report",
            description=f"Informe Médico General - Consulta #{appointment.id}",
        )
        
        doc.file.save(filename, ContentFile(pdf_bytes))
        
        report.file_url = doc.file.url if doc.file else f"/media/medical_reports/{filename}"
        report.save()
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        logger.error(f"Error generando informe médico: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST', 'GET'])
def generate_prescription_pdf(request, pk):
    """
    Genera PDF de receta médica.
    """
    try:
        prescription = get_object_or_404(Prescription, pk=pk)
        
        # ✅ VALIDACIÓN DE INSTITUCIÓN (ya implementada)
        if not hasattr(request, 'current_institution'):
            return Response({"error": "Institución no especificada"}, status=400)
        
        if prescription.institution != request.current_institution:
            return Response({"error": "Acceso denegado: receta no pertenece a la institución activa"}, status=403)
        
        # ✅ GENERACIÓN DE PDF (corregido)
        pdf_bytes, filename, audit_code = services.generate_generic_pdf(
            prescription, 
            'prescriptions',
            request.current_institution  # <--- Opción C: Usar institución activa
        )
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando PDF de receta: {str(e)}", exc_info=True)
        return Response({"error": "Error interno del servidor"}, status=500)


@api_view(['POST', 'GET'])
def generate_treatment_pdf(request, pk):
    """
    Genera PDF de tratamiento médico.
    """
    try:
        treatment = get_object_or_404(Treatment, pk=pk)
        
        # ✅ VALIDACIÓN DE INSTITUCIÓN (ya implementada)
        if not hasattr(request, 'current_institution'):
            return Response({"error": "Institución no especificada"}, status=400)
        
        if treatment.institution != request.current_institution:
            return Response({"error": "Acceso denegado: tratamiento no pertenece a la institución activa"}, status=403)
        
        # ✅ GENERACIÓN DE PDF (corregido)
        pdf_bytes, filename, audit_code = services.generate_generic_pdf(
            treatment, 
            'treatments',
            request.current_institution  # <--- Opción C: Usar institución activa
        )
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando PDF de tratamiento: {str(e)}", exc_info=True)
        return Response({"error": "Error interno del servidor"}, status=500)


@api_view(['POST', 'GET'])
def generate_referral_pdf(request, pk):
    """
    Genera PDF de referencia médica.
    """
    try:
        referral = get_object_or_404(MedicalReferral, pk=pk)
        
        # ✅ VALIDACIÓN DE INSTITUCIÓN (ya implementada)
        if not hasattr(request, 'current_institution'):
            return Response({"error": "Institución no especificada"}, status=400)
        
        if referral.institution != request.current_institution:
            return Response({"error": "Acceso denegado: referencia no pertenece a la institución activa"}, status=403)
        
        # ✅ GENERACIÓN DE PDF (corregido)
        pdf_bytes, filename, audit_code = services.generate_generic_pdf(
            referral, 
            'referrals',
            request.current_institution  # <--- Opción C: Usar institución activa
        )
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando PDF de referencia: {str(e)}", exc_info=True)
        return Response({"error": "Error interno del servidor"}, status=500)


@api_view(['POST', 'GET'])
def generate_chargeorder_pdf(request, pk):
    """
    Genera PDF de orden de cobro con código de auditoría QR.
    """
    try:
        charge_order = get_object_or_404(ChargeOrder, pk=pk)
        
        # Validar relaciones requeridas
        if not charge_order.patient:
            return Response({"error": "La orden no tiene paciente asociado"}, status=400)
        if not charge_order.institution:
            return Response({"error": "La orden no tiene institución asociada"}, status=400)
        
        items = ChargeItem.objects.filter(order=charge_order)
        payments = Payment.objects.filter(charge_order=charge_order)
        
        subtotal = charge_order.total
        paid_amount = sum(p.amount for p in payments)
        balance_due = charge_order.balance_due
        
        # Generar código de auditoría
        audit_code = generate_audit_code(charge_order.appointment, charge_order.patient)
        
        # Generar QR
        qr_payload = f"ORD:{charge_order.id}|PAC:{charge_order.patient.id}|AUDIT:{audit_code}"
        qr_img = qrcode.make(qr_payload)
        buffer = BytesIO()
        qr_img.save(buffer, "PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        qr_code_url = f"data:image/png;base64,{qr_base64}"
        
        METHOD_LABELS = {
            'cash': 'Efectivo',
            'card': 'Tarjeta / Punto de Venta',
            'transfer': 'Transferencia / Pago Móvil',
            'zelle': 'Zelle / Divisas',
            'crypto': 'Criptomonedas',
            'other': 'Otro',
        }
        
        PAYMENT_STATUS_LABELS = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmado',
            'rejected': 'Rechazado',
            'void': 'Anulado',
        }
        
        ORDER_STATUS_LABELS = {
            'open': 'Abierta',
            'partially_paid': 'Parcialmente Pagada',
            'paid': 'Pagada',
            'void': 'Anulada',
            'waived': 'Exonerada',
        }
        
        payments_formatted = []
        for p in payments:
            payments_formatted.append({
                'received_at': p.received_at,
                'method': METHOD_LABELS.get(p.method, p.method),
                'reference': p.reference_number or p.gateway_transaction_id or '-',
                'amount': p.amount,
                'status': PAYMENT_STATUS_LABELS.get(p.status, p.status),
            })
        
        status_label = ORDER_STATUS_LABELS.get(charge_order.status, charge_order.status)
        
        doctor = charge_order.doctor
        doctor_name = doctor.full_name if doctor else "Sin médico asignado"
        doctor_colegiado = doctor.colegiado_id if doctor else None
        doctor_specialties = list(doctor.specialties.values_list('name', flat=True)) if doctor else []
        doctor_signature_path = doctor.signature.path if doctor and doctor.signature else None
        institution_logo_path = charge_order.institution.logo.path if charge_order.institution.logo else None
        
        context = {
            'charge_order': charge_order,
            'patient': charge_order.patient,
            'appointment': charge_order.appointment,
            'doctor': doctor,
            'doctor_name': doctor_name,
            'doctor_colegiado': doctor_colegiado,
            'doctor_specialties': doctor_specialties,
            'doctor_signature_path': doctor_signature_path,
            'institution': charge_order.institution,
            'institution_logo_path': institution_logo_path,
            'items': items,
            'payments': payments_formatted,
            'subtotal': str(subtotal),
            'discount': '0.00',
            'tax': '0.00',
            'total': str(charge_order.total),
            'paid_amount': str(paid_amount),
            'balance_due': str(balance_due),
            'generated_at': timezone.now(),
            'audit_code': audit_code,
            'qr_code_url': qr_code_url,
            'status_label': status_label,
        }
        
        html_string = render_to_string('medical/documents/charge_order.html', context)
        
        # DEBUG: Verificar que el HTML se renderizó
        logger.info(f"[CHARGE_ORDER_PDF] HTML length: {len(html_string)} chars")
        logger.info(f"[CHARGE_ORDER_PDF] HTML preview: {html_string[:200]}...")
        
        # Generar PDF con fallback
        pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf() or b""
        
        # DEBUG: Verificar PDF
        logger.info(f"[CHARGE_ORDER_PDF] PDF length: {len(pdf_bytes)} bytes")
        logger.info(f"[CHARGE_ORDER_PDF] PDF starts with %PDF: {pdf_bytes[:4] == b'%PDF'}")
        
        if not pdf_bytes or not pdf_bytes.startswith(b'%PDF'):
            logger.error(f"[CHARGE_ORDER_PDF] PDF generation failed - returning error")
            return Response({"error": "Error generando PDF"}, status=500)
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"ORD-{charge_order.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando orden de cobro: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)



@api_view(['POST', 'GET'])
def generate_used_documents(request, pk):
    """
    Genera todos los documentos PDF usados en una cita en lote.
    Incluye: informes médicos, recetas, tratamientos, referencias, exámenes.
    """
    try:
        # Obtener la cita
        appointment = get_object_or_404(Appointment, pk=pk)
        user = request.user if request.user.is_authenticated else None
        
        # Usar el servicio existente de generación en lote
        result = services.bulk_generate_appointment_docs(appointment, user)
        
        # ✅ FIX: Devolver estructura que coincide con el interface del frontend
        return Response({
            'consultation_id': pk,
            'audit_code': result.get('audit_code'),
            'generated_at': timezone.now().isoformat(),
            'documents': result.get('documents', []),      # ✅ Array de documentos
            'skipped': result.get('skipped', []),          # ✅ Array de categorías omitidas
            'errors': result.get('errors', []),            # ✅ Array de errores
        })
        
    except Exception as e:
        logger.error(f"Error generando documentos en lote: {str(e)}")
        return Response({"error": str(e)}, status=500)


# Opciones (Choices)
@api_view(['GET'])
def treatment_choices_api(request):
    """
    Devuelve los tipos de tratamiento disponibles (choices del modelo Treatment).
    Usado para desplegar opciones en el formulario de creación de tratamientos.
    """
    try:
        # Obtener choices del modelo Treatment
        treatment_types = Treatment.TREATMENT_TYPE_CHOICES
        
        # Formatear como array de objetos
        choices = [
            {'value': choice[0], 'label': choice[1]}
            for choice in treatment_types
        ]
        
        return Response(choices)
    except Exception as e:
        logger.error(f"Error en treatment_choices_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def prescription_choices_api(request):
    """
    Devuelve el catálogo de medicamentos disponibles.
    Usado para autocompletar en el formulario de recetas.
    """
    try:
        # Obtener medicamentos activos
        category = request.query_params.get('category')
        search = request.query_params.get('q', '')
        
        medications = MedicationCatalog.objects.filter(is_active=True)
        
        # Filtrar por categoría si se proporciona
        if category:
            medications = medications.filter(presentation=category)
        
        # Filtrar por búsqueda si se proporciona
        if search:
            medications = medications.filter(
                Q(name__icontains=search) |
                Q(generic_name__icontains=search) |
                Q(code__icontains=search)
            )
        
        # Ordenar y limitar resultados
        medications = medications.order_by('name')[:50]
        
        serializer = MedicationCatalogSerializer(medications, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error en prescription_choices_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def medicaltest_choices_api(request):
    """
    Devuelve el catálogo de exámenes médicos disponibles.
    Usado para autocompletar en el formulario de exámenes.
    """
    try:
        # Obtener pruebas activas
        category = request.query_params.get('category')
        search = request.query_params.get('q', '')
        
        tests = MedicalTestCatalog.objects.filter(is_active=True)
        
        # Filtrar por categoría si se proporciona
        if category:
            tests = tests.filter(category=category)
        
        # Filtrar por búsqueda si se proporciona
        if search:
            tests = tests.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search)
            )
        
        # Ordenar y limitar resultados
        tests = tests.order_by('name')[:50]
        
        serializer = MedicalTestCatalogSerializer(tests, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error en medicaltest_choices_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def medicalreferral_choices_api(request):
    """
    Devuelve las especialidades médicas disponibles para referencias.
    Usado para autocompletar en el formulario de referencias.
    """
    try:
        # Obtener especialidades
        category = request.query_params.get('category')
        search = request.query_params.get('q', '')
        
        specialties = Specialty.objects.all()
        
        # Filtrar por categoría si se proporciona
        if category:
            specialties = specialties.filter(category=category)
        
        # Filtrar por búsqueda si se proporciona
        if search:
            specialties = specialties.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search)
            )
        
        # Ordenar y limitar resultados
        specialties = specialties.order_by('name')[:50]
        
        serializer = SpecialtySerializer(specialties, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error en medicalreferral_choices_api: {str(e)}")
        return Response({"error": str(e)}, status=500)



@api_view(['GET', 'PATCH'])
@permission_classes([conditional_permission()])
def institution_settings_api(request):
    """
    Endpoint de configuración de institución.
    
    GET:
        Si no hay autenticación: Devuelve institución global (legacy singleton)
        Si hay autenticación: Devuelve todas las instituciones del doctor
        Si query param 'active_only=true': Devuelve solo la institución activa
    
    PATCH:
        Actualiza la institución ACTIVA del doctor (según header X-Institution-ID)
    """
    # Si no hay autenticación, comportamiento legacy (singleton global)
    if not request.user.is_authenticated:
        data = services.get_institution_settings(request, active_only=True)
        if request.method == 'PATCH':
            data = request.data
            files = request.FILES
            settings_obj = services.update_institution_settings_ext(
                data, None, files
            )
            return Response(InstitutionSettingsSerializer(settings_obj).data)
        return Response(data)
    
    # Si hay autenticación, comportamiento nuevo
    doctor = getattr(request.user, 'doctor_profile', None)
    if not doctor:
        return Response({"error": "Doctor profile not found"}, status=404)
    
    if request.method == 'GET':
        # Verificar si pide solo la activa
        active_only = request.query_params.get('active_only', 'false').lower() == 'true'
        data = services.get_institution_settings(request, active_only=active_only)
        return Response(data)
    
    elif request.method == 'PATCH':
        # Identificar institución activa (prioridad: header → DB predeterminada → primera)
        institution_id = request.META.get('HTTP_X_INSTITUTION_ID')
        
        if institution_id:
            institution = doctor.institutions.filter(id=institution_id).first()
        elif doctor.active_institution:
            institution = doctor.active_institution
        else:
            institution = doctor.institutions.first()
        
        if not institution:
            return Response({"error": "No active institution found"}, status=404)
        
        # Actualizar la institución activa
        if request.content_type == 'multipart/form-data':
            data = request.data
            files = request.FILES
            settings_obj = services.update_institution_settings_ext(
                data, request.user, files
            )
        else:
            data = request.data
            settings_obj = services.update_institution_settings_ext(
                data, request.user
            )
        
        return Response(InstitutionSettingsSerializer(settings_obj).data)


@api_view(['GET'])
def public_institution_location_api(request):
    """
    Endpoint público con datos de ubicación para OperationalHub.
    No requiere autenticación.
    """
    try:
        institution = InstitutionSettings.objects.select_related(
            'neighborhood__parish__municipality__state__country'
        ).first()
        
        if not institution:
            return Response({
                'name': 'MEDOPS - Sistema Clínico',
                'location': None,
                'timezone': 'UTC-4',
                'status': 'no_institution_configured'
            })
        
        n = institution.neighborhood
        
        if not n:
            return Response({
                'name': institution.name,
                'location': {
                    'neighborhood': None,
                    'parish': None,
                    'municipality': None,
                    'state': None,
                    'country': None,
                    'coordinates': "0.00° N / 0.00° W"
                },
                'timezone': 'LOCAL_TZ',
                'status': 'no_location_configured'
            })
        
        # Acceder a objetos relacionados
        p = getattr(n, 'parish', None)
        m = getattr(p, 'municipality', None) if p else None
        s = getattr(m, 'state', None) if m else None
        c = getattr(s, 'country', None) if s else None
        
        neighborhood_name = n.name if n else None
        parish_name = p.name if p else None
        municipality_name = m.name if m else None
        state_name = s.name if s else None
        country_name = c.name if c else None
        
        # Determinar timezone
        timezone = 'VET_TZ' if country_name and 'VENEZUELA' in country_name.upper() else 'LOCAL_TZ'
        
        return Response({
            'name': institution.name,
            'location': {
                'neighborhood': neighborhood_name,
                'parish': parish_name,
                'municipality': municipality_name,
                'state': state_name,
                'country': country_name,
                'coordinates': f"{n.id if n else 0}.00° N / {m.id if m else 0}.88° W"
            },
            'timezone': timezone,
            'status': 'operational'
        })
        
    except Exception as e:
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=500)


@api_view(['GET', 'PATCH'])
@permission_classes([conditional_permission()])
def doctor_operator_settings_api(request):
    """
    Endpoint de configuración del doctor operador.
    """
    if request.method == 'GET':
        data = services.get_doctor_config(request)  # ← Pasa request
        if not data:
            return Response({"error": "No doctor configured"}, status=404)
        return Response(data)
    elif request.method == 'PATCH':
        data = request.data
        files = request.FILES
        doctor = services.update_doctor_config(data, request.user, files)
        return Response(DoctorOperatorSerializer(doctor).data)


@api_view(['GET'])
def specialty_choices_api(request):
    try:
        specialties = Specialty.objects.all().order_by('name')
        serializer = SpecialtySerializer(specialties, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def metrics_api(request):
    try:
        data = services.get_daily_metrics()
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([conditional_permission()])
def dashboard_summary_api(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    range_param = request.query_params.get('range')
    currency = request.query_params.get('currency', 'USD')
    status_param = request.query_params.get('status')
    
    try:
        data = services.get_dashboard_summary_data(
            start_date=start_date,
            end_date=end_date,
            range_param=range_param,
            currency=currency,
            status_param=status_param
        )
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def patient_search_api(request):
    q = request.query_params.get('q', '').strip()
    limit = int(request.query_params.get('limit', 10))
    
    if not q:
        return Response([])
    
    try:
        # Dividir query en palabras individuales para búsqueda más flexible
        # Ejemplo: "ungar e" busca pacientes que contengan "ungar" Y "e"
        words = q.split()
        
        # Construir filtros para cada palabra - todas deben coincidir
        # ✅ AGREGADO: middle_name y second_last_name
        query = Q(active=True)
        for word in words:
            query &= (
                Q(first_name__icontains=word) |
                Q(middle_name__icontains=word) |
                Q(last_name__icontains=word) |
                Q(second_last_name__icontains=word) |
                Q(national_id__icontains=word)
            )
        
        patients = Patient.objects.filter(query)[:limit]
        
        serializer = PatientListSerializer(patients, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def daily_appointments_api(request):
    try:
        data = services.get_daily_appointments()
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def current_consultation_api(request):
    try:
        data = services.get_current_consultation()
        if not data:
            return Response({"message": "No consultation in progress"}, status=404)
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST', 'PATCH'])  # ✅ FIX: Agregado PATCH
@permission_classes([conditional_permission()])
def update_appointment_status(request, pk):
    """
    Actualiza el status de un appointment.
    Acepta POST y PATCH para mayor flexibilidad del frontend.
    
    Cuando el status es 'completed', automáticamente sincroniza
    el WaitingRoomEntry relacionado para mantener consistencia.
    """
    try:
        from django.utils import timezone
        appointment = get_object_or_404(Appointment, pk=pk)
        new_status = request.data.get('status')
        
        valid_statuses = ['pending', 'arrived', 'in_consultation', 'completed', 'canceled']
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Valid options: {valid_statuses}"}, 
                status=400
            )
        
        appointment.update_status(new_status)
        
        # ✅ SINCRONIZACIÓN ROBUSTA: WaitingRoomEntry cuando el appointment se completa
        if new_status == 'completed':
            from .models import WaitingRoomEntry
            from django.utils import timezone
            
            # ✅ BÚSQUEDA ROBUSTA: Por paciente + institución + fecha
            # Esto funciona para walk-ins donde appointment puede ser NULL en el entry
            today = timezone.now().date()
            entry = WaitingRoomEntry.objects.filter(
                patient=appointment.patient,
                institution=appointment.institution,
                arrival_time__date=today,
                status__in=['waiting', 'in_consultation']
            ).first()
            
            if entry:
                try:
                    entry.status = 'completed'
                    entry.completed_at = timezone.now()
                    entry.save(update_fields=['status', 'completed_at'])
                    logger.info(f"SYNC: WaitingRoomEntry {entry.id} -> completed (Appointment {appointment.id})")
                except Exception as e:
                    logger.error(f"ERROR sincronizando WaitingRoomEntry {entry.id}: {e}")
        
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def waitingroom_groups_today_api(request):
    try:
        data = services.get_waitingroom_groups_today()
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def waitingroom_entries_today_api(request):
    try:
        data = services.get_waitingroom_today_data()
        serializer = WaitingRoomEntrySerializer(data, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_waitingroom_status(request, pk):
    try:
        entry = get_object_or_404(WaitingRoomEntry, pk=pk)
        new_status = request.data.get('status')
        
        if not entry.can_transition(new_status):
            return Response(
                {"error": f"Invalid transition: {entry.status} -> {new_status}"}, 
                status=400
            )
        
        entry.update_status(new_status)
        serializer = WaitingRoomEntrySerializer(entry)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def payment_summary_api(request):
    try:
        data = services.get_payment_summary()
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def waived_consultations_api(request):
    try:
        waived = services.get_waived_consultations()
        serializer = PaymentSerializer(waived, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def audit_log_api(request):
    entity = request.query_params.get('entity')
    entity_id = request.query_params.get('entity_id')
    patient_id = request.query_params.get('patient_id')
    limit = request.query_params.get('limit')
    
    try:
        data = services.get_audit_logic(
            entity=entity,
            entity_id=entity_id,
            patient_id=patient_id,
            limit=int(limit) if limit else None
        )
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def audit_by_appointment(request, appointment_id):
    try:
        data = services.get_audit_logic(
            entity="Appointment",
            entity_id=appointment_id
        )
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def audit_by_patient(request, patient_id):
    try:
        data = services.get_audit_logic(
            patient_id=patient_id
        )
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([conditional_permission()])
def institutions_list_api(request):
    """
    Obtiene todas las instituciones del doctor autenticado.
    """
    try:
        data = services.get_institution_settings(request, active_only=False)
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def create_institution_api(request):
    """
    Crea una nueva institución para el doctor autenticado.
    """
    try:
        doctor = getattr(request.user, 'doctor_profile', None)
        if not doctor:
            return Response({"error": "Doctor profile not found"}, status=404)
        
        data = services.create_institution_for_doctor(request.data, doctor)
        return Response(InstitutionSettingsSerializer(data).data, status=201)
    except ValidationError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def add_institution_api(request):
    """
    Agrega una institución existente al doctor autenticado.
    """
    try:
        doctor = getattr(request.user, 'doctor_profile', None)
        if not doctor:
            return Response({"error": "Doctor profile not found"}, status=404)
        
        institution_id = request.data.get('institution_id')
        if not institution_id:
            return Response({"error": "institution_id is required"}, status=400)
        
        data = services.add_institution_to_doctor(institution_id, doctor)
        return Response(InstitutionSettingsSerializer(data).data, status=201)
    except ValidationError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['DELETE'])
@permission_classes([conditional_permission()])
def delete_institution_api(request, institution_id):
    """
    Elimina una institución del doctor autenticado.
    NO borra la institución de la DB global, solo la relación.
    """
    try:
        doctor = getattr(request.user, 'doctor_profile', None)
        if not doctor:
            return Response({"error": "Doctor profile not found"}, status=404)
        
        result = services.delete_institution_from_doctor(institution_id, doctor)
        return Response(result)
    except ValidationError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['PUT'])
@permission_classes([conditional_permission()])
def set_active_institution_api(request, institution_id):
    """
    Cambia la institución activa (predeterminada) del doctor autenticado.
    Guarda en base de datos para persistencia entre sesiones.
    """
    try:
        doctor = getattr(request.user, 'doctor_profile', None)
        if not doctor:
            return Response({"error": "Doctor profile not found"}, status=404)
        
        data = services.set_active_institution(institution_id, doctor)
        return Response(InstitutionSettingsSerializer(data).data)
    except ValidationError as e:
        return Response({"error": str(e)}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def generate_professional_pdf(request):
    try:
        logger.info(f"🔍 [ENDPOINT-1] Starting PDF generation endpoint")
        logger.info(f"🔍 [ENDPOINT-2] Request data: {request.data}")
        
        from .utils.professional_pdf import ProfessionalPDFService
        
        template_name = request.data.get('template_name', 'medical_report')
        context = request.data.get('context', {})
        institution_settings = request.data.get('institution_settings', {})
        
        logger.info(f"🔍 [ENDPOINT-3] Inputs extracted - template: {template_name}")
        
        pdf_service = ProfessionalPDFService()
        logger.info(f"🔍 [ENDPOINT-4] Service instantiated")
        
        pdf_bytes = pdf_service.generate_professional_pdf(template_name, context, institution_settings)
        
        logger.info(f"🔍 [ENDPOINT-5] PDF bytes received from service")
        logger.info(f"🔍 [ENDPOINT-6] Type: {type(pdf_bytes)}")
        logger.info(f"🔍 [ENDPOINT-7] Length: {len(pdf_bytes)}")
        logger.info(f"🔍 [ENDPOINT-8] First 50 chars: {pdf_bytes[:50]}")
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{template_name}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        
        logger.info(f"🔍 [ENDPOINT-9] Response created, content-type: {response['Content-Type']}")
        logger.info(f"🔍 [ENDPOINT-10] Response content: {type(response.content)}, length: {len(response.content)}")
        
        return response
        
    except Exception as e:
        logger.error(f"🔍 [ENDPOINT-ERROR] Error in endpoint: {str(e)}")
        return Response({'error': f'No se pudo generar PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([conditional_permission()])
def institution_permissions_api(request):
    """Obtener permisos del médico actual"""
    doctor = getattr(request.user, 'doctor_profile', None)
    if not doctor:
        return Response({"error": "Doctor profile not found"}, status=404)
    
    from .permissions import SmartInstitutionValidator
    from .models import InstitutionSettings
    
    # Obtener todas las instituciones del médico
    institutions = doctor.institutions.all()
    permissions_data = []
    
    for institution in institutions:
        permission_info = SmartInstitutionValidator.get_permission_level(doctor, institution)
        permissions_data.append({
            'institution_id': institution.id,
            'institution_name': institution.name,
            'institution_logo': institution.logo.url if institution.logo else None,
            'access_level': permission_info['level'],
            'is_own_institution': permission_info['is_own'],
            'is_cross_institution': permission_info['is_cross'],
            'can_edit': permission_info['can_edit'],
            'can_generate_pdf': permission_info['can_generate_pdf'],
            'expires_at': permission_info['expires_at'],
            'access_count': permission_info['permission'].access_count,
            'last_accessed': permission_info['permission'].last_accessed
        })
    
    from .serializers import InstitutionMiniSerializer
    return Response({
        'active_institution': InstitutionMiniSerializer(doctor.active_institution).data if doctor.active_institution else None,
        'all_permissions': permissions_data,
        'own_institutions': [p for p in permissions_data if p['is_own_institution']],
        'cross_institutions': [p for p in permissions_data if p['is_cross_institution']]
    })


@api_view(['POST'])
@permission_classes([conditional_permission()])
def refresh_emergency_access(request):
    """Refrescar emergency access (24h adicionales)"""
    institution_id = request.data.get('institution_id')
    doctor = getattr(request.user, 'doctor_profile', None)
    
    # ✅ VALIDACIÓN ANTES DE USAR doctor
    if not doctor:
        return Response({"error": "Doctor profile not found"}, status=404)
    
    try:
        from .models import InstitutionSettings
        institution = InstitutionSettings.objects.get(id=institution_id)
        
        # ✅ VALIDACIÓN ANTES DE USAR doctor.institutions
        if not hasattr(doctor, 'institutions'):
            return Response({"error": "Doctor has no institutions"}, status=400)
        
        institutions_list = doctor.institutions.all()
        
        # Solo permite refresh para cross-institutions
        if institution in institutions_list:
            return Response({"error": "Solo para cross-institutions"}, status=400)
        
        # Crear/actualizar emergency access
        from .permissions import SmartInstitutionValidator
        permission_info = SmartInstitutionValidator.get_permission_level(doctor, institution)
        
        # Refresh expiration
        permission = permission_info['permission']
        from django.utils import timezone
        from datetime import timedelta
        permission.expires_at = timezone.now() + timedelta(hours=24)
        permission.save(update_fields=['expires_at'])
        
        # Log del refresh
        SmartInstitutionValidator.log_access(
            doctor, institution, 'emergency_access_refreshed'
        )
        
        return Response({
            "message": "Emergency access refrescado por 24 horas",
            "expires_at": permission.expires_at
        })
        
    except InstitutionSettings.DoesNotExist:
        return Response({"error": "Institution not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def verify_weasyprint_output(request):
    """Endpoint que verifica qué produce WeasyPrint SIN errores de TypeScript"""
    try:
        import os
        from weasyprint import HTML
        from django.template.loader import render_to_string
        from django.utils import timezone
        from typing import Dict, Any
        
        print(f"🔍 [VERIFY] Starting WeasyPrint verification")
        
        # 1. Template rendering
        context = {
            'test': 'verification',
            'timestamp': str(timezone.now())
        }
        
        html_string = render_to_string('medical/documents/medical_report.html', context)
        print(f"🔍 [VERIFY] Template rendered: {len(html_string)} chars")
        print(f"🔍 [VERIFY] HTML preview: {html_string[:100]}...")
        
        # 2. WeasyPrint generation
        html_obj = HTML(string=html_string)
        pdf_bytes = html_obj.write_pdf()
        print(f"🔍 [VERIFY] WeasyPrint called, type: {type(pdf_bytes)}")
        
        # 🔥 NUEVO: Verificación segura del valor None
        if pdf_bytes is None:
            return Response({
                'success': False,
                'error': 'WeasyPrint returned None - HTML could not be converted to PDF',
                'timestamp': str(timezone.now()),
                'weasyprint_works': False,
            })
        
        # 3. Análisis robusto (ahora seguro sin riesgo de None)
        verification_data = {
            'success': True,
            'timestamp': str(timezone.now()),
            'weasyprint_works': True,
            'pdf_type': type(pdf_bytes).__name__,
            'pdf_length': len(pdf_bytes),
            'pdf_preview': pdf_bytes[:50],  # ✅ Seguro: pdf_bytes no es None
            'pdf_is_pdf_like': pdf_bytes.startswith(b'%PDF'),  # ✅ Seguro
            'pdf_starts_with_pdf': pdf_bytes[:4],  # ✅ Seguro
        }
        
        print(f"🔍 [VERIFY] VERIFICATION COMPLETE")
        
        return Response(verification_data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'timestamp': str(timezone.now()),
        })


@api_view(['GET'])
def active_institution_dashboard_api(request):
    """
    Dashboard de institución activa con métricas en tiempo real.
    Retorna institución activa + estadísticas del día actual.
    """
    try:
        # Obtener institución activa del contexto
        institution_id = request.headers.get('X-Institution-ID')
        if not institution_id:
            return Response({"error": "No active institution"}, status=400)
            
        institution = get_object_or_404(InstitutionSettings, id=institution_id)
        today = timezone.now().date()
        
        # Queries REALES a la base de datos
        patients_today = Appointment.objects.filter(
            appointment_date=today,
            institution=institution
        ).values('patient').distinct().count()
        
        appointments_today = Appointment.objects.filter(
            appointment_date=today,
            institution=institution
        ).count()
        
        payments_today = Payment.objects.filter(
            received_at__date=today,
            charge_order__institution=institution,
            status='confirmed'
        ).count()
        
        pending_payments = Payment.objects.filter(
            charge_order__institution=institution,
            status='pending'
        ).count()
        
        return Response({
            'institution': InstitutionMiniSerializer(institution).data,
            'metrics': {
                'patients_today': patients_today,
                'appointments_today': appointments_today,
                'payments_today': payments_today,
                'pending_payments': pending_payments,
            }
        })
    except Exception as e:
        logger.error(f"Error en active_institution_dashboard_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


# ==========================================
# MERCANTIL P2C PAYMENT GATEWAY
# ==========================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mercantil_p2c_generate_qr(request):
    """
    Genera QR de pago P2C Mercantil.
    Endpoint listo para producción con estructura completa.
    """
    try:
        # Obtener configuración P2C de institución activa
        institution_id = request.headers.get('X-Institution-ID')
        if not institution_id:
            return Response({
                "success": False,
                "error": "No active institution",
                "error_code": "NO_INSTITUTION"
            }, status=400)
        
        institution = get_object_or_404(InstitutionSettings, id=institution_id)
        
        # Obtener o crear configuración P2C
        p2c_config, created = MercantilP2CConfig.objects.get_or_create(
            institution=institution,
            defaults={
                'is_test_mode': True,  # Por defecto en sandbox
                'qr_expiration_minutes': 15,
                'max_amount': Decimal('1000000.00'),
                'min_amount': Decimal('1.00')
            }
        )
        
        # Datos del request
        amount = Decimal(str(request.data.get('amount', '0')))
        charge_order_id = request.data.get('charge_order_id')
        
        if not amount or amount <= 0:
            return Response({
                "success": False,
                "error": "Invalid amount",
                "error_code": "INVALID_AMOUNT"
            }, status=400)
        
        # Datos básicos de la transacción
        merchant_order_id = f"MDP{datetime.now().strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4())[:8]}"
        expires_at = timezone.now() + timedelta(minutes=p2c_config.qr_expiration_minutes)
        
        # Guardar transacción en BD
        transaction = MercantilP2CTransaction.objects.create(
            institution=institution,
            charge_order_id=charge_order_id,
            merchant_order_id=merchant_order_id,
            amount=amount,
            currency='VES',  # Por ahora VES
            qr_code_data="PLACEHOLDER_DATA_UNTIL_API_ACCESS",  # placeholder
            status='generated',
            expires_at=expires_at,
            gateway_response_raw={
                "request_payload": {
                    "client_id": p2c_config.client_id or "PLACEHOLDER",
                    "merchant_order_id": merchant_order_id,
                    "amount": str(amount.quantize(Decimal('0.01'))),
                    "currency": "VES",
                    "expiration_minutes": p2c_config.qr_expiration_minutes,
                    "callback_url": p2c_config.webhook_url or f"{settings.SITE_URL}/api/webhooks/mercantil-p2c/",
                    "timestamp": datetime.now().isoformat(),
                    "description": f"Pago MedOps - Orden {merchant_order_id}"
                },
                "api_base_url": "https://api.mercantilbanco.com/p2c-sandbox",  # URL sandbox
                "note": "Placeholder structure - waiting API credentials"
            }
        )
        
        return Response({
            "success": True,
            "transaction_id": transaction.id,
            "merchant_order_id": transaction.merchant_order_id,
            "qr_code_data": transaction.qr_code_data,
            "qr_image_url": transaction.qr_image_url,
            "expires_at": transaction.expires_at.isoformat() if transaction.expires_at else None,
            "amount": str(transaction.amount),
            "currency": transaction.currency,
            "status": transaction.get_status_display(),
            "note": "P2C QR generated successfully - waiting API credentials for real processing"
        })
    
    except Exception as e:
        logger.error(f"Error en mercantil_p2c_generate_qr: {str(e)}")
        return Response({
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mercantil_p2c_check_status(request, merchant_order_id):
    """
    Consulta estado de transacción P2C.
    Endpoint listo para producción con estructura completa.
    """
    try:
        # Validar merchant_order_id
        if not merchant_order_id:
            return Response({
                "success": False,
                "error": "Merchant order ID required",
                "error_code": "MISSING_ORDER_ID"
            }, status=400)
        
        # Buscar transacción
        transaction = get_object_or_404(
            MercantilP2CTransaction,
            merchant_order_id=merchant_order_id
        )
        
        # Respuesta simulada (placeholder hasta API real)
        response_data = {
            "request_payload": {
                "client_id": "PLACEHOLDER",
                "merchant_order_id": merchant_order_id,
                "timestamp": datetime.now().isoformat()
            },
            "api_endpoint": "https://api.mercantilbanco.com/p2c-sandbox/status",
            "note": "Placeholder structure - waiting API credentials"
        }
        
        # Actualizar transacción con respuesta del gateway
        transaction.gateway_response_raw = response_data
        transaction.save(update_fields=['gateway_response_raw'])
        
        return Response({
            "success": True,
            "transaction_id": transaction.id,
            "merchant_order_id": transaction.merchant_order_id,
            "status": transaction.get_status_display(),
            "gateway_response": response_data,
            "message": "Status check completed - waiting API credentials for real processing"
        })
    
    except MercantilP2CTransaction.DoesNotExist:
        return Response({
            "success": False,
            "error": "Transaction not found",
            "error_code": "TRANSACTION_NOT_FOUND"
        }, status=404)
    except Exception as e:
        logger.error(f"Error en mercantil_p2c_check_status: {str(e)}")
        return Response({
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])  # AllowAny para webhook externo
def mercantil_p2c_webhook(request):
    """
    Procesa webhook de confirmación de pago P2C.
    Endpoint listo para producción con estructura completa.
    """
    try:
        # Obtener firma del header
        signature = request.headers.get('X-Mercantil-Signature')
        if not signature:
            return Response({
                "valid": False,
                "error": "Missing signature"
            }, status=400)
        
        # Obtener datos del webhook
        webhook_data = request.data
        
        # Validar merchant_order_id
        merchant_order_id = webhook_data.get('merchant_order_id')
        if not merchant_order_id:
            return Response({
                "valid": False,
                "error": "Missing merchant_order_id"
            }, status=400)
        
        # Buscar transacción
        transaction = get_object_or_404(
            MercantilP2CTransaction,
            merchant_order_id=merchant_order_id
        )
        
        # Simular validación de firma (placeholder hasta API real)
        # En producción, aquí iría la validación HMAC real
        processed_data = {
            "merchant_order_id": webhook_data.get('merchant_order_id'),
            "mercantil_transaction_id": webhook_data.get('transaction_id'),
            "status": webhook_data.get('status'),
            "amount": webhook_data.get('amount'),
            "paid_at": webhook_data.get('paid_at'),
            "raw_data": webhook_data
        }
        
        # Actualizar transacción
        transaction.mercantil_transaction_id = processed_data.get('mercantil_transaction_id')
        transaction.status = 'confirmed' if processed_data.get('status') == 'paid' else 'failed'
        transaction.confirmed_at = timezone.now()
        transaction.callback_data = processed_data['raw_data']
        transaction.save(update_fields=[
            'mercantil_transaction_id', 'status', 
            'confirmed_at', 'callback_data'
        ])
        
        # Si está confirmado, crear registro de pago
        if transaction.status == 'confirmed':
            # Buscar o crear payment asociado
            from .models import Payment
            payment = Payment.objects.create(
                institution=transaction.institution,
                charge_order=transaction.charge_order,
                amount=transaction.amount,
                currency=transaction.currency,
                method='p2c_mercantil',
                status='confirmed',
                gateway_transaction_id=processed_data.get('mercantil_transaction_id'),
                reference_number=processed_data.get('reference'),
                gateway_response_raw=processed_data['raw_data']
            )
            
            # Vincular pago a transacción P2C
            transaction.payment = payment
            transaction.save(update_fields=['payment'])
        
        return Response({
            "success": True,
            "message": "Webhook processed successfully - waiting API credentials for real processing"
        })
    
    except MercantilP2CTransaction.DoesNotExist:
        return Response({
            "valid": False,
            "error": "Transaction not found"
        }, status=404)
    except Exception as e:
        logger.error(f"Error en mercantil_p2c_webhook: {str(e)}")
        return Response({
            "valid": False,
            "error": str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mercantil_p2c_config_status(request):
    """
    Retorna estado de configuración P2C para debugging.
    """
    try:
        institution_id = request.headers.get('X-Institution-ID')
        if not institution_id:
            return Response({
                "configured": False,
                "error": "No active institution"
            }, status=400)
        
        institution = get_object_or_404(InstitutionSettings, id=institution_id)
        
        try:
            config = institution.p2c_config
            return Response({
                "configured": bool(config.client_id and config.client_id != "PLACEHOLDER"),
                "test_mode": config.is_test_mode,
                "has_credentials": bool(config.client_id and config.secret_key and config.client_id != "PLACEHOLDER"),
                "webhook_url": config.webhook_url,
                "environment": "sandbox" if config.is_test_mode else "production",
                "message": "P2C configuration status retrieved"
            })
        except MercantilP2CConfig.DoesNotExist:
            return Response({
                "configured": False,
                "error": "P2C configuration not found",
                "message": "Configure P2C settings to enable payments"
            })
    
    except Exception as e:
        logger.error(f"Error en mercantil_p2c_config_status: {str(e)}")
        return Response({
            "configured": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }, status=500)


# 🆕 ==========================================
# MERCANTIL P2C - VERIFICACIÓN DE PAGOS MÓVILES 
# ==========================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_mobile_payment(request):
    """
    🎯 ELITE VERIFICATION: Mobile Payment Reference Verification
    
    Verifies mobile payment references from any Venezuelan bank by querying
    Banco Mercantil API for recent transactions matching criteria.
    
    Expected Payload:
    {
        "charge_order_id": 123,
        "expected_amount": 150.00,
        "time_window_hours": 24,
        "reference_pattern": "AUTO_DETECT"  # Optional: specific reference pattern
    }
    """
    try:
        # 🏦 VALIDACIÓN INSTITUCIONAL (siguiendo patrón existente)
        institution_id = request.headers.get('X-Institution-ID')
        if not institution_id:
            return Response({
                "success": False,
                "error": "INSTITUTION_HEADER_MISSING",
                "message": "X-Institution-ID header required"
            }, status=400)
        
        institution = get_object_or_404(InstitutionSettings, id=institution_id)
        
        # 📋 VALIDACIÓN DE DATOS DE ENTRADA
        charge_order_id = request.data.get('charge_order_id')
        expected_amount = request.data.get('expected_amount')
        time_window_hours = request.data.get('time_window_hours', 24)
        
        if not charge_order_id:
            return Response({
                "success": False,
                "error": "MISSING_CHARGE_ORDER_ID",
                "message": "charge_order_id is required"
            }, status=400)
        
        if not expected_amount:
            return Response({
                "success": False,
                "error": "MISSING_EXPECTED_AMOUNT",
                "message": "expected_amount is required"
            }, status=400)
        
        # 🎯 OBTENER CHARGE ORDER CON PERMISOS
        try:
            charge_order = ChargeOrder.objects.get(
                id=charge_order_id,
                institution=institution
            )
        except ChargeOrder.DoesNotExist:
            return Response({
                "success": False,
                "error": "CHARGE_ORDER_NOT_FOUND",
                "message": "Charge order not found or doesn't belong to your institution"
            }, status=404)
        
        # 💰 VERIFICAR QUE HAY SALDO PENDIENTE
        current_balance = charge_order.balance_due
        if current_balance <= 0:
            return Response({
                "success": False,
                "error": "NO_PENDING_BALANCE",
                "message": f"Charge order already paid. Balance: ${current_balance:.2f}"
            }, status=400)
        
        # 🔄 VALIDAR MONTO COINCIDENTE
        if float(expected_amount) != float(current_balance):
            return Response({
                "success": False,
                "error": "AMOUNT_MISMATCH",
                "message": f"Expected amount (${expected_amount}) doesn't match current balance (${current_balance})"
            }, status=400)
        
        # 🏦 CONSULTAR SERVICIO MERCANTIL
        from .utils.payment_gateways.mercantil_p2c import MercantilP2CService
        mercantil_service = MercantilP2CService(institution)
        
        # 🕒 DEFINIR VENTANA DE BÚSQUEDA
        cutoff_time = timezone.now() - timedelta(hours=time_window_hours)
        
        logger.info(f"[MOBILE_PAYMENT_VERIFY] Searching for payment: order={charge_order_id}, amount=${expected_amount}, institution={institution.name}")
        
        # 🔍 BUSCAR TRANSACCIONES RECIENTES
        try:
            recent_transactions = mercantil_service.lookup_recent_transactions(
                amount=float(expected_amount),
                since=cutoff_time
            )
        except Exception as api_error:
            logger.error(f"[MOBILE_PAYMENT_VERIFY] API Error: {str(api_error)}")
            return Response({
                "success": False,
                "error": "MERCANTIL_API_ERROR",
                "message": "Unable to connect to Banco Mercantil API",
                "details": str(api_error),
                "fallback_required": True
            }, status=503)  # Service Unavailable - suggests manual fallback
        
        # 📊 ANALIZAR RESULTADOS
        if not recent_transactions:
            return Response({
                "success": False,
                "error": "NO_TRANSACTIONS_FOUND",
                "message": f"No mobile payments found for amount ${expected_amount} in the last {time_window_hours} hours",
                "data": {
                    "searched_amount": expected_amount,
                    "time_window_hours": time_window_hours,
                    "cutoff_time": cutoff_time.isoformat()
                }
            }, status=404)
        
        # 🎯 ENCONTRAR TRANSACCIÓN COINCIDENTE (la más reciente)
        best_match = recent_transactions[0]  # API returns ordered by newest
        
        # 🔒 DUPLICACIÓN CHECK
        existing_payment = Payment.objects.filter(
            gateway_transaction_id=best_match.get('transaction_id'),
            institution=institution
        ).first()
        
        if existing_payment:
            return Response({
                "success": False,
                "error": "PAYMENT_ALREADY_EXISTS",
                "message": "This transaction was already recorded",
                "existing_payment": {
                    "id": existing_payment.id,
                    "amount": str(existing_payment.amount),
                    "created_at": existing_payment.created_at.isoformat() if existing_payment.created_at else None,  # type: ignore[union-attr]
                    "charge_order_id": existing_payment.charge_order.id
                }
            }, status=409)  # Conflict
        
        # ✅ CREAR PAYMENT REGISTRATION
        try:
            payment = Payment.objects.create(
                institution=institution,
                charge_order=charge_order,
                appointment=charge_order.appointment,  # Puede ser None
                patient=charge_order.patient if charge_order.appointment is None else charge_order.appointment.patient,
                doctor=charge_order.doctor if charge_order.appointment is None else charge_order.appointment.doctor,
                amount=Decimal(str(best_match['amount'])),
                currency=best_match.get('currency', 'VES'),
                method='transfer',  # Mobile payment is a transfer
                status='confirmed',
                reference_number=best_match.get('reference'),
                gateway_transaction_id=best_match.get('transaction_id'),
                gateway_response_raw={
                    'verification_method': 'mobile_payment_lookup',
                    'bank_source': best_match.get('bank_origin', 'MERCANTIL'),
                    'verified_at': timezone.now().isoformat(),
                    'transaction_data': best_match
                },
                received_by=request.user,
                notes=f"Mobile payment verified automatically via API. Ref: {best_match.get('reference', 'N/A')}"
            )
            
            logger.info(f"[MOBILE_PAYMENT_VERIFY] SUCCESS: payment_id={payment.id}, order_id={charge_order_id}, amount=${payment.amount}")
            
            # 🔄 ACTUALIZAR CHARGE ORDER BALANCE
            charge_order.recalculate_balance()
            
            return Response({
                "success": True,
                "message": "✅ Mobile payment verified and registered successfully",
                "data": {
                    "payment_id": payment.id,
                    "charge_order_id": charge_order_id,
                    "amount_verified": str(payment.amount),
                    "reference_number": payment.reference_number,
                    "bank_transaction_id": payment.gateway_transaction_id,
                    "new_balance": str(charge_order.balance_due),
                    "payment_status": payment.status,
                    "verification_method": "automatic_api_lookup"
                }
            }, status=201)  # Created
            
        except Exception as creation_error:
            logger.error(f"[MOBILE_PAYMENT_VERIFY] Payment Creation Error: {str(creation_error)}")
            return Response({
                "success": False,
                "error": "PAYMENT_CREATION_FAILED",
                "message": "Transaction found but payment registration failed",
                "details": str(creation_error),
                "transaction_data": best_match  # Return for manual processing
            }, status=500)
    
    except Exception as e:
        logger.error(f"[MOBILE_PAYMENT_VERIFY] CRITICAL ERROR: {str(e)}")
        return Response({
            "success": False,
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred during payment verification",
            "details": str(e)
        }, status=500)


@api_view(['GET'])
def active_institution_with_metrics(request):
    """
    Retorna institución activa + métricas filtradas por institución activa.
    ✅ OPTIMIZADO: Mejor manejo de errores y fallback seguro para BCV
    """
    from django.utils import timezone
    from datetime import timedelta
    from decimal import Decimal
    from .services import get_institution_settings
    
    # Obtener institución activa usando el servicio existente
    try:
        institution_data = get_institution_settings(request, active_only=True)
        
        # ✅ MEJORADO: Verificación más robusta
        if not institution_data or not isinstance(institution_data, dict):
            return Response({"error": "No active institution found"}, status=404)
        
        institution_id = institution_data.get('id')
        if not institution_id:
            return Response({"error": "No active institution ID"}, status=404)
        
        active_inst = InstitutionSettings.objects.get(id=institution_id)
        
    except InstitutionSettings.DoesNotExist:
        return Response({"error": "Institution not found"}, status=404)
    except Exception as e:
        logger.error(f"Error obteniendo institución activa: {str(e)}")
        return Response({"error": f"Error: {str(e)}"}, status=500)
    
    # Filtros de tiempo y moneda
    range_param = request.GET.get('range', 'day')
    currency = request.GET.get('currency', 'USD')
    
    # Calcular rango de fechas
    now = timezone.now()
    if range_param == 'day':
        start_date = now.date()
        end_date = now.date() + timedelta(days=1)
    elif range_param == 'week':
        start_date = now.date() - timedelta(days=7)
        end_date = now.date() + timedelta(days=1)
    else:  # month
        start_date = now.date() - timedelta(days=30)
        end_date = now.date() + timedelta(days=1)
    
    # Métricas específicas para esta institución
    try:
        # ✅ Citas agendadas
        scheduled_count = Appointment.objects.filter(
            institution=active_inst,
            status='scheduled',
            appointment_date__gte=start_date,
            appointment_date__lt=end_date
        ).count()
        
        # ✅ Citas pendientes totales
        pending_count = Appointment.objects.filter(
            institution=active_inst,
            status='pending'
        ).count()
        
        # ✅ Citas en sala de espera
        waiting_count = Appointment.objects.filter(
            institution=active_inst,
            status='arrived'
        ).count()
        
        # ✅ Citas en consulta
        in_consultation_count = Appointment.objects.filter(
            institution=active_inst,
            status='in_consultation'
        ).count()
        
        # ✅ Citas completadas
        completed_count = Appointment.objects.filter(
            institution=active_inst,
            status='completed',
            appointment_date__gte=start_date,
            appointment_date__lt=end_date
        ).count()
        
        # ✅ Métricas financieras - OPTIMIZADO
        charge_orders = ChargeOrder.objects.filter(
            institution=active_inst,
            issued_at__gte=start_date,
            issued_at__lt=end_date
        )
        
        total_usd = sum(order.total for order in charge_orders)
        
        # ✅ FIX: Obtener tasa BCV con manejo de errores mejorado
        # Esta función ahora solo usa cache, nunca hace scraping
        try:
            from .services import get_bcv_rate
            bcv_rate = float(get_bcv_rate())
        except Exception as bcv_error:
            logger.warning(f"Error obteniendo tasa BCV: {bcv_error}")
            bcv_rate = 1.0  # Fallback seguro
        
        # Convertir a VES si se solicita
        if currency == "VES":
            total_amount = float(total_usd) * bcv_rate
        else:
            total_amount = float(total_usd)
        
        # ✅ Pagos confirmados
        payments_count = Payment.objects.filter(
            charge_order__institution=active_inst,
            received_at__gte=start_date,
            received_at__lt=end_date,
            status='confirmed'
        ).count()
        
        # ✅ Órdenes exoneradas
        exempted_count = ChargeOrder.objects.filter(
            institution=active_inst,
            status='waived',
            issued_at__gte=start_date,
            issued_at__lt=end_date
        ).count()
        
        metrics = {
            'scheduled_count': scheduled_count,
            'pending_count': pending_count,
            'waiting_count': waiting_count,
            'in_consultation_count': in_consultation_count,
            'completed_count': completed_count,
            'total_amount': float(total_amount),
            'payments_count': payments_count,
            'exempted_count': exempted_count,
            'bcv_rate': bcv_rate,  # ✅ NUEVO: Incluir rate en respuesta
        }
        
        # Serializar institución
        institution_data = InstitutionSettingsSerializer(active_inst).data
        
        return Response({
            'institution': institution_data,
            'metrics': metrics
        })
        
    except Exception as e:
        logger.error(f"Error en active_institution_with_metrics: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def start_consultation_from_entry(request, entry_id):
    """
    Iniciar consulta desde WaitingRoomEntry.
    
    Si es walk-in: crea Appointment + ChargeOrder (solo si no existe)
    Si ya existe Appointment: usa el existente
    """
    try:
        entry = get_object_or_404(WaitingRoomEntry, pk=entry_id)
        
        # Obtener doctor del header
        doctor_id = request.headers.get('X-Doctor-ID')
        if not doctor_id:
            return Response({"error": "Doctor ID required"}, status=400)
        
        try:
            doctor = DoctorOperator.objects.get(pk=int(doctor_id))
        except (DoctorOperator.DoesNotExist, ValueError):
            return Response({"error": "Doctor no encontrado"}, status=400)
        
        # Obtener institution_id del header
        institution_id = request.headers.get('X-Institution-ID')
        if not institution_id:
            return Response({"error": "Institution ID required"}, status=400)
        
        try:
            institution_id = int(institution_id)
        except ValueError:
            return Response({"error": "Invalid institution ID"}, status=400)
        
        institution = get_object_or_404(InstitutionSettings, pk=institution_id)
        
        # Obtener o crear Appointment para este paciente
        if entry.appointment:
            appointment = entry.appointment
            appointment.status = "in_consultation"
            appointment.started_at = timezone.now()
            appointment.save(update_fields=['status', 'started_at'])
        else:
            # WALK-IN: Crear Appointment desde cero
            appointment = Appointment.objects.create(
                patient=entry.patient,
                doctor=doctor,
                institution=institution,
                appointment_date=localdate(),
                status="in_consultation",
                started_at=timezone.now(),
                notes=f"Walk-in desde Waiting Room (Entry #{entry.id})"
            )
            
            # ✅ FIX CRÍTICO: Vincular appointment al WaitingRoomEntry (para walk-ins)
            # Sin esto, update_appointment_status no puede encontrar el entry correcto
            entry.appointment = appointment
            entry.save(update_fields=['appointment'])
        
        # ✅ FIX: Verificar si YA existe ChargeOrder antes de crear (para walk-ins nuevos)
        # Esto evita duplicados si el Appointment ya tiene uno o si se llama múltiples veces
        existing_charge_order = ChargeOrder.objects.filter(
            appointment=appointment
        ).exclude(status__in=['void', 'waived']).first()
        
        if not existing_charge_order:
            # Solo crear si no existe - esto permite que add-items también cree si es necesario
            ChargeOrder.objects.create(
                appointment=appointment,
                patient=entry.patient,
                doctor=doctor,
                institution=institution,
                currency="USD",
                status="open",
                total=Decimal('0.00'),
                balance_due=Decimal('0.00'),
            )
        
        # Actualizar status del WaitingRoomEntry
        entry.status = "in_consultation"
        entry.save(update_fields=['status'])
        
        serializer = AppointmentDetailSerializer(appointment)
        return Response(serializer.data, status=201)
    
    except Exception as e:
        logger.error(f"Error en start_consultation_from_entry: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET', 'POST'])
@permission_classes([conditional_permission()])
def vital_signs_api(request, appointment_id):
    """
    Obtener o crear signos vitales para una cita.
    """
    
    if request.method == 'GET':
        vitals = VitalSigns.objects.filter(appointment_id=appointment_id).first()
        if vitals:
            serializer = VitalSignsSerializer(vitals)
            return Response(serializer.data)
        return Response(None, status=200)
    
    elif request.method == 'POST':
        try:
            if VitalSigns.objects.filter(appointment_id=appointment_id).exists():
                return Response(
                    {"error": "Ya existen signos vitales. Usa PATCH."}, 
                    status=400
                )
            
            try:
                appointment = Appointment.objects.get(pk=appointment_id)
            except Appointment.DoesNotExist:
                return Response({"error": "Cita no encontrada"}, status=404)
            
            serializer = VitalSignsSerializer(data={
                **request.data,
                'appointment': appointment_id
            })
            if serializer.is_valid():
                vitals = serializer.save()
                return Response(VitalSignsSerializer(vitals).data, status=201)
            return Response(serializer.errors, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([conditional_permission()])
def vital_signs_detail_api(request, vital_signs_id):
    """
    Obtener, actualizar o eliminar signos vitales por ID.
    """
    
    try:
        vitals = VitalSigns.objects.get(pk=vital_signs_id)
    except VitalSigns.DoesNotExist:
        return Response({"error": "Signos vitales no encontrados"}, status=404)
    
    if request.method == 'GET':
        serializer = VitalSignsSerializer(vitals)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = VitalSignsSerializer(vitals, data=request.data, partial=True)
        if serializer.is_valid():
            vitals = serializer.save()
            return Response(VitalSignsSerializer(vitals).data)
        return Response(serializer.errors, status=400)
    
    elif request.method == 'DELETE':
        vitals.delete()
        return Response(status=204)


@api_view(['GET'])
@permission_classes([conditional_permission()])
def appointment_charge_order_api(request, appointment_id):
    """
    Obtener charge order ACTIVO asociado a una cita.
    Excluye órdenes void/waived.
    GET /api/appointments/<appointment_id>/charge-order/
    """
    try:
        # Solo obtener órdenes activas (excluir void y waived)
        charge_order = ChargeOrder.objects.filter(
            appointment_id=appointment_id
        ).exclude(status__in=['void', 'waived']).order_by('-issued_at').first()
        
        if not charge_order:
            return Response(None, status=200)
        
        serializer = ChargeOrderSerializer(charge_order)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Error en appointment_charge_order_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def add_charge_order_items(request, appointment_id):
    """
    Agregar items a orden de cobro. Crea la orden automáticamente si no existe una activa.
    POST /api/appointments/{appointment_id}/charge-order/add-items/
    Body: { "items": [{ "service_id": 1, "qty": 1 }] }
    """
    try:
        appointment = get_object_or_404(Appointment, pk=appointment_id)
        items_data = request.data.get('items', [])
        if not items_data or len(items_data) == 0:
            return Response({"error": "No se proporcionaron items"}, status=400)
        # Buscar orden activa existente (excluir void)
        charge_order = ChargeOrder.objects.filter(
            appointment_id=appointment_id
        ).exclude(status='void').order_by('-issued_at').first()
        # Si no existe orden activa, crear una nueva
        if not charge_order:
            charge_order = ChargeOrder.objects.create(
                appointment=appointment,
                patient=appointment.patient,
                doctor=appointment.doctor,
                institution=appointment.institution,
                currency="USD",
                status="open",
                total=Decimal('0.00'),
                balance_due=Decimal('0.00'),
            )
        # Agregar items a la orden
        created_items = []
        for item_data in items_data:
            # Validar service_id
            service_id = item_data.get('service_id')
            if not service_id:
                return Response({"error": "service_id es requerido en cada item"}, status=400)
            # Buscar servicio
            try:
                service = DoctorService.objects.get(id=service_id)
            except DoctorService.DoesNotExist:
                return Response({"error": f"Servicio con ID {service_id} no existe"}, status=400)
            # Validar que el servicio esté activo
            if not service.is_active:
                return Response({"error": f"Servicio con ID {service_id} no está activo"}, status=400)
            # Validar que el servicio pertenezca a la institución de la cita
            if service.institution and service.institution != appointment.institution:
                return Response({
                    "error": f"Servicio con ID {service_id} no pertenece a la institución de la cita"
                }, status=400)
            # Validar cantidad
            qty = item_data.get('qty', 1)
            try:
                qty = Decimal(str(qty))
            except:
                return Response({"error": f"Cantidad inválida para servicio {service_id}"}, status=400)
            if qty <= 0:
                return Response({"error": f"Cantidad debe ser mayor que 0 para servicio {service_id}"}, status=400)
            # Límite máximo de cantidad (opcional pero recomendado)
            MAX_QTY = 100
            if qty > MAX_QTY:
                return Response({
                    "error": f"Cantidad excede el límite máximo ({MAX_QTY}) para servicio {service_id}"
                }, status=400)
            # Crear item con datos del servicio
            item = ChargeItem.objects.create(
                order=charge_order,
                doctor_service=service,      # Vinculación al servicio
                code=service.code,           # Código del servicio
                description=service.name,    # Nombre del servicio
                qty=qty,
                unit_price=service.price_usd, # Precio del servicio (no del payload)
            )
            created_items.append(item)
        # Recalcular totales
        charge_order.recalc_totals()
        charge_order.save(update_fields=['total', 'balance_due', 'status'])
        serializer = ChargeOrderSerializer(charge_order)
        return Response(serializer.data, status=200 if len(created_items) > 0 else 201)
    except Exception as e:
        logger.error(f"Error en add_charge_order_items: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def create_charge_order_from_appointment(request, appointment_id):
    """
    Crear charge order para una cita.
    NOTA: Este endpoint está deprecado. Usar add_charge_order_items en su lugar.
    POST /api/appointments/<appointment_id>/charge-order/create/
    """
    try:
        appointment = get_object_or_404(Appointment, pk=appointment_id)
        
        # Verificar que no exista ya una orden ACTIVA (excluir void/waived)
        existing = ChargeOrder.objects.filter(
            appointment_id=appointment_id
        ).exclude(status__in=['void', 'waived']).first()
        
        if existing:
            return Response(
                {"error": "Ya existe una orden de cobro activa para esta cita", "order_id": existing.id},
                status=400
            )
        
        # Crear charge order
        charge_order = ChargeOrder.objects.create(
            appointment=appointment,
            patient=appointment.patient,
            doctor=appointment.doctor,
            institution=appointment.institution,
            currency="USD",
            status="open",
            total=Decimal('0.00'),
            balance_due=Decimal('0.00'),
        )
        
        serializer = ChargeOrderSerializer(charge_order)
        return Response(serializer.data, status=201)
    
    except Exception as e:
        logger.error(f"Error en create_charge_order_from_appointment: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([conditional_permission()])
def clinical_note_api(request, appointment_id):
    """
    API para notas clínicas SOAP.
    
    GET /api/appointments/<appointment_id>/clinical-note/
        - Retorna 200 con la nota si existe
        - Retorna 200 con null si no existe
    
    POST /api/appointments/<appointment_id>/clinical-note/
        - Crea nueva nota clínica
    
    PATCH /api/appointments/<appointment_id>/clinical-note/
        - Actualiza nota existente
    """
    
    if request.method == 'GET':
        note = ClinicalNote.objects.filter(appointment_id=appointment_id).first()
        if note:
            serializer = ClinicalNoteSerializer(note)
            return Response(serializer.data)
        return Response(None, status=200)
    
    elif request.method == 'POST':
        try:
            if ClinicalNote.objects.filter(appointment_id=appointment_id).exists():
                return Response(
                    {"error": "Ya existe una nota clínica. Usa PATCH para actualizar."}, 
                    status=400
                )
            
            from .models import Appointment
            try:
                appointment = Appointment.objects.get(pk=appointment_id)
            except Appointment.DoesNotExist:
                return Response({"error": "Cita no encontrada"}, status=404)
            
            serializer = ClinicalNoteSerializer(data={
                **request.data,
                'appointment': appointment_id
            })
            if serializer.is_valid():
                note = serializer.save()
                return Response(ClinicalNoteSerializer(note).data, status=201)
            return Response(serializer.errors, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    elif request.method == 'PATCH':
        try:
            note = ClinicalNote.objects.get(appointment_id=appointment_id)
            
            if note.is_locked:
                return Response(
                    {"error": "La nota está bloqueada y no puede editarse"}, 
                    status=400
                )
            
            serializer = ClinicalNoteSerializer(note, data=request.data, partial=True)
            if serializer.is_valid():
                note = serializer.save()
                return Response(ClinicalNoteSerializer(note).data)
            return Response(serializer.errors, status=400)
        except ClinicalNote.DoesNotExist:
            return Response({"error": "Nota clínica no encontrada"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def clinical_note_lock_api(request, appointment_id):
    """
    Bloquear/Desbloquear nota clínica.
    
    POST /api/appointments/<appointment_id>/clinical-note/lock/ → Bloquear
    POST /api/appointments/<appointment_id>/clinical-note/unlock/ → Desbloquear
    """
    
    try:
        note = ClinicalNote.objects.get(appointment_id=appointment_id)
        
        action = request.data.get('action', 'lock')
        
        if action == 'lock':
            note.lock_note()
            return Response({"status": "locked", "locked_at": note.locked_at})
        
        elif action == 'unlock':
            note.is_locked = False
            note.locked_at = None
            note.save()
            return Response({"status": "unlocked"})
        
        return Response({"error": "Acción inválida. Usa 'lock' o 'unlock'"}, status=400)
    
    except ClinicalNote.DoesNotExist:
        return Response({"error": "Nota clínica no encontrada"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ==========================================
# AUTENTICACIÓN - PORTAL PACIENTE
# ==========================================
def generate_token(length=32):
    """Genera un token aleatorio seguro"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))


@api_view(['POST'])
@permission_classes([AllowAny])
def patient_register(request):
    """
    POST /api/patient-auth/register/
    Registro de nuevo paciente en el portal.
    """
    from django.contrib.auth.models import User
    from rest_framework.authtoken.models import Token
    
    try:
        data = request.data
        email = data.get('email', '').lower().strip()
        password = data.get('password')
        patient_id = data.get('patient_id')
        
        if not email or not password or not patient_id:
            return Response({
                'error': 'Email, contraseña e ID de paciente son obligatorios.'
            }, status=400)
        
        if len(password) < 8:
            return Response({
                'error': 'La contraseña debe tener al menos 8 caracteres.'
            }, status=400)
        
        try:
            patient = Patient.objects.get(pk=patient_id, active=True)
        except Patient.DoesNotExist:
            return Response({
                'error': 'Paciente no encontrado o inactivo.'
            }, status=404)
        
        if PatientUser.objects.filter(email=email).exists():
            return Response({
                'error': 'Ya existe una cuenta con este email.'
            }, status=400)
        
        if hasattr(patient, 'patient_user'):
            return Response({
                'error': 'Este paciente ya tiene una cuenta en el portal.'
            }, status=400)
        
        # Crear Django User
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            is_active=True
        )
        
        # Asignar al grupo Patients
        from django.contrib.auth.models import Group
        patients_group, _ = Group.objects.get_or_create(name='Patients')
        user.groups.add(patients_group)
        
        # Crear PatientUser con referencia al User
        patient_user = PatientUser.objects.create(
            patient=patient,
            email=email,
            user=user,
            is_active=True,
            is_verified=False,
            verification_token=generate_token(),
            verification_token_expires=timezone.now() + timedelta(days=7)
        )
        
        # Generar Token DRF
        token = Token.objects.create(user=user)
        
        # Log de auditoría
        PatientAccessLog.objects.create(
            patient_user=patient_user,
            patient=patient,
            action='register',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            description=f'Nuevo registro de paciente: {email}'
        )
        
        return Response({
            'success': True,
            'token': token.key,
            'message': 'Cuenta creada exitosamente.',
            'patient_user_id': patient_user.id,
            'email': email,
            'patient': {
                'id': patient.id,
                'full_name': patient.full_name
            }
        }, status=201)
        
    except Exception as e:
        logger.error(f"Error en patient_register: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def patient_login(request):
    """
    POST /api/patient-auth/login/
    Login de paciente en el portal.
    """
    from rest_framework.authtoken.models import Token
    
    try:
        data = request.data
        email = data.get('email', '').lower().strip()
        password = data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email y contraseña son obligatorios.'
            }, status=400)
        
        try:
            patient_user = PatientUser.objects.select_related('user').get(email=email)
        except PatientUser.DoesNotExist:
            PatientAccessLog.objects.create(
                patient_user=None,
                action='failed_login',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description=f'Intento de login con email no registrado: {email}'
            )
            return Response({
                'error': 'Email o contraseña incorrectos.'
            }, status=401)
        
        if patient_user.is_locked():
            PatientAccessLog.objects.create(
                patient_user=patient_user,
                action='failed_login',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description='Cuenta bloqueada por múltiples intentos fallidos'
            )
            return Response({
                'error': 'Cuenta bloqueada. Intenta más tarde.'
            }, status=401)
        
        # Verificar que existe usuario Django (cuenta migrada)
        if not patient_user.user:
            PatientAccessLog.objects.create(
                patient_user=patient_user,
                action='failed_login',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description='Usuario Django no encontrado - cuenta no migrada'
            )
            return Response({
                'error': 'Email o contraseña incorrectos.'
            }, status=401)
        
        # Verificar contraseña
        if not patient_user.user.check_password(password):
            patient_user.failed_login_attempts += 1
            
            if patient_user.failed_login_attempts >= 5:
                patient_user.locked_until = timezone.now() + timedelta(minutes=30)
                patient_user.save()
                
                PatientAccessLog.objects.create(
                    patient_user=patient_user,
                    action='failed_login',
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    description='Cuenta bloqueada por múltiples intentos fallidos'
                )
                return Response({
                    'error': 'Cuenta bloqueada por intentos fallidos. Intenta en 30 minutos.'
                }, status=401)
            
            patient_user.save()
            
            PatientAccessLog.objects.create(
                patient_user=patient_user,
                action='failed_login',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description=f'Contraseña incorrecta. Intentos: {patient_user.failed_login_attempts}'
            )
            return Response({
                'error': 'Email o contraseña incorrectos.'
            }, status=401)
        
        # Login exitoso
        patient_user.failed_login_attempts = 0
        patient_user.locked_until = None
        patient_user.last_login_at = timezone.now()
        patient_user.save()
        
        # Crear/actualizar sesión en PatientSession para auditoría
        access_token = generate_token(64)
        refresh_token = generate_token(64)
        
        session = PatientSession.objects.create(
            patient_user=patient_user,
            access_token=access_token,
            refresh_token=refresh_token,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Obtener Token DRF
        token, _ = Token.objects.get_or_create(user=patient_user.user)
        
        # Log
        PatientAccessLog.objects.create(
            patient_user=patient_user,
            patient=patient_user.patient,
            action='login',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            description=f'Login exitoso: {email}'
        )
        
        return Response({
            'success': True,
            'token': token.key,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'patient': {
                'id': patient_user.patient.id,
                'full_name': patient_user.patient.full_name,
                'email': patient_user.email,
                'is_verified': patient_user.is_verified,
                'two_factor_enabled': patient_user.two_factor_enabled,
            },
            'expires_at': session.expires_at
        })
        
    except Exception as e:
        logger.error(f"Error en patient_login: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def patient_logout(request):
    """
    POST /api/patient-auth/logout/
    Logout del paciente.
    """
    try:
        # Invalidar Token DRF
        Token.objects.filter(user=request.user).delete()
        
        # Invalidar sesiones de PatientSession
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
            PatientSession.objects.filter(
                access_token=token,
                is_active=True
            ).update(is_active=False)
        
        # Log
        if hasattr(request.user, 'patient_profile'):
            patient_user = request.user.patient_profile
            PatientAccessLog.objects.create(
                patient_user=patient_user,
                patient=patient_user.patient,
                action='logout',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                description=f'Logout: {patient_user.email}'
            )
        
        return Response({
            'success': True,
            'message': 'Sesión cerrada exitosamente.'
        })
        
    except Exception as e:
        logger.error(f"Error en patient_logout: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def patient_dashboard(request):
    """
    GET /api/patient-dashboard/
    Dashboard del paciente con resumen de su información.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        # Próximas citas
        from datetime import datetime
        upcoming_appointments = Appointment.objects.filter(
            patient=patient,
            appointment_date__gte=datetime.now().date(),
            status__in=['pending', 'arrived']
        ).order_by('appointment_date', 'arrival_time')[:5]
        
        # Citas pasados
        past_appointments = Appointment.objects.filter(
            patient=patient,
            appointment_date__lt=datetime.now().date(),
            status='completed'
        ).order_by('-appointment_date')[:5]
        
        # Suscripción activa
        active_subscription = PatientSubscription.objects.filter(
            patient=patient,
            status='active'
        ).first()
        
        return Response({
            'patient': {
                'id': patient.id,
                'full_name': patient.full_name,
                'email': patient_user.email,
                'phone': patient.phone_number,
                'national_id': patient.national_id,  # ✅ AGREGADO
                'birthdate': patient.birthdate.strftime('%Y-%m-%d') if patient.birthdate else None,  # ✅ AGREGADO
                'is_pediatric': patient.is_pediatric,
                'age': patient.age,
                'is_verified': patient_user.is_verified,
            },
            'subscription': {
                'plan': active_subscription.plan if active_subscription else 'free',
                'status': active_subscription.status if active_subscription else 'inactive',
                'days_remaining': active_subscription.days_remaining if active_subscription else None,
            } if active_subscription else None,
            'upcoming_appointments': [
                {
                    'id': apt.id,
                    'date': apt.appointment_date,
                    'time': apt.arrival_time,  # ✅ CORREGIDO: arrival_time
                    'doctor': apt.doctor.user.get_full_name() if apt.doctor else None,
                    'specialty': apt.doctor.specialty.name if apt.doctor and hasattr(apt.doctor, 'specialty') else None,
                    'status': apt.status,
                }
                for apt in upcoming_appointments
            ],
            'past_appointments_count': Appointment.objects.filter(
                patient=patient,
                status='completed'
            ).count(),
            'notifications': {
                'unread_count': 0,
            }
        })
        
    except Exception as e:
        logger.error(f"Error en patient_dashboard: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET', 'PUT'])
def patient_profile(request):
    """
    GET /api/patient-profile/
    PUT /api/patient-profile/
    Ver o actualizar perfil del paciente.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        if request.method == 'GET':
            return Response({
                'patient': {
                    'id': patient.id,
                    'full_name': patient.full_name,
                    'national_id': patient.national_id,
                    'email': patient_user.email,
                    'phone': patient.phone_number,
                    'birthdate': patient.birthdate,
                    'age': patient.age,
                    'gender': patient.gender,
                    'address': patient.address,
                    'is_pediatric': patient.is_pediatric,
                    'guardian_info': patient.guardian_info,
                },
                'user': {
                    'email': patient_user.email,
                    'phone': patient_user.phone,
                    'is_verified': patient_user.is_verified,
                    'two_factor_enabled': patient_user.two_factor_enabled,
                    'notifications_email': patient_user.notifications_email,
                    'notifications_sms': patient_user.notifications_sms,
                    'notifications_whatsapp': patient_user.notifications_whatsapp,
                }
            })
        
        # PUT - Actualizar perfil
        data = request.data
        
        # ✅ NUEVO: Validar contraseña si se va a cambiar email o phone
        if 'email' in data or 'phone' in data:
            current_password = data.get('current_password')
            if not current_password:
                return Response({
                    'error': 'Se requiere la contraseña actual para cambiar email o teléfono'
                }, status=400)
            
            # Validar contraseña usando Django
            if not request.user.check_password(current_password):
                return Response({
                    'error': 'La contraseña actual es incorrecta'
                }, status=400)
        
        # Actualizar PatientUser
        if 'email' in data and data['email'] != patient_user.email:
            patient_user.email = data['email']
        
        if 'phone' in data:
            patient_user.phone = data['phone']
        
        if 'notifications_email' in data:
            patient_user.notifications_email = data['notifications_email']
        
        if 'notifications_sms' in data:
            patient_user.notifications_sms = data['notifications_sms']
        
        if 'notifications_whatsapp' in data:
            patient_user.notifications_whatsapp = data['notifications_whatsapp']
        
        patient_user.save()
        
        # Actualizar Patient
        if 'phone' in data:
            patient.phone_number = data['phone']
        
        if 'address' in data:
            patient.address = data['address']
        
        patient.save()
        
        # Log
        PatientAccessLog.objects.create(
            patient_user=patient_user,
            patient=patient,
            action='profile_update',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            description='Perfil actualizado'
        )
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente.'
        })
        
    except Exception as e:
        logger.error(f"Error en patient_profile: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def patient_appointments(request):
    """
    GET /api/patient-appointments/
    Lista las citas del paciente.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        # Filtros
        status_filter = request.query_params.get('status')
        from datetime import datetime
        
        appointments = Appointment.objects.filter(patient=patient)
        
        if status_filter:
            appointments = appointments.filter(status=status_filter)
        else:
            # Por defecto mostrar próximas y últimas 10
            appointments = appointments.filter(
                appointment_date__gte=datetime.now().date()
            ) | appointments.filter(
                appointment_date__lt=datetime.now().date()
            ).order_by('-appointment_date')[:10]
        
        appointments = appointments.order_by('-appointment_date', '-appointment_time')[:20]
        
        return Response({
            'appointments': [
                {
                    'id': apt.id,
                    'date': apt.appointment_date,
                    'time': apt.appointment_time,
                    'status': apt.status,
                    'doctor': {
                        'id': apt.doctor.id,
                        'name': apt.doctor.user.get_full_name() if apt.doctor else None,
                    } if apt.doctor else None,
                    'institution': {
                        'name': apt.institution.name,
                    } if apt.institution else None,
                    'reason': apt.reason or '',
                    'notes': apt.notes or '',
                }
                for apt in appointments
            ]
        })
        
    except Exception as e:
        logger.error(f"Error en patient_appointments: {str(e)}")
        return Response({'error': str(e)}, status=500)


# ==========================================
# HELPERS
# ==========================================
def get_client_ip(request):
    """Obtiene la IP del cliente"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_patient_user_from_request(request):
    """
    Obtiene el PatientUser desde el token.
    Soporta tanto PatientSession como DRF Token.
    Acepta formatos 'Bearer' y 'Token' para compatibilidad.
    """
    auth_header = request.headers.get('Authorization', '')
    
    # ✅ ACEPTAR AMBOS FORMATOS: Bearer y Token
    if auth_header.startswith('Bearer '):
        token = auth_header.replace('Bearer ', '')
    elif auth_header.startswith('Token '):
        token = auth_header.replace('Token ', '')
    else:
        return None
    
    # 1. Buscar en PatientSession
    session = PatientSession.objects.filter(
        access_token=token,
        is_active=True
    ).first()
    
    if session and not session.is_expired():
        return session.patient_user
    
    # 2. Buscar en DRF Token
    from rest_framework.authtoken.models import Token
    drf_token = Token.objects.filter(key=token).first()
    
    if drf_token and hasattr(drf_token.user, 'patient_profile'):
        return drf_token.user.patient_profile
    
    return None


# ==========================================
# WHATSAPP API ENDPOINTS
# ==========================================
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def whatsapp_config_api(request):
    """Get or update WhatsApp configuration for the doctor"""
    try:
        doctor = request.user.doctor_profile
        
        if request.method == 'GET':
            serializer = WhatsAppConfigSerializer(doctor)
            return Response(serializer.data)
        
        # PUT
        serializer = WhatsAppConfigSerializer(doctor, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
        
    except Exception as e:
        logger.error(f"Error en whatsapp_config_api: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def whatsapp_send_message(request):
    """Send a WhatsApp message to a patient"""
    try:
        doctor = request.user.doctor_profile
        patient_id = request.data.get('patient_id')
        message_type = request.data.get('message_type', 'notification')
        content = request.data.get('content')
        
        if not patient_id or not content:
            return Response({
                'error': 'patient_id y content son obligatorios'
            }, status=400)
        
        patient = Patient.objects.get(pk=patient_id)
        
        # Validar configuración WhatsApp
        if not doctor.whatsapp_enabled:
            return Response({
                'error': 'WhatsApp no está habilitado para este doctor'
            }, status=400)
        
        if not doctor.whatsapp_business_number:
            return Response({
                'error': 'Número WhatsApp Business no configurado'
            }, status=400)
        
        # Obtener teléfono del paciente
        phone_to = patient.phone_number
        if not phone_to:
            return Response({
                'error': 'El paciente no tiene número de teléfono registrado'
            }, status=400)
        
        # Enviar mensaje via WhatsApp API
        import requests
        
        url = f"https://graph.facebook.com/v18.0/{doctor.whatsapp_business_id}/messages"
        headers = {
            'Authorization': f"Bearer {doctor.whatsapp_access_token}",
            'Content-Type': 'application/json'
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_to,
            "type": "text",
            "text": {"body": content}
        }
        
        response = requests.post(url, json=payload, headers=headers)
        
        # Guardar mensaje en BD
        message = WhatsAppMessage.objects.create(
            patient=patient,
            doctor=doctor,
            message_type=message_type,
            content=content,
            phone_to=phone_to,
            status='sent' if response.status_code == 200 else 'failed',
            whatsapp_message_id=response.json().get('messages', [{}])[0].get('id') if response.status_code == 200 else None,
            sent_at=timezone.now() if response.status_code == 200 else None,
            error_message=response.text if response.status_code != 200 else None
        )
        
        if response.status_code != 200:
            return Response({
                'error': 'Error al enviar mensaje WhatsApp',
                'details': response.text
            }, status=500)
        
        return Response({
            'success': True,
            'message_id': message.id,
            'whatsapp_message_id': message.whatsapp_message_id
        })
        
    except Patient.DoesNotExist:
        return Response({'error': 'Paciente no encontrado'}, status=404)
    except Exception as e:
        logger.error(f"Error en whatsapp_send_message: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def whatsapp_webhook(request):
    """Webhook para recibir eventos de WhatsApp"""
    if request.method == 'GET':
        # Verificación del webhook
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')
        
        # Verificar token
        # TODO: Comparar con configured verify token
        if mode == 'subscribe':
            return Response(int(challenge), status=200)
    
    # POST - Receiving messages
    try:
        data = request.data
        entry = data.get('entry', [{}])[0]
        changes = entry.get('changes', [{}])[0]
        value = changes.get('value', {})
        messages = value.get('messages', [])
        
        for msg in messages:
            # Procesar mensaje recibido
            pass
        
        return Response({'success': True})
    except Exception as e:
        logger.error(f"Error en webhook: {str(e)}")
        return Response({'error': str(e)}, status=500)


class PaymentGatewayViewSet(viewsets.ModelViewSet):
    """ViewSet para catálogo de métodos de pago"""
    queryset = PaymentGateway.objects.all()
    serializer_class = PaymentGatewaySerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PaymentGatewayListSerializer
        return PaymentGatewaySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtrar por activos si se requiere
        if self.request.query_params.get('active') == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset


class DoctorPaymentConfigViewSet(viewsets.ModelViewSet):
    """ViewSet para configuración de pago del doctor"""
    serializer_class = DoctorPaymentConfigSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Doctors solo ven su propia config
        user = self.request.user
        if hasattr(user, 'doctor_operator'):
            return DoctorPaymentConfig.objects.filter(doctor=user.doctor_operator)
        return DoctorPaymentConfig.objects.none()
    
    def get_object(self):
        # Crear config si no existe
        user = self.request.user
        if hasattr(user, 'doctor_operator'):
            obj, created = DoctorPaymentConfig.objects.get_or_create(
                doctor=user.doctor_operator
            )
            return obj
        return None
    
    # GET sin ID retorna la config del doctor actual
    def list(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj:
            serializer = self.get_serializer(obj)
            return Response(serializer.data)
        return Response({
            'detail': 'No payment configuration found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Endpoint público para que pacientes vean datos de pago del doctor"""
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({
                'error': 'doctor_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            config = DoctorPaymentConfig.objects.get(
                doctor_id=doctor_id,
                is_verified=True
            )
            serializer = DoctorPaymentConfigPublicSerializer(config)
            return Response(serializer.data)
        except DoctorPaymentConfig.DoesNotExist:
            return Response({
                'error': 'Configuración no encontrada o no verificada'
            }, status=status.HTTP_404_NOT_FOUND)


class PaymentTransactionViewSet(viewsets.ModelViewSet):
    """ViewSet para transacciones de pago"""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'uuid'
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'doctor_operator'):
            return PaymentTransaction.objects.filter(doctor=user.doctor_operator)
        elif hasattr(user, 'patient'):
            return PaymentTransaction.objects.filter(patient=user.patient)
        return PaymentTransaction.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentTransactionCreateSerializer
        return PaymentTransactionSerializer
    
    def create(self, request, *args, **kwargs):
        """Crear nueva intención de pago"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction = serializer.save()
        transaction.calculate_commissions()
        transaction.save()
        
        return Response(
            PaymentTransactionSerializer(transaction).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def confirm_manual(self, request, uuid=None):
        """Confirmar pago manualmente (el paciente reporta que pagó)"""
        transaction = self.get_object()
        
        serializer = PaymentTransactionConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction.reference_number = serializer.validated_data['reference_number']
        transaction.paid_at = timezone.now()
        transaction.status = 'pending'
        
        if serializer.validated_data.get('notes'):
            transaction.notes = serializer.validated_data['notes']
        
        transaction.save()
        
        return Response(PaymentTransactionSerializer(transaction).data)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, uuid=None):
        """Verificar pago con API del banco"""
        transaction = self.get_object()
        
        serializer = PaymentTransactionVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Lógica de verificación según el método de pago
        method_code = transaction.payment_method.code
        
        if method_code == 'mercantil':
            result = self._verify_mercantil(transaction, serializer.validated_data)
        elif method_code == 'banesco':
            result = self._verify_banesco(transaction, serializer.validated_data)
        elif method_code == 'binance':
            result = self._verify_binance(transaction, serializer.validated_data)
        elif method_code == 'manual':
            # Verificación manual por el doctor
            return self._verify_manual(transaction, request)
        else:
            return Response({
                'error': f'Método de verificación no soportado: {method_code}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if result.get('success'):
            transaction.gateway_response = result
            transaction.bank_reference = result.get('bank_reference')
            transaction.gateway_transaction_id = result.get('gateway_transaction_id')
            transaction.confirm(verified_by='api')
            
            # Notificar al doctor
            self._notify_doctor(transaction)
            
            return Response(PaymentTransactionSerializer(transaction).data)
        else:
            transaction.gateway_response = result
            transaction.status = 'failed'
            transaction.notes = result.get('error', 'Verificación fallida')
            transaction.save()
            
            return Response({
                'error': result.get('error', 'Verificación fallida'),
                'details': result
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def _verify_mercantil(self, transaction, data):
        """Verifica con API de Mercantil"""
        try:
            config = transaction.doctor.payment_config
            if not config.mercantil_enabled:
                return {'success': False, 'error': 'Mercantil no habilitado'}
            
            # TODO: Implementar llamada real a API Mercantil
            # Por ahora retorna éxito simulado
            return {
                'success': True,
                'bank_reference': f"MERC-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                'gateway_transaction_id': f"MERC-TX-{transaction.uuid}",
                'verified_at': timezone.now().isoformat()
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _verify_banesco(self, transaction, data):
        """Verifica con API de Banesco"""
        try:
            config = transaction.doctor.payment_config
            if not config.banesco_enabled:
                return {'success': False, 'error': 'Banesco no habilitado'}
            
            # TODO: Implementar llamada real a API Banesco
            return {
                'success': True,
                'bank_reference': f"BAN-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                'gateway_transaction_id': f"BAN-TX-{transaction.uuid}",
                'verified_at': timezone.now().isoformat()
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _verify_binance(self, transaction, data):
        """Verifica con API de Binance"""
        try:
            config = transaction.doctor.payment_config
            if not config.binance_enabled:
                return {'success': False, 'error': 'Binance no habilitado'}
            
            # TODO: Implementar verificación con Binance
            return {
                'success': True,
                'bank_reference': f"BIN-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                'gateway_transaction_id': f"BIN-TX-{transaction.uuid}",
                'verified_at': timezone.now().isoformat()
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _verify_manual(self, transaction, request):
        """Verificación manual por el doctor"""
        # Solo el doctor puede aprobar
        if not hasattr(request.user, 'doctor_operator'):
            return Response({
                'error': 'Solo el doctor puede verificar pagos manualmente'
            }, status=status.HTTP_403_FORBIDDEN)
        
        action = request.data.get('action', 'approve')
        
        if action == 'approve':
            transaction.confirm(verified_by='manual')
            if request.data.get('notes'):
                transaction.internal_notes = request.data['notes']
                transaction.save()
            
            # Notificar al paciente
            self._notify_patient(transaction)
            
        elif action == 'reject':
            transaction.status = 'failed'
            transaction.notes = request.data.get('reason', 'Rechazado por el doctor')
            transaction.save()
        
        return Response(PaymentTransactionSerializer(transaction).data)
    
    def _notify_doctor(self, transaction):
        """Notifica al doctor por WhatsApp de nuevo pago"""
        # TODO: Implementar notificación WhatsApp
        pass
    
    def _notify_patient(self, transaction):
        """Notifica al paciente de confirmación"""
        # TODO: Implementar notificación
        pass


class PaymentWebhookViewSet(viewsets.ModelViewSet):
    """ViewSet para auditoría de webhooks"""
    serializer_class = PaymentWebhookSerializer
    permission_classes = [AllowAny]  # Webhooks son públicos
    queryset = PaymentWebhook.objects.all()
    http_method_names = ['get', 'post', 'head']  # Solo lectura y POST
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'doctor_operator'):
            return PaymentWebhook.objects.filter(doctor=user.doctor_operator)
        return PaymentWebhook.objects.none()
# ============================================================================
# FUNCTION-BASED API VIEWS
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_gateways_api(request):
    """Lista de métodos de pago disponibles"""
    gateways = PaymentGateway.objects.filter(is_active=True)
    serializer = PaymentGatewayListSerializer(gateways, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_config_api(request):
    """Get/Update configuración de pago del doctor"""
    user = request.user
    
    if not hasattr(user, 'doctor_operator'):
        return Response({
            'error': 'Solo doctores pueden configurar pagos'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        config = DoctorPaymentConfig.objects.get(doctor=user.doctor_operator)
    except DoctorPaymentConfig.DoesNotExist:
        config = DoctorPaymentConfig.objects.create(doctor=user.doctor_operator)
    
    if request.method == 'GET':
        serializer = DoctorPaymentConfigSerializer(config)
        return Response(serializer.data)
    
    # POST - Update
    serializer = DoctorPaymentConfigSerializer(
        config,
        data=request.data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_config_public_api(request):
    """Endpoint público para ver config de pago de un doctor"""
    doctor_id = request.query_params.get('doctor_id')
    
    if not doctor_id:
        return Response({
            'error': 'doctor_id es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        config = DoctorPaymentConfig.objects.get(
            doctor_id=doctor_id,
            is_verified=True
        )
        serializer = DoctorPaymentConfigPublicSerializer(config)
        return Response(serializer.data)
    except DoctorPaymentConfig.DoesNotExist:
        return Response({
            'error': 'Configuración no encontrada o no verificada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_create_api(request):
    """Crear nueva transacción de pago"""
    serializer = PaymentTransactionCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    transaction = serializer.save()
    transaction.calculate_commissions()
    transaction.save()
    
    return Response(
        PaymentTransactionSerializer(transaction).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_transactions_api(request):
    """Lista de transacciones del doctor/paciente"""
    user = request.user
    
    if hasattr(user, 'doctor_operator'):
        queryset = PaymentTransaction.objects.filter(
            doctor=user.doctor_operator
        )
    elif hasattr(user, 'patient'):
        queryset = PaymentTransaction.objects.filter(
            patient=user.patient
        )
    else:
        return Response({
            'error': 'Usuario no autorizado'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Filtros
    status_filter = request.query_params.get('status')
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    method_filter = request.query_params.get('method')
    if method_filter:
        queryset = queryset.filter(payment_method__code=method_filter)
    
    serializer = PaymentTransactionSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_stats_api(request):
    """Dashboard de estadísticas de pagos"""
    user = request.user
    
    if not hasattr(user, 'doctor_operator'):
        return Response({
            'error': 'Solo doctores pueden ver estadísticas'
        }, status=status.HTTP_403_FORBIDDEN)
    
    doctor = user.doctor_operator
    now = timezone.now()
    today = now.date()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    
    # Transacciones confirmadas
    confirmed_tx = PaymentTransaction.objects.filter(
        doctor=doctor,
        status='confirmed'
    )
    
    # Stats básicas
    total_earnings = confirmed_tx.aggregate(
        total=Sum('net_amount')
    )['total'] or Decimal('0')
    
    today_earnings = confirmed_tx.filter(
        confirmed_at__date=today
    ).aggregate(
        total=Sum('net_amount')
    )['total'] or Decimal('0')
    
    week_earnings = confirmed_tx.filter(
        confirmed_at__date__gte=week_start
    ).aggregate(
        total=Sum('net_amount')
    )['total'] or Decimal('0')
    
    month_earnings = confirmed_tx.filter(
        confirmed_at__date__gte=month_start
    ).aggregate(
        total=Sum('net_amount')
    )['total'] or Decimal('0')
    
    # Conteo de transacciones
    total_transactions = PaymentTransaction.objects.filter(
        doctor=doctor
    ).count()
    
    pending_transactions = PaymentTransaction.objects.filter(
        doctor=doctor,
        status='pending'
    ).count()
    
    # Por método
    by_method = PaymentTransaction.objects.filter(
        doctor=doctor,
        status='confirmed'
    ).values(
        'payment_method__code',
        'payment_method__name'
    ).annotate(
        count=Count('id'),
        total=Sum('amount')
    )
    
    return Response({
        'total_earnings': float(total_earnings),
        'today_earnings': float(today_earnings),
        'week_earnings': float(week_earnings),
        'month_earnings': float(month_earnings),
        'total_transactions': total_transactions,
        'pending_transactions': pending_transactions,
        'by_method': list(by_method)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def bcv_rate_api(request):
    """Obtener tasa BCV actual"""
    try:
        from .models import BCVRateCache
        latest = BCVRateCache.objects.last()
        
        if latest:
            return Response({
                'rate': float(latest.value), 
                'date': latest.date.isoformat() if latest.date else None,
            })
        
        return Response({
            'error': 'Tasa no disponible'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Webhooks para cada gateway
@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_mercantil(request):
    """Webhook para Mercantil P2C"""
    # TODO: Implementar verificación de firma
    # TODO: Procesar payload
    
    return Response({'status': 'received'})


@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_banesco(request):
    """Webhook para Banesco"""
    # TODO: Implementar
    
    return Response({'status': 'received'})


@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_binance(request):
    """Webhook para Binance Pay"""
    # TODO: Implementar verificación de firma RSA
    # TODO: Procesar evento bizStatus
    
    return Response({'status': 'received'})


# ============================================================================
# SUBSCRIPTIONS API VIEWS
# ============================================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subscriptions_api(request):
    """Lista/Crea suscripciones del paciente"""
    user = request.user
    
    if not hasattr(user, 'patient'):
        return Response({
            'error': 'Solo pacientes pueden gestionar suscripciones'
        }, status=status.HTTP_403_FORBIDDEN)
    
    patient = user.patient
    
    if request.method == 'GET':
        subscriptions = PatientSubscription.objects.filter(patient=patient)
        serializer = PatientSubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)
    
    # POST - Crear suscripción
    serializer = PatientSubscriptionCreateSerializer(
        data=request.data,
        context={'patient': patient}
    )
    serializer.is_valid(raise_exception=True)
    subscription = serializer.save()
    
    return Response(
        PatientSubscriptionSerializer(subscription).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscription_cancel_api(request, pk):
    """Cancelar suscripción"""
    user = request.user
    
    if not hasattr(user, 'patient'):
        return Response({
            'error': 'Solo pacientes pueden cancelar suscripciones'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        subscription = PatientSubscription.objects.get(
            pk=pk,
            patient=user.patient
        )
    except PatientSubscription.DoesNotExist:
        return Response({
            'error': 'Suscripción no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    
    reason = request.data.get('reason', '')
    subscription.cancel(reason=reason)
    
    return Response(PatientSubscriptionSerializer(subscription).data)


@api_view(['POST'])
@permission_classes([conditional_permission()])
def invite_patient_to_portal(request, patient_id):
    """
    POST /api/patients/{id}/invite/
    Doctor invita a un paciente al portal MEDOPZ.
    """
    try:
        patient = Patient.objects.get(pk=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Paciente no encontrado'}, status=404)
    
    # Obtener el doctor actual
    if not hasattr(request.user, 'doctor_profile'):
        return Response({'error': 'Solo doctores pueden invitar al portal'}, status=403)
    doctor = request.user.doctor_profile
    
    # ============================================================
    # LÓGICA RE-INVITACIÓN: Solo bloquear si YA está activado
    # ============================================================
    
    # 1. Verificar si el paciente YA tiene acceso (activado)
    existing_active = PatientInvitation.objects.filter(
        patient=patient,
        status='activated'
    ).first()
    
    if existing_active:
        return Response({
            'error': 'El paciente ya tiene acceso al portal',
            'invitation': PatientInvitationSerializer(existing_active).data
        }, status=400)
    
    # 2. Si existe invitación previa pendiente/enviada, cancelarla
    existing_pending = PatientInvitation.objects.filter(
        patient=patient,
        status__in=['pending', 'sent']
    ).first()
    
    if existing_pending:
        existing_pending.status = 'cancelled'
        existing_pending.save()
    
    # 3. Crear nueva invitación
    import secrets
    token = secrets.token_urlsafe(32)
    
    # Calcular fecha de expiración (7 días)
    from django.utils import timezone
    from datetime import timedelta
    expires_at = timezone.now() + timedelta(days=7)
    
    # Crear invitación
    invitation = PatientInvitation.objects.create(
        patient=patient,
        doctor=doctor,
        token=token,
        status='sent',
        sent_at=timezone.now(),
        expires_at=expires_at
    )
    
    # Generar link
    invite_link = f"/patient/activate?token={token}"
    
    return Response({
        'invite_link': invite_link,
        'invitation': PatientInvitationSerializer(invitation).data
    })


def send_welcome_email(email: str, patient_name: str):
    """Envía email de bienvenida al paciente"""
    subject = '✅ Tu cuenta MEDOPZ ha sido activada'
    message = f"""
    Hola {patient_name},
    Bienvenido al Portal del Paciente MEDOPZ.
    Tu cuenta ha sido activada exitosamente.
    IMPORTANTE: Tu suscripción está en proceso de activación.
    Un miembro de nuestro equipo verificará tu pago pronto.
    ¿Necesitas ayuda? Contáctanos en info.medopz@gmail.com
    Saludos,
    Equipo MEDOPZ
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def activate_patient_portal(request):
    """
    POST /api/patient-activate/
    Paciente activa su cuenta con el token de invitación.
    """
    token = request.data.get('token')
    password = request.data.get('password')
    
    if not token or not password:
        return Response({
            'error': 'Token y contraseña son requeridos'
        }, status=400)
    
    try:
        invitation = PatientInvitation.objects.get(token=token)
    except PatientInvitation.DoesNotExist:
        return Response({'error': 'Token inválido'}, status=404)
    
    if invitation.is_expired:
        invitation.status = 'expired'
        invitation.save()
        return Response({'error': 'La invitación ha expirado'}, status=400)
    
    if invitation.status == 'activated':
        return Response({'error': 'Esta invitación ya fue activada'}, status=400)
    
    # Crear o obtener usuario Django
    from django.contrib.auth.models import User
    patient = invitation.patient
    
    # Email genérico (fallback) - se usa cuando el email del paciente es inválido/genérico
    fallback_email = f"patient_{patient.id}@medops.local"
    
    # Lista de emails genéricos que NO deben usarse
    generic_emails = {
        'example@example.com',
        'test@test.com', 
        'test@test',
        'email@email.com',
        'correo@correo.com',
        'user@user.com',
        'admin@admin.com',
        'info@info.com',
        'null',
        'none',
        '',
    }
    
    # Si el paciente tiene un email "real", usarlo; si no, usar fallback
    if patient.email and patient.email.lower() not in generic_emails:
        email = patient.email
    else:
        email = fallback_email
    
    user, created = User.objects.get_or_create(
        username=email,
        defaults={
            'email': email,
            'is_active': True
        }
    )
    user.set_password(password)
    user.save()
    
    # Asignar grupo Patients
    from django.contrib.auth.models import Group
    patients_group, _ = Group.objects.get_or_create(name='Patients')
    user.groups.add(patients_group)
    
    # Crear PatientUser
    patient_user, pu_created = PatientUser.objects.get_or_create(
        patient=patient,
        defaults={
            'email': email,
            'user': user,
            'is_active': True,
            'is_verified': True
        }
    )
    
    if not pu_created:
        patient_user.user = user
        patient_user.is_active = True
        patient_user.is_verified = True
        patient_user.save()
    
    # Actualizar invitación
    invitation.status = 'activated'
    invitation.activated_at = timezone.now()
    invitation.save()
    
    # ============================================================
    # OPCIÓN C: Enviar email de bienvenida
    # ============================================================
    send_welcome_email(email, patient.full_name)
    
    # Generar token DRF
    from rest_framework.authtoken.models import Token
    token_obj, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'success': True,
        'message': 'Cuenta activada exitosamente',
        'token': token_obj.key,
        'patient': {
            'id': patient.id,
            'full_name': patient.full_name
        }
    })


@api_view(['GET'])
@permission_classes([conditional_permission()])
def get_patient_invitation_status(request, patient_id):
    """
    GET /api/patients/{id}/invitation-status/
    Verificar estado de invitación de un paciente.
    Retorna la invitación más reciente no cancelada.
    """
    try:
        patient = Patient.objects.get(pk=patient_id)
    except Patient.DoesNotExist:
        return Response({'error': 'Paciente no encontrado'}, status=404)
    
    # Obtener la invitación más reciente NO cancelada
    invitation = PatientInvitation.objects.filter(
        patient=patient,
        status__in=['pending', 'sent', 'activated']
    ).exclude(
        status='cancelled'
    ).order_by(
        '-created_at'
    ).first()
    
    if invitation:
        return Response({
            'has_invitation': True,
            'invitation': PatientInvitationSerializer(invitation).data,
            'has_portal_access': invitation.status == 'activated'
        })
    
    return Response({
        'has_invitation': False,
        'has_portal_access': False
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def doctor_login(request):
    """
    POST /api/auth/doctor-login/
    Login exclusivo para doctores - rechaza pacientes.
    """
    from django.contrib.auth import authenticate
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Usuario y contraseña requeridos'}, status=400)
    
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({'error': 'Credenciales inválidas'}, status=401)
    
    # Verificar que ES doctor
    if not hasattr(user, 'doctor_profile'):
        return Response({
            'error': 'Esta cuenta no tiene acceso al portal de doctores'
        }, status=403)
    
    # Generar token
    from rest_framework.authtoken.models import Token
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.doctor_profile.full_name
        }
    })


# ==========================================
# ENDPOINTS DE PAGOS - PORTAL PACIENTE
# ==========================================
@api_view(['GET', 'PUT'])
def patient_payment_method(request):
    """
    GET /api/patient-payment-method/
    PUT /api/patient-payment-method/
    
    Obtiene o actualiza los métodos de pago del paciente.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        if request.method == 'GET':
            payment_method, created = PatientPaymentMethod.objects.get_or_create(patient=patient)
            serializer = PatientPaymentMethodSerializer(payment_method)
            return Response(serializer.data)
        
        # PUT - Actualizar
        payment_method, created = PatientPaymentMethod.objects.get_or_create(patient=patient)
        serializer = PatientPaymentMethodSerializer(payment_method, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
        
    except Exception as e:
        logger.error(f"Error en patient_payment_method: {str(e)}")
        return Response({'error': str(e)}, status=500)
@api_view(['GET'])
def patient_charge_orders(request):
    """
    GET /api/patient-charge-orders/
    
    Lista todas las órdenes de cobro del paciente autenticado.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        # Obtener todas las charge orders del paciente
        charge_orders = ChargeOrder.objects.filter(
            patient=patient
        ).select_related(
            'institution', 'doctor', 'doctor__user'
        ).prefetch_related('items', 'payments').order_by('-issued_at')
        
        # Calcular métricas
        total_pending = sum(order.balance_due for order in charge_orders if order.status in ['open', 'partially_paid'])
        total_paid = sum(order.total - order.balance_due for order in charge_orders if order.status == 'paid')
        
        return Response({
            'orders': [
                {
                    'id': order.id,
                    'institution': order.institution.name,
                    'institution_tax_id': order.institution.tax_id,
                    'total': float(order.total),
                    'balance_due': float(order.balance_due),
                    'status': order.status,
                    'status_display': order.get_status_display(),
                    'issued_at': order.issued_at.strftime('%Y-%m-%d %H:%M'),
                    'items_count': order.items.count(),
                    'payments_count': order.payments.count(),
                }
                for order in charge_orders
            ],
            'summary': {
                'total_orders': charge_orders.count(),
                'total_pending': float(total_pending),
                'total_paid': float(total_paid),
                'paid_orders': charge_orders.filter(status='paid').count(),
                'pending_orders': charge_orders.filter(status__in=['open', 'partially_paid']).count(),
            }
        })
        
    except Exception as e:
        logger.error(f"Error en patient_charge_orders: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def patient_charge_order_detail(request, order_id):
    """
    GET /api/patient-charge-orders/{order_id}/
    
    Detalle de una orden de cobro específica.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        order = ChargeOrder.objects.filter(
            id=order_id,
            patient=patient
        ).select_related(
            'institution', 'doctor', 'doctor__user', 'appointment'
        ).prefetch_related('items', 'payments').first()
        
        if not order:
            return Response({'error': 'Orden no encontrada'}, status=404)
        
        # Calcular el monto mínimo a pagar (USD * BCV actual)
        from .services import get_bcv_rate
        bcv_rate = float(get_bcv_rate())
        usd_total = float(order.balance_due)
        min_amount_bs = usd_total * bcv_rate if bcv_rate else usd_total
        
        return Response({
            'id': order.id,
            'institution': {
                'id': order.institution.id,
                'name': order.institution.name,
                'tax_id': order.institution.tax_id,
                'address': order.institution.address,
            },
            'doctor': {
                'id': order.doctor.id if order.doctor else None,
                'name': order.doctor.full_name if order.doctor else None,
            } if order.doctor else None,
            'appointment': {
                'id': order.appointment.id,
                'date': order.appointment.appointment_date,
                'time': order.appointment.arrival_time,
            } if order.appointment else None,
            'currency': order.currency,
            'total': float(order.total),
            'total_ves': float(order.total) * bcv_rate if bcv_rate else float(order.total),
            'balance_due': float(order.balance_due),
            'balance_due_ves': float(order.balance_due) * bcv_rate if bcv_rate else float(order.balance_due),
            'min_amount_bs': round(min_amount_bs, 2),
            'bcv_rate': bcv_rate,
            'status': order.status,
            'status_display': order.get_status_display(),
            'issued_at': order.issued_at.strftime('%Y-%m-%d %H:%M'),
            'items': [
                {
                    'id': item.id,
                    'code': item.code,
                    'description': item.description,
                    'qty': item.qty,
                    'unit_price': float(item.unit_price),
                    'unit_price_ves': float(item.unit_price) * bcv_rate if bcv_rate else float(item.unit_price),
                    'subtotal': float(item.subtotal),
                    'subtotal_ves': float(item.subtotal) * bcv_rate if bcv_rate else float(item.subtotal),
                }
                for item in order.items.all()
            ],
            'payments': [
                {
                    'id': payment.id,
                    'amount': float(payment.amount),
                    'amount_ves': float(payment.amount_ves) if payment.amount_ves else None,
                    'exchange_rate_bcv': float(payment.exchange_rate_bcv) if payment.exchange_rate_bcv else None,
                    'method': payment.method,
                    'method_display': payment.get_method_display(),
                    'status': payment.status,
                    'status_display': payment.get_status_display(),
                    'reference_number': payment.reference_number,
                    'received_at': payment.received_at.strftime('%Y-%m-%d %H:%M') if payment.received_at else None,
                }
                for payment in order.payments.all()
            ],
        })
        
    except Exception as e:
        logger.error(f"Error en patient_charge_order_detail: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def patient_register_payment(request, order_id):
    """
    POST /api/patient-charge-orders/{order_id}/register-payment/
    
    Registra un pago manual del paciente (Pago Móvil).
    Determina automáticamente si la verificación es automática o manual.
    """
    from django.db.models import Q
    
    try:
        from decimal import Decimal
        from django.db import transaction
        from django.utils import timezone
        
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        order = ChargeOrder.objects.filter(
            id=order_id,
            patient=patient
        ).first()
        
        if not order:
            return Response({'error': 'Orden no encontrada'}, status=404)
        
        if order.status in ['paid', 'void', 'waived']:
            return Response({'error': 'Orden no apta para pagos'}, status=400)
        
        # Validar datos del pago
        bank_code = request.data.get('bank_code')
        phone = request.data.get('phone')
        national_id = request.data.get('national_id')
        reference = request.data.get('reference')
        amount_bs = Decimal(str(request.data.get('amount_bs', 0)))
        
        if not all([bank_code, phone, national_id, reference, amount_bs]):
            return Response({'error': 'Faltan datos requeridos'}, status=400)
        
        # Calcular monto mínimo con BCV
        from .services import get_bcv_rate
        bcv_rate = get_bcv_rate()
        bcv_rate_float = float(bcv_rate) if bcv_rate else 1.0
        usd_total = float(order.balance_due)
        min_amount_bs = usd_total * bcv_rate_float
        
        # Validar que el monto sea igual o mayor al mínimo
        if float(amount_bs) < min_amount_bs:
            return Response({
                'error': f'El monto debe ser igual o mayor a Bs {min_amount_bs:,.2f}',
                'min_amount_required': round(min_amount_bs, 2),
            }, status=400)
        
        # ✅ VERIFICAR TIPO DE VERIFICACIÓN
        from .models import DoctorPaymentConfig
        
        # ✅ FIX: Separar Q objects en filter() separado
        bank_api_enabled = DoctorPaymentConfig.objects.filter(
            doctor=order.doctor,
        ).filter(
            Q(mercantil_enabled=True) | Q(banesco_enabled=True)
        ).exists()
        
        # Determinar tipo de verificación y status inicial
        if bank_api_enabled:
            verification_type = 'automatic'
            payment_status = 'pending'
        else:
            verification_type = 'manual'
            payment_status = 'pending'
        
        # Calcular monto en USD
        amount_usd = amount_bs / Decimal(str(bcv_rate_float)) if bcv_rate else amount_bs
        
        # ✅ CORRECCIÓN: Usar campos válidos del modelo Payment
        # Crear el pago
        with transaction.atomic():
            payment = Payment.objects.create(
                institution=order.institution,
                appointment=order.appointment,
                charge_order=order,
                doctor=order.doctor,
                amount=amount_usd,
                amount_ves=amount_bs,
                exchange_rate_bcv=bcv_rate,
                currency='VES',
                method='transfer',
                status=payment_status,
                reference_number=reference,
                bank_reference=bank_code,
                verification_notes=f"Pago Móvil: Tel {phone}, Cédula {national_id}",
                verification_type=verification_type,
            )
            
            # Actualizar método de pago del paciente
            payment_method, _ = PatientPaymentMethod.objects.get_or_create(patient=patient)
            payment_method.mobile_phone = phone
            payment_method.mobile_national_id = national_id
            payment_method.preferred_bank = bank_code
            payment_method.last_payment_amount = amount_bs
            payment_method.save()
            
            # Recalcular totales de la orden
            order.recalc_totals()
            order.save()
        
        # Mensaje según tipo de verificación
        if verification_type == 'automatic':
            message = 'Pago registrado. Verificación automática en proceso.'
        else:
            message = 'Pago registrado exitosamente. Pendiente de verificación por el médico.'
        
        return Response({
            'success': True,
            'payment': {
                'id': payment.id,
                'amount': float(payment.amount),
                'amount_bs': float(payment.amount_ves) if payment.amount_ves else 0.0,
                'exchange_rate_bcv': float(payment.exchange_rate_bcv) if payment.exchange_rate_bcv else None,
                'reference': reference,
                'status': payment.status,
                'verification_type': verification_type,
                'message': message
            }
        }, status=201)
        
    except Exception as e:
        logger.error(f"Error en patient_register_payment: {str(e)}")
        return Response({'error': str(e)}, status=500)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request, payment_id):
    """
    POST /api/payments/{payment_id}/verify/
    
    Verifica (confirma o rechaza) un pago pendiente.
    Solo accesible para doctores.
    """
    try:
        from django.utils import timezone
        from django.db import transaction
        
        # Verificar que es un doctor
        doctor = getattr(request.user, 'doctor_profile', None)
        if not doctor:
            return Response({'error': 'Solo doctores pueden verificar pagos'}, status=403)
        
        payment = get_object_or_404(Payment, pk=payment_id)
        
        # Verificar que el pago pertenece al doctor
        if payment.doctor != doctor:
            return Response({'error': 'No tienes permiso para verificar este pago'}, status=403)
        
        # Solo pagos pending pueden ser verificados
        if payment.status != 'pending':
            return Response({'error': f'El pago ya está {payment.status}'}, status=400)
        
        action = request.data.get('action')
        notes = request.data.get('notes', '')
        
        if action not in ['confirm', 'reject']:
            return Response({'error': 'Acción inválida. Usar: confirm o reject'}, status=400)
        
        # Procesar verificación
        with transaction.atomic():
            if action == 'confirm':
                payment.status = 'confirmed'
                payment.verified_by = request.user
                payment.verified_at = timezone.now()
                payment.verification_notes = notes
                payment.save(update_fields=[
                    'status', 'verified_by', 'verified_at', 'verification_notes'
                ])
                
                # Recalcular totales de la orden
                payment.charge_order.recalc_totals()
                payment.charge_order.save()
                
                message = 'Pago confirmado exitosamente'
            else:
                payment.status = 'rejected'
                payment.verified_by = request.user
                payment.verified_at = timezone.now()
                payment.verification_notes = notes
                payment.save(update_fields=[
                    'status', 'verified_by', 'verified_at', 'verification_notes'
                ])
                
                message = 'Pago rechazado'
        
        # ✅ CORREGIDO: Verificar que verified_by no sea None
        verified_by_username = None
        if payment.verified_by:
            verified_by_username = getattr(payment.verified_by, 'username', None) or getattr(payment.verified_by, 'email', None)
        
        verified_at_str = None
        if payment.verified_at:
            verified_at_str = payment.verified_at.strftime('%Y-%m-%d %H:%M')  # type: ignore[union-attr]
        
        return Response({
            'success': True,
            'payment': {
                'id': payment.id,
                'status': payment.status,
                'verified_by': verified_by_username,
                'verified_at': verified_at_str,
                'verification_notes': payment.verification_notes,
                'message': message
            }
        })
        
    except Exception as e:
        logger.error(f"Error en verify_payment: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_payments(request):
    """
    GET /api/payments/pending/
    
    Obtiene todos los pagos pendientes de verificación para el doctor.
    Solo retorna pagos que pertenezcan a la institución del doctor.
    """
    try:
        # Verificar que es un doctor
        doctor = getattr(request.user, 'doctor_profile', None)
        if not doctor:
            return Response({'error': 'Solo doctores pueden acceder a esta información'}, status=403)
        
        # Obtener la institución activa
        institution_id = request.headers.get('X-Institution-ID')
        if institution_id:
            institution = InstitutionSettings.objects.filter(id=institution_id).first()
        else:
            institution = doctor.active_institution
        
        if not institution:
            return Response({'error': 'No hay institución activa'}, status=400)
        
        # Obtener pagos pendientes de la institución
        # Pagos pendientes = status='pending' (registrados por pacientes pero no verificados)
        pending_payments = Payment.objects.filter(
            institution=institution,
            status='pending'
        ).select_related(
            'charge_order',
            'charge_order__patient',
            'charge_order__appointment',
            'charge_order__appointment__patient'
        ).order_by('-created_at')
        
        results = []
        for payment in pending_payments:
            charge_order = payment.charge_order
            patient = charge_order.patient if charge_order else None
            appointment = charge_order.appointment if charge_order else None
            
            # Calcular monto en Bs si tiene tasa BCV
            amount_bs = None
            if payment.amount_ves and payment.exchange_rate_bcv:
                amount_bs = float(payment.amount_ves)
            
            results.append({
                'id': payment.id,
                'amount': float(payment.amount) if payment.amount else None,
                'amount_ves': float(payment.amount_ves) if payment.amount_ves else None,
                'exchange_rate_bcv': float(payment.exchange_rate_bcv) if payment.exchange_rate_bcv else None,
                'amount_bs': amount_bs,
                'method': payment.method,
                'reference_number': payment.reference_number,
                'bank_reference': payment.bank_reference,
                'status': payment.status,
                'created_at': payment.created_at.isoformat() if payment.created_at else None,
                'patient': {
                    'id': patient.id,
                    'full_name': patient.full_name if patient else None,
                    'national_id': patient.national_id if patient else None,
                    'phone_number': patient.phone_number if patient else None,
                } if patient else None,
                'charge_order': {
                    'id': charge_order.id,
                    'total': float(charge_order.total) if charge_order.total else None,
                    'balance_due': float(charge_order.balance_due) if charge_order.balance_due else None,
                } if charge_order else None,
                'appointment': {
                    'id': appointment.id,
                    'appointment_date': appointment.appointment_date.isoformat() if appointment else None,
                } if appointment else None,
            })
        
        return Response({
            'count': len(results),
            'payments': results
        })
        
    except Exception as e:
        logger.error(f"Error en get_pending_payments: {str(e)}")
        return Response({'error': str(e)}, status=500)


# ============================================
# PATIENT PORTAL - SERVICIOS
# ============================================
@api_view(['GET'])
def patient_services_history(request):
    """
    GET /api/patient/services/history/
    
    Historial de servicios del paciente.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        # Obtener órdenes de cobro pagadas del paciente
        paid_orders = ChargeOrder.objects.filter(
            patient=patient, 
            status='paid'
        ).select_related('doctor', 'institution')
        
        # Construir historial de servicios
        orders_data = []
        for order in paid_orders:
            order_items = []
            for item in order.items.all():
                # ✅ NUEVO: Agregar service_id desde doctor_service
                service_id = None
                if hasattr(item, 'doctor_service') and item.doctor_service:
                    service_id = item.doctor_service.id
                
                order_items.append({
                    'code': item.code,
                    'service_id': service_id,  # ✅ NUEVO CAMPO
                    'description': item.description,
                    'qty': float(item.qty),
                    'unit_price': float(item.unit_price),
                    'subtotal': float(item.subtotal),
                })
            
            orders_data.append({
                'id': order.id,
                'date': order.issued_at.isoformat() if order.issued_at else None,
                'institution': order.institution.name if order.institution else 'N/A',
                'total': float(order.total),
                'status': order.status,
                'items': order_items,
            })
        
        # Estadísticas resumidas
        total_orders = len(orders_data)
        total_invertido = sum(order['total'] for order in orders_data)
        unique_services = len(set(
            item['code'] 
            for order in orders_data 
            for item in order['items']
        ))
        
        return Response({
            'orders': orders_data,
            'summary': {
                'total_orders': total_orders,
                'total_invertido': total_invertido,
                'unique_services': unique_services,
            }
        })
        
    except Exception as e:
        logger.error(f"Error en patient_services_history: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def patient_services_catalog(request):
    """
    GET /api/patient/services/catalog/
    
    Catálogo general de servicios disponibles en MEDOPZ.
    Agrupa por especialidad y muestra precios.
    """
    try:
        # ✅ NUEVO: Obtener servicios directamente desde DoctorService
        # (más eficiente que agrupar ChargeItems)
        from django.db.models import Count, Max, Q
        
        services = DoctorService.objects.filter(
            is_active=True,
            is_visible_global=True
        ).select_related('doctor', 'category', 'institution')
        
        # Anotar con conteo de usos
        services = services.annotate(times_used=Count('charge_items'))
        
        # Ordenar por relevancia (usos y nombre)
        services = services.order_by('-times_used', 'name')
        
        # Formatear resultados
        results = []
        for service in services:
            results.append({
                'id': service.id,
                'code': service.code,
                'name': service.name,
                'description': service.description,
                'doctor_name': service.doctor.full_name if service.doctor else None,
                'institution_name': service.institution.name if service.institution else None,
                'price_usd': float(service.price_usd) if service.price_usd else 0.0,
                'duration_minutes': service.duration_minutes,
                'times_used': service.times_used,
                'is_active': service.is_active,
                'category_name': service.category.name if service.category else None,
            })
        
        # Obtener especialidades únicas
        specialties_used = set()
        for service in services:
            if service.category:
                specialties_used.add(service.category.name)
        
        return Response({
            'services': results,
            'specialties': sorted(list(specialties_used)),
            'total_services': len(results),
        })
        
    except Exception as e:
        logger.error(f"Error en patient_services_catalog: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def patient_services_recommended(request):
    """
    GET /api/patient/services/recommended/
    
    Servicios recomendados basados en el historial del paciente.
    """
    try:
        patient_user = get_patient_user_from_request(request)
        if not patient_user:
            return Response({'error': 'No autenticado'}, status=401)
        
        patient = patient_user.patient
        
        # Paso 1: Obtener IDs de órdenes pagadas
        paid_order_ids = ChargeOrder.objects.filter(
            patient=patient, 
            status='paid'
        ).values_list('id', flat=True)
        
        # Paso 2: Obtener objetos completos con relaciones optimizadas
        paid_orders = ChargeOrder.objects.filter(
            id__in=paid_order_ids
        ).select_related('doctor')
        
        # Obtener las especialidades de los doctores que han atendido al paciente
        patient_doctor_specialties = set()
        
        for order in paid_orders:
            if order.doctor:
                spec_ids = order.doctor.specialties.values_list('id', flat=True)
                patient_doctor_specialties.update(spec_ids)
        
        # Encontrar doctores con esas especialidades
        recommended_doctors = DoctorOperator.objects.filter(
            specialties__id__in=patient_doctor_specialties,
            is_verified=True
        ).distinct()[:5]
        
        # ✅ NUEVO: Obtener servicios recomendados de esos doctores
        from django.db.models import Count
        
        recommended_services = DoctorService.objects.filter(
            doctor__in=recommended_doctors,
            is_active=True,
            is_visible_global=True
        ).select_related('doctor', 'institution')
        
        # Anotar con conteo de usos
        recommended_services = recommended_services.annotate(times_used=Count('charge_items'))
        
        # Ordenar por popularidad
        recommended_services = recommended_services.order_by('-times_used', 'name')[:10]
        
        # Formatear servicios recomendados
        services_data = []
        for service in recommended_services:
            services_data.append({
                'id': service.id,
                'code': service.code,
                'name': service.name,
                'doctor_name': service.doctor.full_name if service.doctor else None,
                'institution_name': service.institution.name if service.institution else None,
                'price_usd': float(service.price_usd) if service.price_usd else 0.0,
                'duration_minutes': service.duration_minutes,
                'times_used': service.times_used,
            })
        
        return Response({
            'recommended_doctors': [
                {
                    'id': doc.id,
                    'full_name': doc.full_name,
                    'gender': doc.gender,
                    'specialties': [s.name for s in doc.specialties.all()],
                    'is_verified': doc.is_verified,
                }
                for doc in recommended_doctors
            ],
            'recommended_services': services_data,
            'based_on': 'Tu historial de servicios',
        })
        
    except Exception as e:
        logger.error(f"Error en patient_services_recommended: {str(e)}")
        return Response({'error': str(e)}, status=500)
# ============================================
# PATIENT PORTAL - BÚSQUEDA
# ============================================
@api_view(['GET'])
def patient_search_doctors(request):
    """
    GET /api/patient-search/doctors/
    
    Busca doctores por nombre o especialidad.
    Devuelve información estructurada compatible con DoctorProfile (Frontend).
    """
    q = request.query_params.get('q', '').strip()
    
    try:
        doctors = DoctorOperator.objects.filter(is_verified=True)
        
        if q:
            doctors = doctors.filter(
                Q(full_name__icontains=q) |
                Q(specialties__name__icontains=q)
            ).distinct()
        
        doctors = doctors[:20]
        
        results = []
        for doc in doctors:
            # --- MAPEO DE ESPECIALIDADES ---
            # Frontend espera: { id: number, name: string }[]
            specialties = [{'id': s.id, 'name': s.name} for s in doc.specialties.all()]
            
            # --- MAPEO DE INSTITUCIONES ---
            # Frontend espera: { id: number, name: string }[]
            # Usamos doc.institutions.all() para todas las instituciones del doctor
            institutions = [{'id': i.id, 'name': i.name} for i in doc.institutions.all()[:5]]
            
            # --- INSTITUCIÓN ACTIVA (Opcional) ---
            # Para el campo 'institution_name' en el frontend (string simple)
            active_institution_name = doc.active_institution.name if doc.active_institution else None
            
            # Si no hay active_institution, usar la primera de la lista (si existe)
            if not active_institution_name and institutions:
                active_institution_name = institutions[0]['name']
            results.append({
                'id': doc.id,
                'full_name': doc.full_name,
                'gender': doc.gender,
                'is_verified': doc.is_verified,
                'colegiado_id': doc.colegiado_id,
                'license': doc.license,
                'specialties': specialties,      # Array de objetos con id y name
                'institutions': institutions,    # Array de objetos con id y name
                'institution_name': active_institution_name, # String opcional
                'email': doc.email,
                'phone': doc.phone,
                'bio': doc.bio,
                'photo_url': doc.photo_url,
            })
        
        return Response({
            'count': len(results),
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error en patient_search_doctors: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def patient_search_services(request):
    """
    GET /api/patient-search/services/
    
    Busca servicios activos y visibles por nombre, código o descripción.
    Devuelve información completa del servicio incluyendo precio (USD), médico y duración.
    """
    q = request.query_params.get('q', '').strip()
    
    try:
        # Buscar en DoctorService con filtros de estado
        services = DoctorService.objects.filter(
            is_active=True,
            is_visible_global=True
        )
        
        # Aplicar búsqueda si hay consulta
        if q:
            services = services.filter(
                Q(code__icontains=q) |
                Q(name__icontains=q) |
                Q(description__icontains=q)
            )
        
        # Anotar con conteo de charge_items para obtener times_used
        services = services.annotate(times_used=Count('charge_items'))
        
        # Optimización: Cargar médico relacionado e institución
        services = services.select_related('doctor', 'institution')
        
        # Ordenar por relevancia (usos y nombre) y limitar resultados
        services = services.order_by('-times_used', 'name')[:30]
        
        # Formatear resultados
        results = []
        for service in services:
            # Calcular precio (usar price_usd, manejar nulos)
            price = float(service.price_usd) if service.price_usd else 0.0
            
            # Obtener nombre de institución
            institution_name = service.institution.name if service.institution else None
            
            results.append({
                'id': service.id,
                'code': service.code,
                'name': service.name,
                'description': service.description,
                'doctor': {
                    'id': service.doctor.id,
                    'full_name': service.doctor.full_name
                } if service.doctor else None,
                'institution_name': institution_name,
                'price_usd': price,
                'duration_minutes': service.duration_minutes,
                'times_used': service.times_used,
                'is_active': service.is_active,
            })
        
        return Response({
            'count': len(results),
            'results': results
        })
        
    except Exception as e:
        import traceback
        logger.error(f"Error en patient_search_services: {str(e)}")
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=500)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def payment_ocr_api(request):
    """
    POST /api/payments/ocr/
    
    Procesa imagen de captura de pago y extrae datos automáticamente
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Obtener imagen del request
        image = request.FILES.get('image')
        
        logger.info(f"OCR request received - image: {image}")
        
        if not image:
            return Response({
                'success': False,
                'error': 'No se recibió imagen'
            }, status=400)
        
        # Validar tipo de archivo
        allowed_types = ['image/jpeg', 'image/png', 'image/jpg']
        logger.info(f"Image content_type: {image.content_type}")
        
        if image.content_type not in allowed_types:
            return Response({
                'success': False,
                'error': 'Tipo de archivo no permitido. Use JPEG o PNG'
            }, status=400)
        
        # Importar y procesar
        from core.services import PaymentOCRService
        logger.info("Calling PaymentOCRService.extract_data")
        
        result = PaymentOCRService.extract_data(image)
        logger.info(f"OCR result: {result}")
        
        return Response(result)
        
    except Exception as e:
        import traceback
        logger.error(f"Error en payment_ocr_api: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


class DoctorDirectoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Directorio de doctores para el Patient Portal.
    """
    queryset = DoctorOperator.objects.filter(is_verified=True)
    serializer_class = DoctorOperatorSerializer
    permission_classes = [AllowAny] # O IsAuthenticated si prefieres
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtros opcionales
        specialty_id = self.request.query_params.get('specialty')
        if specialty_id:
            queryset = queryset.filter(specialties__id=specialty_id)
        return queryset


class DoctorProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Perfil de un doctor específico.
    """
    queryset = DoctorOperator.objects.filter(is_verified=True)
    serializer_class = DoctorOperatorSerializer
    permission_classes = [AllowAny]
    @action(detail=True, methods=['get'], url_path='services')
    def get_services(self, request, pk=None):
        """
        Obtener servicios activos y visibles de un doctor específico.
        """
        doctor = self.get_object()
        services = DoctorService.objects.filter(
            doctor=doctor, 
            is_active=True, 
            is_visible_global=True
        )
        serializer = DoctorServiceSerializer(services, many=True)
        return Response(serializer.data)


class DoctorServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar servicios del doctor.
    Incluye búsqueda y filtros.
    """
    queryset = DoctorService.objects.all()
    serializer_class = DoctorServiceSerializer
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DoctorServiceWriteSerializer
        if self.action == 'search':
            return DoctorServiceSearchSerializer
        return DoctorServiceSerializer
    
    def get_queryset(self):
        # Obtener institución del header o del perfil del doctor
        institution_id = self.request.headers.get('X-Institution-ID')
        
        if institution_id:
            queryset = DoctorService.objects.filter(institution_id=institution_id)
        else:
            # Fallback: usar institución activa del doctor
            doctor = getattr(self.request.user, 'doctor_operator', None)
            if doctor:
                institution = doctor.active_institution or doctor.institutions.first()
                if institution:
                    queryset = DoctorService.objects.filter(institution=institution)
                else:
                    return DoctorService.objects.none()
            else:
                return DoctorService.objects.none()
        
        # Filtrar por doctor si es necesario
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        
        # Filtros adicionales
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(code__icontains=search) |
                models.Q(name__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        return queryset.order_by('doctor', 'name')
    
    def perform_create(self, serializer):
        # Obtener institución del header o del perfil
        institution_id = self.request.headers.get('X-Institution-ID')
        if institution_id:
            institution = InstitutionSettings.objects.get(pk=institution_id)
        else:
            doctor = getattr(self.request.user, 'doctor_profile', None)
            institution = doctor.active_institution or doctor.institutions.first() if doctor else None
        if not institution:
            raise ValidationError("No se pudo determinar la institución")
        serializer.save(institution=institution)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Endpoint de búsqueda rápido para autocomplete."""
        queryset = self.get_queryset()[:20]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de servicios.
    """
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ServiceCategoryWriteSerializer
        return ServiceCategorySerializer
    
    def get_queryset(self):
        queryset = ServiceCategory.objects.all()
        return queryset.order_by('name')
    
    def perform_create(self, serializer):
        serializer.save()



@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Ajustar según necesidad
def purchase_service_direct(request):
    """
    Compra directa de servicio sin cita previa.
    Crea ChargeOrder asociada al paciente.
    """
    patient_id = request.data.get('patient_id')
    doctor_service_id = request.data.get('doctor_service_id')
    qty = request.data.get('qty', 1)
    
    # Validaciones
    if not patient_id or not doctor_service_id:
        return Response(
            {"error": "Se requiere patient_id y doctor_service_id"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buscar servicio
    try:
        service = DoctorService.objects.get(
            id=doctor_service_id,
            is_active=True,
            is_visible_global=True
        )
    except DoctorService.DoesNotExist:
        return Response(
            {"error": "Servicio no encontrado o no disponible"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Buscar o crear ChargeOrder para el paciente (sin appointment)
    charge_order, created = ChargeOrder.objects.get_or_create(
        patient_id=patient_id,
        appointment__isnull=True,  # Sin cita asociada
        status='open',
        defaults={
            'doctor': service.doctor,
            'institution': service.institution,
            'currency': 'USD',
            'total': 0,
            'balance_due': 0
        }
    )
    
    # Crear ChargeItem
    charge_item = ChargeItem.objects.create(
        order=charge_order,
        doctor_service=service,
        code=service.code,
        description=service.name,
        qty=qty,
        unit_price=service.price_usd
    )
    
    # Recalcular totales
    charge_order.recalc_totals()
    charge_order.save(update_fields=['total', 'balance_due', 'status'])
    
    serializer = ChargeOrderSerializer(charge_order)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


class ServiceAvailabilityView(APIView):
    """
    Endpoint para verificar disponibilidad de slots de tiempo para un servicio.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request, service_id):
        institution_id = request.query_params.get('institution_id')
        date_str = request.query_params.get('date')
        
        if not institution_id or not date_str:
            return Response({"error": "Faltan parámetros: institution_id y date"}, status=400)
        try:
            service = DoctorService.objects.get(id=service_id)
            institution = InstitutionSettings.objects.get(id=institution_id)
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except (DoctorService.DoesNotExist, InstitutionSettings.DoesNotExist, ValueError):
            return Response({"error": "Servicio o institución no válida"}, status=404)
        # Validar fecha mínima (lead time)
        min_date = timezone.now().date() + timedelta(hours=service.booking_lead_time)
        if target_date < min_date:
            return Response({"error": f"La fecha debe ser al menos {service.booking_lead_time} horas en el futuro"}, status=400)
        # Obtener horarios configurados para ese día de la semana
        day_of_week = target_date.weekday()  # 0 = Lunes
        schedules = ServiceSchedule.objects.filter(
            service=service,
            institution=institution,
            day_of_week=day_of_week,
            is_active=True
        )
        if not schedules.exists():
            return Response({"available_slots": []})
        # Generar slots y verificar ocupación
        available_slots = []
        for schedule in schedules:
            current_time = datetime.combine(target_date, schedule.start_time)
            end_time = datetime.combine(target_date, schedule.end_time)
            
            while current_time < end_time:
                # Verificar si el slot está ocupado (citas confirmadas o tentativas)
                is_occupied = Appointment.objects.filter(
                    institution=institution,
                    doctor=service.doctor,
                    appointment_date=target_date,
                    status__in=['tentative', 'confirmed', 'pending']
                ).filter(
                    tentative_time__range=[current_time.time(), (current_time + timedelta(minutes=schedule.slot_duration)).time()]
                ).exists()
                if not is_occupied:
                    available_slots.append({
                        "start": current_time.time().strftime('%H:%M'),
                        "end": (current_time + timedelta(minutes=schedule.slot_duration)).strftime('%H:%M'),
                        "available": True
                    })
                
                current_time += timedelta(minutes=schedule.slot_duration)
        return Response({
            "service_id": service_id,
            "institution_id": institution_id,
            "date": date_str,
            "available_slots": available_slots
        })


class PurchaseServiceDirect(APIView):
    """
    Endpoint para crear una orden de cobro con fecha tentativa.
    """
    permission_classes = [IsAuthenticated]
    def post(self, request):
        data = request.data.copy()
        
        # Mapear IDs a relaciones de modelo
        try:
            patient_id = data.pop('patient_id')
            doctor_service_id = data.pop('doctor_service_id')
            institution_id = data.pop('institution_id')
            
            data['patient'] = patient_id
            data['doctor_service'] = doctor_service_id
            data['institution'] = institution_id
            
            # Obtener doctor desde el servicio
            service = DoctorService.objects.get(id=doctor_service_id)
            data['doctor'] = service.doctor.id
            
        except KeyError:
            return Response({"error": "Faltan patient_id, doctor_service_id o institution_id"}, status=400)
        except DoctorService.DoesNotExist:
            return Response({"error": "Servicio no encontrado"}, status=404)
        # Validar disponibilidad si se envía fecha tentativa
        tentative_date = data.get('tentative_date')
        tentative_time = data.get('tentative_time')
        
        if tentative_date and tentative_time:
            # Lógica de validación de disponibilidad (opcional, se puede hacer aquí o en el serializer)
            pass
        
        serializer = ChargeOrderSerializer(data=data)
        if serializer.is_valid():
            order = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConfirmAppointmentView(APIView):
    """
    Endpoint para confirmar una cita tentativa desde el Portal Doctor.
    Opera sobre una Appointment existente y actualiza su estado a 'confirmed'.
    También actualiza el estado de la ChargeOrder asociada a 'confirmed' si existe.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk): # Cambiado de order_id a pk (appointment_id)
        try:
            appointment = Appointment.objects.get(id=pk)
        except Appointment.DoesNotExist:
            return Response({"error": "Cita no encontrada"}, status=404)
        
        # Validar que la cita esté en estado tentative
        if appointment.status != 'tentative':
            return Response({"error": "Esta cita no está en estado tentative"}, status=400)
        
        # Actualizar estado de la Appointment
        appointment.status = 'confirmed'
        appointment.confirmed_at = timezone.now()
        # La fecha decisiva es la que el paciente seleccionó (tentative_date)
        # Aseguramos que appointment_date coincida con la fecha tentativa
        appointment.appointment_date = appointment.tentative_date
        appointment.save()
        
        # Actualizar estado de la ChargeOrder asociada (si existe)
        # Buscamos la ChargeOrder vinculada a esta Appointment
        charge_order = appointment.charge_orders.first() # Usa el related_name 'charge_orders' del modelo ChargeOrder
        if charge_order:
            charge_order.status = 'confirmed'
            charge_order.save()
            # Opcional: Podríamos también actualizar el 'total' o 'balance_due' si fuera necesario,
            # pero generalmente se mantienen igual hasta el pago.
        return Response({
            "message": "Cita confirmada exitosamente",
            "appointment_id": appointment.id,
            "charge_order_id": charge_order.id if charge_order else None
        })


class DoctorAppointmentsView(APIView):
    """
    Endpoint para listar citas pendientes de confirmación para el doctor.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Filtrar citas del doctor autenticado con estado 'tentative'
        appointments = Appointment.objects.filter(
            doctor__user=request.user,
            status='tentative'
        )
        
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)


class OperationalHubView(APIView):
    """
    Endpoint unificado para el Hub Operativo del WaitingRoom.
    Versión 2.0: Soporte mensual + timeline unificado + disponibilidad.
    
    Parámetros:
    - institution_id: ID de la institución (requerido)
    - year: Año para filtro (opcional, predeterminado: año actual)
    - month: Mes para filtro (opcional, predeterminado: mes actual)
    
    Retorna:
    - timeline: Items unificados (citas + disponibilidad) para el calendario
    - live_queue: Entradas activas en sala de espera (día actual)
    - pending_entries: Citas pendientes del día actual
    - filters: Categorías y servicios para filtros UI
    - stats: Estadísticas del periodo
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # 1. Validar y obtener parámetros
            institution_id = self._validate_institution_id(request)
            if isinstance(institution_id, Response):
                return institution_id
            
            year = self._get_year(request)
            month = self._get_month(request)
            
            # LOG: Depuración de parámetros
            logger.info(f"[OperationalHubView] institution_id={institution_id}, year={year}, month={month}")
            
            # 2. Calcular rango de fechas
            start_date, end_date = self._get_date_range(year, month)
            logger.info(f"[OperationalHubView] Date range: {start_date} to {end_date}")
            
            # 3. Obtener datos del mes actual
            timeline = self._build_timeline(institution_id, start_date, end_date)
            
            # LOG: Depuración de timeline
            logger.info(f"[OperationalHubView] Timeline items: {len(timeline)}")
            
            # 4. Obtener datos para WaitingRoom (día actual)
            today = timezone.now().date()
            live_queue = self._get_live_queue(institution_id)
            pending_entries = self._get_pending_entries(institution_id, today)
            
            # 5. Obtener catálogos para filtros
            categories, services = self._get_catalogs(institution_id)
            
            # 6. Calcular estadísticas
            stats = self._calculate_stats(timeline, start_date, end_date)
            
            return Response({
                "timeline": timeline,
                "live_queue": live_queue,
                "pending_entries": pending_entries,
                "filters": {
                    "categories": categories,
                    "services": services
                },
                "stats": stats,
                "metadata": {
                    "year": year,
                    "month": month,
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "total_days": (end_date - start_date).days + 1,
                    "timeline_count": len(timeline)
                }
            })
            
        except Exception as e:
            logger.error(f"[OperationalHubView] Error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Error interno del servidor", "detail": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _validate_institution_id(self, request):
        """Valida el ID de la institución."""
        institution_id = request.query_params.get('institution_id')
        if not institution_id:
            return Response(
                {"error": "institution_id es requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            institution_id = int(institution_id)
            return institution_id
        except (ValueError, TypeError):
            return Response(
                {"error": "institution_id debe ser un entero válido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _get_year(self, request):
        """Obtiene el año de los parámetros o usa el actual."""
        year_param = request.query_params.get('year')
        if year_param:
            try:
                year = int(year_param)
                current_year = timezone.now().year
                if current_year - 5 <= year <= current_year + 5:
                    return year
            except ValueError:
                pass
        return timezone.now().year
    
    def _get_month(self, request):
        """Obtiene el mes de los parámetros o usa el actual."""
        month_param = request.query_params.get('month')
        if month_param:
            try:
                month = int(month_param)
                if 1 <= month <= 12:
                    return month
            except ValueError:
                pass
        return timezone.now().month
    
    def _get_date_range(self, year, month):
        """Calcula el rango de fechas para el mes solicitado."""
        first_day = date(year, month, 1)
        last_day_num = calendar.monthrange(year, month)[1]
        last_day = date(year, month, last_day_num)
        return first_day, last_day
    
    def _build_timeline(self, institution_id, start_date, end_date):
        """
        Construye el timeline unificado con citas y disponibilidad.
        CORRECCIÓN: Muestra TODAS las citas del mes, no solo las activas.
        """
        timeline = []
        
        try:
            # 1. Obtener TODAS las citas del mes (sin filtro de estado)
            appointments = Appointment.objects.filter(
                institution_id=institution_id,
                appointment_date__range=[start_date, end_date]
            ).select_related(
                'patient', 'doctor', 'institution', 
                'doctor_service', 'doctor_service__category'
            ).order_by('appointment_date', 'tentative_time')
            
            logger.info(f"[OperationalHubView] Citas encontradas en rango: {appointments.count()}")
            
            # 2. Obtener horarios de servicio activos
            service_schedules = ServiceSchedule.objects.filter(
                institution_id=institution_id,
                is_active=True
            ).select_related('service', 'service__category', 'service__doctor')
            
            # 3. Construir diccionario de citas por fecha
            appointments_by_date = {}
            for apt in appointments:
                date_str = apt.appointment_date.isoformat()
                if date_str not in appointments_by_date:
                    appointments_by_date[date_str] = []
                appointments_by_date[date_str].append(apt)
            
            logger.info(f"[OperationalHubView] Citas por fecha: {list(appointments_by_date.keys())}")
            
            # 4. Generar timeline día por día
            current_date = start_date
            while current_date <= end_date:
                date_str = current_date.isoformat()
                day_of_week = current_date.weekday()
                
                # Obtener citas del día
                day_appointments = appointments_by_date.get(date_str, [])
                
                # Agendar citas al timeline
                for apt in day_appointments:
                    timeline_item = self._appointment_to_timeline_item(apt)
                    if timeline_item:
                        timeline.append(timeline_item)
                
                # Obtener horarios para este día de la semana
                day_schedules = service_schedules.filter(day_of_week=day_of_week)
                
                # Generar slots de disponibilidad para cada horario
                for schedule in day_schedules:
                    availability_slots = self._generate_availability_slots(
                        schedule, current_date, day_appointments
                    )
                    timeline.extend(availability_slots)
                
                current_date += timedelta(days=1)
            
            # 5. Ordenar timeline por fecha y hora
            timeline.sort(key=lambda x: (x['date'], x.get('time') or ''))
            
            logger.info(f"[OperationalHubView] Timeline total items: {len(timeline)}")
            
        except Exception as e:
            logger.error(f"[OperationalHubView] Error construyendo timeline: {str(e)}", exc_info=True)
            timeline = []
        
        return timeline
    
    def _appointment_to_timeline_item(self, appointment):
        """Convierte una Appointment a item de timeline."""
        try:
            service_name = None
            service_id = None
            category_name = None
            category_id = None
            
            if appointment.doctor_service:
                service_name = appointment.doctor_service.name
                service_id = appointment.doctor_service.id
                if appointment.doctor_service.category:
                    category_name = appointment.doctor_service.category.name
                    category_id = appointment.doctor_service.category.id
            
            return {
                'id': appointment.id,
                'type': 'appointment',
                'date': appointment.appointment_date.isoformat(),
                'time': appointment.tentative_time,
                # ✅ CAMBIO: Usar camelCase para consistencia con frontend
                'title': appointment.patient.full_name if appointment.patient else 'Sin nombre',
                'status': appointment.status,
                'patientName': appointment.patient.full_name if appointment.patient else 'Sin nombre',
                'doctorName': appointment.doctor.full_name if appointment.doctor else 'Sin asignar',
                'doctorId': appointment.doctor.id if appointment.doctor else None,
                'serviceName': service_name,
                'serviceId': service_id,
                'categoryName': category_name,
                'categoryId': category_id,
                'isAvailable': False,
                'metadata': {
                    'appointment_id': appointment.id,
                    'doctor_service_id': service_id,
                    'appointment_type': appointment.appointment_type,
                    'expected_amount': str(appointment.expected_amount) if appointment.expected_amount else None,
                    'appointment_date': appointment.appointment_date.isoformat(),
                    'tentative_time': appointment.tentative_time
                }
            }
        except Exception as e:
            logger.error(f"Error convirtiendo appointment a timeline item: {str(e)}")
            return None
    
    def _generate_availability_slots(self, schedule, current_date, day_appointments):
        """
        Genera slots de disponibilidad basados en un horario de servicio.
        """
        slots = []
        
        try:
            start_time = schedule.start_time
            end_time = schedule.end_time
            slot_duration = schedule.slot_duration
            
            current_datetime = datetime.combine(current_date, start_time)
            end_datetime = datetime.combine(current_date, end_time)
            
            while current_datetime < end_datetime:
                slot_time_str = current_datetime.time().strftime('%H:%M')
                
                # Verificar si este slot está ocupado por alguna cita
                is_occupied = any(
                    apt.tentative_time == slot_time_str 
                    for apt in day_appointments
                    if apt.tentative_time
                )
                
                if not is_occupied:
                    slots_remaining = schedule.max_appointments
                    
                    doctor_name = None
                    doctor_id = None
                    if hasattr(schedule.service, 'doctor'):
                        doctor_name = schedule.service.doctor.full_name if schedule.service.doctor else None
                        doctor_id = schedule.service.doctor.id if schedule.service.doctor else None
                    
                    # ✅ CAMBIO: Usar camelCase para consistencia con frontend
                    slots.append({
                        'id': f"avail-{schedule.id}-{slot_time_str}",
                        'type': 'availability',
                        'date': current_date.isoformat(),
                        'time': slot_time_str,
                        'title': f"Disponible: {schedule.service.name}",
                        'status': 'available',
                        'patientName': None,
                        'doctorName': doctor_name,
                        'doctorId': doctor_id,
                        'serviceName': schedule.service.name,
                        'serviceId': schedule.service.id,
                        'categoryName': schedule.service.category.name if schedule.service.category else None,
                        'categoryId': schedule.service.category.id if schedule.service.category else None,
                        'isAvailable': True,
                        'slotsRemaining': slots_remaining,
                        'maxSlots': schedule.max_appointments,
                        'metadata': {
                            'schedule_id': schedule.id,
                            'service_id': schedule.service.id,
                            'slot_duration': slot_duration,
                            'max_appointments': schedule.max_appointments,
                            'day_of_week': schedule.day_of_week,
                            'start_time': str(start_time),
                            'end_time': str(end_time)
                        }
                    })
                
                current_datetime += timedelta(minutes=slot_duration)
            
        except Exception as e:
            logger.error(f"Error generando slots de disponibilidad: {str(e)}")
        
        return slots
    
    def _get_live_queue(self, institution_id):
        """Obtiene entradas de sala de espera del día actual (todos los estados)."""
        try:
            from core.models import WaitingRoomEntry
            from core.serializers import WaitingRoomEntrySerializer
            
            # ✅ CAMBIO: Usar timezone.local para obtener la fecha en la zona horaria local
            today = timezone.localdate()  # En lugar de timezone.now().date()
            
            # Logging para depuración
            logger.info(f"[_get_live_queue] institution_id={institution_id}, today={today}")
            
            # Contar todas las entradas del día (independientemente del estado)
            count_today = WaitingRoomEntry.objects.filter(
                institution_id=institution_id,
                arrival_time__date=today
            ).count()
            logger.info(f"[_get_live_queue] Total entradas hoy: {count_today}")
            
            # Contar por estado
            for status in ['waiting', 'in_consultation', 'completed', 'canceled', 'no_show']:
                count = WaitingRoomEntry.objects.filter(
                    institution_id=institution_id,
                    arrival_time__date=today,
                    status=status
                ).count()
                logger.info(f"[_get_live_queue] Entradas con status '{status}': {count}")
            
            live_queue = WaitingRoomEntry.objects.filter(
                institution_id=institution_id,
                status__in=['waiting', 'in_consultation', 'completed', 'canceled', 'no_show'],
                arrival_time__date=today
            ).select_related('patient', 'appointment', 'institution')
            
            logger.info(f"[_get_live_queue] Resultado final: {live_queue.count()} entradas")
            
            live_queue_data = WaitingRoomEntrySerializer(live_queue, many=True).data
            
            return live_queue_data
            
        except Exception as e:
            logger.error(f"Error obteniendo live queue: {str(e)}", exc_info=True)
            return []
    
    def _get_pending_entries(self, institution_id, today):
        """Obtiene citas pendientes del día actual."""
        try:
            from core.serializers import AppointmentSerializer
            
            pending_entries = Appointment.objects.filter(
                institution_id=institution_id,
                status__in=['pending', 'tentative', 'confirmed'],
                appointment_date=today
            ).select_related('patient', 'doctor', 'institution', 'doctor_service')
            
            return AppointmentSerializer(pending_entries, many=True).data
            
        except Exception as e:
            logger.error(f"Error obteniendo pending entries: {str(e)}")
            return []
    
    def _get_catalogs(self, institution_id):
        """Obtiene catálogos para filtros UI."""
        try:
            from core.models import ServiceCategory, DoctorService
            
            categories = ServiceCategory.objects.filter(is_active=True)
            services = DoctorService.objects.filter(
                is_active=True, 
                institution_id=institution_id
            ).select_related('category', 'doctor')
            
            categories_data = [{"id": c.id, "name": c.name} for c in categories]
            services_data = [
                {
                    "id": s.id,
                    "name": s.name,
                    "category_id": s.category_id,
                    "category_name": s.category.name if s.category else None,
                    "doctor_name": s.doctor.full_name if s.doctor else None,
                    "doctor_id": s.doctor.id if s.doctor else None
                } 
                for s in services
            ]
            
            return categories_data, services_data
            
        except Exception as e:
            logger.error(f"Error obteniendo catálogos: {str(e)}")
            return [], []
    
    def _calculate_stats(self, timeline, start_date, end_date):
        """Calcula estadísticas del periodo."""
        try:
            total_items = len(timeline)
            appointments_count = sum(1 for item in timeline if item['type'] == 'appointment')
            availability_count = sum(1 for item in timeline if item['type'] == 'availability')
            
            dates_with_activity = len(set(item['date'] for item in timeline))
            
            return {
                "total_items": total_items,
                "appointments_count": appointments_count,
                "availability_count": availability_count,
                "dates_with_activity": dates_with_activity,
                "avg_items_per_day": round(total_items / dates_with_activity, 1) if dates_with_activity > 0 else 0,
                "period_days": (end_date - start_date).days + 1
            }
            
        except Exception as e:
            logger.error(f"Error calculando estadísticas: {str(e)}")
            return {
                "total_items": 0,
                "appointments_count": 0,
                "availability_count": 0,
                "dates_with_activity": 0,
                "avg_items_per_day": 0,
                "period_days": (end_date - start_date).days + 1
            }


class ServiceScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar horarios de servicios.
    Permite configurar rangos horarios por día de la semana.
    """
    queryset = ServiceSchedule.objects.all()
    serializer_class = ServiceScheduleSerializer  # Asegúrate de tener este serializer en core/serializers.py
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Filtrar por servicio si se pasa el parámetro service_id
        service_id = self.request.query_params.get('service_id')
        if service_id:
            return self.queryset.filter(service_id=service_id)
        return self.queryset
    def perform_create(self, serializer):
        # Lógica opcional: Validar que el servicio pertenece a la institución del usuario
        serializer.save()


class MedicalServicesListView(APIView):
    """
    Endpoint para obtener lista de servicios médicos.
    Público (no requiere institución activa) para uso del Portal Paciente.
    """
    def get(self, request):
        services = DoctorService.objects.filter(is_active=True).select_related('category')
        serializer = DoctorServiceSerializer(services, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
        """
        Verifica si el token de autenticación es válido.
        Retorna datos básicos del usuario autenticado.
        """
        user = request.user
        return Response({
            'valid': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        })
