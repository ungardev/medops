from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Patient, Appointment, Payment, Event, WaitingRoomEntry,
    Diagnosis, Treatment, Prescription, MedicalDocument, GeneticPredisposition,
    ChargeOrder, ChargeItem, InstitutionSettings, DoctorOperator, MedicalReport,
    ICD11Entry, MedicalTest, MedicalReferral, Specialty, MedicationCatalog, PrescriptionComponent,
    PersonalHistory, FamilyHistory, Surgery, Habit, Vaccine, VaccinationSchedule, PatientVaccination,
    Allergy, MedicalHistory, ClinicalAlert
)
from .choices import UNIT_CHOICES, ROUTE_CHOICES, FREQUENCY_CHOICES
from datetime import date
from typing import Optional, Any, cast
from decimal import Decimal, InvalidOperation
from django.db import models

# --- Pacientes ---
class GeneticPredispositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeneticPredisposition
        fields = ["id", "name", "description"]


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = ["id", "name", "severity", "source", "notes", "created_at", "updated_at"]

class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = ["id", "condition", "status", "source", "notes", "created_at", "updated_at"]


# 🔹 Serializer para crear/actualizar pacientes (sin campo active)
class PatientWriteSerializer(serializers.ModelSerializer):
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
            "birth_place",
            "birth_country",
            "gender",
            "contact_info",
            "email",
            "address",
            "weight",
            "height",
            "blood_type",
            "genetic_predispositions",
        ]
        extra_kwargs = {
            "birthdate": {"required": False, "allow_null": True},
            "birth_place": {"required": False, "allow_blank": True},
            "birth_country": {"required": False, "allow_blank": True},
            "gender": {"required": False, "allow_null": True},
            "email": {"required": False, "allow_blank": True},
            "address": {"required": False, "allow_blank": True},
            "weight": {"required": False, "allow_null": True},
            "height": {"required": False, "allow_null": True},
            "blood_type": {"required": False, "allow_null": True},
            "genetic_predispositions": {"required": False},
        }

    def create(self, validated_data):
        preds = validated_data.pop("genetic_predispositions", None)
        instance = super().create(validated_data)
        if preds is not None:
            instance.genetic_predispositions.set(preds)
        return instance

    def update(self, instance, validated_data):
        preds = validated_data.pop("genetic_predispositions", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if preds is not None:
            instance.genetic_predispositions.set(preds)
        return instance


class PatientReadSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    allergies = AllergySerializer(many=True, read_only=True)
    medical_history = MedicalHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "full_name",
            "national_id",
            "email",
            "age",
            "gender",
            "allergies",        # ahora array de objetos
            "medical_history",  # ahora array de objetos
        ]

    @extend_schema_field(serializers.CharField())
    def get_full_name(self, obj) -> str:
        """
        Construye el nombre completo, devolviendo 'SIN-NOMBRE' si no hay datos.
        """
        if not obj:  # 👈 blindaje extra
            return "SIN-NOMBRE"
        parts = [
            getattr(obj, "first_name", None),
            getattr(obj, "middle_name", None),
            getattr(obj, "last_name", None),
            getattr(obj, "second_last_name", None),
        ]
        full_name = " ".join(filter(None, parts)).strip()
        return full_name if full_name else "SIN-NOMBRE"

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_age(self, obj) -> Optional[int]:
        """
        Calcula la edad si hay fecha de nacimiento válida.
        """
        if not obj or not obj.birthdate:
            return None
        today = date.today()
        age = today.year - obj.birthdate.year - (
            (today.month, today.day) < (obj.birthdate.month, obj.birthdate.day)
        )
        return age if age >= 0 else None


class PatientListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    allergies = AllergySerializer(many=True, read_only=True)
    medical_history = MedicalHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "full_name",
            "age",
            "gender",
            "contact_info",
            "allergies",        # ahora array de objetos
            "medical_history",  # ahora array de objetos
        ]

    def get_full_name(self, obj) -> str:
        parts = [
            getattr(obj, "first_name", None),
            getattr(obj, "middle_name", None),
            getattr(obj, "last_name", None),
            getattr(obj, "second_last_name", None),
        ]
        full_name = " ".join(filter(None, parts)).strip()
        return full_name if full_name else "SIN-NOMBRE"

    def get_age(self, obj) -> Optional[int]:
        if not obj or not obj.birthdate:
            return None
        today = date.today()
        age = today.year - obj.birthdate.year - (
            (today.month, today.day) < (obj.birthdate.month, obj.birthdate.day)
        )
        return age if age >= 0 else None


class PatientDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    genetic_predispositions = GeneticPredispositionSerializer(many=True, read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)
    medical_history = MedicalHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id",
            "full_name",
            "age",
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
            "allergies",          # ahora array de objetos
            "medical_history",    # ahora array de objetos
            "genetic_predispositions",
            "active",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj) -> str:
        parts = [obj.first_name, obj.middle_name, obj.last_name, obj.second_last_name]
        return " ".join(filter(None, parts)) or "SIN-NOMBRE"

    def get_age(self, obj) -> Optional[int]:
        if not obj or not obj.birthdate:
            return None
        today = date.today()
        age = today.year - obj.birthdate.year - (
            (today.month, today.day) < (obj.birthdate.month, obj.birthdate.day)
        )
        return age if age >= 0 else None


class PrescriptionComponentSerializer(serializers.ModelSerializer):
    unit_display = serializers.CharField(source="get_unit_display", read_only=True)

    class Meta:
        model = PrescriptionComponent
        fields = ["id", "substance", "dosage", "unit", "unit_display"]


# --- Prescripciones ---
class PrescriptionSerializer(serializers.ModelSerializer):
    route_display = serializers.CharField(source="get_route_display", read_only=True)
    frequency_display = serializers.CharField(source="get_frequency_display", read_only=True)

    medication_catalog = serializers.StringRelatedField(read_only=True)
    medication_text = serializers.CharField(read_only=True)

    components = PrescriptionComponentSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "id",
            "diagnosis",
            "medication_catalog",
            "medication_text",
            "route",
            "route_display",
            "frequency",
            "frequency_display",
            "duration",
            "components",   # 🔹 lista de sustancias activas
        ]


class PrescriptionComponentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionComponent
        fields = ["substance", "dosage", "unit"]


