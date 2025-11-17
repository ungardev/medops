# src/core/api_urls.py
from django.urls import path
from rest_framework import routers
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
    ChargeOrderViewSet,        # 👈 añadido
    ChargeItemViewSet,         # 👈 nuevo
    MedicalTestViewSet,        # 👈 NUEVO
    MedicalReferralViewSet,    # 👈 NUEVO
    SpecialtyViewSet,          # 👈 NUEVO catálogo institucional
    update_appointment_status,
    update_waitingroom_status,
    patient_search_api,
    update_appointment_notes,
    audit_by_appointment,
    audit_by_patient,
    register_arrival,
    waitingroom_entries_today_api,
    appointments_pending_api,
    reports_api,                   # 👈 ENDPOINT DE REPORTES
    reports_export_api,            # 👈 ENDPOINT DE EXPORTACIÓN
    institution_settings_api,      # 👈 ENDPOINT DE CONFIGURACIÓN INSTITUCIONAL
    doctor_operator_settings_api,  # 👈 NUEVO ENDPOINT DE CONFIGURACIÓN MÉDICO OPERADOR
    bcv_rate_api,                  # 👈 NUEVO ENDPOINT DE TASA BCV
    audit_log_api,                 # 👈 NUEVO ENDPOINT DE AUDITORÍA REAL
    generate_medical_report,       # 👈 ENDPOINT DE INFORME MÉDICO
    generate_prescription_pdf,     # 👈 NUEVO ENDPOINT DE PRESCRIPCIÓN
    generate_treatment_pdf,        # 👈 NUEVO ENDPOINT DE TRATAMIENTO
    generate_referral_pdf,         # 👈 NUEVO ENDPOINT DE REFERENCIA MÉDICA
    generate_chargeorder_pdf,      # 👈 NUEVO ENDPOINT DE ORDEN FINANCIERA
    generate_used_documents,       # 👈 NUEVO ENDPOINT DE DOCUMENTOS DE CONSULTA
    icd_search_api,                # 👈 ENDPOINT DE BÚSQUEDA ICD-11
    # --- Endpoints de choices ---
    treatment_choices_api,
    prescription_choices_api,
    medicaltest_choices_api,
    medicalreferral_choices_api,
    specialty_choices_api,         # 👈 NUEVO ENDPOINT DE CHOICES DE ESPECIALIDADES
    current_consultation_api,
    appointment_detail_api,        # 👈 ENDPOINT DE DETALLE DE CITA
)

# --- Swagger / OpenAPI ---
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings

# --- Router DRF (CRUD básicos + acciones personalizadas) ---
router = routers.DefaultRouter()
router.register(r"patients", PatientViewSet, basename="patient")
router.register(r"appointments", AppointmentViewSet, basename="appointment")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"waitingroom", WaitingRoomEntryViewSet, basename="waitingroom")
router.register(r"genetic-predispositions", GeneticPredispositionViewSet, basename="genetic-predisposition")
router.register(r"documents", MedicalDocumentViewSet, basename="document")
router.register(r"diagnoses", DiagnosisViewSet, basename="diagnosis")
router.register(r"treatments", TreatmentViewSet, basename="treatment")
router.register(r"prescriptions", PrescriptionViewSet, basename="prescription")
router.register(r"charge-orders", ChargeOrderViewSet, basename="chargeorder")   # 👈 ordenes
router.register(r"charge-items", ChargeItemViewSet, basename="chargeitem")      # 👈 ítems
router.register(r"medical-tests", MedicalTestViewSet, basename="medicaltest")   # 👈 NUEVO
router.register(r"medical-referrals", MedicalReferralViewSet, basename="medicalreferral")  # 👈 NUEVO
router.register(r"specialties", SpecialtyViewSet, basename="specialty")         # 👈 NUEVO catálogo institucional

# --- Funciones personalizadas ---
urlpatterns = [
    # --- Login ---
    path("auth/token/", api_views.login_view, name="api-login"),

    # --- Dashboard / métricas ---
    path("metrics/", api_views.metrics_api, name="metrics-api"),
    path("dashboard/summary/", api_views.dashboard_summary_api, name="dashboard-summary-api"),

    # --- Reportes ---
    path("reports/", reports_api, name="reports-api"),
    path("reports/export/", reports_export_api, name="reports-export-api"),

    # --- Configuración ---
    path("config/institution/", institution_settings_api, name="institution-settings-api"),
    path("config/doctor/", doctor_operator_settings_api, name="doctor-operator-settings-api"),

    # --- Pacientes ---
    path("patients/search/", patient_search_api, name="patient-search-api"),

    # --- Citas ---
    path("appointments/today/", api_views.daily_appointments_api, name="daily-appointments-api"),
    path("appointments/<int:pk>/status/", update_appointment_status, name="appointment-status-api"),
    path("appointments/<int:pk>/notes/", update_appointment_notes, name="appointment-notes-api"),
    path("appointments/pending/", appointments_pending_api, name="appointments-pending-api"),
    path("appointments/<int:pk>/", appointment_detail_api, name="appointment-detail-api"),  # ✅ ENDPOINT PRINCIPAL
    path("consultations/<int:pk>/", appointment_detail_api, name="consultation-detail-api"),  # ✅ ALIAS PARA EL FRONTEND

    # --- Consultas ---
    path("consultation/current/", current_consultation_api, name="current-consultation-api"),
    path("consultations/<int:pk>/generate-report/", generate_medical_report, name="generate-medical-report"),
    path("consultations/<int:pk>/generate-used-documents/", generate_used_documents, name="generate-used-documents"),
    path("prescriptions/<int:pk>/generate-pdf/", generate_prescription_pdf, name="generate-prescription-pdf"),
    path("treatments/<int:pk>/generate-pdf/", generate_treatment_pdf, name="generate-treatment-pdf"),
    path("referrals/<int:pk>/generate-pdf/", generate_referral_pdf, name="generate-referral-pdf"),
    path("chargeorders/<int:pk>/generate-pdf/", generate_chargeorder_pdf, name="generate-chargeorder-pdf"),

    # --- Diagnósticos ICD-11 ---
    path("icd/search/", icd_search_api, name="icd-search-api"),

    # --- Pagos ---
    path("payments/summary/", api_views.payment_summary_api, name="payment-summary-api"),
    path("payments/waived/", api_views.waived_consultations_api, name="waived-consultations-api"),

    # --- Auditoría ---
    path("events/", api_views.event_log_api, name="event-log-api"),
    path("notifications/", api_views.notifications_api, name="notifications-api"),
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
]

# --- Documentación OpenAPI ---
urlpatterns += [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]

if settings.DEBUG:
    urlpatterns += [
        path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]

# --- Unir ambos ---
urlpatterns += router.urls
