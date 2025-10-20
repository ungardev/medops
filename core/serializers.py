from rest_framework import serializers
from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'name', 'email', 'phone']


class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'appointment_date', 'status']


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
    patient_name = serializers.CharField(source="patient.name", read_only=True)

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",
            "patient_name",
            "appointment",
            "arrival_time",
            "status",
            "priority",
            "order",
        ]