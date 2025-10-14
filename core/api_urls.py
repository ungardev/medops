from django.urls import path
from . import api_views

urlpatterns = [
    path("patients/", api_views.patients_api, name="patients-api"),
    path("metrics/", api_views.metrics_api, name="metrics-api"),
    path("appointments/today/", api_views.daily_appointments_api, name="daily-appointments-api"),
    path("payments/summary/", api_views.payment_summary_api, name="payment-summary-api"),
    path("payments/waived/", api_views.waived_consultations_api, name="waived-consultations-api"),
    path("events/", api_views.event_log_api, name="event-log-api"),
    path("audit/aggregates/", api_views.audit_dashboard_api, name="audit-dashboard-api"),
]
