from django.urls import path
from rest_framework import routers
from . import api_views
from .api_views import (
    PatientViewSet,
    AppointmentViewSet,
    PaymentViewSet,
    WaitingRoomEntryViewSet,
)

# --- Router DRF ---
router = routers.DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'waiting-room', WaitingRoomEntryViewSet)

# --- Funciones personalizadas ---
urlpatterns = [
    path("metrics/", api_views.metrics_api, name="metrics-api"),
    path("dashboard/summary/", api_views.dashboard_summary_api, name="dashboard-summary-api"),
    path("patients-list/", api_views.patients_api, name="patients-api"),
    path("appointments/today/", api_views.daily_appointments_api, name="daily-appointments-api"),
    path("payments/summary/", api_views.payment_summary_api, name="payment-summary-api"),
    path("payments/waived/", api_views.waived_consultations_api, name="waived-consultations-api"),
    path("events/", api_views.event_log_api, name="event-log-api"),   # ✅ ahora existe en api_views.py
    path("audit/aggregates/", api_views.audit_dashboard_api, name="audit-dashboard-api"),
]

# --- Unir ambos ---
urlpatterns += router.urls