class PrescriptionWriteSerializer(serializers.ModelSerializer):
    medication_catalog = serializers.PrimaryKeyRelatedField(
        queryset=MedicationCatalog.objects.all(),
        required=False,
        allow_null=True
    )
    medication_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    components = PrescriptionComponentWriteSerializer(many=True)

    class Meta:
        model = Prescription
        fields = [
            "id",
            "diagnosis",
            "medication_catalog",
            "medication_text",
            "route",
            "frequency",
            "duration",
            "components",   # 🔹 escritura múltiple
        ]

    def create(self, validated_data):
        components_data = validated_data.pop("components", [])
        prescription = Prescription.objects.create(**validated_data)
        for comp in components_data:
            PrescriptionComponent.objects.create(prescription=prescription, **comp)
        return prescription

    def update(self, instance, validated_data):
        components_data = validated_data.pop("components", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if components_data is not None:
            instance.components.all().delete()
            for comp in components_data:
                PrescriptionComponent.objects.create(prescription=instance, **comp)
        return instance


class TreatmentSerializer(serializers.ModelSerializer):
    treatment_type_display = serializers.CharField(source="get_treatment_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Treatment
        fields = [
            "id",
            "diagnosis",
            "treatment_type",
            "treatment_type_display",
            "plan",
            "start_date",
            "end_date",
            "status",
            "status_display",
        ]


class TreatmentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Treatment
        fields = [
            "id",
            "diagnosis",
            "treatment_type",
            "plan",
            "start_date",
            "end_date",
            "status",
        ]


class DiagnosisSerializer(serializers.ModelSerializer):
    treatments = TreatmentSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)

    class Meta:
        model = Diagnosis
        fields = [
            "id",
            "icd_code",       # código ICD-11
            "title",          # descripción oficial OMS
            "foundation_id",  # ID único ICD-11
            "description",    # notas adicionales
            "treatments",
            "prescriptions",
        ]


class DiagnosisWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = [
            "id",
            "appointment",   # 👈 necesario para crear
            "icd_code",
            "title",
            "foundation_id",
            "description",
        ]


# --- Pagos ---
class PaymentSerializer(serializers.ModelSerializer):
    appointment_date = serializers.DateField(
        source="appointment.appointment_date", read_only=True
    )
    patient = PatientReadSerializer(source="appointment.patient", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "appointment",
            "appointment_date",
            "patient",
            "charge_order",
            "amount",
            "currency",
            "method",
            "status",
            "reference_number",
            "bank_name",
            "received_by",
            "received_at",
            "idempotency_key",
        ]
        read_only_fields = (
            "id",
            "appointment",      # 👈 ahora solo lectura
            "charge_order",     # 👈 ahora solo lectura
            "appointment_date",
            "patient",
            "status",
            "received_at",
        )

    def validate(self, attrs):
        amount = attrs.get("amount")
        # obtenemos la orden desde attrs o desde la instancia
        order = attrs.get("charge_order") or (
            self.instance.charge_order if self.instance else None
        )

        if amount is None or amount <= Decimal("0.00"):
            raise serializers.ValidationError("El monto debe ser mayor a 0.")

        if order and order.status == "void":
            raise serializers.ValidationError("No se puede pagar una orden anulada.")

        if order:
            order.recalc_totals()
            if amount > order.balance_due:
                raise serializers.ValidationError(
                    "El monto excede el saldo pendiente de la orden."
                )

        return attrs


class MedicalDocumentWriteSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all())
    appointment = serializers.PrimaryKeyRelatedField(
        queryset=Appointment.objects.all(),
        required=False,
        allow_null=True
    )
    diagnosis = serializers.PrimaryKeyRelatedField(
        queryset=Diagnosis.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "patient",
            "appointment",
            "diagnosis",
            "description",
            "category",
            "file",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        """
        Blindaje institucional:
        - Categorías operativas requieren appointment.
        - Prescription y Treatment requieren además diagnosis.
        - Reportes generales y 'other' pueden omitirse.
        """
        category = attrs.get("category")
        appointment = attrs.get("appointment")
        diagnosis = attrs.get("diagnosis")

        required_categories = {
            "prescription",
            "treatment",
            "medical_test_order",
            "medical_referral",
        }

        if category in required_categories and not appointment:
            raise serializers.ValidationError({
                "appointment": f"La categoría '{category}' requiere una cita (appointment)."
            })

        if category in {"prescription", "treatment"} and not diagnosis:
            raise serializers.ValidationError({
                "diagnosis": f"La categoría '{category}' requiere un diagnóstico asociado."
            })

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Calcular metadatos del archivo
        file = validated_data.get("file")
        if file:
            validated_data["mime_type"] = file.content_type or "application/octet-stream"
            validated_data["size_bytes"] = file.size
            import hashlib
            sha256 = hashlib.sha256()
            for chunk in file.chunks():
                sha256.update(chunk)
            validated_data["checksum_sha256"] = sha256.hexdigest()

        # Setear metadatos institucionales
        validated_data["source"] = "user_uploaded"
        validated_data["origin_panel"] = "consultation_or_patient"
        validated_data["template_version"] = "v1.0"
        validated_data["uploaded_by"] = user if user and user.is_authenticated else None
        validated_data["generated_by"] = user if user and user.is_authenticated else None

        return super().create(validated_data)


# --- Eventos (auditoría) ---
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "timestamp", "actor", "entity", "entity_id", "action", "metadata", "severity", "notify"]


