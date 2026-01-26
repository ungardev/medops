from rest_framework import viewsets, status, views
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db.models import Sum, Count, Q
from .models import *
from .serializers import *
from datetime import date
from . import services
from datetime import datetime, timedelta, date as python_date
from django.utils import timezone
import logging
from weasyprint import HTML
from openpyxl import Workbook


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
        # 1. Si está viendo la tabla (lista)
        if self.action == 'list':
            return PatientListSerializer
        
        # 2. Si está viendo el perfil completo (detalle)
        if self.action == 'retrieve':
            return PatientReadSerializer
        
        # 3. Si está creando o editando (escritura)
        return PatientWriteSerializer
    
    def get_queryset(self):
        """
        Opcional: Filtrado por institución automática.
        Si el usuario no es superuser, solo ve pacientes de su institución.
        """
        user = self.request.user
        queryset = super().get_queryset()
        
        # ✅ Solo pacientes activos (excluye soft deletes)
        queryset = queryset.filter(active=True)
        
        # ✅ REMOVED: Patient model NO tiene campo 'institution'
        # El filtrado por institución debe hacerse a través de la jerarquía geográfica
        # o agregando el campo institution al modelo Patient
        # Por ahora, devolvemos todos los pacientes activos
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def clinical_summary(self, request, pk=None):
        """Endpoint extra para un resumen rápido en el Frontend."""
        patient = self.get_object()
        # Aquí podrías usar un serializer aún más específico
        return Response({"status": "Success", "data": "Resumen clínico generado"})
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """
        Endpoint completo del perfil clínico del paciente.
        Devuelve todos los antecedentes, alergias, hábitos, cirugías y vacunaciones
        en una sola respuesta optimizada.
        """
        # Optimización de consultas con prefetch_related
        patient = Patient.objects.filter(pk=pk).prefetch_related(
            'allergies',
            'personal_history',
            'family_history',
            'surgeries',
            'habits',
            'vaccinations',  # ✅ CORREGIDO: 'patient_vaccinations' → 'vaccinations'
            'genetic_predispositions'
        ).first()
        
        if not patient:
            return Response({"error": "Patient not found"}, status=404)
        
        # Serializar cada módulo clínico (convertir a list de Python para evitar error Pylance)
        allergies_data = list(AllergySerializer(patient.allergies.all(), many=True).data)
        personal_history_data = list(PersonalHistorySerializer(patient.personal_history.all(), many=True).data)
        family_history_data = list(FamilyHistorySerializer(patient.family_history.all(), many=True).data)
        surgeries_data = list(SurgerySerializer(patient.surgeries.all(), many=True).data)
        habits_data = list(HabitSerializer(patient.habits.all(), many=True).data)
        vaccinations_data = list(PatientVaccinationSerializer(patient.vaccinations.all(), many=True).data)  # ✅ CORREGIDO
        genetic_data = list(GeneticPredispositionSerializer(patient.genetic_predispositions.all(), many=True).data)
        medical_history_data = list(MedicalHistorySerializer(patient.medical_history.all(), many=True).data)
        
        # Construir objeto de respuesta unificado
        profile_data = {
            'id': patient.id,
            'first_name': patient.first_name,  # ✅ AGREGADO
            'middle_name': patient.middle_name,  # ✅ AGREGADO
            'last_name': patient.last_name,  # ✅ AGREGADO
            'second_last_name': patient.second_last_name,  # ✅ AGREGADO
            'full_name': patient.full_name,
            'national_id': patient.national_id,
            'birthdate': patient.birthdate.isoformat() if patient.birthdate else None,
            'birth_place': patient.birth_place,  # ✅ AGREGADO
            'birth_country': patient.birth_country,  # ✅ AGREGADO
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
            'created_at': patient.created_at.isoformat() if patient.created_at else None,
            'updated_at': patient.updated_at.isoformat() if patient.updated_at else None,
            
            # Datos clínicos completos
            'allergies': allergies_data,
            'personal_history': personal_history_data,
            'family_history': family_history_data,
            'surgeries': surgeries_data,
            'habits': habits_data,
            'vaccinations': vaccinations_data,
            'genetic_predispositions': genetic_data,
            'medical_history': medical_history_data,
            
            # clinical_background = unión de todos los antecedentes
            'clinical_background': personal_history_data + family_history_data + [
                {'id': g['id'], 'type': 'genetic', 'condition': g['name'], 'description': g.get('description', '')}
                for g in genetic_data
            ],
        }
        
        return Response(profile_data)
    
    @action(detail=True, methods=['get'])
    def completed_appointments(self, request, pk=None):
        """
        Citas completadas del paciente.
        Retorna las últimas 20 citas con status='completed'.
        """
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
        """
        Citas pendientes del paciente.
        Retorna citas con status='pending' o 'arrived' ordenadas por fecha.
        """
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
        """
        Notas del paciente (lectura/escritura).
        GET: Retorna las notas del paciente (campo contact_info).
        PATCH: Actualiza las notas del paciente.
        """
        try:
            patient = self.get_object()
            
            if request.method == 'GET':
                # GET: Retornar notas existentes
                return Response({
                    'patient_id': patient.id,
                    'content': patient.contact_info or '',
                    'updated_at': patient.updated_at.isoformat() if patient.updated_at else None,
                })
            
            # PATCH: Actualizar notas
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
        """
        Pagos del paciente.
        Retorna todos los pagos relacionados con órdenes de cobro del paciente.
        """
        try:
            patient = self.get_object()
            
            # Buscar órdenes de cobro del paciente
            charge_orders = ChargeOrder.objects.filter(patient=patient).values_list('id', flat=True)
            
            # Buscar pagos de esas órdenes de cobro
            payments = Payment.objects.filter(
                charge_order__in=charge_orders
            ).select_related('charge_order', 'charge_order__patient', 'charge_order__appointment').order_by('-payment_date')
            
            serializer = PaymentSerializer(payments, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error en payments: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    def delete_document(self, request, pk=None, document_id=None):
        """
        Eliminar documento del paciente.
        DELETE /api/patients/{pk}/documents/{document_id}/
        """
        try:
            # Verificar que el documento pertenece al paciente
            document = get_object_or_404(
                MedicalDocument,
                pk=document_id,
                patient=pk
            )
            
            # Eliminar el documento
            document.delete()
            
            return Response(status=204)  # No Content
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
        # Filtro institucional: Seguridad Elite
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_superuser and hasattr(user, 'doctor_profile'):
            # Aseguramos que solo vea citas de su institución
            return qs.filter(institution=user.doctor_profile.institution)
        return qs


class MedicalDocumentViewSet(viewsets.ModelViewSet):
    queryset = MedicalDocument.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return MedicalDocumentReadSerializer
        return MedicalDocumentWriteSerializer


class MedicationCatalogViewSet(viewsets.ModelViewSet):
    """
    Catálogo maestro de medicamentos.
    Expone el modelo MedicationCatalog con CRUD completo.
    """
    queryset = MedicationCatalog.objects.all()
    serializer_class = MedicationCatalogSerializer
    
    def get_queryset(self):
        """
        Filtra medicamentos activos y del contexto institucional.
        - Si hay institución activa: muestra solo medicamentos de esa institución + catálogo maestro (institution is null)
        - Si no hay institución: muestra solo catálogo maestro
        """
        user = self.request.user
        
        # Filtro básico: solo activos
        queryset = super().get_queryset().filter(is_active=True)
        
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
        
        return queryset


# ViewSets Automáticos (Mocks de serializers y modelos)
class PaymentViewSet(viewsets.ModelViewSet): queryset = Payment.objects.all(); serializer_class = PaymentSerializer
class WaitingRoomEntryViewSet(viewsets.ModelViewSet): queryset = WaitingRoomEntry.objects.all(); serializer_class = WaitingRoomEntrySerializer
class GeneticPredispositionViewSet(viewsets.ModelViewSet): queryset = GeneticPredisposition.objects.all(); serializer_class = GeneticPredispositionSerializer
class DiagnosisViewSet(viewsets.ModelViewSet): queryset = Diagnosis.objects.all(); serializer_class = DiagnosisSerializer
class TreatmentViewSet(viewsets.ModelViewSet): queryset = Treatment.objects.all(); serializer_class = TreatmentSerializer
class PrescriptionViewSet(viewsets.ModelViewSet): queryset = Prescription.objects.all(); serializer_class = PrescriptionSerializer
class ChargeOrderViewSet(viewsets.ModelViewSet): queryset = ChargeOrder.objects.all(); serializer_class = ChargeOrderSerializer
class ChargeItemViewSet(viewsets.ModelViewSet): queryset = ChargeItem.objects.all(); serializer_class = ChargeItemSerializer
class MedicalTestViewSet(viewsets.ModelViewSet): queryset = MedicalTest.objects.all(); serializer_class = MedicalTestSerializer
class MedicalReferralViewSet(viewsets.ModelViewSet): queryset = MedicalReferral.objects.all(); serializer_class = MedicalReferralSerializer
class SpecialtyViewSet(viewsets.ModelViewSet): queryset = Specialty.objects.all(); serializer_class = SpecialtySerializer
class PersonalHistoryViewSet(viewsets.ModelViewSet): queryset = PersonalHistory.objects.all(); serializer_class = PersonalHistorySerializer
class FamilyHistoryViewSet(viewsets.ModelViewSet): queryset = FamilyHistory.objects.all(); serializer_class = FamilyHistorySerializer
class SurgeryViewSet(viewsets.ModelViewSet): queryset = Surgery.objects.all(); serializer_class = SurgerySerializer
class HabitViewSet(viewsets.ModelViewSet): queryset = Habit.objects.all(); serializer_class = HabitSerializer
class VaccineViewSet(viewsets.ModelViewSet): queryset = Vaccine.objects.all(); serializer_class = VaccineSerializer
class VaccinationScheduleViewSet(viewsets.ModelViewSet): queryset = VaccinationSchedule.objects.all(); serializer_class = VaccinationScheduleSerializer
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
        # Buscar en múltiples campos del paciente y cita
        appointments = Appointment.objects.filter(
            Q(patient__full_name__icontains=q) |
            Q(patient__national_id__icontains=q) |
            Q(id__icontains=q) |
            Q(appointment_date__icontains=q)
        ).order_by('-appointment_date')[:limit]
        
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
        # Buscar en múltiples campos de la orden y paciente
        charge_orders = ChargeOrder.objects.filter(
            Q(patient__full_name__icontains=q) |
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
def search(request): return Response([])

# Citas y Sala de Espera
@api_view(['GET'])
def appointments_pending_api(request): return Response([])
@api_view(['GET'])
def appointment_detail_api(request, pk): return Response({})


@api_view(['POST'])
def update_appointment_notes(request, pk): return Response({"ok": True})

@api_view(['POST'])
def register_arrival(request): return Response({"ok": True})



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
    Soporta filtros de tipo, fecha inicio, fecha fin, moneda.
    """
    report_type = request.query_params.get('type', 'FINANCIAL')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    currency = request.query_params.get('currency', 'USD')
    
    try:
        # Parsear fechas si se proporcionan
        start = datetime.strptime(start_date, '%Y-%m-%d') if start_date else None
        end = datetime.strptime(end_date, '%Y-%m-%d') if end_date else None
        
        rows = []
        
        if report_type == 'FINANCIAL':
            # Reporte financiero: pagos por período
            payments = Payment.objects.filter(status='confirmed')
            
            if start:
                payments = payments.filter(payment_date__date__gte=start)
            if end:
                payments = payments.filter(payment_date__date__lte=end)
            
            # Agrupar por fecha
            payments_by_date = payments.values('payment_date').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-payment_date')
            
            for item in payments_by_date:
                rows.append({
                    'id': f"FIN-{item['payment_date']}",
                    'date': item['payment_date'],
                    'type': 'FINANCIAL',
                    'entity': 'Payment',
                    'status': 'CONFIRMED',
                    'amount': float(item['total']),
                    'currency': currency,
                })
        
        elif report_type == 'CLINICAL':
            # Reporte clínico: citas por período y estado
            appointments = Appointment.objects.filter(
                status__in=['pending', 'completed', 'canceled']
            )
            
            if start:
                appointments = appointments.filter(appointment_date__date__gte=start)
            if end:
                appointments = appointments.filter(appointment_date__date__lte=end)
            
            # Agrupar por fecha y estado
            appointments_by_status = appointments.values('appointment_date', 'status').annotate(
                count=Count('id')
            ).order_by('-appointment_date')
            
            for item in appointments_by_status:
                rows.append({
                    'id': f"CLI-{item['appointment_date']}.{item['status']}",
                    'date': item['appointment_date'],
                    'type': 'CLINICAL',
                    'entity': 'Appointment',
                    'status': item['status'].upper(),
                    'amount': 0,
                    'currency': currency,
                })
        
        elif report_type == 'COMBINED':
            # Reporte combinado: pagos + citas
            # Pagos
            payments = Payment.objects.filter(status='confirmed')
            if start:
                payments = payments.filter(payment_date__date__gte=start)
            if end:
                payments = payments.filter(payment_date__date__lte=end)
            
            payments_by_date = payments.values('payment_date').annotate(
                total=Sum('amount'),
                count=Count('id')
            ).order_by('-payment_date')
            
            # Citas
            appointments = Appointment.objects.filter(
                status__in=['pending', 'completed', 'canceled']
            )
            if start:
                appointments = appointments.filter(appointment_date__date__gte=start)
            if end:
                appointments = appointments.filter(appointment_date__date__lte=end)
            
            # Agrupar por fecha y estado
            appointments_by_status = appointments.values('appointment_date', 'status').annotate(
                count=Count('id')
            ).order_by('-appointment_date')
            
            # Agregar filas financieras
            for item in payments_by_date:
                rows.append({
                    'id': f"FIN-{item['payment_date']}",
                    'date': item['payment_date'],
                    'type': 'FINANCIAL',
                    'entity': 'Payment',
                    'status': 'CONFIRMED',
                    'amount': float(item['total']),
                    'count': item['count'],
                    'currency': currency,
                })
            
            # Agregar filas clínicas
            for item in appointments_by_status:
                rows.append({
                    'id': f"CLI-{item['appointment_date']}.{item['status']}",
                    'date': item['appointment_date'],
                    'type': 'CLINICAL',
                    'entity': 'Appointment',
                    'status': item['status'].upper(),
                    'amount': 0,
                    'count': item['count'],
                    'currency': currency,
                })
        else:
            # Tipo de reporte no soportado
            return Response({"error": f"Tipo de reporte no soportado: {report_type}"}, status=400)
        
        # Ordenar por fecha descendente
        rows.sort(key=lambda x: x.get('date', ''), reverse=True)
        
        return Response(rows)
    except Exception as e:
        logger.error(f"Error en reports_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


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
                payments = payments.filter(payment_date__date__gte=start_date)
            if end_date:
                payments = payments.filter(payment_date__date__lte=end_date)
            
            for p in payments:
                data.append({
                    'ID': p.id,
                    'Fecha de Pago': p.payment_date.strftime('%d/%m/%Y') if p.payment_date else '',
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
                payments = payments.filter(payment_date__date__gte=start_date)
            if end_date:
                payments = payments.filter(payment_date__date__lte=end_date)
            
            for p in payments:
                data.append({
                    'ID': p.id,
                    'Tipo': 'Pago',
                    'Fecha': p.payment_date.strftime('%d/%m/%Y') if p.payment_date else '',
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
    """
    try:
        from . import services
        from .serializers import EventSerializer
        
        # get_audit_logic devuelve directamente una LISTA de eventos
        all_events = services.get_audit_logic(limit=3)
        
        # Asegurar que es una lista
        if not isinstance(all_events, list):
            all_events = list(all_events)
        
        # Filtrar por notify=True (solo notificaciones)
        notifications = [e for e in all_events if e.get('notify', False)]
        
        # Si hay eventos con notify=True, procesarlos
        if notifications:
            # Ordenar por timestamp descendente
            notifications.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            # Tomar las 3 notificaciones más recientes
            top_3 = notifications[:3]
            
            # Filtrar por ventana de 7 días
            cutoff = datetime.now() - timedelta(days=7)
            recent = [
                n for n in top_3 
                if n.get('timestamp') and 
                   datetime.fromisoformat(n['timestamp']) > cutoff
            ]
            
            # Si hay notificaciones recientes, devolverlas
            if recent:
                return Response(recent)
        
        # Si no hay notificaciones, devolver evento de "sin actividad"
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
        logger.error(f"Error en notifications_api: {str(e)}")
        return Response({"error": str(e)}, status=500)


# PDF y Generación
@api_view(['POST', 'GET'])
def generate_medical_report(request, pk):
    """
    Genera PDF de informe médico completo.
    Incluye diagnósticos, tratamientos, recetas, exámenes, y referencias.
    """
    try:
        # Obtener el informe médico
        report = get_object_or_404(MedicalReport, pk=pk)
        appointment = report.appointment
        patient = appointment.patient
        doctor = appointment.doctor
        institution = appointment.institution
        
        # Obtener datos de la consulta
        diagnoses = Diagnosis.objects.filter(appointment=appointment)
        treatments = Treatment.objects.filter(appointment=appointment)
        prescriptions = Prescription.objects.filter(appointment=appointment)
        medical_tests = MedicalTest.objects.filter(appointment=appointment)
        referrals = MedicalReferral.objects.filter(appointment=appointment)
        
        # Preparar contexto para plantilla
        context = {
            'data': report,
            'patient': patient,
            'appointment': appointment,
            'doctor': doctor,
            'institution': institution,
            'diagnoses': diagnoses,
            'treatments': treatments,
            'prescriptions': prescriptions,
            'medical_tests': medical_tests,
            'referrals': referrals,
            'generated_at': timezone.now(),
        }
        
        # Renderizar HTML desde plantilla
        html_string = render_to_string('pdf/medical_report.html', context)
        
        # Generar PDF con WeasyPrint
        pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()
        
        # Crear respuesta HTTP con PDF
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"medical_report_{appointment.id}_{report.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Actualizar el reporte con la URL del PDF
        report.file_url = f"/media/medical_reports/{filename}"
        report.save()
        
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
        # Obtener la receta
        prescription = get_object_or_404(Prescription, pk=pk)
        
        # Usar el servicio de generación de PDFs existente
        pdf_bytes, filename, mime_type = services.generate_generic_pdf(
            prescription, 'prescriptions'
        )
        
        # Crear respuesta HTTP con PDF
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando receta: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST', 'GET'])
def generate_treatment_pdf(request, pk):
    """
    Genera PDF de tratamiento.
    """
    try:
        # Obtener el tratamiento
        treatment = get_object_or_404(Treatment, pk=pk)
        
        # Usar el servicio de generación de PDFs existente
        pdf_bytes, filename, mime_type = services.generate_generic_pdf(
            treatment, 'treatments'
        )
        
        # Crear respuesta HTTP con PDF
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando tratamiento: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST', 'GET'])
def generate_referral_pdf(request, pk):
    """
    Genera PDF de referencia médica.
    """
    try:
        # Obtener la referencia
        referral = get_object_or_404(MedicalReferral, pk=pk)
        
        # Usar el servicio de generación de PDFs existente
        pdf_bytes, filename, mime_type = services.generate_generic_pdf(
            referral, 'referrals'
        )
        
        # Crear respuesta HTTP con PDF
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando referencia: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST', 'GET'])
def generate_chargeorder_pdf(request, pk):
    """
    Genera PDF de orden de cobro.
    """
    try:
        # Obtener la orden de cobro
        charge_order = get_object_or_404(ChargeOrder, pk=pk)
        
        # Obtener datos relacionados para el contexto
        items = ChargeItem.objects.filter(charge_order=charge_order)
        payments = Payment.objects.filter(charge_order=charge_order)
        
        # Calcular totales
        subtotal = charge_order.total
        paid_amount = sum(p.amount for p in payments)
        balance_due = charge_order.balance_due
        
        # Preparar contexto para plantilla
        context = {
            'data': charge_order,
            'charge_order': charge_order,
            'patient': charge_order.patient,
            'appointment': charge_order.appointment,
            'doctor': charge_order.doctor,
            'institution': charge_order.institution,
            'items': items,
            'payments': payments,
            'subtotal': str(subtotal),
            'discount': str(charge_order.discount or 0),
            'total': str(charge_order.total),
            'paid_amount': str(paid_amount),
            'balance_due': str(balance_due),
            'generated_at': timezone.now(),
        }
        
        # Renderizar HTML desde plantilla
        html_string = render_to_string('pdf/charge_order.html', context)
        
        # Generar PDF con WeasyPrint
        pdf_bytes = HTML(string=html_string, base_url=settings.MEDIA_ROOT).write_pdf()
        
        # Crear respuesta HTTP con PDF
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"charge_order_{charge_order.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
        
    except Exception as e:
        logger.error(f"Error generando orden de cobro: {str(e)}")
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
        
        return Response({
            'status': 'success',
            'generated_files': result.get('generated_files', []),
            'errors': result.get('errors', []),
            'total_generated': len(result.get('generated_files', [])),
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
def bcv_rate_api(request):
    try:
        rate = services.get_bcv_rate()
        return Response({"rate": float(rate)})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def patient_search_api(request):
    q = request.query_params.get('q', '').strip()
    limit = int(request.query_params.get('limit', 10))
    
    if not q:
        return Response([])
    
    try:
        patients = Patient.objects.filter(
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q) |
            Q(national_id__icontains=q)
        ).filter(active=True)[:limit]
        
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_appointment_status(request, pk):
    try:
        appointment = get_object_or_404(Appointment, pk=pk)
        new_status = request.data.get('status')
        
        valid_statuses = ['pending', 'arrived', 'in_consultation', 'completed', 'canceled']
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Valid options: {valid_statuses}"}, 
                status=400
            )
        
        appointment.update_status(new_status)
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
    """Endpoint para generar PDF profesional"""
    try:
        from core.utils.professional_pdf import ProfessionalPDFService
        
        service = ProfessionalPDFService()
        # 🔧 CAMBIO CLAVE: Usar template existente
        template_name = request.data.get('template_name', 'medical_report')  # Cambiar de 'medical_report_universal' a 'medical_report'
        context = request.data.get('context', {})
        institution_settings = request.data.get('institution_settings', {})
        
        pdf_bytes = service.generate_professional_pdf(template_name, context, institution_settings)
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{template_name}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        return response
        
    except Exception as e:
        logger.error(f"Error en generate_professional_pdf: {str(e)}")
        return Response(
            {'error': f'No se pudo generar PDF: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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