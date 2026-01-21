from rest_framework import viewsets, status, views
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import *
from .serializers import *
from . import services
import logging


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
        
        if not user.is_superuser and hasattr(user, 'doctor_profile') and hasattr(user.doctor_profile, 'institution'):
            return queryset.filter(institution=user.doctor_profile.institution)
        return queryset
    @action(detail=True, methods=['get'])
    def clinical_summary(self, request, pk=None):
        """Endpoint extra para un resumen rápido en el Frontend."""
        patient = self.get_object()
        # Aquí podrías usar un serializer aún más específico
        return Response({"status": "Success", "data": "Resumen clínico generado"})


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
        if self.action in ['list', 'retrieve']: return MedicalDocumentReadSerializer
        return MedicalDocumentWriteSerializer

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
def audit_dashboard_api(request): return Response({}) # <--- Faltaba

# Búsquedas
@api_view(['GET'])
def appointment_search_api(request): return Response([])
@api_view(['GET'])
def chargeorder_search_api(request): return Response([])
@api_view(['GET'])
def icd_search_api(request): return Response([])
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
def event_log_api(request): return Response([]) # <--- Faltaba



# Configuración y Varios
@api_view(['GET'])
def reports_api(request): return Response({})
@api_view(['GET'])
def reports_export_api(request): return Response({})
@api_view(['GET'])
def documents_api(request): return Response([])
@api_view(['GET'])
def notifications_api(request): return Response([])

# PDF y Generación
@api_view(['POST', 'GET'])
def generate_medical_report(request, pk): return Response({"url": ""})
@api_view(['POST', 'GET'])
def generate_prescription_pdf(request, pk): return Response({"url": ""})
@api_view(['POST', 'GET'])
def generate_treatment_pdf(request, pk): return Response({"url": ""})
@api_view(['POST', 'GET'])
def generate_referral_pdf(request, pk): return Response({"url": ""})
@api_view(['POST', 'GET'])
def generate_chargeorder_pdf(request, pk): return Response({"url": ""})
@api_view(['POST', 'GET'])
def generate_used_documents(request, pk): return Response({"url": ""})

# Opciones (Choices)
@api_view(['GET'])
def treatment_choices_api(request): return Response([])
@api_view(['GET'])
def prescription_choices_api(request): return Response([])
@api_view(['GET'])
def medicaltest_choices_api(request): return Response([])
@api_view(['GET'])
def medicalreferral_choices_api(request): return Response([])



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