# --- Sala de espera (básico) ---
class WaitingRoomEntrySerializer(serializers.ModelSerializer):
    patient = serializers.SerializerMethodField()
    appointment_id = serializers.SerializerMethodField()
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

    def get_patient(self, obj):
        """
        Devuelve siempre un objeto paciente válido.
        """
        if obj.patient:
            return PatientReadSerializer(obj.patient).data
        return {"id": None, "full_name": "SIN-NOMBRE"}

    def get_appointment_id(self, obj):
        return obj.appointment.id if obj.appointment else None

    def get_appointment_status(self, obj):
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

    # 🔹 Ahora description es opcional y puede ser vacío
    description = serializers.CharField(allow_blank=True, required=False)

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
    total = serializers.FloatField(read_only=True)
    balance_due = serializers.FloatField(read_only=True)
    items = ChargeItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    # ✅ Campo plano para Search.tsx y otros endpoints
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = ChargeOrder
        fields = (
            "id",
            "appointment",
            "patient",
            "currency",
            "total",
            "balance_due",
            "status",
            "issued_at",
            "issued_by",
            "items",
            "payments",
            "patient_name",   # ✅ añadido
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )
        read_only_fields = (
            "total",
            "balance_due",
            "status",
            "issued_at",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )

    def get_patient_name(self, obj):
        p = obj.patient
        if not p:
            return "SIN-NOMBRE"
        parts = [
            p.first_name,
            p.middle_name,
            p.last_name,
            p.second_last_name,
        ]
        return " ".join([x for x in parts if x])


# --- Citas ---
class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)
    charge_order = ChargeOrderSerializer(read_only=True)

    # ✅ Campo plano para Search.tsx y otros endpoints
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "patient_name",      # ✅ añadido
            "appointment_date",
            "appointment_type",
            "expected_amount",
            "status",
            "arrival_time",
            "completed_at",
            "notes",
            "charge_order",
        ]

    def get_patient_name(self, obj):
        p = obj.patient
        if not p:
            return "SIN-NOMBRE"
        parts = [
            p.first_name,
            p.middle_name,
            p.last_name,
            p.second_last_name,
        ]
        return " ".join([x for x in parts if x])


# --- Documentos clínicos ---
class MedicalDocumentReadSerializer(serializers.ModelSerializer):
    patient = PatientReadSerializer(read_only=True)
    appointment = AppointmentSerializer(read_only=True)
    diagnosis = DiagnosisSerializer(read_only=True)
    uploaded_by = serializers.StringRelatedField(read_only=True)
    generated_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = MedicalDocument
        fields = [
            "id",
            "patient",
            "appointment",
            "diagnosis",
            "description",
            "category",
            "source",
            "origin_panel",
            "template_version",
            "is_signed",
            "signer_name",
            "signer_registration",
            "uploaded_at",
            "uploaded_by",
            "generated_by",
            "file",
            "mime_type",
            "size_bytes",
            "checksum_sha256",
            "storage_key",
        ]
        read_only_fields = fields  # todo es solo lectura en el serializer de salida


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


class ChargeOrderPaymentSerializer(serializers.ModelSerializer):
    # 🔹 Aliases para Pagos
    appointment_date = serializers.DateTimeField(read_only=True)  # ahora toma el campo anotado en el queryset
    total_amount = serializers.FloatField(source="total", read_only=True)  # homogéneo con FloatField
    patient_detail = PatientReadSerializer(source="patient", read_only=True)
    items = ChargeItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    # 🔹 Auditoría (fechas ya formateadas globalmente por DATETIME_FORMAT en settings.py)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    created_by = serializers.CharField(read_only=True)
    updated_by = serializers.CharField(read_only=True)

    class Meta:
        model = ChargeOrder
        fields = (
            "id", "appointment", "patient", "currency",
            "total", "balance_due", "status",
            "issued_at", "issued_by", "items",
            "appointment_date", "total_amount", "patient_detail",
            "payments",
            "created_at", "updated_at", "created_by", "updated_by",
        )
        read_only_fields = (
            "total", "balance_due", "status", "issued_at",
            "created_at", "updated_at", "created_by", "updated_by",
        )


# --- Reportes institucionales ---
class ReportRowSerializer(serializers.Serializer):
    """
    Serializer genérico para filas de reporte.
    Compatible con el frontend ReportRow.ts y usado en export PDF/Excel.
    """
    id = serializers.IntegerField()
    date = serializers.DateField()        # ISO YYYY-MM-DD (acepta str y parsea a date)
    type = serializers.CharField()        # "financial" | "clinical" | "combined"
    entity = serializers.CharField()      # paciente, procedimiento o entidad
    status = serializers.CharField()
    amount = serializers.FloatField()
    currency = serializers.CharField(default="VES")  # campo adicional opcional

