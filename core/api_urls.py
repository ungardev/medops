from django.urls import path
from rest_framework import routers
from . import api_views
from .api_views import (
    PatientViewSet,
    AppointmentViewSet,
    PaymentViewSet,
    WaitingRoomEntryViewSet,
    GeneticPredispositionViewSet,   # 👈 añadido
    update_appointment_status,
    update_waitingroom_status,
    patient_search_api,
    update_appointment_notes,
    audit_by_appointment,
    audit_by_patient,
    register_arrival,
    waitingroom_entries_today_api,
    MedicalDocumentViewSet,         # 👈 nuevo import
    appointments_pending_api,       # 👈 nuevo import para citas pendientes
)

# --- Swagger / OpenAPI ---
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings

# --- Router DRF (CRUD básicos + acciones personalizadas) ---
router = routers.DefaultRouter()
router.register(r"patients", PatientViewSet)
router.register(r"appointments", AppointmentViewSet)
router.register(r"payments", PaymentViewSet)
router.register(r"waitingroom", WaitingRoomEntryViewSet)
router.register(r"genetic-predispositions", GeneticPredispositionViewSet)  # 👈 endpoint predisposiciones
router.register(r"documents", MedicalDocumentViewSet)                      # 👈 nuevo endpoint documentos

# --- Funciones personalizadas ---
urlpatterns = [
    # --- Login ---
    path("auth/token/", api_views.login_view, name="api-login"),

    # --- Dashboard / métricas ---
    path("metrics/", api_views.metrics_api, name="metrics-api"),
    path("dashboard/summary/", api_views.dashboard_summary_api, name="dashboard-summary-api"),

    # --- Pacientes ---
    path("patients/search/", patient_search_api, name="patient-search-api"),
    # 👉 Nota: /patients/{id}/payments/, /patients/{id}/documents/,
    #          /patients/{id}/completed_appointments/ y /patients/{id}/pending_appointments/
    #          se exponen automáticamente por PatientViewSet

    # --- Citas ---
    path("appointments/today/", api_views.daily_appointments_api, name="daily-appointments-api"),
    path("appointments/<int:pk>/status/", update_appointment_status, name="appointment-status-api"),
    path("appointments/<int:pk>/notes/", update_appointment_notes, name="appointment-notes-api"),
    path("appointments/pending/", appointments_pending_api, name="appointments-pending-api"),  # 👈 NUEVO ENDPOINT

    # --- Consultas ---
    path("consultation/current/", api_views.current_consultation_api, name="current-consultation-api"),

    # --- Pagos ---
    path("payments/summary/", api_views.payment_summary_api, name="payment-summary-api"),
    path("payments/waived/", api_views.waived_consultations_api, name="waived-consultations-api"),

    # --- Auditoría ---
    path("events/", api_views.event_log_api, name="event-log-api"),
    path("audit/aggregates/", api_views.audit_dashboard_api, name="audit-dashboard-api"),
    path("audit/appointment/<int:appointment_id>/", audit_by_appointment, name="audit-by-appointment"),
    path("audit/patient/<int:patient_id>/", audit_by_patient, name="audit-by-patient"),

    # --- Sala de Espera ---
    path("waitingroom/groups-today/", api_views.waitingroom_groups_today_api, name="waitingroom-groups-today-api"),
    path("waitingroom/today/entries/", waitingroom_entries_today_api, name="waitingroom-entries-today-api"),
    path("waitingroom/<int:pk>/status/", update_waitingroom_status, name="waitingroom-status-api"),
    path("waitingroom/register/", register_arrival, name="waitingroom-register"),
]

# --- Documentación OpenAPI ---
urlpatterns += [
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
]

if settings.DEBUG:  # 👈 Swagger solo en desarrollo
    urlpatterns += [
        path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]

# --- Unir ambos ---
urlpatterns += router.urls
