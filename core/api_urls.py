# core/api_urls.py
from django import views
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
    # --- ✅ NUEVO: ViewSets de Catálogo de Facturación ---
    BillingCategoryViewSet,
    BillingItemViewSet,
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
    generate_professional_pdf,
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
    # 🆕 MERCANTIL P2C ENDPOINTS (ya existen en api_views.py) ---
    mercantil_p2c_generate_qr,
    mercantil_p2c_check_status,
    mercantil_p2c_webhook,
    mercantil_p2c_config_status,
    # 🆕 VERIFICACIÓN DE PAGOS MÓVILES ---
    verify_mobile_payment,
    # 🆕 NUEVO: Dashboard de institución activa
    active_institution_dashboard_api,
    # ✅ NUEVO: Dashboard con 8 métricas y filtros
    active_institution_with_metrics,
    # 🆕 NUEVO: Start Consultation from Waiting Room Entry
    start_consultation_from_entry,
    # ✅ NUEVOS ENDPOINTS DE SIGNOS VITALES ---
    vital_signs_api,
    vital_signs_detail_api,
    # ✅ NUEVOS ENDPOINTS DE CHARGE ORDER POR APPOINTMENT ---
    appointment_charge_order_api,
    create_charge_order_from_appointment,
    # ✅ NUEVOS ENDPOINTS DE CLINICAL NOTE ---
    clinical_note_api,
    clinical_note_lock_api,
    # ✅ NUEVO: Endpoint público de ubicación ---
    public_institution_location_api,
    add_charge_order_items,
    # Pacientes Pediátricos
    patient_dependents,
    register_minor,
    minor_verification,
    approve_minor_consent,
    # Portal Paciente
    patient_register,
    patient_login,
    patient_logout,
    patient_dashboard,
    patient_profile,
    patient_appointments,
    whatsapp_config_api,
    whatsapp_send_message,
    whatsapp_webhook,
    payment_gateways_api,
    payment_config_api,
    payment_config_public_api,
    payment_create_api,
    payment_transactions_api,
    payment_stats_api,
    webhook_mercantil,
    webhook_banesco,
    webhook_binance,
    subscriptions_api,
    subscription_cancel_api,
    # ViewSets
    PaymentGatewayViewSet,
    DoctorPaymentConfigViewSet,
    PaymentTransactionViewSet,
    PaymentWebhookViewSet,
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
# --- ✅ NUEVO: Catálogo de Facturación ---
router.register(r"billing-categories", BillingCategoryViewSet, basename="billingcategory")
router.register(r"billing-items", BillingItemViewSet, basename="billingitem")
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
router.register(r'payment-gateways', PaymentGatewayViewSet, basename='payment-gateways')
router.register(r'payment-config', DoctorPaymentConfigViewSet, basename='payment-config')
router.register(r'payment-transactions', PaymentTransactionViewSet, basename='payment-transactions')
router.register(r'payment-webhooks', PaymentWebhookViewSet, basename='payment-webhooks')
# --- Funciones personalizadas ---
urlpatterns = [
    path("metrics/", api_views.metrics_api, name="metrics-api"),
    path("dashboard/summary/", api_views.dashboard_summary_api, name="dashboard-summary-api"),
    path("dashboard/active-institution/", active_institution_dashboard_api, name="active-institution-dashboard-api"),
    path("dashboard/active-institution-metrics/", active_institution_with_metrics, name="active-institution-metrics-api"),
    path("reports/", reports_api, name="reports-api"),
    path("reports/export/", reports_export_api, name="reports-export-api"),
    path("config/institution/", institution_settings_api, name="institution-settings-api"),
    path("config/doctor/", doctor_operator_settings_api, name="doctor-operator-settings-api"),
    
    # ✅ NUEVOS ENDPOINTS DE PERMISOS INSTITUCIONALES ---
    path("config/institution-permissions/", institution_permissions_api, name="institution-permissions-api"),
    path("config/institution-permissions/emergency-refresh/", refresh_emergency_access, name="refresh-emergency-access-api"),
    
    # ✅ NUEVO: Endpoint público de ubicación (OperationalHub) ---
    path("public/institution/location/", public_institution_location_api, name="public-institution-location-api"),
    
    path("patients/search/", patient_search_api, name="patient-search-api"),
    path("patients/<int:pk>/documents/", PatientViewSet.as_view({"get": "documents", "post": "documents"}), name="patient-documents-api"),
    path("patients/<int:pk>/documents/<int:document_id>/", PatientViewSet.as_view({"delete": "delete_document"}), name="patient-document-delete-api"),
    path("patients/<int:pk>/profile/", PatientViewSet.as_view({"get": "profile"}), name="patient-clinical-profile-api"),
    
    path("appointments/search/", appointment_search_api, name="appointment-search-api"),
    path("appointments/today/", api_views.daily_appointments_api, name="daily-appointments-api"),
    path("appointments/<int:pk>/status/", update_appointment_status, name="appointment-status-api"),
    path("appointments/<int:pk>/notes/", update_appointment_notes, name="appointment-notes-api"),
    path("appointments/pending/", appointments_pending_api, name="appointments-pending-api"),
    path("appointments/<int:pk>/", appointment_detail_api, name="appointment-detail-api"),
    
    # ✅ ENDPOINTS DE SIGNOS VITALES ---
    path("appointments/<int:appointment_id>/vital-signs/", vital_signs_api, name="vital-signs-api"),
    path("vital-signs/<int:vital_signs_id>/", vital_signs_detail_api, name="vital-signs-detail-api"),
    
    # ✅ ENDPOINTS DE CHARGE ORDER POR APPOINTMENT ---
    path("appointments/<int:appointment_id>/charge-order/", appointment_charge_order_api, name="appointment-charge-order-api"),
    path("appointments/<int:appointment_id>/charge-order/create/", create_charge_order_from_appointment, name="create-charge-order-from-appointment"),
    path("appointments/<int:appointment_id>/charge-order/add-items/", add_charge_order_items, name="add-charge-order-items"),
    
    # ✅ ENDPOINTS DE CLINICAL NOTE ---
    path("appointments/<int:appointment_id>/clinical-note/", clinical_note_api, name="clinical-note-api"),
    path("appointments/<int:appointment_id>/clinical-note/lock/", clinical_note_lock_api, name="clinical-note-lock-api"),
    
    path("consultations/<int:pk>/", appointment_detail_api, name="consultation-detail-api"),
    path("consultations/current/", current_consultation_api, name="current-consultation-api"),
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
    
    # --- Payments URLs (EXISTENTES + NUEVAS) ---
    path("payments/summary/", api_views.payment_summary_api, name="payment-summary-api"),
    path("payments/waived/", api_views.waived_consultations_api, name="waived-consultations-api"),
    path("charge-orders/search/", chargeorder_search_api, name="chargeorder-search-api"),
    
    # 🆕 MERCANTIL P2C ENDPOINTS ---
    path("payments/p2c/mercantil/generate-qr/", mercantil_p2c_generate_qr, name="mercantil_p2c_generate_qr"),
    path("payments/p2c/mercantil/status/<str:merchant_order_id>/", mercantil_p2c_check_status, name="mercantil_p2c_check_status"),
    path("webhooks/mercantil-p2c/", mercantil_p2c_webhook, name="mercantil_p2c_webhook"),
    path("payments/p2c/mercantil/config-status/", mercantil_p2c_config_status, name="mercantil_p2c_config_status"),
    
    # 🆕 VERIFICACIÓN DE PAGOS MÓVILES ---
    path("payments/verify-mobile-payment/", verify_mobile_payment, name="verify-mobile-payment"),
    
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
    path("waitingroom/<int:entry_id>/start-consultation/", start_consultation_from_entry, name="start-consultation-from-entry"),
    
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
    
    # --- Multi-Institución ---
    path("config/institutions/", institutions_list_api, name="institutions-list-api"),
    path("config/institutions/create/", create_institution_api, name="create-institution-api"),
    path("config/institutions/add/", add_institution_api, name="add-institution-api"),
    path("config/institutions/<int:institution_id>/delete/", delete_institution_api, name="delete-institution-api"),
    path("config/institutions/<int:institution_id>/set-active/", set_active_institution_api, name="set-active-institution-api"),
    # Pacientes Pediátricos
    path('patients/<int:patient_id>/dependents/', api_views.patient_dependents, name='patient-dependents'),
    path('patients/register-minor/', api_views.register_minor, name='register-minor'),
    path('patients/minor-verification/', api_views.minor_verification, name='minor-verification'),
    path('patients/<int:patient_id>/approve-consent/', api_views.approve_minor_consent, name='approve-minor-consent'),
    # --- Portal Paciente - Autenticación ---
    path('patient-auth/register/', api_views.patient_register, name='patient-register'),
    path('patient-auth/login/', api_views.patient_login, name='patient-login'),
    path('patient-auth/logout/', api_views.patient_logout, name='patient-logout'),
    # --- Portal Paciente - Datos ---
    path('patient-dashboard/', api_views.patient_dashboard, name='patient-dashboard'),
    path('patient-profile/', api_views.patient_profile, name='patient-profile'),
    path('patient-appointments/', api_views.patient_appointments, name='patient-appointments'),
    # WhatsApp API
    path('whatsapp/config/', api_views.whatsapp_config_api, name='whatsapp-config'),
    path('whatsapp/send/', api_views.whatsapp_send_message, name='whatsapp-send'),
    path('whatsapp/webhook/', api_views.whatsapp_webhook, name='whatsapp-webhook'),
    # === Payment System URLs ===
    path('payments/gateways/', payment_gateways_api, name='payment-gateways-api'),
    path('payments/config/', payment_config_api, name='payment-config-api'),
    path('payments/config/public/', payment_config_public_api, name='payment-config-public-api'),
    path('payments/create/', payment_create_api, name='payment-create-api'),
    path('payments/transactions/', payment_transactions_api, name='payment-transactions-api'),
    path('payments/stats/', payment_stats_api, name='payment-stats-api'),
    # Webhooks
    path('payments/webhook/mercantil/', webhook_mercantil, name='webhook-mercantil'),
    path('payments/webhook/banesco/', webhook_banesco, name='webhook-banesco'),
    path('payments/webhook/binance/', webhook_binance, name='webhook-binance'),
    # Subscriptions
    path('subscriptions/', subscriptions_api, name='subscriptions-api'),
    path('subscriptions/<int:pk>/cancel/', subscription_cancel_api, name='subscription-cancel-api'),
]
# --- Documentación OpenAPI ---
urlpatterns += [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]
urlpatterns += router.urls
urlpatterns += patients_router.urls
if settings.DEBUG:
    urlpatterns += [
        path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)