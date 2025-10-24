from django.urls import path
from rest_framework import routers
from . import api_views
from .api_views import (
    PatientViewSet,
    AppointmentViewSet,
    PaymentViewSet,
    WaitingRoomEntryViewSet,
    update_appointment_status,
    update_waitingroom_status,
    waitingroom_list_api,
    patient_search_api,        # 👈 búsqueda de pacientes
    update_appointment_notes,  # 👈 nueva vista para notas de consulta
    audit_by_appointment,      # 👈 historial de auditoría por cita
    audit_by_patient,          # 👈 historial de auditoría por paciente
)

# --- Router DRF (CRUD básicos + acciones personalizadas) ---
router = routers.DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'waitingroom', WaitingRoomEntryViewSet)
# Nota: esto expone automáticamente:
#   - PATCH /waitingroom/{id}/promote_to_emergency/
#   - POST  /waitingroom/close_day/
#   - CRUD completo de WaitingRoomEntry

# --- Funciones personalizadas ---
urlpatterns = [
    # --- Dashboard / métricas ---
    path("metrics/", api_views.metrics_api, name="metrics-api"),
    path("dashboard/summary/", api_views.dashboard_summary_api, name="dashboard-summary-api"),

    # --- Pacientes ---
    path("patients-list/", api_views.patients_api, name="patients-api"),
    path("patients/search/", patient_search_api, name="patient-search-api"),

    # --- Citas ---
    path("appointments/today/", api_views.daily_appointments_api, name="daily-appointments-api"),
    path("appointments/<int:pk>/status/", update_appointment_status, name="appointment-status-api"),
    path("appointments/<int:pk>/notes/", update_appointment_notes, name="appointment-notes-api"),

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
    path("waitingroom/", waitingroom_list_api, name="waitingroom-list-api"),
    path("waitingroom/<int:pk>/status/", update_waitingroom_status, name="waitingroom-status-api"),
    # Nota: /waitingroom/close_day/ se expone vía ViewSet
]

# --- Unir ambos ---
urlpatterns += router.urls
