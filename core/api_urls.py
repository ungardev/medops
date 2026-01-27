from django.urls import path, include
from rest_framework import routers
from rest_framework_nested import routers as nested_routers
from . import api_views
from .api_views import (
    PatientViewSet,
    AppointmentViewSet,
    PaymentViewSet,
    WaitingRoomEntryViewSet,
    GeneticPredispositionViewSet,
    MedicalDocumentViewSet,
    DiagnosisViewSet,
    TreatmentViewSet,
    PrescriptionViewSet,
    ChargeOrderViewSet,
    ChargeItemViewSet,
    MedicalTestViewSet,
    MedicalReferralViewSet,
    SpecialtyViewSet,
    # --- Nuevos ViewSets clínicos ---
    PersonalHistoryViewSet,
    FamilyHistoryViewSet,
    SurgeryViewSet,
    HabitViewSet,
    VaccineViewSet,
    VaccinationScheduleViewSet,
    PatientVaccinationViewSet,
    PatientClinicalProfileViewSet,
    AllergyViewSet,
    MedicalHistoryViewSet,
    ClinicalAlertViewSet,
    ClinicalBackgroundViewSet,
    # --- ViewSets de Direcciones ---
    CountryViewSet,
    StateViewSet,
    MunicipalityViewSet,
    CityViewSet,
    ParishViewSet,
    NeighborhoodViewSet,
    # --- ✅ NUEVO: ViewSet de Medicamentos ---
    MedicationCatalogViewSet,
    AddressChainView,
    NeighborhoodSearchView,
    # --- Funciones ---
    update_appointment_status,
    update_waitingroom_status,
    patient_search_api,
    update_appointment_notes,
    audit_by_appointment,
    audit_by_patient,
    register_arrival,
    waitingroom_entries_today_api,
    appointments_pending_api,
    reports_api,
    reports_export_api,
    institution_settings_api,
    doctor_operator_settings_api,
    bcv_rate_api,
    audit_log_api,
    generate_medical_report,
    generate_prescription_pdf,
    generate_treatment_pdf,
    generate_referral_pdf,
    generate_chargeorder_pdf,
    generate_used_documents,
    # 🔥 NUEVO: Sistema PDF Profesional
    generate_professional_pdf,  # ✅ Ya estaba importado, ahora se usará
    icd_search_api,
    treatment_choices_api,
    prescription_choices_api,
    medicaltest_choices_api,
    medicalreferral_choices_api,
    specialty_choices_api,
    current_consultation_api,
    appointment_detail_api,
    documents_api,
    search,
    appointment_search_api,
    chargeorder_search_api,
    # --- Notificaciones ---
    notifications_api,
    # --- Multi-Institución (NUEVOS ENDPOINTS) ---
    institutions_list_api,
    create_institution_api,
    add_institution_api,
    delete_institution_api,
    set_active_institution_api,
    # ✅ NUEVOS ENDPOINTS DE PERMISOS ---
    institution_permissions_api,
    refresh_emergency_access,
    # 🔥 NUEVO: Verificación de WeasyPrint
    verify_weasyprint_output,
)
# --- Swagger / OpenAPI ---
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static
# --- Router DRF principal ---
router = routers.DefaultRouter()
# --- Core ---
router.register(r"patients", PatientViewSet, basename="patient")
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"waitingroom", WaitingRoomEntryViewSet, basename="waitingroom")
router.register(r"genetic-predispositions", GeneticPredispositionViewSet, basename="genetic-predisposition")
router.register(r"documents", MedicalDocumentViewSet, basename="document")
router.register(r"diagnoses", DiagnosisViewSet, basename="diagnosis")
router.register(r"treatments", TreatmentViewSet, basename="treatment")
router.register(r"prescriptions", PrescriptionViewSet, basename="prescription")
router.register(r"charge-orders", ChargeOrderViewSet, basename="chargeorder")
router.register(r"charge-items", ChargeItemViewSet, basename="chargeitem")
router.register(r"medical-tests", MedicalTestViewSet, basename="medicaltest")
router.register(r"medical-referrals", MedicalReferralViewSet, basename="medicalreferral")
router.register(r"specialties", SpecialtyViewSet, basename="specialty")
# --- Nuevos módulos clínicos ---
router.register(r"personal-history", PersonalHistoryViewSet, basename="personal-history")
router.register(r"family-history", FamilyHistoryViewSet, basename="family-history")
router.register(r"surgeries", SurgeryViewSet, basename="surgery")
router.register(r"habits", HabitViewSet, basename="habit")
router.register(r"vaccines", VaccineViewSet, basename="vaccine")
router.register(r"vaccination-schedule", VaccinationScheduleViewSet, basename="vaccination-schedule")
router.register(r"patient-vaccinations", PatientVaccinationViewSet, basename="patient-vaccinations")
router.register(r"patient-clinical-profile", PatientClinicalProfileViewSet, basename="patient-clinical-profile")
router.register(r"medical-history", MedicalHistoryViewSet, basename="medical-history")
router.register(r"patients/(?P<patient_id>\d+)/alerts", ClinicalAlertViewSet, basename="patient-alerts")
router.register(r"clinical-background", ClinicalBackgroundViewSet, basename="clinical-background")
# --- ✅ NUEVO: Catálogo de Medicamentos ---
router.register(r"medications", MedicationCatalogViewSet, basename="medication")
# --- Direcciones ---
router.register(r"countries", CountryViewSet, basename="country")
router.register(r"states", StateViewSet, basename="state")
router.register(r"municipalities", MunicipalityViewSet, basename="municipality")
router.register(r"cities", CityViewSet, basename="city")
router.register(r"parishes", ParishViewSet, basename="parish")
router.register(r"neighborhoods", NeighborhoodViewSet, basename="neighborhood")
# --- Router anidado para pacientes ---
patients_router = nested_routers.NestedDefaultRouter(router, r"patients", lookup="patient")
patients_router.register(r"allergies", AllergyViewSet, basename="patient-allergies")
patients_router.register(r"habits", HabitViewSet, basename="patient-habits")
# --- Funciones personalizadas ---
urlpatterns = [
    # ❌ Eliminado el endpoint legacy de login que causaba CSRF
    # path("auth/token/", api_views.login_view, name="api-login"),
    
    path("metrics/", api_views.metrics_api, name="metrics-api"),
    path("dashboard/summary/", api_views.dashboard_summary_api, name="dashboard-summary-api"),
    path("reports/", reports_api, name="reports-api"),
    path("reports/export/", reports_export_api, name="reports-export-api"),
    path("config/institution/", institution_settings_api, name="institution-settings-api"),
    path("config/doctor/", doctor_operator_settings_api, name="doctor-operator-settings-api"),
    
    # ✅ NUEVOS ENDPOINTS DE PERMISOS INSTITUCIONALES ---
    path("config/institution-permissions/", institution_permissions_api, name="institution-permissions-api"),
    path("config/institution-permissions/emergency-refresh/", refresh_emergency_access, name="refresh-emergency-access-api"),
    
    path("patients/search/", patient_search_api, name="patient-search-api"),
    path("patients/<int:pk>/documents/", PatientViewSet.as_view({"get": "documents", "post": "documents"}), name="patient-documents-api"),
    path("patients/<int:pk>/documents/<int:document_id>/", PatientViewSet.as_view({"delete": "delete_document"}), name="patient-document-delete-api"),
    path("patients/<int:pk>/profile/", PatientViewSet.as_view({"get": "profile"}), name="patient-clinical-profile"),
    
    path("appointments/search/", appointment_search_api, name="appointment-search-api"),
    path("appointments/today/", api_views.daily_appointments_api, name="daily-appointments-api"),
    path("appointments/<int:pk>/status/", update_appointment_status, name="appointment-status-api"),
    path("appointments/<int:pk>/notes/", update_appointment_notes, name="appointment-notes-api"),
    path("appointments/pending/", appointments_pending_api, name="appointments-pending-api"),
    path("appointments/<int:pk>/", appointment_detail_api, name="appointment-detail-api"),
    
    path("consultations/<int:pk>/", appointment_detail_api, name="consultation-detail-api"),
    path("consultation/current/", current_consultation_api, name="current-consultation-api"),
    path("consultations/<int:pk>/generate-report/", generate_medical_report, name="generate-medical-report"),
    path("consultations/<int:pk>/generate-used-documents/", generate_used_documents, name="generate-used-documents"),
    
    # --- PDFs Legacy (ReportLab) ---
    path("prescriptions/<int:pk>/generate-pdf/", generate_prescription_pdf, name="generate-prescription-pdf"),
    path("treatments/<int:pk>/generate-pdf/", generate_treatment_pdf, name="generate-treatment-pdf"),
    path("referrals/<int:pk>/generate-pdf/", generate_referral_pdf, name="generate-referral-pdf"),
    path("chargeorders/<int:pk>/generate-pdf/", generate_chargeorder_pdf, name="generate-chargeorder-pdf"),
    path("charge-orders/<int:pk>/export/", generate_chargeorder_pdf, name="chargeorder-export"),
    
    # 🔥 NUEVO: Sistema PDF Profesional (WeasyPrint) ---
    path("pdf/generate/", generate_professional_pdf, name="generate-professional-pdf"),
    path("pdf/verify-weasyprint/", verify_weasyprint_output, name="verify-weasyprint"),
    
    path("documents/", documents_api, name="documents-api"),
    path("icd/search/", icd_search_api, name="icd-search-api"),
    
    path("payments/summary/", api_views.payment_summary_api, name="payment-summary-api"),
    path("payments/waived/", api_views.waived_consultations_api, name="waived-consultations-api"),
    path("charge-orders/search/", chargeorder_search_api, name="chargeorder-search-api"),
    
    # --- Auditoría ---
    path("events/", api_views.event_log_api, name="event-log-api"),
    path("notifications/", notifications_api, name="notifications-api"),
    path("audit/aggregates/", api_views.audit_dashboard_api, name="audit-dashboard-api"),
    path("audit/appointment/<int:appointment_id>/", audit_by_appointment, name="audit-by-appointment"),
    path("audit/patient/<int:patient_id>/", audit_by_patient, name="audit-by-patient"),
    path("audit/log/", audit_log_api, name="audit-log-api"),
    
    # --- Sala de Espera ---
    path("waitingroom/groups-today/", api_views.waitingroom_groups_today_api, name="waitingroom-groups-today-api"),
    path("waitingroom/today/entries/", waitingroom_entries_today_api, name="waitingroom-entries-today-api"),
    path("waitingroom/<int:pk>/status/", update_waitingroom_status, name="waitingroom-status-api"),
    path("waitingroom/register/", register_arrival, name="waitingroom-register"),
    
    # --- Tasa BCV ---
    path("bcv-rate/", bcv_rate_api, name="bcv-rate-api"),
    
    # --- Choices ---
    path("choices/treatment/", treatment_choices_api, name="treatment-choices-api"),
    path("choices/prescription/", prescription_choices_api, name="prescription-choices-api"),
    path("choices/medical-test/", medicaltest_choices_api, name="medicaltest-choices-api"),
    path("choices/medical-referral/", medicalreferral_choices_api, name="medicalreferral-choices-api"),
    path("choices/specialty/", specialty_choices_api, name="specialty-choices-api"),
    
    # --- Búsqueda institucional general ---
    path("search/", search, name="search-api"),
    
    # --- Endpoints de Direcciones ---
    path("address-chain/", AddressChainView.as_view(), name="address-chain-api"),
    path("neighborhood-search/", NeighborhoodSearchView.as_view(), name="neighborhood-search-api"),
    
    # --- Multi-Institución (NUEVOS ENDPOINTS) ---
    path("config/institutions/", institutions_list_api, name="institutions-list-api"),
    path("config/institutions/create/", create_institution_api, name="create-institution-api"),
    path("config/institutions/add/", add_institution_api, name="add-institution-api"),
    path("config/institutions/<int:institution_id>/delete/", delete_institution_api, name="delete-institution-api"),
    path("config/institutions/<int:institution_id>/set-active/", set_active_institution_api, name="set-active-institution-api"),
]
# --- Documentación OpenAPI ---
urlpatterns += [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]
if settings.DEBUG:
    urlpatterns += [
        path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]
# --- Routers principales y anidados ---
urlpatterns += router.urls
urlpatterns += patients_router.urls
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)