# --- Filtros de reportes ---
class ReportFiltersSerializer(serializers.Serializer):
    """
    Serializer para documentar los filtros de entrada en /reports.
    """
    start_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Fecha inicial (YYYY-MM-DD)",
    )
    end_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Fecha final (YYYY-MM-DD)",
    )
    type = serializers.ChoiceField(
        choices=["financial", "clinical", "combined"],
        default="financial",
        help_text="Tipo de reporte",
    )


# --- Exportación de reportes ---
class ReportExportSerializer(serializers.Serializer):
    """
    Serializer para documentar la exportación de reportes.
    """
    format = serializers.ChoiceField(
        choices=["pdf", "excel"],
        help_text="Formato de exportación",
    )
    filters = ReportFiltersSerializer(
        required=False,
        help_text="Filtros aplicados al reporte exportado",
    )
    # DRF: nested serializer con many=True es correcto.
    # Pylance: requiere cast/ignore para evitar el falso positivo de 'property'.
    data: Any = cast(Any, ReportRowSerializer(many=True))
    # Alternativa:
    # data = ReportRowSerializer(many=True)  # type: ignore[assignment]


class InstitutionSettingsSerializer(serializers.ModelSerializer):
    # 🔹 Logo opcional con URL completa
    logo = serializers.ImageField(required=False, allow_null=True, use_url=True)

    class Meta:
        model = InstitutionSettings
        fields = ["id", "name", "address", "phone", "logo", "tax_id"]


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ["id", "code", "name"]


class DoctorOperatorSerializer(serializers.ModelSerializer):
    # 🔹 Firma opcional con URL completa
    signature = serializers.ImageField(required=False, allow_null=True, use_url=True)

    # 🔹 Especialidades: lectura y escritura
    specialties = SpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(),
        many=True,
        write_only=True,
        source="specialties"
    )

    class Meta:
        model = DoctorOperator
        fields = [
            "id",
            "full_name",
            "colegiado_id",
            "specialties",      # lectura como objetos {id, code, name}
            "specialty_ids",    # escritura como lista de IDs
            "license",
            "email",
            "phone",
            "signature",
        ]

    def to_representation(self, instance):
        """
        Extiende la representación para incluir también los IDs de especialidades
        en la salida, de modo que el frontend pueda repoblar el <select multiple>.
        """
        rep = super().to_representation(instance)
        rep["specialty_ids"] = list(instance.specialties.values_list("id", flat=True))
        return rep

    def update(self, instance, validated_data):
        """
        ✅ FIX DEFINITIVO:
        - Maneja specialties y specialty_ids correctamente
        - Permite enviar [] para borrar todas
        - Evita el bug del OR que destruía la lógica
        """

        specialties = None

        # ✅ Si vienen specialties (por source="specialties")
        if "specialties" in validated_data:
            specialties = validated_data.pop("specialties")

        # ✅ Si vienen specialty_ids directamente
        if "specialty_ids" in validated_data:
            specialties = validated_data.pop("specialty_ids")

        # ✅ Actualizar campos simples
        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        instance.save()

        # ✅ Actualizar ManyToMany correctamente
        if specialties is not None:
            # specialties puede ser lista de IDs o lista de objetos
            if all(isinstance(s, int) or isinstance(s, str) for s in specialties):
                ids = [int(s) for s in specialties]
                qs = Specialty.objects.filter(id__in=ids)
                instance.specialties.set(qs)
            else:
                instance.specialties.set(specialties)

        return instance


# --- Resumen ejecutivo del Dashboard ---
class DashboardSummarySerializer(serializers.Serializer):
    # 🔹 Clínico
    total_patients = serializers.IntegerField()
    total_appointments = serializers.IntegerField()
    active_appointments = serializers.IntegerField()     # ✅ citas con actividad clínica real
    completed_appointments = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    waiting_room_count = serializers.IntegerField()
    active_consultations = serializers.IntegerField()

    # 🔹 Financiero
    total_payments = serializers.IntegerField()
    total_events = serializers.IntegerField()            # eventos críticos genéricos (mantener para auditoría)
    total_canceled_orders = serializers.IntegerField()   # ✅ nuevo: solo órdenes anuladas en el rango
    total_waived = serializers.IntegerField()
    total_payments_amount = serializers.FloatField()
    estimated_waived_amount = serializers.FloatField()
    financial_balance = serializers.FloatField()

    # 🔹 Tendencias
    appointments_trend = serializers.ListField()
    payments_trend = serializers.ListField()
    balance_trend = serializers.ListField()

    # 🔹 Auditoría
    event_log = serializers.ListField(required=False)

    # 🔹 Tasa BCV
    bcv_rate = serializers.DictField(
        child=serializers.FloatField(),
        help_text="Tasa oficial BCV con unidad, precisión y bandera de fallback"
    )


