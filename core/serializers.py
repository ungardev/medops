from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Patient, Appointment, Payment, Event, WaitingRoomEntry,
    Diagnosis, Treatment, Prescription, MedicalDocument, GeneticPredisposition,
    ChargeOrder, ChargeItem
)
from datetime import date
from typing import Optional
from decimal import Decimal, InvalidOperation

# --- Pacientes ---
class GeneticPredispositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneticPredisposition
        fields = ["id", "name", "description"]


class PatientWriteSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar pacientes"""
    genetic_predispositions = serializers.PrimaryKeyRelatedField(
        queryset=GeneticPredisposition.objects.all(),
        many=True,
        required=False
    )

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
            "genetic_predispositions",  # 👈 añadido
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
            "genetic_predispositions": {"required": False},  # 👈 añadido
        }


class PatientReadSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    allergies = serializers.CharField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "full_name",
            "national_id",
            "email",
            "age",
            "allergies",
            "gender",   # 👈 añadido
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
    genetic_predispositions = GeneticPredispositionSerializer(many=True, read_only=True)

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
            "genetic_predispositions",  # 👈 añadido
            "active",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        parts = [obj.first_name, obj.middle_name, obj.last_name, obj.second_last_name]
        return " ".join(filter(None, parts))


# --- Diagnósticos, Tratamientos y Prescripciones ---
class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ["id", "medication", "dosage", "duration"]


class TreatmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treatment
        fields = ["id", "plan", "start_date", "end_date"]


class DiagnosisSerializer(serializers.ModelSerializer):
    treatments = TreatmentSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    class Meta:
        model = Diagnosis
        fields = ["id", "code", "description", "treatments", "prescriptions"]


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


class AppointmentDetailSerializer(AppointmentSerializer):
    diagnoses = DiagnosisSerializer(many=True, read_only=True)
    balance_due = serializers.SerializerMethodField()

    class Meta(AppointmentSerializer.Meta):
        fields = AppointmentSerializer.Meta.fields + [
            "diagnoses",
            "balance_due",
        ]

    def get_balance_due(self, obj):
        try:
            return float(obj.balance_due())
        except Exception:
            return 0.0


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
            "patient",
            "charge_order",       # 👈 NUEVO: vínculo obligatorio
            "amount",
            "currency",           # 👈 NUEVO
            "method",
            "status",
            "reference_number",
            "bank_name",
            "received_by",
            "received_at",
            "idempotency_key",    # 👈 NUEVO
        ]
        read_only_fields = ("status", "received_at")

    def validate(self, attrs):
        amount = attrs.get("amount")
        order = attrs.get("charge_order")
        if amount is None or amount <= Decimal("0.00"):
            raise serializers.ValidationError("El monto debe ser mayor a 0.")
        if order and order.status == "void":
            raise serializers.ValidationError("No se puede pagar una orden anulada.")
        order.recalc_totals()
        if amount > order.balance_due:
            raise serializers.ValidationError("El monto excede el saldo pendiente de la orden.")
        return attrs


# --- Documentos clínicos ---
class MedicalDocumentSerializer(serializers.ModelSerializer):
    # write_only: se envía en POST pero no se devuelve en GET
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        write_only=True
    )

    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "patient",        # write-only
            "description",
            "category",
            "uploaded_at",
            "uploaded_by",
            "file",
        ]
        read_only_fields = ["id", "uploaded_at", "uploaded_by"]


# --- Eventos (auditoría) ---
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "timestamp", "actor", "entity", "entity_id", "action", "metadata"]


# --- Sala de espera (básico) ---
class WaitingRoomEntrySerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)
    appointment_id = serializers.IntegerField(source="appointment.id", read_only=True)
    appointment_status = serializers.SerializerMethodField()

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",
            "appointment_id",
            "appointment_status",
            "arrival_time",
            "status",
            "priority",
            "source_type",
            "order",
        ]

    def get_appointment_status(self, obj):
        """
        Devuelve el estado del Appointment si existe,
        normalizando 'arrived' como 'waiting' para la UI.
        """
        if obj.appointment:
            status = obj.appointment.status
            if status == "arrived":
                return "waiting"
            return status
        return obj.status


# --- Sala de espera (detallado con cita completa) ---
class WaitingRoomEntryDetailSerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)
    appointment = AppointmentSerializer(read_only=True)
    effective_status = serializers.SerializerMethodField()

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
            "effective_status",  # 👈 añadido para consistencia
        ]

    def get_effective_status(self, obj):
        """
        Igual que en el serializer básico: arrived → waiting.
        """
        if obj.appointment:
            status = obj.appointment.status
            if status == "arrived":
                return "waiting"
            return status
        return obj.status


# --- Citas pendientes con pagos ---
class AppointmentPendingSerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    financial_status = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "appointment_date",
            "expected_amount",
            "patient",
            "payments",
            "financial_status",
        ]

    def get_financial_status(self, obj):
        def safe_decimal(value):
            try:
                return Decimal(str(value or "0"))
            except (InvalidOperation, TypeError, ValueError):
                return Decimal("0")

        expected = safe_decimal(obj.expected_amount)
        total_paid = sum(
            safe_decimal(p.amount) for p in obj.payments.all() if p.status == "confirmed"
        )

        if total_paid >= expected and expected > 0:
            return "paid"
        return "pending"


class ChargeItemSerializer(serializers.ModelSerializer):
    # 👇 Forzamos a que se serialicen como float
    qty = serializers.FloatField()
    unit_price = serializers.FloatField()
    subtotal = serializers.FloatField(read_only=True)

    class Meta:
        model = ChargeItem
        fields = [
            "id",
            "order",          # campo real en el modelo
            "code",
            "description",
            "qty",
            "unit_price",
            "subtotal",
        ]
        read_only_fields = ["id", "subtotal"]

    def validate(self, data):
        qty = data.get("qty", 1)
        unit_price = data.get("unit_price", 0)
        if qty <= 0:
            raise serializers.ValidationError({"qty": "La cantidad debe ser mayor a 0"})
        if unit_price < 0:
            raise serializers.ValidationError({"unit_price": "El precio no puede ser negativo"})
        return data


class ChargeOrderSerializer(serializers.ModelSerializer):
    # 👇 Forzamos a que se serialicen como float en vez de string
    total = serializers.FloatField(read_only=True)
    balance_due = serializers.FloatField(read_only=True)
    items = ChargeItemSerializer(many=True, read_only=True)  # solo lectura

    class Meta:
        model = ChargeOrder
        fields = (
            "id", "appointment", "patient", "currency",
            "total", "balance_due", "status",
            "issued_at", "issued_by", "items"
        )
        read_only_fields = ("total", "balance_due", "status", "issued_at")

    def create(self, validated_data):
        # Normalmente no se crean ítems aquí, se agregan después
        order = ChargeOrder.objects.create(**validated_data)
        order.recalc_totals()
        order.save(update_fields=["total", "balance_due"])
        return order


class ChargeOrderPaymentSerializer(serializers.ModelSerializer):
    # Aliases para Pagos
    appointment_date = serializers.DateTimeField(source="issued_at", read_only=True)
    total_amount = serializers.DecimalField(source="total", max_digits=10, decimal_places=2, read_only=True)
    patient_detail = PatientReadSerializer(source="patient", read_only=True)
    items = ChargeItemSerializer(many=True, read_only=True)

    class Meta:
        model = ChargeOrder
        fields = (
            # Campos originales (compatibilidad)
            "id", "appointment", "patient", "currency",
            "total", "balance_due", "status",
            "issued_at", "issued_by", "items",
            # Aliases nuevos para Pagos
            "appointment_date", "total_amount", "patient_detail",
        )


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
