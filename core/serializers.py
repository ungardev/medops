from rest_framework import serializers
from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry


class PatientSerializer(serializers.ModelSerializer):
    # Campo calculado que concatena first_name + last_name
    name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ['id', 'name']  # solo los campos que existen en el modelo

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    patient_name = serializers.CharField(source="patient.__str__", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient',
            'patient_name',
            'appointment_date',
            'appointment_type',
            'expected_amount',
            'status',
            'arrival_time',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    appointment = AppointmentSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'appointment', 'amount', 'method', 'status']


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'timestamp', 'entity', 'entity_id', 'action', 'metadata']


class WaitingRoomEntrySerializer(serializers.ModelSerializer):
    # Usamos el PatientSerializer, que ya expone "name"
    patient = PatientSerializer(read_only=True)
    patient_name = serializers.CharField(source="patient.__str__", read_only=True)
    appointment_id = serializers.IntegerField(source="appointment.id", read_only=True)

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",
            "patient_name",
            "appointment_id",
            "arrival_time",
            "status",
            "priority",
            "order",
        ]


# 🔹 Serializer para el resumen ejecutivo del Dashboard
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