class MedicalReportSerializer(serializers.ModelSerializer):
    institution = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()
    diagnoses = serializers.SerializerMethodField()
    prescriptions = serializers.SerializerMethodField()

    class Meta:
        model = MedicalReport
        fields = [
            "id",
            "appointment",
            "patient",
            "created_at",
            "status",
            "file_url",
            "institution",     # 🔹 datos institucionales
            "doctor",          # 🔹 datos del médico operador
            "diagnoses",       # ✅ lista completa de diagnósticos
            "prescriptions",   # ✅ lista completa de prescripciones
        ]

    def get_institution(self, obj):
        institution = InstitutionSettings.objects.first()
        return InstitutionSettingsSerializer(institution).data if institution else None

    def get_doctor(self, obj):
        doctor = DoctorOperator.objects.first()
        if not doctor:
            return None

        specialties = doctor.specialties.values_list("name", flat=True)
        return {
            "full_name": doctor.full_name,
            "colegiado_id": doctor.colegiado_id,
            "specialties": list(specialties) if specialties else ["No especificadas"],
            "signature": doctor.signature.url if doctor.signature else None,
        }

    def get_diagnoses(self, obj):
        diagnoses = obj.appointment.diagnoses.all()
        return [
            {
                "icd_code": d.icd_code,
                "title": d.title,
                "description": d.description,
            }
            for d in diagnoses
        ]

    def get_prescriptions(self, obj):
        prescriptions = Prescription.objects.filter(diagnosis__appointment=obj.appointment).prefetch_related("components")
        return [
            {
                "medication": (
                    f"{p.medication_catalog.name} — {p.medication_catalog.presentation} — {p.medication_catalog.concentration}"
                    if p.medication_catalog
                    else p.medication_text
                    if p.medication_text
                    else "Medicamento no especificado"
                ),
                "route": p.get_route_display() if p.route else "-",
                "frequency": p.get_frequency_display() if p.frequency else "-",
                "duration": p.duration or "-",
                "components": [
                    {
                        "substance": comp.substance,
                        "dosage": str(comp.dosage),
                        "unit": dict(UNIT_CHOICES).get(comp.unit, comp.unit),
                    }
                    for comp in p.components.all()
                ],
            }
            for p in prescriptions
        ]


class ICD11EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ICD11Entry
        fields = ["icd_code", "title", "definition", "synonyms", "parent_code"]


