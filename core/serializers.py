from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Patient, Appointment, Payment, Event, WaitingRoomEntry
from datetime import date
from typing import Optional

# --- Pacientes ---
class PatientWriteSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar pacientes"""
    class Meta:
        model = Patient
        fields = [
            "id",
            "first_name",
            "middle_name",
            "last_name",
            "second_last_name",
            "national_id",
            "birthdate",
            "gender",
            "contact_info",
            "email",
            "address",
            "weight",
            "height",
            "blood_type",
            "allergies",
            "medical_history",
            "active",
        ]
        extra_kwargs = {
            "birthdate": {"required": False, "allow_null": True},
            "gender": {"required": False, "allow_null": True},
            "email": {"required": False, "allow_blank": True},
            "address": {"required": False, "allow_blank": True},
            "weight": {"required": False, "allow_null": True},
            "height": {"required": False, "allow_null": True},
            "blood_type": {"required": False, "allow_null": True},
            "allergies": {"required": False, "allow_blank": True},
            "medical_history": {"required": False, "allow_blank": True},
        }


class PatientReadSerializer(serializers.ModelSerializer):
    """Serializer ligero para búsquedas y referencias"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ["id", "full_name", "national_id", "email"]

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        parts = [obj.first_name, obj.middle_name, obj.last_name, obj.second_last_name]
        return " ".join(filter(None, parts))


class PatientListSerializer(serializers.ModelSerializer):
    """Serializer para listar pacientes en tabla (Pacientes.tsx)"""
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id",           # usado como folio en la tabla
            "full_name",
            "age",
            "gender",
            "contact_info",
        ]

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        parts = [obj.first_name, obj.middle_name, obj.last_name, obj.second_last_name]
        return " ".join(filter(None, parts))

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_age(self, obj) -> Optional[int]:
        if not obj.birthdate:
            return None
        today = date.today()
        return today.year - obj.birthdate.year - (
            (today.month, today.day) < (obj.birthdate.month, obj.birthdate.day)
        )


class PatientDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para la vista detallada"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id",
            "full_name",
            "national_id",
            "first_name",
            "middle_name",
            "last_name",
            "second_last_name",
            "birthdate",
            "gender",
            "contact_info",
            "email",
            "address",
            "weight",
            "height",
            "blood_type",
            "allergies",
            "medical_history",
            "active",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        parts = [obj.first_name, obj.middle_name, obj.last_name, obj.second_last_name]
        return " ".join(filter(None, parts))


# --- Citas ---
class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",           # incluye id, full_name y email
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
    patient = PatientReadSerializer(source="appointment.patient", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "appointment",
            "appointment_date",
            "patient",          # objeto con id, full_name y email
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


# --- Sala de espera (básico) ---
class WaitingRoomEntrySerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)
    appointment_id = serializers.IntegerField(source="appointment.id", read_only=True)

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",          # objeto con id, full_name y email
            "appointment_id",
            "arrival_time",
            "status",
            "priority",
            "source_type",
            "order",
        ]


# --- Sala de espera (detallado con cita completa) ---
class WaitingRoomEntryDetailSerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)
    appointment = AppointmentSerializer(read_only=True)

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",
            "appointment",
            "arrival_time",
            "status",
            "priority",
            "source_type",
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

    appointments_trend = serializers.ListField()
    payments_trend = serializers.ListField()
    balance_trend = serializers.ListField()
