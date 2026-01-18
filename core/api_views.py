from rest_framework import viewsets, status, views
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import *
from .serializers import *
from . import services
import logging

logger = logging.getLogger(__name__)

# ==========================================
# 1. VIEWSETS (Requeridos por el Router) [cite: 5, 6]
# ==========================================

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']: return PatientReadSerializer
        return PatientWriteSerializer
    @action(detail=True, methods=['get', 'post'])
    def documents(self, request, pk=None): return Response([])
    @action(detail=True, methods=['delete'])
    def delete_document(self, request, pk=None, document_id=None): return Response(status=204)
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None): return Response({})

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

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
def metrics_api(request): return Response({})
@api_view(['GET'])
def dashboard_summary_api(request): return Response({})
@api_view(['GET'])
def payment_summary_api(request): return Response({})
@api_view(['GET'])
def waived_consultations_api(request): return Response([]) # <--- Faltaba
@api_view(['GET'])
def audit_dashboard_api(request): return Response({}) # <--- Faltaba

# Búsquedas
@api_view(['GET'])
def patient_search_api(request): return Response([])
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
def daily_appointments_api(request): return Response([])
@api_view(['GET'])
def appointments_pending_api(request): return Response([])
@api_view(['GET'])
def appointment_detail_api(request, pk): return Response({})
@api_view(['GET'])
def current_consultation_api(request): return Response({})
@api_view(['POST'])
def update_appointment_status(request, pk): return Response({"ok": True})
@api_view(['POST'])
def update_appointment_notes(request, pk): return Response({"ok": True})
@api_view(['POST'])
def update_waitingroom_status(request, pk): return Response({"ok": True})
@api_view(['POST'])
def register_arrival(request): return Response({"ok": True})
@api_view(['GET'])
def waitingroom_groups_today_api(request): return Response([]) # <--- Faltaba
@api_view(['GET'])
def waitingroom_entries_today_api(request): return Response([])

# Auditoría y Logs
@api_view(['GET'])
def event_log_api(request): return Response([]) # <--- Faltaba
@api_view(['GET'])
def audit_log_api(request): return Response([])
@api_view(['GET'])
def audit_by_appointment(request, appointment_id): return Response([])
@api_view(['GET'])
def audit_by_patient(request, patient_id): return Response([])

# Configuración y Varios
@api_view(['GET'])
def institution_settings_api(request): return Response({})
@api_view(['GET'])
def doctor_operator_settings_api(request): return Response({})
@api_view(['GET'])
def bcv_rate_api(request): return Response({"rate": 0})
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
@api_view(['GET'])
def specialty_choices_api(request): return Response([])