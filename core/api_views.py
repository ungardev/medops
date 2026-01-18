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
# 1. VIEWSETS PRINCIPALES
# ==========================================

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return PatientReadSerializer
        return PatientWriteSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

class MedicalDocumentViewSet(viewsets.ModelViewSet):
    queryset = MedicalDocument.objects.all()
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return MedicalDocumentReadSerializer
        return MedicalDocumentWriteSerializer

# ==========================================
# 2. SISTEMA DE DIRECCIONES
# ==========================================

class CountryViewSet(viewsets.ModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer

class StateViewSet(viewsets.ModelViewSet):
    queryset = State.objects.all()
    serializer_class = StateSerializer

class MunicipalityViewSet(viewsets.ModelViewSet):
    queryset = Municipality.objects.all()
    serializer_class = MunicipalitySerializer

class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer

class ParishViewSet(viewsets.ModelViewSet):
    queryset = Parish.objects.all()
    serializer_class = ParishSerializer

class NeighborhoodViewSet(viewsets.ModelViewSet):
    queryset = Neighborhood.objects.all()
    serializer_class = NeighborhoodSerializer

class AddressChainView(views.APIView):
    def get(self, request):
        neighborhood_id = request.query_params.get('neighborhood_id')
        if not neighborhood_id:
            return Response({"error": "neighborhood_id is required"}, status=400)
        neighborhood = get_object_or_404(Neighborhood, id=neighborhood_id)
        serializer = NeighborhoodDetailSerializer(neighborhood)
        return Response(serializer.data)

class NeighborhoodSearchView(views.APIView):
    def get(self, request):
        q = request.query_params.get('q', '')
        neighborhoods = Neighborhood.objects.filter(name__icontains=q)[:10]
        serializer = NeighborhoodSerializer(neighborhoods, many=True)
        return Response(serializer.data)

# ==========================================
# 3. OTROS VIEWSETS CLÍNICOS Y ADMINISTRATIVOS
# ==========================================

class PaymentViewSet(viewsets.ModelViewSet): queryset = Payment.objects.all(); serializer_class = PaymentSerializer
class PersonalHistoryViewSet(viewsets.ModelViewSet): queryset = PersonalHistory.objects.all(); serializer_class = PersonalHistorySerializer
class FamilyHistoryViewSet(viewsets.ModelViewSet): queryset = FamilyHistory.objects.all(); serializer_class = FamilyHistorySerializer
class SurgeryViewSet(viewsets.ModelViewSet): queryset = Surgery.objects.all(); serializer_class = SurgerySerializer
class HabitViewSet(viewsets.ModelViewSet): queryset = Habit.objects.all(); serializer_class = HabitSerializer
class AllergyViewSet(viewsets.ModelViewSet): queryset = Allergy.objects.all(); serializer_class = AllergySerializer
class VaccineViewSet(viewsets.ModelViewSet): queryset = Vaccine.objects.all(); serializer_class = VaccineSerializer
class VaccinationScheduleViewSet(viewsets.ModelViewSet): queryset = VaccinationSchedule.objects.all(); serializer_class = VaccinationScheduleSerializer
class PatientVaccinationViewSet(viewsets.ModelViewSet): queryset = PatientVaccination.objects.all(); serializer_class = PatientVaccinationSerializer
class MedicalHistoryViewSet(viewsets.ModelViewSet): queryset = MedicalHistory.objects.all(); serializer_class = MedicalHistorySerializer
class ClinicalAlertViewSet(viewsets.ModelViewSet): queryset = ClinicalAlert.objects.all(); serializer_class = ClinicalAlertSerializer
class PatientClinicalProfileViewSet(viewsets.ModelViewSet): queryset = ClinicalNote.objects.all(); serializer_class = ClinicalNoteSerializer
class ClinicalBackgroundViewSet(viewsets.ModelViewSet): queryset = MedicalHistory.objects.all(); serializer_class = MedicalHistorySerializer
class WaitingRoomEntryViewSet(viewsets.ModelViewSet): queryset = WaitingRoomEntry.objects.all(); serializer_class = WaitingRoomEntrySerializer
class DiagnosisViewSet(viewsets.ModelViewSet): queryset = Diagnosis.objects.all(); serializer_class = DiagnosisSerializer
class TreatmentViewSet(viewsets.ModelViewSet): queryset = Treatment.objects.all(); serializer_class = TreatmentSerializer
class PrescriptionViewSet(viewsets.ModelViewSet): queryset = Prescription.objects.all(); serializer_class = PrescriptionSerializer
class ChargeOrderViewSet(viewsets.ModelViewSet): queryset = ChargeOrder.objects.all(); serializer_class = ChargeOrderSerializer
class ChargeItemViewSet(viewsets.ModelViewSet): queryset = ChargeItem.objects.all(); serializer_class = ChargeItemSerializer
class MedicalTestViewSet(viewsets.ModelViewSet): queryset = MedicalTest.objects.all(); serializer_class = MedicalTestSerializer
class MedicalReferralViewSet(viewsets.ModelViewSet): queryset = MedicalReferral.objects.all(); serializer_class = MedicalReferralSerializer
class SpecialtyViewSet(viewsets.ModelViewSet): queryset = Specialty.objects.all(); serializer_class = SpecialtySerializer
class GeneticPredispositionViewSet(viewsets.ModelViewSet): queryset = GeneticPredisposition.objects.all(); serializer_class = GeneticPredispositionSerializer

# ==========================================
# 4. FUNCIONES API EXIGIDAS POR api_urls.py
# ==========================================

@api_view(['GET'])
def dashboard_summary_api(request):
    return Response({"summary": "Dashboard data"})

@api_view(['GET'])
def metrics_api(request):
    return Response({"metrics": "Advanced metrics"})

@api_view(['GET'])
def bcv_rate_api(request):
    try: return Response({"rate": services.get_bcv_rate()})
    except: return Response({"rate": 0})

@api_view(['GET'])
def institution_settings_api(request):
    config = InstitutionSettings.objects.first()
    return Response(InstitutionSettingsSerializer(config).data if config else {"error": "No config"})

@api_view(['GET'])
def doctor_operator_settings_api(request):
    doctor = DoctorOperator.objects.first()
    return Response(DoctorOperatorSerializer(doctor).data if doctor else {"error": "No doctor"})

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

@api_view(['POST'])
def update_appointment_status(request, pk): return Response({"status": "ok"})
@api_view(['POST'])
def update_appointment_notes(request, pk): return Response({"status": "ok"})
@api_view(['POST'])
def update_waitingroom_status(request, pk): return Response({"status": "ok"})
@api_view(['POST'])
def register_arrival(request): return Response({"status": "ok"})

@api_view(['GET'])
def audit_by_appointment(request, appointment_id): return Response([])
@api_view(['GET'])
def audit_by_patient(request, patient_id): return Response([])
@api_view(['GET'])
def audit_log_api(request): return Response([])

@api_view(['GET'])
def waitingroom_entries_today_api(request): return Response([])
@api_view(['GET'])
def appointments_pending_api(request): return Response([])
@api_view(['GET'])
def current_consultation_api(request): return Response({})
@api_view(['GET'])
def appointment_detail_api(request, pk): return Response({})
@api_view(['GET'])
def reports_api(request): return Response({})
@api_view(['GET'])
def reports_export_api(request): return Response({})
@api_view(['GET'])
def documents_api(request): return Response([])
@api_view(['GET'])
def notifications_api(request): return Response([])

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