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
    # Usamos el PatientSerializer, que ya expone "name"
    patient = PatientSerializer(read_only=True)

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",
            "appointment",
            "arrival_time",
            "status",
            "priority",
            "order",
        ]
