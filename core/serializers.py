from rest_framework import serializers
from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry


# --- Pacientes ---
class PatientSerializer(serializers.ModelSerializer):
    # Campo calculado que concatena nombres y apellidos
    name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ["id", "name"]

    def get_name(self, obj):
        parts = [obj.first_name, obj.middle_name, obj.last_name, obj.second_last_name]
        return " ".join(filter(None, parts))


# --- Citas ---
class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",           # 👈 incluye id y name
            "appointment_date",
            "appointment_type",
            "expected_amount",
            "status",
            "arrival_time",
            "notes",
        ]


# --- Pagos ---
class PaymentSerializer(serializers.ModelSerializer):
    appointment_date = serializers.DateField(source="appointment.appointment_date", read_only=True)
    patient = PatientSerializer(source="appointment.patient", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "appointment",
            "appointment_date",
            "patient",          # 👈 objeto con id y name
            "amount",
            "method",
            "status",
            "reference_number",
            "bank_name",
            "received_by",
            "received_at",
        ]


# --- Eventos (auditoría) ---
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "timestamp", "entity", "entity_id", "action", "metadata"]


# --- Sala de espera ---
class WaitingRoomEntrySerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    appointment_id = serializers.IntegerField(source="appointment.id", read_only=True)

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",          # 👈 objeto con id y name
            "appointment_id",
            "arrival_time",
            "status",
            "priority",
            "order",
        ]


# --- Resumen ejecutivo del Dashboard ---
class DashboardSummarySerializer(serializers.Serializer):
    total_patients = serializers.IntegerField()
    total_appointments = serializers.IntegerField()
    completed_appointments = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    total_payments = serializers.IntegerField()
    total_events = serializers.IntegerField()
    total_waived = serializers.IntegerField()
    total_payments_amount = serializers.FloatField()
    estimated_waived_amount = serializers.FloatField()
    financial_balance = serializers.FloatField()

    # 🔹 Nuevos campos para tendencias
    appointments_trend = serializers.ListField()
    payments_trend = serializers.ListField()
    balance_trend = serializers.ListField()