# --- Exámenes médicos (lectura) ---
class MedicalTestSerializer(serializers.ModelSerializer):
    test_type_display = serializers.CharField(source="get_test_type_display", read_only=True)
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MedicalTest
        fields = [
            "id",
            "appointment",
            "diagnosis",
            "test_type",
            "test_type_display",
            "urgency",
            "urgency_display",
            "status",
            "status_display",
            "description",
        ]

    def validate_test_type(self, value):
        valid_values = [choice[0] for choice in MedicalTest.TEST_TYPE_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError("Tipo de examen inválido.")
        return value


# --- Exámenes médicos (escritura) ---
class MedicalTestWriteSerializer(serializers.ModelSerializer):
    appointment = serializers.PrimaryKeyRelatedField(
        queryset=Appointment.objects.all(),
        required=True
    )
    diagnosis = serializers.PrimaryKeyRelatedField(
        queryset=Diagnosis.objects.all(),
        required=False,
        allow_null=True
    )

    # 🔹 Incluimos displays para que la respuesta al POST sea usable directamente en la UI
    test_type_display = serializers.CharField(source="get_test_type_display", read_only=True)
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MedicalTest
        fields = [
            "id",
            "appointment",
            "diagnosis",
            "test_type",
            "test_type_display",
            "urgency",
            "urgency_display",
            "status",
            "status_display",
            "description",
        ]

    def validate_test_type(self, value):
        valid_values = [choice[0] for choice in MedicalTest.TEST_TYPE_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError("Tipo de examen inválido.")
        return value

    def validate_status(self, value):
        valid_values = [choice[0] for choice in MedicalTest.STATUS_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError("Estado inválido para el examen médico.")
        return value

    def validate(self, data):
        # 🔹 Blindaje: debe existir al menos appointment o diagnosis
        if not data.get("appointment") and not data.get("diagnosis"):
            raise serializers.ValidationError(
                "Debe asociar el examen a una cita o a un diagnóstico."
            )
        return data

    def create(self, validated_data):
        # 🔹 Garantizamos que appointment se setee correctamente
        test = MedicalTest.objects.create(**validated_data)
        return test

    def update(self, instance, validated_data):
        # 🔹 Actualizamos campos simples
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# --- Referencias médicas ---
class MedicalReferralSerializer(serializers.ModelSerializer):
    # 🔹 Especialidades: lectura y escritura
    specialties = SpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(),
        many=True,
        write_only=True,
        source="specialties"
    )

    # 🔹 Displays para choices
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MedicalReferral
        fields = [
            "id",
            "appointment",
            "diagnosis",
            "referred_to",       # 👈 ahora sí existe en el modelo
            "reason",
            "specialties",       # lectura
            "specialty_ids",     # escritura
            "urgency",
            "urgency_display",
            "status",
            "status_display",
        ]

    def validate_status(self, value):
        valid_values = [choice[0] for choice in MedicalReferral.STATUS_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError("Estado inválido para la referencia médica.")
        return value

    def validate_urgency(self, value):
        valid_values = [choice[0] for choice in MedicalReferral.URGENCY_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError("Urgencia inválida para la referencia médica.")
        return value


# --- Referencias médicas (escritura) ---
class MedicalReferralWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalReferral
        fields = [
            "id",
            "appointment",
            "diagnosis",
            "specialty",
            "urgency",
            "reason",
            "status",
        ]

    def validate_specialty(self, value):
        valid_values = [choice[0] for choice in MedicalReferral.SPECIALTY_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError("Especialidad inválida para la referencia médica.")
        return value

    def validate_status(self, value):
        valid_values = [choice[0] for choice in MedicalReferral.STATUS_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError("Estado inválido para la referencia médica.")
        return value
    

# --- Serializador genérico para exponer choices ---
class ChoicesSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()


class AppointmentDetailSerializer(AppointmentSerializer):
    diagnoses = DiagnosisSerializer(many=True, read_only=True)
    # 🔹 agregados
    treatments = serializers.SerializerMethodField()
    prescriptions = serializers.SerializerMethodField()
    charge_order = serializers.SerializerMethodField()
    medical_tests = MedicalTestSerializer(many=True, read_only=True)
    referrals = MedicalReferralSerializer(many=True, read_only=True)
    balance_due = serializers.SerializerMethodField()

    class Meta(AppointmentSerializer.Meta):
        fields = AppointmentSerializer.Meta.fields + [
            "diagnoses",
            "treatments",
            "prescriptions",
            "charge_order",
            "medical_tests",
            "referrals",
            "balance_due",
            "notes",
        ]

    def get_balance_due(self, obj):
        try:
            return float(obj.balance_due())
        except Exception:
            return 0.0

    # 🔹 Treatments: todas las de los diagnósticos de esta cita
    def get_treatments(self, obj):
        qs = Treatment.objects.filter(diagnosis__appointment=obj).select_related("diagnosis")
        return TreatmentSerializer(qs, many=True).data

    # 🔹 Prescriptions: todas las de los diagnósticos de esta cita
    def get_prescriptions(self, obj):
        qs = Prescription.objects.filter(diagnosis__appointment=obj).select_related("diagnosis", "medication_catalog")
        return PrescriptionSerializer(qs, many=True).data

    # 🔹 Charge order: la orden activa más relevante (paid/partially_paid/open), ignorando void
    def get_charge_order(self, obj):
        order = (
            obj.charge_orders.exclude(status="void")
            .order_by(
                models.Case(
                    models.When(status="paid", then=0),
                    models.When(status="partially_paid", then=1),
                    default=2,
                    output_field=models.IntegerField(),
                ),
                "-issued_at",
            )
            .first()
        )
        return ChargeOrderSerializer(order).data if order else None


class PersonalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalHistory
        fields = [
            "id",
            "patient",
            "type",
            "description",
            "date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class FamilyHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyHistory
        fields = [
            "id",
            "patient",
            "condition",
            "relative",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SurgerySerializer(serializers.ModelSerializer):
    class Meta:
        model = Surgery
        fields = [
            "id",
            "patient",
            "name",
            "date",
            "hospital",
            "complications",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = [
            "id",
            "patient",
            "type",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class VaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccine
        fields = [
            "id",
            "name",
            "code",
            "description",
            "country",
        ]
        read_only_fields = ["id"]


class VaccinationScheduleSerializer(serializers.ModelSerializer):
    vaccine_detail = VaccineSerializer(source="vaccine", read_only=True)

    class Meta:
        model = VaccinationSchedule
        fields = [
            "id",
            "vaccine",
            "vaccine_detail",
            "recommended_age_months",
            "dose_number",
            "country",
        ]
        read_only_fields = ["id"]


class PatientVaccinationSerializer(serializers.ModelSerializer):
    vaccine_detail = VaccineSerializer(source="vaccine", read_only=True)

    class Meta:
        model = PatientVaccination
        fields = [
            "id",
            "patient",
            "vaccine",
            "vaccine_detail",
            "dose_number",
            "date_administered",
            "lot",
            "center",
            "next_dose_date",
        ]
        read_only_fields = ["id"]


class PatientClinicalProfileSerializer(serializers.ModelSerializer):
    surgeries = SurgerySerializer(many=True, read_only=True)
    habits = HabitSerializer(many=True, read_only=True)
    vaccinations = PatientVaccinationSerializer(many=True, read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)
    medical_history = MedicalHistorySerializer(many=True, read_only=True)

    clinical_background = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id",
            "national_id",
            "first_name",
            "middle_name",
            "last_name",
            "second_last_name",
            "birthdate",
            "birth_place",
            "birth_country",
            "gender",
            "email",
            "contact_info",
            "address",
            "weight",
            "height",
            "blood_type",
            "allergies",
            "medical_history",
            "surgeries",
            "habits",
            "vaccinations",
            "clinical_background",
        ]

    def get_clinical_background(self, obj):
        # 🔒 Blindaje: nunca explotar si las relaciones no existen
        try:
            personales_qs = PersonalHistory.objects.filter(patient=obj)
        except Exception:
            personales_qs = []

        try:
            familiares_qs = FamilyHistory.objects.filter(patient=obj)
        except Exception:
            familiares_qs = []

        try:
            geneticos_qs = getattr(obj, "genetic_predispositions", None)
            geneticos_qs = geneticos_qs.all() if geneticos_qs else []
        except Exception:
            geneticos_qs = []

        personales = [
            {
                "id": getattr(ph, "id", None),
                "type": "personal",
                "condition": getattr(ph, "description", None) or getattr(ph, "condition", None),
                "status": getattr(ph, "status", "activo"),
                "notes": getattr(ph, "notes", None),
                "source": "historia_clinica",
            }
            for ph in personales_qs
        ]

        familiares = [
            {
                "id": getattr(fh, "id", None),
                "type": "family",
                "condition": getattr(fh, "condition", None),
                "status": getattr(fh, "status", "positivo"),
                "relative": getattr(fh, "relative", None),
                "notes": getattr(fh, "notes", None),
                "source": "historia_clinica",
            }
            for fh in familiares_qs
        ]

        geneticos = [
            {
                "id": getattr(gp, "id", None),
                "type": "genetic",
                "condition": getattr(gp, "name", None),
                "status": "positivo",
                "notes": getattr(gp, "description", None),
                "source": "prueba_genetica",
            }
            for gp in geneticos_qs
        ]

        return personales + familiares + geneticos


class ClinicalAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalAlert
        fields = ["id", "patient", "type", "message", "created_at", "updated_at"]
