from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    Patient, Appointment, Payment, Event, WaitingRoomEntry,
    Diagnosis, Treatment, Prescription, MedicalDocument, GeneticPredisposition,
    ChargeOrder, ChargeItem, InstitutionSettings, DoctorOperator, MedicalReport,
    ICD11Entry, MedicalTest, MedicalReferral, Specialty, MedicationCatalog, PrescriptionComponent,
    PersonalHistory, FamilyHistory, Surgery, Habit, Vaccine, VaccinationSchedule, PatientVaccination,
    Allergy, MedicalHistory, ClinicalAlert, Country, State, Municipality, City, Parish, Neighborhood,
    ClinicalNote, VitalSigns, MedicalTestCatalog, MercantilP2CTransaction, MercantilP2CConfig, 
    WhatsAppMessage, PaymentGateway, DoctorPaymentConfig, PaymentTransaction, PaymentWebhook, 
    PatientSubscription, PatientInvitation, PatientPaymentMethod, DoctorService, ServiceCategory,
    ServiceSchedule
)
from .choices import UNIT_CHOICES, ROUTE_CHOICES, FREQUENCY_CHOICES, BANK_CHOICES, get_bank_name
from datetime import date
from typing import Optional, Any, cast
from decimal import Decimal, InvalidOperation
from django.db import models
from django.utils import timezone
#from typing import Dict, Any, cast, Optional, List
from typing import Optional, Any, Dict, List, cast
import hashlib

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
    """
    Serializer Élite para Antecedentes Médicos (Problemas/Condiciones Crónicas).
    Gestiona la persistencia de la salud del paciente fuera de las citas.
    """
    # Representaciones amigables para el Frontend
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = MedicalHistory
        fields = [
            "id", 
            "patient", 
            "patient_name",
            "condition",     # Ej: "Hipertensión Arterial"
            "status",        # active, resolved, suspected, remission, permanent
            "status_display",
            "source",        # Fuente: diagnóstico oficial, referencia externa, etc.
            "notes",         
            "onset_date",    # Fecha de inicio o diagnóstico inicial
            "created_at", 
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_onset_date(self, value):
        """Validación de integridad temporal: No aceptamos viajeros del futuro."""
        if value and value > timezone.now().date():
            raise serializers.ValidationError("La fecha de aparición no puede ser futura.")
        return value

    def validate(self, attrs):
        """
        Validación de Negocio: Blindaje contra duplicidad de condiciones activas.
        """
        # Obtenemos los datos ya sea de la creación (attrs) o de la instancia (si es un update)
        instance = self.instance
        patient = attrs.get('patient', instance.patient if instance else None)
        condition = attrs.get('condition', instance.condition if instance else None)
        status = attrs.get('status', instance.status if instance else None)

        # Lógica de Prevención: No duplicar enfermedades activas iguales
        if status == 'active':
            queryset = MedicalHistory.objects.filter(
                patient=patient, 
                condition__iexact=condition, 
                status='active'
            )
            
            # Si estamos editando, excluimos el registro actual de la búsqueda
            if instance:
                queryset = queryset.exclude(id=instance.id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    "condition": f"Ya existe un registro de '{condition}' marcado como activo para este paciente."
                })

        return attrs


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["id", "name"]


class StateSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    country_id = serializers.PrimaryKeyRelatedField(
        queryset=Country.objects.all(),
        write_only=True,
        source="country"
    )

    class Meta:
        model = State
        fields = ["id", "name", "country", "country_id"]


class MunicipalitySerializer(serializers.ModelSerializer):
    state = StateSerializer(read_only=True)
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        write_only=True,
        source="state"
    )

    class Meta:
        model = Municipality
        fields = ["id", "name", "state", "state_id"]


class CitySerializer(serializers.ModelSerializer):
    state = StateSerializer(read_only=True)
    state_id = serializers.PrimaryKeyRelatedField(
        queryset=State.objects.all(),
        write_only=True,
        source="state"
    )

    class Meta:
        model = City
        fields = ["id", "name", "state", "state_id"]


class ParishSerializer(serializers.ModelSerializer):
    municipality = MunicipalitySerializer(read_only=True)
    municipality_id = serializers.PrimaryKeyRelatedField(
        queryset=Municipality.objects.all(),
        write_only=True,
        source="municipality"
    )

    class Meta:
        model = Parish
        fields = ["id", "name", "municipality", "municipality_id"]


class NeighborhoodSerializer(serializers.ModelSerializer):
    parish = ParishSerializer(read_only=True)
    parish_id = serializers.PrimaryKeyRelatedField(
        queryset=Parish.objects.all(),
        write_only=True,
        source="parish"
    )

    class Meta:
        model = Neighborhood
        fields = ["id", "name", "parish", "parish_id"]


class ClinicalAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalAlert
        fields = ["id", "type", "message", "is_active", "level"]


# 🔹 Serializer para crear/actualizar pacientes (sin campo active)
class PatientWriteSerializer(serializers.ModelSerializer):
    """
    OPTIMIZADO: Para creación y edición.
    Maneja la relación Many-to-Many y la jerarquía geográfica por ID.
    """
    genetic_predispositions = serializers.PrimaryKeyRelatedField(
        queryset=GeneticPredisposition.objects.all(),
        many=True,
        required=False
    )
    
    # Para lectura - objeto completo
    neighborhood = NeighborhoodSerializer(read_only=True, required=False)
    
    # Para escritura - solo ID
    neighborhood_id = serializers.PrimaryKeyRelatedField(
        queryset=Neighborhood.objects.all(),
        required=False,
        allow_null=True,
        source="neighborhood"
    )
    
    # Representante (para pacientes pediátricos)
    representative_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        required=False,
        allow_null=True,
        source="representative",
        help_text="ID del representante (padre/madre/tutor)"
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
            "phone_number", 
            "email",
            "contact_info",
            "address",
            "neighborhood",
            "neighborhood_id",
            "weight", 
            "height", 
            "blood_type", 
            "genetic_predispositions", 
            "active",
            "tattoo",
            "profession",
            "skin_type",
            # --- Campos Paciente Pediátrico ---
            "is_minor",
            "representative",
            "representative_id",
            "relationship_type",
            "parental_consent",
            "consent_date",
            "representative_doc",
            "representative_phone",
            "representative_email",
        ]
    
    def validate_birthdate(self, value):
        if value and value > date.today():
            raise serializers.ValidationError("La fecha de nacimiento no puede ser futura.")
        return value
    
    def validate(self, attrs):
        """Validación específica para pacientes pediátricos"""
        is_minor = attrs.get('is_minor', False)
        representative = attrs.get('representative')
        
        # Si es menor, debe tener representante
        if is_minor and not representative:
            raise serializers.ValidationError({
                'representative': 'Los pacientes menores de edad deben tener un representante.'
            })
        
        # Si tiene representante, debe especificar tipo de relación
        if representative and not attrs.get('relationship_type'):
            raise serializers.ValidationError({
                'relationship_type': 'Debe especificar el tipo de relación con el representante.'
            })
        
        # Si parental_consent es true, debe tener consent_date
        if attrs.get('parental_consent') and not attrs.get('consent_date'):
            raise serializers.ValidationError({
                'consent_date': 'Debe especificar la fecha del consentimiento parental.'
            })
        
        return attrs
    
    def save(self, **kwargs):
        v_data = cast(Dict[str, Any], self.validated_data)
        if v_data.get('address') is None:
            v_data['address'] = ""
        if v_data.get('contact_info') is None:
            v_data['contact_info'] = ""
        return super().save(**kwargs)


class PatientReadSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField() 
    age = serializers.ReadOnlyField()
    age_category = serializers.ReadOnlyField()
    is_pediatric = serializers.ReadOnlyField()
    guardian_info = serializers.SerializerMethodField()
    medical_history = MedicalHistorySerializer(many=True, read_only=True)
    genetic_predispositions = GeneticPredispositionSerializer(many=True, read_only=True)
    alerts = serializers.SerializerMethodField()
    address_chain = serializers.SerializerMethodField()
    neighborhood = NeighborhoodSerializer(read_only=True)
    
    # Representante
    representative = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            "id", "full_name", "national_id", "email", "age", "age_category",
            "is_pediatric", "gender",
            "birthdate",
            "phone_number", "address",
            "contact_info",
            "neighborhood",
            "blood_type",
            "weight", "height", "medical_history", "genetic_predispositions", 
            "alerts", "address_chain", "active", "created_at", "updated_at",
            "tattoo", "profession", "skin_type",
            # --- Campos Paciente Pediátrico ---
            "is_minor",
            "representative",
            "relationship_type",
            "parental_consent",
            "consent_date",
            "representative_doc",
            "representative_phone",
            "representative_email",
            "guardian_info",
        ]
    
    @extend_schema_field(serializers.DictField())
    def get_guardian_info(self, obj):
        return obj.guardian_info
    
    @extend_schema_field(serializers.DictField())
    def get_representative(self, obj):
        if not obj.representative:
            return None
        return {
            "id": obj.representative.id,
            "full_name": obj.representative.full_name,
            "national_id": obj.representative.national_id,
            "phone": obj.representative_phone,
            "relationship": obj.get_relationship_type_display(),
        }
    
    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_alerts(self, obj) -> List[Dict[str, Any]]:
        if not hasattr(obj, 'alerts'):
            return []
        return [
            {"type": alert.type, "message": alert.message} 
            for alert in obj.alerts.all()
        ]
    
    @extend_schema_field(serializers.DictField())
    def get_address_chain(self, obj) -> Dict[str, Any]:
        n = obj.neighborhood
        if not n:
            return {"neighborhood": "N/A", "full_path": "Sin dirección"}
        p = getattr(n, 'parish', None)
        m = getattr(p, 'municipality', None) if p else None
        s = getattr(m, 'state', None) if m else None
        
        res: Dict[str, Any] = {
            "neighborhood": n.name,
            "parish": getattr(p, 'name', "N/A"),
            "municipality": getattr(m, 'name', "N/A"),
            "state": getattr(s, 'name', "N/A"),
            "country": getattr(s.country, 'name', "N/A") if s else "N/A",
            "full_path": f"{n.name}, {getattr(p, 'name', '')}".strip(', ')
        }
        return res


class PatientListSerializer(serializers.ModelSerializer):
    """
    LIGERO: Diseñado para tablas, resultados de búsqueda y alto rendimiento.
    """
    full_name = serializers.ReadOnlyField()
    age = serializers.ReadOnlyField()
    is_pediatric = serializers.ReadOnlyField()
    short_address = serializers.SerializerMethodField()
    representative_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            "id", "full_name", "national_id", "age", "is_pediatric", "gender", 
            "phone_number", "contact_info", "short_address", "active",
            "representative_name", "relationship_type",
        ]
    
    @extend_schema_field(serializers.CharField())
    def get_short_address(self, obj) -> str:
        """Dirección compacta para columnas de tablas."""
        if obj.neighborhood:
            return f"{obj.neighborhood.name}, {obj.neighborhood.parish.name}"
        return obj.address[:30] if obj.address else "Sin dirección"
    
    @extend_schema_field(serializers.CharField())
    def get_representative_name(self, obj) -> Optional[str]:
        """Nombre del representante para menores."""
        if obj.representative:
            return obj.representative.full_name
        return None


class PatientDetailSerializer(serializers.ModelSerializer):
    """
    La Joyas de la Corona": Devuelve la visión 360° del paciente.
    Incluye alertas críticas, historia unificada y geolocalización.
    """
    full_name = serializers.ReadOnlyField()
    age = serializers.SerializerMethodField()
    age_category = serializers.ReadOnlyField()
    is_pediatric = serializers.ReadOnlyField()
    guardian_info = serializers.SerializerMethodField()
    medical_history = MedicalHistorySerializer(many=True, read_only=True)
    genetic_predispositions = GeneticPredispositionSerializer(many=True, read_only=True)
    alerts = serializers.SerializerMethodField()
    address_chain = serializers.SerializerMethodField()
    representative = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            "id", "full_name", "national_id", "age", "age_category", "is_pediatric", "gender", "birthdate",
            "email", "contact_info", "blood_type", "weight", "height",
            "medical_history", "genetic_predispositions", "alerts",
            "address", "address_chain", "active", "created_at", "updated_at",
            "tattoo", "profession", "skin_type",
            # --- Campos Paciente Pediátrico ---
            "is_minor",
            "representative",
            "relationship_type",
            "parental_consent",
            "consent_date",
            "representative_doc",
            "representative_phone",
            "representative_email",
            "guardian_info",
        ]
    
    def get_age(self, obj):
        return obj.age
    
    @extend_schema_field(serializers.DictField())
    def get_guardian_info(self, obj):
        return obj.guardian_info
    
    @extend_schema_field(serializers.DictField())
    def get_representative(self, obj):
        if not obj.representative:
            return None
        return {
            "id": obj.representative.id,
            "full_name": obj.representative.full_name,
            "national_id": obj.representative.national_id,
            "phone": obj.representative_phone,
            "relationship": obj.get_relationship_type_display(),
        }
    
    def get_alerts(self, obj):
        """Extrae alertas de seguridad: Alergias severas o riesgos clínicos."""
        if not hasattr(obj, 'alerts'): return []
        return [{"type": a.type, "message": a.message} for a in obj.alerts.all()]
    
    def get_address_chain(self, obj):
        """Navegación segura por la jerarquía geográfica."""
        n = obj.neighborhood
        if not n:
            return {"neighborhood": "N/A", "full_path": "Sin dirección"}
        p = getattr(n, 'parish', None)
        m = getattr(p, 'municipality', None) if p else None
        s = getattr(m, 'state', None) if m else None
        
        res: Dict[str, Any] = {
            "neighborhood": getattr(n, 'name', "N/A"),
            "parish": getattr(p, 'name', 'N/A'),
            "municipality": getattr(m, 'name', "N/A"),
            "state": getattr(s, 'name', 'N/A'),
            "country": getattr(s.country, 'name', "N/A") if s else "N/A",
            "full_path": f"{n.name}, {getattr(p, 'name', '')}".strip(', ')
        }
        return res


class MedicationCatalogSerializer(serializers.ModelSerializer):
    """
    Serializer mejorado para el catálogo de medicamentos.
    Expone todos los campos útiles para el frontend de prescripciones.
    """
    presentation_display = serializers.CharField(
        source='get_presentation_display', 
        read_only=True
    )
    route_display = serializers.CharField(
        source='get_route_display', 
        read_only=True
    )
    unit_display = serializers.CharField(
        source='get_unit_display', 
        read_only=True
    )
    
    class Meta:
        model = MedicationCatalog
        fields = [
            "id", 
            "name", 
            "generic_name", 
            "presentation",
            "presentation_display",
            "concentration",
            "route",
            "route_display",
            "unit",
            "unit_display",
            "presentation_size",
            "concentration_detail",
            "code",
            "inhrr_code",
            "inhrr_status",
            "atc_code",
            "is_controlled",
            "therapeutic_action",
            "source",
            "is_active",
            "last_scraped_at",
        ]


class PrescriptionComponentSerializer(serializers.ModelSerializer):
    unit_display = serializers.CharField(source="get_unit_display", read_only=True)

    class Meta:
        model = PrescriptionComponent
        fields = ["id", "substance", "dosage", "unit", "unit_display"]


# --- Prescripciones ---
class PrescriptionSerializer(serializers.ModelSerializer):
    """
    Serializer de lectura para prescripciones.
    
    ✅ CORREGIDO: Anida objetos completos para el frontend:
    - medication_catalog: Objeto completo del catálogo INHRR
    - doctor: Objeto con full_name e is_verified
    - institution: Objeto con name
    """
    route_display = serializers.CharField(source="get_route_display", read_only=True)
    frequency_display = serializers.CharField(source="get_frequency_display", read_only=True)
    components = PrescriptionComponentSerializer(many=True, read_only=True)
    
    # ✅ CRÍTICO: Anidar objeto completo del catálogo INHRR
    medication_catalog = MedicationCatalogSerializer(read_only=True)
    
    # ✅ Campos de metadata
    medication_name = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()
    institution = serializers.SerializerMethodField()
    class Meta:
        model = Prescription
        fields = [
            "id", "diagnosis", "medication_catalog", "medication_text", "medication_name",
            "dosage_form", "route", "route_display", "frequency", "frequency_display",
            "duration", "indications", "components", "doctor", "institution", "issued_at"
        ]
    def get_medication_name(self, obj):
        """Fallback si medication_catalog no existe"""
        if obj.medication_catalog:
            return obj.medication_catalog.name
        return obj.medication_text or "—"
    def get_doctor(self, obj):
        """Retorna objeto doctor con campos necesarios para PrescriptionBadge"""
        if obj.doctor:
            return {
                'id': obj.doctor.id,
                'full_name': obj.doctor.full_name,
                'is_verified': getattr(obj.doctor, 'is_verified', False),
            }
        return None
    def get_institution(self, obj):
        """Retorna objeto institution con campos necesarios"""
        if obj.institution:
            return {
                'id': obj.institution.id,
                'name': obj.institution.name,
            }
        return None


class PrescriptionComponentWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionComponent
        fields = ["substance", "dosage", "unit"]


class PrescriptionWriteSerializer(serializers.ModelSerializer):
    # Definimos los componentes para permitir la creación de la receta y sus fármacos en un solo JSON
    components = PrescriptionComponentSerializer(many=True)

    class Meta:
        model = Prescription
        fields = [
            "id",
            "diagnosis",
            "medication_catalog",
            "medication_text",
            "dosage_form",  # 👈 Nuevo: Tableta, Jarabe, Ampolla...
            "route",
            "frequency",
            "duration",
            "indications",  # 👈 Nuevo: Instrucciones para el paciente
            "components",   # Lista de sustancias activas
        ]

    def validate(self, data):
        """Validación de integridad: Debe haber una fuente de medicamento."""
        if not data.get("medication_catalog") and not data.get("medication_text"):
            raise serializers.ValidationError(
                "Debe seleccionar un medicamento del catálogo o escribir uno manualmente."
            )
        return data

    def create(self, validated_data):
        """Crea la receta y sus componentes en una transacción atómica."""
        components_data = validated_data.pop("components", [])
        
        # Usamos atomic para asegurar que si falla un componente, no se cree la receta vacía
        from django.db import transaction
        with transaction.atomic():
            prescription = Prescription.objects.create(**validated_data)
            for comp in components_data:
                PrescriptionComponent.objects.create(prescription=prescription, **comp)
        return prescription

    def update(self, instance, validated_data):
        """Actualiza la receta y refresca la lista de componentes."""
        components_data = validated_data.pop("components", None)

        from django.db import transaction
        with transaction.atomic():
            # Actualizamos los campos básicos de la receta
            instance = super().update(instance, validated_data)

            # Si se enviaron componentes, reemplazamos los anteriores (Lógica de reemplazo total)
            if components_data is not None:
                instance.components.all().delete()
                for comp_data in components_data:
                    PrescriptionComponent.objects.create(prescription=instance, **comp_data)
        
        return instance


class TreatmentSerializer(serializers.ModelSerializer):
    """
    Serializer de Lectura: Optimizado para mostrar la información completa 
    en la línea de tiempo del paciente.
    
    ✅ ACTUALIZADO: Ahora incluye campos CACHED (patient, doctor, institution)
                  usando SerializerMethodField para evitar errores de definición
    """
    treatment_type_display = serializers.CharField(source="get_treatment_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    
    # Útil para el Frontend: indica si el tratamiento sigue vigente hoy
    is_active_now = serializers.SerializerMethodField()
    
    # ✅ NUEVOS: Campos CACHED usando SerializerMethodField (solución definitiva)
    patient = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()
    institution = serializers.SerializerMethodField()
    class Meta:
        model = Treatment
        fields = [
            "id",
            "diagnosis",
            # ✅ Campos CACHED agregados
            "patient",
            "doctor",
            "institution",
            # Definición
            "treatment_type",
            "treatment_type_display",
            "title",
            "plan",
            # Cronología
            "start_date",
            "end_date",
            # Estado y control
            "is_permanent",
            "status",
            "status_display",
            "notes",
            # Utilidad frontend
            "is_active_now",
        ]
    
    def get_is_active_now(self, obj) -> bool:
        from django.utils import timezone
        if obj.end_date:
            return obj.end_date >= timezone.now().date()
        return True
    
    def get_patient(self, obj):
        """Devuelve el paciente con datos básicos."""
        if obj.patient:
            return {
                "id": obj.patient.id,
                "national_id": obj.patient.national_id,
                "full_name": obj.patient.full_name,
                "gender": obj.patient.gender,
            }
        return None
    
    def get_doctor(self, obj):
        """Devuelve el médico con datos básicos."""
        if obj.doctor:
            return {
                "id": obj.doctor.id,
                "full_name": obj.doctor.full_name,
                "colegiado_id": obj.doctor.colegiado_id,
                "gender": obj.doctor.gender,
                "is_verified": obj.doctor.is_verified,
            }
        return None
    
    def get_institution(self, obj):
        """Devuelve la institución con datos básicos."""
        if obj.institution:
            return {
                "id": obj.institution.id,
                "name": obj.institution.name,
                "tax_id": obj.institution.tax_id,
                "is_active": obj.institution.is_active,
            }
        return None


class TreatmentWriteSerializer(serializers.ModelSerializer):
    """
    Serializer de Escritura: Limpio y con validaciones de integridad temporal.
    """
    class Meta:
        model = Treatment
        fields = [
            "id",
            "diagnosis",
            "treatment_type",
            "title",
            "plan",
            "start_date",
            "end_date",
            "is_permanent",
            "status",
            "notes",
        ]

    def validate(self, data):
        """
        Validación Élite: Integridad de fechas.
        """
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        is_permanent = data.get('is_permanent', False)

        # 1. Si no es permanente, debe tener fin o lógica de revisión
        if not is_permanent and not end_date and data.get('status') == 'active':
            # Opcional: Podrías lanzar error o simplemente dejarlo pasar según tu regla de negocio
            pass

        # 2. El fin no puede ser antes que el inicio
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "La fecha de finalización no puede ser anterior a la de inicio."
            })

        return data


class DiagnosisSerializer(serializers.ModelSerializer):
    """
    Serializer de LECTURA: Completo para el historial clínico.
    Muestra relaciones anidadas y etiquetas legibles.
    """
    treatments = TreatmentSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    doctor_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Diagnosis
        fields = [
            "id", "appointment", "icd_code", "title", "foundation_id", 
            "description", "type", "type_display", "status", "status_display", 
            "clinical_certainty", "treatments", "prescriptions", 
            "created_by", "doctor_name", "created_at", "updated_at",
        ]


class DiagnosisWriteSerializer(serializers.ModelSerializer):
    """
    Serializer de ESCRITURA: Optimizado y Seguro.
    Se encarga de la validación del catálogo y asignación de autoría.
    """
    class Meta:
        model = Diagnosis
        fields = [
            "id", "appointment", "icd_code", "title", "foundation_id",
            "description", "type", "status", "clinical_certainty"
        ]

    def validate_icd_code(self, value):
        """Valida que el código exista en el catálogo maestro CIE-11."""
        if not ICD11Entry.objects.filter(icd_code=value).exists():
            raise serializers.ValidationError(
                f"El código '{value}' no es válido en el catálogo institucional."
            )
        return value

    def validate(self, data):
        """Lógica de integridad: Coherencia entre estatus y certeza."""
        status = data.get('status')
        certainty = data.get('clinical_certainty')

        if status == 'confirmed' and certainty is not None and certainty < 80:
            raise serializers.ValidationError({
                "clinical_certainty": "Un diagnóstico confirmado no puede tener una certeza menor al 80%."
            })
        return data

    def create(self, validated_data):
        """Asigna automáticamente al médico que realiza el diagnóstico."""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)


# --- Pagos ---
class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer de pagos.
    
    ✅ ACTUALIZADO: Ahora incluye campo CACHED (doctor) para trazabilidad
                  usando SerializerMethodField para evitar errores de definición
    """
    # --- Lectura Inflada (UI Friendly) ---
    patient_name = serializers.CharField(source="appointment.patient.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    method_display = serializers.CharField(source="get_method_display", read_only=True)
    
    # Campo para ver la respuesta técnica de la API (solo para auditoría)
    gateway_response_raw = serializers.JSONField(read_only=True)
    
    # ✅ NUEVO: Campo CACHED usando SerializerMethodField (solución definitiva)
    doctor = serializers.SerializerMethodField()
    class Meta:
        model = Payment
        fields = [
            "id",
            "institution",
            "appointment",
            "charge_order",
            # ✅ Campo CACHED agregado
            "doctor",
            "patient_name",
            # Transacción
            "amount",
            "amount_ves",
            "exchange_rate_bcv",
            "currency",
            "method",
            "method_display",
            "status",
            "status_display",
            # Trazabilidad Fintech
            "gateway_transaction_id",
            "reference_number",
            "bank_reference",
            "gateway_response_raw",
            # Verificación
            "verification_type",
            "verified_by",
            "verified_at",
            "verification_notes",
            # Auditoría
            "received_at",
            "created_at",
            "updated_at",
            "screenshot",
        ]
    
    def get_doctor(self, obj):
        """Devuelve el médico con datos básicos."""
        if obj.doctor:
            return {
                "id": obj.doctor.id,
                "full_name": obj.doctor.full_name,
                "colegiado_id": obj.doctor.colegiado_id,
                "gender": obj.doctor.gender,
                "is_verified": obj.doctor.is_verified,
            }
        return None



class PaymentWriteSerializer(serializers.ModelSerializer):
    """
    Serializer de ESCRITURA: Para crear pagos desde el panel de consulta.
    Solo incluye campos editables, el resto se auto-completa desde charge_order.
    """
    bank_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    detail = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Payment
        fields = ["amount", "method", "reference_number", "bank_name", "detail", "screenshot"]
    
    def validate_amount(self, value):
        if value <= Decimal('0.00'):
            raise serializers.ValidationError("El monto debe ser positivo")
        return value
    
    def validate_method(self, value):
        valid_methods = ['cash', 'card', 'transfer', 'zelle', 'crypto', 'other']
        if value not in valid_methods:
            raise serializers.ValidationError(f"Método inválido. Opciones: {valid_methods}")
        return value


class MedicalDocumentWriteSerializer(serializers.ModelSerializer):
    """
    Serializer de ESCRITURA: Gestiona la carga segura de archivos.
    Calcula automáticamente metadatos de integridad y auditoría.
    """
    class Meta:
        model = MedicalDocument
        fields = [
            "id", "patient", "appointment", "diagnosis", "category",
            "description", "file", "mime_type", "size_bytes", "checksum_sha256"
        ]
        read_only_fields = ["id", "mime_type", "size_bytes", "checksum_sha256"]

    def validate(self, attrs):
        """
        Validación de Integridad Clínica: Asegura que el documento 
        esté anclado al contexto médico correcto.
        """
        category = attrs.get("category")
        appointment = attrs.get("appointment")
        diagnosis = attrs.get("diagnosis")

        # Regla de Oro: Documentos clínicos requieren una Cita
        clinical_types = ["prescription", "treatment", "medical_test_order", "medical_referral"]
        
        if category in clinical_types and not appointment:
            raise serializers.ValidationError({
                "appointment": f"Los documentos de tipo '{category}' deben generarse dentro de una cita médica."
            })

        # Regla de Precisión: Recetas y Tratamientos requieren un Diagnóstico
        if category in ["prescription", "treatment"] and not diagnosis:
            raise serializers.ValidationError({
                "diagnosis": "Para emitir una prescripción o tratamiento debe seleccionar el diagnóstico asociado."
            })

        return attrs

    def create(self, validated_data):
        """
        Inyección de metadatos de auditoría y seguridad.
        """
        request = self.context.get("request")
        file = validated_data.get("file")

        if file:
            # 1. Metadatos automáticos del archivo
            validated_data["mime_type"] = getattr(file, "content_type", "application/octet-stream")
            validated_data["size_bytes"] = file.size
            
            # 2. Generar Checksum SHA256 (Pilar de No Repudio)
            sha256 = hashlib.sha256()
            for chunk in file.chunks():
                sha256.update(chunk)
            validated_data["checksum_sha256"] = sha256.hexdigest()

        # 3. Datos de Auditoría
        if request and request.user.is_authenticated:
            validated_data["uploaded_by"] = request.user
            validated_data["source"] = "user_uploaded"

        return super().create(validated_data)


# --- Eventos (auditoría) ---
class EventSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    action_label = serializers.SerializerMethodField()
    action_href = serializers.SerializerMethodField()
    badge_action = serializers.SerializerMethodField()
    actor = serializers.SerializerMethodField()  # ✅ CORREGIDO: Ahora usa get_actor()
    
    class Meta:
        model = Event
        fields = [
            "id",
            "timestamp",
            "actor",
            "entity",
            "entity_id",
            "action",
            "metadata",
            "severity",
            "notify",
            # 🔹 Campos enriquecidos
            "title",
            "description",
            "category",
            "action_label",
            "action_href",
            "badge_action",  # 🔹 Incluido en la respuesta
        ]
    
    # 🆕 MEJORADO: Títulos más descriptivos para notificaciones
    def get_title(self, obj):
        # === CHARGE ORDER ===
        if obj.entity == "ChargeOrder" and obj.action == "void":
            return f"Orden #{obj.entity_id} anulada"
        if obj.entity == "ChargeOrder" and obj.action == "void_by_appointment_cancel":
            return f"Orden #{obj.entity_id} anulada por cancelación"
        if obj.entity == "ChargeOrder" and obj.action == "waive":
            return f"Orden #{obj.entity_id} exonerada"
        if obj.entity == "ChargeOrder" and obj.action == "create":
            return f"Orden #{obj.entity_id} creada"
        
        # === PAYMENT ===
        if obj.entity == "Payment" and obj.action == "create":
            return "Pago confirmado"
        if obj.entity == "Payment" and obj.action == "confirm":
            return "Pago verificado"
        if obj.entity == "Payment" and obj.action == "reverse":
            return f"Pago #{obj.entity_id} reversado"
        
        # === APPOINTMENT ===
        if obj.entity == "Appointment" and obj.action == "create":
            return f"Cita #{obj.entity_id} creada"
        if obj.entity == "Appointment" and obj.action == "update":
            return "Cita actualizada"
        if obj.entity == "Appointment" and obj.action == "cancel":
            return f"Cita #{obj.entity_id} cancelada"
        if obj.entity == "Appointment" and obj.action == "canceled":
            return f"Cita #{obj.entity_id} cancelada"
        if obj.entity == "Appointment" and obj.action == "completed":
            return f"Cita #{obj.entity_id} completada"
        if obj.entity == "Appointment" and obj.action == "arrived":
            return f"Paciente llegó a cita #{obj.entity_id}"
        
        # === WAITING ROOM ===
        if obj.entity == "WaitingRoom" and obj.action == "delete":
            return "Paciente retirado de sala de espera"
        if obj.entity == "WaitingRoomEntry" and obj.action == "patient_arrived":
            return "Paciente llegó a la sala de espera"
        if obj.entity == "WaitingRoomEntry" and obj.action == "create":
            return "Paciente agregado a sala de espera"
        
        # === PATIENT ===
        if obj.entity == "Patient" and obj.action == "create":
            return "Paciente registrado"
        if obj.entity == "Patient" and obj.action == "update":
            return "Datos del paciente actualizados"
        
        # Fallback genérico
        return f"{obj.entity} {obj.action}"
    
    # 🆕 MEJORADO: Descripciones con metadata relevante
    def get_description(self, obj):
        # === CHARGE ORDER ===
        if obj.entity == "ChargeOrder" and obj.action in ["void", "void_by_appointment_cancel", "waive"]:
            reason = ""
            actor = ""
            if obj.metadata:
                reason = obj.metadata.get("reason", "Anulación manual")
                actor = obj.metadata.get("actor", "Sistema")
            if reason and actor:
                return f"Razón: {reason} | Por: {actor}"
            elif reason:
                return f"Razón: {reason}"
            return f"Orden #{obj.entity_id} procesada"
        
        if obj.entity == "ChargeOrder":
            return f"Orden #{obj.entity_id}"
        
        # === PAYMENT ===
        if obj.entity == "Payment":
            amount = ""
            if obj.metadata:
                amount = obj.metadata.get("amount", "")
            return f"Monto: ${amount}" if amount else f"Pago #{obj.entity_id} registrado"
        
        # === APPOINTMENT ===
        if obj.entity == "Appointment":
            if obj.metadata:
                patient_id = obj.metadata.get("patient_id", "")
                doctor_id = obj.metadata.get("doctor_id", "")
                return f"ID Paciente: {patient_id} | ID Médico: {doctor_id}"
            return f"Cita #{obj.entity_id}"
        
        # === WAITING ROOM ===
        if obj.entity == "WaitingRoomEntry" and obj.action == "patient_arrived":
            pid = obj.metadata.get("patient_id") if obj.metadata else None
            aid = obj.metadata.get("appointment_id") if obj.metadata else None
            return f"Paciente #{pid} con cita #{aid}"
        
        # === PATIENT ===
        if obj.entity == "Patient" and obj.action == "create":
            if obj.metadata:
                full_name = obj.metadata.get("full_name", "")
                return f"Nombre: {full_name}" if full_name else "Nuevo paciente registrado"
            return "Nuevo paciente"
        
        # Metadata genérico
        if obj.metadata:
            # Intentar mostrar información relevante del metadata
            if "message" in obj.metadata:
                return obj.metadata.get("message", "")
            # Mostrar las primeras 2 claves del metadata
            keys = list(obj.metadata.keys())[:2]
            parts = [f"{k}: {obj.metadata[k]}" for k in keys]
            return " | ".join(parts)
        
        return ""
    
    def get_category(self, obj):
        # Normaliza entity+action como clave única
        return f"{obj.entity.lower()}.{obj.action.lower()}"
    
    def get_action_label(self, obj):
        if obj.entity == "Payment":
            return "Ver pago"
        if obj.entity == "ChargeOrder":
            return "Ver orden"
        if obj.entity == "Appointment":
            return "Ver cita"
        if obj.entity == "WaitingRoomEntry":
            return "Ver sala de espera"
        if obj.entity == "WaitingRoom":
            return "Ver sala de espera"
        if obj.entity == "Patient":
            return "Ver paciente"
        return "Ver detalle"
    
    # 🆕 MEJORADO: action_href correcto para cada entidad
    def get_action_href(self, obj):
        if obj.entity == "Payment":
            return f"/payments/{obj.entity_id}"
        if obj.entity == "ChargeOrder":
            return f"/payments/{obj.entity_id}"
        if obj.entity == "Appointment":
            return f"/appointments?view={obj.entity_id}"  # ✅ CORREGIDO
        if obj.entity == "Patient":
            return f"/patients/{obj.entity_id}"
        if obj.entity == "WaitingRoom":
            return "/waitingroom"
        if obj.entity == "WaitingRoomEntry":
            return "/waitingroom"
        return None
    
    def get_badge_action(self, obj):
        # 🔹 Normaliza para NotificationBadge
        if obj.action in ["create", "update", "delete"]:
            return obj.action
        if obj.action in ["void", "waive", "cancel", "canceled"]:
            return "delete"
        if obj.action in ["confirm", "completed", "patient_arrived"]:
            return "create"
        if obj.entity == "WaitingRoomEntry" and obj.action == "patient_arrived":
            return "create"
        return "other"
    
    def get_actor(self, obj):
        # ✅ CORREGIDO: Combina actor_user y actor_name
        if obj.actor_user:
            return str(obj.actor_user)
        return obj.actor_name or "System"


class InstitutionSettingsSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True, use_url=True)
    
    # Representación de lectura para la dirección completa (Propiedad del modelo)
    full_address = serializers.ReadOnlyField()
    # Usamos PrimaryKeyRelatedField para que el Frontend envíe solo el ID en POST/PATCH
    neighborhood = serializers.PrimaryKeyRelatedField(
        queryset=Neighborhood.objects.all(),
        required=False,
        allow_null=True
    )
    class Meta:
        model = InstitutionSettings
        fields = [
            "id", 
            "name", 
            "tax_id", 
            "logo", 
            "phone", 
            "address", 
            "neighborhood", 
            "full_address",
            "is_active",
            # --- CAMPOS FINTECH UNIVERSALES ---
            "active_gateway", 
            "gateway_api_key", 
            "gateway_api_secret", 
            "settlement_bank_name", 
            "settlement_account_id", 
            "is_gateway_test_mode"
        ]
        # Seguridad Elite: El secreto de la API se puede escribir pero nunca leer desde el Frontend
        extra_kwargs = {
            'gateway_api_secret': {'write_only': True}
        }
    def to_representation(self, instance):
        """
        Inflamos el objeto para que el Frontend vea la jerarquía geográfica completa
        y la configuración de pagos sea fácil de procesar.
        """
        response = super().to_representation(instance)
        
        # --- Lógica de Jerarquía Geográfica ---
        n = instance.neighborhood
        if n:
            # ✅ MANEJO DEFENSIVO usando getattr()
            p = getattr(n, 'parish', None)
            m = getattr(p, 'municipality', None) if p else None
            s = getattr(m, 'state', None) if m else None
            c = getattr(s, 'country', None) if s else None
            
            neighborhood_data = {
                'id': n.id,
                'name': n.name,
                'parish': None,
                'municipality': None,
                'state': None,
                'country': None
            }
            
            if p:
                neighborhood_data['parish'] = {
                    'id': p.id,
                    'name': p.name,
                    'municipality': None,
                    'state': None,
                    'country': None
                }
                
                if m:
                    neighborhood_data['parish']['municipality'] = {
                        'id': m.id,
                        'name': m.name,
                        'state': None,
                        'country': None
                    }
                    
                    if s:
                        neighborhood_data['parish']['municipality']['state'] = {
                            'id': s.id,
                            'name': s.name,
                            'country': None
                        }
                        
                        if c:
                            neighborhood_data['parish']['municipality']['state']['country'] = {
                                'id': c.id,
                                'name': c.name
                            }
            
            response['neighborhood'] = neighborhood_data
        
        # --- Lógica de Seguridad para el Frontend ---
        # Si existe un secret, enviamos un indicador pero no el valor real
        if instance.gateway_api_secret:
            response['has_api_secret_configured'] = True
        else:
            response['has_api_secret_configured'] = False
            
        return response


# --- Sala de espera (básico) ---
class WaitingRoomEntrySerializer(serializers.ModelSerializer):
    """
    Serializer de LISTADO: Optimizado para el tablero de control de recepción.
    Muestra quién está en fila, su prioridad y cuánto tiempo lleva esperando.
    """
    # ✅ AGREGAR: Patient anidado para el frontend
    patient = PatientReadSerializer(read_only=True)
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_id_number = serializers.CharField(source='patient.national_id', read_only=True)
    appointment_status = serializers.CharField(source='appointment.status', read_only=True)
    waiting_time_minutes = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # ✅ AGREGAR: Institution anidado
    institution_data = InstitutionSettingsSerializer(source='institution', read_only=True)
    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id", 
            "patient",           # ✅ Objeto completo del paciente
            "patient_name",       # ✅ Nombre formateado
            "patient_id_number",  # ✅ Cédula del paciente
            "appointment", 
            "appointment_status",
            "arrival_time", 
            "waiting_time_minutes",
            "status", 
            "status_display",
            "priority", 
            "source_type", 
            "order",
            "institution",       # ✅ ID de la institución
            "institution_data",  # ✅ Objeto completo de la institución
        ]
    def get_waiting_time_minutes(self, obj) -> int:
        """Calcula el tiempo transcurrido desde la llegada en tiempo real."""
        if obj.status == 'waiting' and obj.arrival_time:
            delta = timezone.now() - obj.arrival_time
            return int(delta.total_seconds() // 60)
        return 0


class WaitingRoomEntryWriteSerializer(serializers.ModelSerializer):
    institution = serializers.PrimaryKeyRelatedField(
        queryset=InstitutionSettings.objects.all(),
        required=True
    )
    
    class Meta:
        model = WaitingRoomEntry
        fields = ["patient", "appointment", "priority", "source_type", "notes", "institution"]
    def validate(self, attrs):
        patient = attrs.get('patient')
        institution = attrs.get('institution')
        if WaitingRoomEntry.objects.filter(patient=patient, institution=institution, status='waiting').exists():
            raise serializers.ValidationError("El paciente ya se encuentra en la sala de espera.")
        return attrs


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
    
    # ✅ NUEVO: Servicio asociado (DoctorService)
    doctor_service_name = serializers.CharField(source='doctor_service.name', read_only=True)
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
            "doctor_service",     # <--- AGREGADO
            "doctor_service_name",# <--- AGREGADO
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


class InstitutionMiniSerializer(serializers.ModelSerializer):
    """Serializer minimal para institution selector"""
    class Meta:
        model = InstitutionSettings
        fields = ['id', 'name', 'logo', 'is_active']


class ChargeOrderSerializer(serializers.ModelSerializer):
    """
    Serializer de órdenes de cobro.
    
    ✅ ACTUALIZADO: Ahora incluye campo institution para显示 en frontend
    """
    total = serializers.FloatField(read_only=True)
    balance_due = serializers.FloatField(read_only=True)
    items = ChargeItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    
    # ✅ NUEVO: Campo institution con mini serializer
    institution = InstitutionMiniSerializer(read_only=True)
    
    # Campo CACHED usando SerializerMethodField
    doctor = serializers.SerializerMethodField()
    
    # Campo plano para Search.tsx y otros endpoints
    patient_name = serializers.SerializerMethodField()
    
    # Nuevos campos de fecha tentativa
    tentative_date = serializers.DateField(required=False, allow_null=True)
    tentative_time = serializers.TimeField(required=False, allow_null=True)
    
    class Meta:
        model = ChargeOrder
        fields = (
            "id",
            "appointment",
            "patient",
            "institution",  # ✅ NUEVO: Agregado
            "currency",
            "doctor",
            "total",
            "balance_due",
            "status",
            "issued_at",
            "issued_by",
            "items",
            "payments",
            "patient_name",
            "tentative_date",  # ✅ NUEVO: Agregado
            "tentative_time",  # ✅ NUEVO: Agregado
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )
    
    def get_patient_name(self, obj) -> str:
        return obj.patient.full_name if obj.patient else ""
    
    def get_doctor(self, obj):
        """Devuelve el médico con datos básicos."""
        if obj.doctor:
            return {
                "id": obj.doctor.id,
                "full_name": obj.doctor.full_name,
                "colegiado_id": obj.doctor.colegiado_id,
                "gender": obj.doctor.gender,
                "is_verified": obj.doctor.is_verified,
            }
        return None


class VitalSignsSerializer(serializers.ModelSerializer):
    """
    Serializer para Signos Vitales con lógica de semaforización.
    Calcula el IMC y evalúa si los rangos son normales o críticos.
    """
    # Propiedad calculada en el modelo
    bmi = serializers.ReadOnlyField()
    
    # Campo inyectado para alertas en el Frontend
    vitals_status = serializers.SerializerMethodField()

    class Meta:
        model = VitalSigns
        fields = [
            'id', 
            'appointment',
            'weight', 
            'height', 
            'temperature', 
            'bp_systolic', 
            'bp_diastolic', 
            'heart_rate', 
            'respiratory_rate', 
            'oxygen_saturation', 
            'bmi',
            'vitals_status'
        ]

    @extend_schema_field(serializers.DictField())
    def get_vitals_status(self, obj):
        """
        Retorna un mapa de alertas para que el Frontend pinte de colores.
        Ej: 'high', 'low', 'normal'.
        """
        status = {
            "bp": "normal",
            "temp": "normal",
            "o2": "normal"
        }
        
        # Lógica de Presión Arterial (Simplificada)
        if obj.bp_systolic and obj.bp_systolic >= 140:
            status["bp"] = "high"
        elif obj.bp_systolic and obj.bp_systolic <= 90:
            status["bp"] = "low"
            
        # Lógica de Temperatura
        if obj.temperature and obj.temperature >= 38.0:
            status["temp"] = "high"
        elif obj.temperature and obj.temperature <= 35.5:
            status["temp"] = "low"
            
        # Lógica de Oxigenación
        if obj.oxygen_saturation and obj.oxygen_saturation < 92:
            status["o2"] = "critical"
            
        return status

class ClinicalNoteSerializer(serializers.ModelSerializer):
    """
    Serializer para la Nota Médica (SOAP).
    Implementa el 'Sello de Seguridad' que impide la alteración de registros
    una vez finalizada la consulta.
    """
    # Campos informativos para la interfaz
    is_editable = serializers.SerializerMethodField()

    class Meta:
        model = ClinicalNote
        fields = [
            'id', 
            'appointment', 
            'subjective', 
            'objective', 
            'analysis', 
            'plan', 
            'is_locked', 
            'locked_at',
            'created_at',
            'updated_at',
            'is_editable'
        ]
        read_only_fields = ['locked_at', 'created_at', 'updated_at']

    def get_is_editable(self, obj) -> bool:
        """Helper para que el Frontend bloquee los campos visualmente."""
        return not obj.is_locked

    def validate(self, data):
        """
        Regla de Oro de Integridad Médica:
        Si la nota ya está bloqueada, se prohíbe cualquier cambio via API.
        """
        if self.instance and self.instance.is_locked:
            # Solo permitimos la validación si no se está intentando cambiar nada 
            # (evita errores en validaciones de serializadores anidados)
            raise serializers.ValidationError(
                "Esta nota clínica cuenta con un cierre médico (firmada/bloqueada). "
                "Cualquier corrección debe hacerse mediante una nota de evolución posterior."
            )
        return data

    def update(self, instance, validated_data):
        """
        Lógica de Cierre de Nota:
        Al activar is_locked, se estampa el timestamp y se guarda el estado.
        """
        was_locked = instance.is_locked
        is_locking_now = validated_data.get('is_locked', False)

        if is_locking_now and not was_locked:
            instance.locked_at = timezone.now()
            # Aquí se podría disparar una señal para generar el PDF del MedicalReport automáticamente
        
        return super().update(instance, validated_data)


# --- Citas ---
class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer de LISTADO y ESCRITURA: Optimizado para el calendario y la
    gestión administrativa de citas.
    """
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    appointment_type_display = serializers.CharField(source='get_appointment_type_display', read_only=True)
    # ✅ NUEVO: Servicio específico (DoctorService)
    doctor_service_name = serializers.CharField(source='doctor_service.name', read_only=True)
    # ✅ NUEVOS CAMPOS para servicios del catálogo
    services = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        write_only=True,
        required=False,
        help_text="Lista de servicios: [{'doctor_service_id': 1, 'qty': 1}]"
    )
    # ✅ NUEVO: Pago inicial opcional
    initial_payment = serializers.DictField(required=False, write_only=True)
    # 🆕 AGREGADO: VitalSigns para obtener peso y talla desde signos vitales
    vital_signs = VitalSignsSerializer(read_only=True)
    # ✅ NUEVO: Campo charge_order (solo en respuesta de creación)
    charge_order = ChargeOrderSerializer(read_only=True)
    
    # ✅ NUEVO: Campos de fecha tentativa (solo lectura para API de listado)
    tentative_date = serializers.DateField(read_only=True)
    tentative_time = serializers.TimeField(read_only=True)
    confirmed_at = serializers.DateTimeField(read_only=True)
    class Meta:
        model = Appointment
        fields = [
            "id", "institution", "doctor", "doctor_name", "patient", "patient_name",
            "appointment_date", "appointment_type",
            "appointment_type_display", "status", "status_display",
            "expected_amount", "arrival_time",
            # ✅ Nuevos campos de servicio
            "doctor_service",
            "doctor_service_name",
            # ✅ Nuevos campos de creación
            "services",
            "initial_payment",
            # 🆕 MÉTRICAS ANTROPOMÉTRICAS del Appointment
            "weight",
            "height",
            # 🆕 AGREGADO: VitalSigns (peso y talla desde signos vitales)
            "vital_signs",
            # ✅ AGREGADO: ChargeOrder (respuesta)
            "charge_order",
            # ✅ NUEVO: Campos de fecha tentativa
            "tentative_date",
            "tentative_time",
            "confirmed_at",
        ]
        read_only_fields = ["id", "charge_order", "tentative_date", "tentative_time", "confirmed_at"]
    def get_patient_name(self, obj):
        """Obtiene el nombre completo del paciente de forma explícita."""
        if obj.patient:
            return obj.patient.full_name
        return "UNKNOWN_SUBJECT"
    def get_doctor_name(self, obj):
        """✅ CORREGIDO: Obtiene el nombre completo del doctor directamente del modelo."""
        if obj.doctor:
            return obj.doctor.full_name
        return None
    def create(self, validated_data):
        """
        Creación Élite de Appointment con ChargeOrder automático.
        """
        from .models import ChargeOrder, ChargeItem, Payment
        from decimal import Decimal
        # Extraer servicios y pago inicial
        services_data = validated_data.pop('services', [])
        initial_payment = validated_data.pop('initial_payment', None)
        
        # 1. Crear el Appointment
        # NOTA: Si se envía fecha tentativa desde la compra, se guardará en los campos correspondientes
        # El flujo actual crea la cita directamente, pero para el nuevo flujo:
        # Si el status es 'tentative', guardamos la fecha en tentative_date
        if validated_data.get('status') == 'tentative':
            validated_data['tentative_date'] = validated_data.get('appointment_date')
            # appointment_date real se asignará después de la confirmación
            # Por ahora, mantenemos appointment_date como la fecha tentativa para consistencia visual
            pass
            
        appointment = Appointment.objects.create(**validated_data)
        
        # 2. Crear ChargeOrder automáticamente
        charge_order = ChargeOrder.objects.create(
            appointment=appointment,
            patient=appointment.patient,
            doctor=appointment.doctor,
            institution=appointment.institution,
            currency="USD",
            status="open",
            total=Decimal('0.00'),
            balance_due=Decimal('0.00'),
        )
        
        # 3. Crear ChargeItems directamente desde los datos recibidos
        total_amount = Decimal('0.00')
        for service in services_data:
            doctor_service_id = service.get('doctor_service_id')
            qty = service.get('qty', 1)
            if doctor_service_id:
                doctor_service = None
                try:
                    doctor_service = DoctorService.objects.filter(
                        id=doctor_service_id,
                        is_active=True
                    ).first()
                except Exception:
                    pass
                
                if doctor_service:
                    code = doctor_service.code
                    description = doctor_service.name
                    unit_price = doctor_service.price_usd
                else:
                    code = service.get('code', f'SVC-{doctor_service_id}')
                    description = service.get('description', f'Servicio {doctor_service_id}')
                    unit_price = Decimal(str(service.get('unit_price', service.get('price_usd', service.get('price', 0)))))
                
                item = ChargeItem.objects.create(
                    order=charge_order,
                    doctor_service=doctor_service,
                    code=code,
                    description=description,
                    qty=Decimal(str(qty)),
                    unit_price=unit_price,
                )
                total_amount += item.subtotal
        
        # Recalcular totales del ChargeOrder
        charge_order.recalc_totals()
        charge_order.save(update_fields=['total', 'balance_due', 'status'])
        
        # ✅ FIX: Actualizar expected_amount en Appointment
        appointment.expected_amount = charge_order.total
        appointment.save(update_fields=['expected_amount'])
        
        # 4. [OPCIONAL] Procesar pago inicial
        if initial_payment and total_amount > 0:
            payment_amount = Decimal(str(initial_payment.get('amount', 0)))
            if payment_amount > 0:
                payment = Payment.objects.create(
                    institution=appointment.institution,
                    appointment=appointment,
                    charge_order=charge_order,
                    amount=payment_amount,
                    method=initial_payment.get('method', 'cash'),
                    reference_number=initial_payment.get('reference_number', f"PRE-{charge_order.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"),
                    status='confirmed',
                )
                # Recalcular después del pago
                charge_order.recalc_totals()
                charge_order.save(update_fields=['total', 'balance_due', 'status'])
        
        return appointment
    
    def update(self, instance, validated_data):
        """
        Actualización Élite de Appointment.
        Maneja la actualización de campos básicos y la sincronización de servicios.
        """
        from .models import ChargeOrder, ChargeItem, Payment
        from decimal import Decimal
        
        # Extraer servicios y pago inicial
        services_data = validated_data.pop('services', None)
        initial_payment = validated_data.pop('initial_payment', None)
        
        # 1. Actualizar campos básicos del Appointment
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 2. Sincronizar servicios si se proporcionan
        if services_data is not None:
            # Obtener o crear ChargeOrder
            charge_order = ChargeOrder.objects.filter(
                appointment=instance
            ).exclude(status='void').order_by('-issued_at').first()
            
            if not charge_order:
                charge_order = ChargeOrder.objects.create(
                    appointment=instance,
                    patient=instance.patient,
                    doctor=instance.doctor,
                    institution=instance.institution,
                    currency="USD",
                    status="open",
                    total=Decimal('0.00'),
                    balance_due=Decimal('0.00'),
                )
            
            # Eliminar items existentes
            ChargeItem.objects.filter(order=charge_order).delete()
            
            # Crear nuevos items
            total_amount = Decimal('0.00')
            for service in services_data:
                doctor_service_id = service.get('doctor_service_id')
                qty = service.get('qty', 1)
                if doctor_service_id:
                    doctor_service = None
                    try:
                        doctor_service = DoctorService.objects.filter(
                            id=doctor_service_id,
                            is_active=True
                        ).first()
                    except Exception:
                        pass
                    
                    if doctor_service:
                        code = doctor_service.code
                        description = doctor_service.name
                        unit_price = doctor_service.price_usd
                    else:
                        code = service.get('code', f'SVC-{doctor_service_id}')
                        description = service.get('description', f'Servicio {doctor_service_id}')
                        unit_price = Decimal(str(service.get('unit_price', service.get('price_usd', service.get('price', 0)))))
                    
                    item = ChargeItem.objects.create(
                        order=charge_order,
                        doctor_service=doctor_service,
                        code=code,
                        description=description,
                        qty=Decimal(str(qty)),
                        unit_price=unit_price,
                    )
                    total_amount += item.subtotal
            
            # Recalcular totales del ChargeOrder
            charge_order.recalc_totals()
            charge_order.save(update_fields=['total', 'balance_due', 'status'])
            
            # Actualizar expected_amount en Appointment
            instance.expected_amount = charge_order.total
            instance.save(update_fields=['expected_amount'])
        
        return instance


# --- Documentos clínicos ---
class MedicalDocumentReadSerializer(serializers.ModelSerializer):
    """
    Serializer de LECTURA: Proporciona la trazabilidad completa del documento.
    Diseñado para auditoría legal y visualización de expedientes.
    
    ✅ ACTUALIZADO: Ahora incluye campos CACHED (doctor, institution)
                   usando SerializerMethodField para evitar errores de definición
    ✅ NUEVO: Agregado file_url para compatibilidad con frontend
    """
    # 1. Identidad del Paciente
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    
    # 2. Etiquetas legibles para la UI
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    
    # 3. Trazabilidad de Usuarios (Full Name desde el modelo User)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    # ✅ NUEVOS: Campos CACHED usando SerializerMethodField (solución definitiva)
    doctor = serializers.SerializerMethodField()
    institution = serializers.SerializerMethodField()
    
    # ✅ NUEVO: file_url como alias de file para compatibilidad con frontend
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalDocument
        fields = [
            "id", 
            # Identidad
            "patient", "patient_name", 
            "appointment", 
            "diagnosis",
            # ✅ Campos CACHED agregados
            "doctor",
            "institution",
            # Clasificación
            "category", "category_display", 
            "source", "source_display",
            "origin_panel", 
            # Archivo
            "description", 
            "file", 
            "file_url",  # ✅ NUEVO: alias para frontend
            "mime_type", 
            "size_bytes",
            # Seguridad
            "checksum_sha256", 
            "audit_code", 
            "is_signed", 
            "signer_name",
            "signer_registration", 
            "template_version", 
            # Auditoría
            "uploaded_at",
            "uploaded_by_name", 
            "generated_by_name",
        ]
    
    def get_doctor(self, obj):
        """Devuelve el médico con datos básicos."""
        if obj.doctor:
            return {
                "id": obj.doctor.id,
                "full_name": obj.doctor.full_name,
                "colegiado_id": obj.doctor.colegiado_id,
                "gender": obj.doctor.gender,
                "is_verified": obj.doctor.is_verified,
            }
        return None
    
    def get_institution(self, obj):
        """Devuelve la institución con datos básicos."""
        if obj.institution:
            return {
                "id": obj.institution.id,
                "name": obj.institution.name,
                "tax_id": obj.institution.tax_id,
                "is_active": obj.institution.is_active,
            }
        return None
    
    def get_file_url(self, obj):
        """Devuelve la URL del archivo para compatibilidad con frontend."""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


# --- Sala de espera (detallado con cita completa) ---
class WaitingRoomEntryDetailSerializer(serializers.ModelSerializer):
    """
    Serializer de DETALLE: Proporciona el contexto completo del paciente
    y la cita asociada para el médico o la enfermera de triaje.
    """
    patient = PatientReadSerializer(read_only=True)
    appointment = AppointmentSerializer(read_only=True)
    effective_status = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = WaitingRoomEntry
        fields = [
            "id",
            "patient",
            "appointment",
            "arrival_time",
            "status",
            "effective_status",
            "priority",
            "priority_display",
            "source_type",
            "order",
            "created_at",
        ]

    def get_effective_status(self, obj):
        """
        Lógica de estado unificada: Si la cita está en 'arrived', 
        para la sala de espera el estado efectivo es 'waiting'.
        """
        if obj.appointment:
            status = obj.appointment.status
            # Mapeo de estados de cita a estados de flujo de sala
            mapping = {
                "arrived": "waiting",
                "in_consultation": "called",
                "completed": "finished",
                "cancelled": "removed"
            }
            return mapping.get(status, status)
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


class SpecialtySerializer(serializers.ModelSerializer):
    """Especialidades médicas con soporte para jerarquía"""
    subspecialties = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Specialty
        fields = ["id", "code", "name", "category", "parent", "subspecialties", "icon_name"]


# --- Serializers de Horarios ---
class ServiceScheduleSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)
    
    class Meta:
        model = ServiceSchedule
        fields = '__all__'
        read_only_fields = ['service']



class DoctorServiceSerializer(serializers.ModelSerializer):
    """Serializer para servicios del doctor."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    price_ves = serializers.SerializerMethodField()
    
    # Nuevos campos de configuración de citas
    requires_appointment = serializers.BooleanField(default=True)
    booking_lead_time = serializers.IntegerField(default=24)
    cancellation_window = serializers.IntegerField(default=24)
    
    # Horarios asociados (solo lectura)
    schedules = ServiceScheduleSerializer(many=True, read_only=True)
    
    class Meta:
        model = DoctorService
        fields = [
            'id', 'doctor', 'doctor_name', 'category', 'category_name',
            'institution', 'code', 'name', 'description',
            'price_usd', 'price_ves', 'duration_minutes',
            'is_active', 'is_visible_global',
            'requires_appointment', 'booking_lead_time', 'cancellation_window',
            'schedules',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_price_ves(self, obj):
        # Si el modelo tiene un campo price_ves, devolverlo directamente
        if hasattr(obj, 'price_ves') and obj.price_ves:
            return float(obj.price_ves)
        # Si no, calcular a partir de price_usd (asumiendo tasa de cambio disponible)
        # Por ahora, devolver price_usd como fallback
        return float(obj.price_usd) if obj.price_usd else 0.0


class DoctorServiceWriteSerializer(serializers.ModelSerializer):
    """Serializer de escritura para servicios del doctor."""
    
    # Nuevos campos de configuración de citas
    requires_appointment = serializers.BooleanField(default=True)
    booking_lead_time = serializers.IntegerField(default=24)
    cancellation_window = serializers.IntegerField(default=24)
    
    class Meta:
        model = DoctorService
        fields = [
            'doctor', 'category', 'institution', 'code', 'name',
            'description', 'price_usd', 'duration_minutes',
            'is_active', 'is_visible_global',
            'requires_appointment', 'booking_lead_time', 'cancellation_window'
        ]
    
    def validate_code(self, value):
        # Validar que el código sea único globalmente
        if DoctorService.objects.filter(code=value.upper()).exists():
            if not self.instance or self.instance.code.upper() != value.upper():
                raise serializers.ValidationError("Ya existe un servicio con este código")
        return value.upper()
    
    def validate_price_usd(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError("El precio no puede ser negativo")
        return value


class DoctorServiceSearchSerializer(serializers.ModelSerializer):
    """Serializer liviano para búsqueda/autocomplete de servicios."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = DoctorService
        fields = ['id', 'code', 'name', 'price_usd', 'category_name']


class DoctorOperatorSerializer(serializers.ModelSerializer):
    signature = serializers.ImageField(required=False, allow_null=True, use_url=True)
    specialties = SpecialtySerializer(many=True, read_only=True)
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(),
        many=True,
        write_only=True,
        source="specialties"
    )
    institutions = serializers.PrimaryKeyRelatedField(
        queryset=InstitutionSettings.objects.all(),
        many=True,
        required=False,
        allow_null=True
    )
    active_institution = serializers.PrimaryKeyRelatedField(
        queryset=InstitutionSettings.objects.all(),
        required=False,
        allow_null=True
    )
    formal_title = serializers.CharField(read_only=True)
    
    # === NUEVO: Servicios del doctor ===
    services = DoctorServiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = DoctorOperator
        fields = [
            "id",
            "full_name",
            "gender",
            "is_verified",
            "colegiado_id",
            "license",
            "specialties",
            "specialty_ids",
            "institutions",
            "active_institution",
            "email",
            "phone",
            "signature",
            "formal_title",
            "services",
            "bio",
            "photo_url",
        ]
    
    def to_representation(self, instance):
        """
        Extiende la representación para incluir también los IDs de especialidades
        en la salida, de modo que el frontend pueda repoblar el <select multiple>.
        """
        rep = super().to_representation(instance)
        rep["specialty_ids"] = list(instance.specialties.values_list("id", flat=True))
        rep["institution_ids"] = list(instance.institutions.values_list("id", flat=True))
        return rep
        
    def update(self, instance, validated_data):
        """
        ✅ FIX DEFINITIVO:
        - Maneja specialties, specialty_ids, e institutions correctamente
        - Permite enviar [] para borrar todas
        - Evita el bug del OR que destruía la lógica
        """
        specialties = None
        institutions = None
        # ✅ Si vienen specialties (por source="specialties")
        if "specialties" in validated_data:
            specialties = validated_data.pop("specialties")
        # ✅ Si vienen specialty_ids directamente
        if "specialty_ids" in validated_data:
            specialties = validated_data.pop("specialty_ids")
        # ✅ Si vienen instituciones
        if "institutions" in validated_data:
            institutions = validated_data.pop("institutions")
        # ✅ Actualizar campos simples
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        # ✅ Actualizar ManyToMany de especialidades
        if specialties is not None:
            if all(isinstance(s, int) or isinstance(s, str) for s in specialties):
                ids = [int(s) for s in specialties]
                qs = Specialty.objects.filter(id__in=ids)
                instance.specialties.set(qs)
            else:
                instance.specialties.set(specialties)
        # ✅ Actualizar ManyToMany de instituciones
        if institutions is not None:
            instance.institutions.set(institutions)
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
    """
    Serializer de informes médicos.
    
    ✅ ACTUALIZADO: Ahora usa campos CACHED en lugar de .objects.first()
                  usando SerializerMethodField para evitar errores de definición
    """
    # ✅ CORREGIDO: Usar SerializerMethodField para campos CACHED (solución definitiva)
    institution = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()
    
    # Mantener campos relacionados si son necesarios
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
            # ✅ Ahora usa SerializerMethodField para obtener desde campos CACHED
            "institution",     
            "doctor",          
            # Listas relacionadas
            "diagnoses",       
            "prescriptions",   
        ]
    
    def get_institution(self, obj):
        """Devuelve la institución desde el campo CACHED."""
        if obj.institution:
            return {
                "id": obj.institution.id,
                "name": obj.institution.name,
                "tax_id": obj.institution.tax_id,
                "is_active": obj.institution.is_active,
            }
        return None
    
    def get_doctor(self, obj):
        """Devuelve el médico desde el campo CACHED."""
        if obj.doctor:
            return {
                "id": obj.doctor.id,
                "full_name": obj.doctor.full_name,
                "colegiado_id": obj.doctor.colegiado_id,
                "gender": obj.doctor.gender,
                "is_verified": obj.doctor.is_verified,
            }
        return None
    
    def get_diagnoses(self, obj):
        """Devuelve los diagnósticos de la consulta."""
        if obj.appointment:
            diagnoses = obj.appointment.diagnoses.all()
            from .serializers import DiagnosisSerializer
            return DiagnosisSerializer(diagnoses, many=True).data
        return []
    
    def get_prescriptions(self, obj):
        """Devuelve las prescripciones de la consulta."""
        if obj.appointment:
            # Buscar prescripciones vinculadas a los diagnósticos de esta cita
            prescription_ids = []
            for diag in obj.appointment.diagnoses.all():
                prescription_ids.extend(diag.prescriptions.values_list('id', flat=True))
            
            if prescription_ids:
                from .models import Prescription
                from .serializers import PrescriptionSerializer
                prescriptions = Prescription.objects.filter(id__in=prescription_ids)
                return PrescriptionSerializer(prescriptions, many=True).data
        return []


class ICD11EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = ICD11Entry
        fields = ["icd_code", "title", "definition", "synonyms", "parent_code", "foundation_id"]


class MedicalTestCatalogSerializer(serializers.ModelSerializer):
    """Catálogo maestro de exámenes (Laboratorio/Imagen)"""
    class Meta:
        model = MedicalTestCatalog
        fields = ["id", "name", "code", "category", "base_price", "is_active"]


# --- Exámenes médicos (lectura) ---
class MedicalTestSerializer(serializers.ModelSerializer):
    test_type_display = serializers.CharField(source="get_test_type_display", read_only=True)
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    catalog_detail = MedicalTestCatalogSerializer(source='catalog_item', read_only=True)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicalTest
        fields = [
            "id", "appointment", "diagnosis", "catalog_item", "catalog_detail",
            "test_type", "test_type_display", "test_name_override", "display_name",
            "urgency", "urgency_display", "status", "status_display", "description",
        ]

    def get_display_name(self, obj):
        return obj.test_name_override or (obj.catalog_item.name if obj.catalog_item else obj.get_test_type_display())


# --- Exámenes médicos (escritura) ---
class MedicalTestWriteSerializer(serializers.ModelSerializer):
    # Los displays se mantienen para que el Frontend reciba los textos tras el POST/PATCH
    test_type_display = serializers.CharField(source="get_test_type_display", read_only=True)
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MedicalTest
        fields = [
            "id",
            "appointment",
            "diagnosis",
            "catalog_item",       # 👈 Agregamos el vínculo al catálogo maestro
            "test_type",
            "test_type_display",
            "test_name_override", # 👈 Para nombres manuales si no está en catálogo
            "urgency",
            "urgency_display",
            "status",
            "status_display",
            "description",
        ]

    def validate(self, data):
        """
        Mantenemos solo la validación de integridad de negocio.
        DRF ya valida automáticamente que test_type y status sean opciones válidas.
        """
        if not data.get("appointment") and not data.get("diagnosis"):
            raise serializers.ValidationError(
                "Debe asociar el examen a una cita o a un diagnóstico (Integridad Médica)."
            )
        return data


# --- Referencias médicas ---
class MedicalReferralSerializer(serializers.ModelSerializer):
    """
    Serializer de LECTURA: Proporciona toda la información necesaria para 
    visualizar la referencia en el portal del paciente o del médico receptor.
    
    ✅ ACTUALIZADO: Ahora incluye campos CACHED (patient, doctor, institution)
                  usando SerializerMethodField para evitar errores de definición
    ✅ ACTUALIZADO: Agregado referred_to (computed) y referred_to_doctor_detail
    """
    # Relaciones de lectura detalladas
    specialties = SpecialtySerializer(many=True, read_only=True)
    
    # Etiquetas legibles para el Frontend
    urgency_display = serializers.CharField(source="get_urgency_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    
    # ✅ Campos CACHED usando SerializerMethodField
    patient = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()
    institution = serializers.SerializerMethodField()
    
    # ✅ NUEVO: Campo computado para el destinatario (frontend lo espera como string)
    referred_to = serializers.SerializerMethodField()
    
    # ✅ NUEVO: Detalle del doctor interno de destino (si existe)
    referred_to_doctor_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = MedicalReferral
        fields = [
            "id",
            "appointment",
            "diagnosis",
            # ✅ Campos CACHED agregados
            "patient",
            "doctor",
            "institution",
            # ✅ Campo computado para frontend
            "referred_to",
            # Doctor de destino (interno o externo)
            "referred_to_doctor",
            "referred_to_doctor_detail",
            "referred_to_external",
            # Metadatos clínicos
            "reason",
            "clinical_summary",
            # Especialidades
            "specialties",
            # Estado y urgencia
            "urgency",
            "urgency_display",
            "status",
            "status_display",
            # Tracking
            "is_internal",
            "issued_at",
        ]
    
    def get_patient(self, obj):
        """Devuelve el paciente con datos básicos."""
        if obj.patient:
            return {
                "id": obj.patient.id,
                "national_id": obj.patient.national_id,
                "full_name": obj.patient.full_name,
                "gender": obj.patient.gender,
            }
        return None
    
    def get_doctor(self, obj):
        """Devuelve el médico emisor con datos básicos."""
        if obj.doctor:
            return {
                "id": obj.doctor.id,
                "full_name": obj.doctor.full_name,
                "colegiado_id": obj.doctor.colegiado_id,
                "gender": obj.doctor.gender,
                "is_verified": obj.doctor.is_verified,
            }
        return None
    
    def get_institution(self, obj):
        """Devuelve la institución con datos básicos."""
        if obj.institution:
            return {
                "id": obj.institution.id,
                "name": obj.institution.name,
                "tax_id": obj.institution.tax_id,
                "is_active": obj.institution.is_active,
            }
        return None
    
    def get_referred_to(self, obj):
        """
        ✅ NUEVO: Devuelve el nombre del destinatario.
        Prioriza el doctor interno, sino usa el campo externo.
        """
        if obj.referred_to_doctor:
            return obj.referred_to_doctor.full_name
        return obj.referred_to_external or ""
    
    def get_referred_to_doctor_detail(self, obj):
        """
        ✅ NUEVO: Devuelve el detalle del doctor interno de destino (si existe).
        """
        if obj.referred_to_doctor:
            return {
                "id": obj.referred_to_doctor.id,
                "full_name": obj.referred_to_doctor.full_name,
                "colegiado_id": obj.referred_to_doctor.colegiado_id,
                "specialty": obj.referred_to_doctor.specialty.name if hasattr(obj.referred_to_doctor, 'specialty') and obj.referred_to_doctor.specialty else None,
            }
        return None


# --- Referencias médicas (escritura) ---
class MedicalReferralWriteSerializer(serializers.ModelSerializer):
    """
    Serializer de ESCRITURA: Optimizado para manejar la relación M2M 
    con especialidades de forma sencilla.
    """
    # Permitimos enviar una lista de IDs de especialidades
    specialty_ids = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(),
        many=True,
        write_only=True,
        source="specialties",
        required=True
    )

    class Meta:
        model = MedicalReferral
        fields = [
            "id",
            "appointment",
            "diagnosis",
            "referred_to_external",
            "reason",
            "specialty_ids",  # Se mapea automáticamente a 'specialties' en el modelo
            "urgency",
            "status",
        ]

    def validate(self, data):
        """
        Validación institucional: Asegura que la referencia tenga un destino claro.
        """
        if not data.get("specialties") and not data.get("referred_to_external"):
            raise serializers.ValidationError(
                "Debe indicar al menos una especialidad o un médico/centro de destino."
            )
        return data


# --- Serializador genérico para exponer choices ---
class ChoicesSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()


class AppointmentDetailSerializer(AppointmentSerializer):
    """
    EL MOTOR DE LA CONSULTA:
    Ensambla diagnósticos, planes de tratamiento, recetas, órdenes de laboratorio
    y el estado financiero en una única respuesta de alto rendimiento.
    """
    # 1. Relaciones Clínicas Directas
    diagnoses = DiagnosisSerializer(many=True, read_only=True)
    medical_tests = MedicalTestSerializer(many=True, read_only=True)
    referrals = MedicalReferralSerializer(many=True, read_only=True)
    vital_signs = VitalSignsSerializer(read_only=True)
    note = ClinicalNoteSerializer(read_only=True)
    patient = PatientReadSerializer(read_only=True)
    
    # ✅ AGREGAR: Institution y Doctor como objetos completos
    institution = serializers.SerializerMethodField()
    doctor = serializers.SerializerMethodField()
    
    # 2. Lógica de Negocio Inyectada (Tratamientos y Recetas)
    treatments = serializers.SerializerMethodField()
    prescriptions = serializers.SerializerMethodField()
    
    # 3. Bloque Financiero y de Auditoría
    charge_order = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()
    documents_count = serializers.SerializerMethodField()
    
    class Meta(AppointmentSerializer.Meta):
        fields = AppointmentSerializer.Meta.fields + [
            "diagnoses",
            "treatments",
            "prescriptions",
            "medical_tests",
            "referrals",
            "vital_signs",
            "note",
            "charge_order",
            "balance_due",
            "documents_count",
            "started_at",
            "completed_at",
            "notes",
            # ✅ AGREGAR estos campos
            "institution",
            "doctor",
        ]
    
    # ✅ AGREGAR estos métodos
    def get_institution(self, obj):
        """Devuelve la institución con datos completos."""
        if obj.institution:
            return {
                "id": obj.institution.id,
                "name": obj.institution.name,
                "tax_id": obj.institution.tax_id,
            }
        return None
    
    def get_doctor(self, obj):
        """Devuelve el doctor con datos completos."""
        if obj.doctor:
            return {
                "id": obj.doctor.id,
                "full_name": obj.doctor.full_name,
                "colegiado_id": obj.doctor.colegiado_id,
            }
        return None
    @extend_schema_field(serializers.FloatField())
    def get_balance_due(self, obj) -> float:
        """Extrae el saldo pendiente directamente de la lógica del modelo."""
        try:
            return float(obj.balance_due())
        except (AttributeError, TypeError, InvalidOperation):
            return 0.0
    @extend_schema_field(serializers.IntegerField())
    def get_documents_count(self, obj) -> int:
        """Cuenta los documentos médicos asociados a esta cita."""
        return obj.documents.count()
    def get_treatments(self, obj):
        """
        Obtiene tratamientos vinculados a los diagnósticos de esta cita.
        Optimizado para evitar el problema N+1.
        """
        qs = Treatment.objects.filter(diagnosis__appointment=obj).select_related("diagnosis")
        return TreatmentSerializer(qs, many=True).data
    def get_prescriptions(self, obj):
        """
        Obtiene recetas y sus componentes (medicamentos) asociados a la cita.
        """
        qs = Prescription.objects.filter(diagnosis__appointment=obj).prefetch_related("components")
        return PrescriptionSerializer(qs, many=True).data
    def get_charge_order(self, obj):
        """
        Devuelve la orden de cobro principal de la cita con lógica de prioridad.
        Prioriza: Pagada > Parcial > Abierta.
        ✅ ACTUALIZADO: Excluye tanto 'void' como 'waived' para evitar duplicados
        """
        order = obj.charge_orders.exclude(status__in=["void", "waived"]).order_by(
            models.Case(
                models.When(status="paid", then=0),
                models.When(status="partially_paid", then=1),
                models.When(status="open", then=2),
                default=3,
                output_field=models.IntegerField(),
            ),
            "-created_at"
        ).first()
        
        if order:
            # Obtener payments de la orden
            payments_data = []
            for p in order.payments.filter(status='confirmed'):
                payments_data.append({
                    "id": p.id,
                    "amount": float(p.amount),
                    "method": p.method,
                    "status": p.status,
                    "reference_number": p.reference_number,
                    "received_at": p.received_at.isoformat() if p.received_at else None,
                })
            
            return {
                "id": order.id,
                "status": order.status,
                "total": float(order.total),
                "balance_due": float(order.balance_due),
                "currency": order.currency,
                "issued_at": order.issued_at.isoformat() if order.issued_at else None,
                "items": list(order.items.values(
                    'id', 'code', 'description', 'qty', 'unit_price', 'subtotal'
                )),
                "payments": payments_data,
            }
        return None


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
    # ✅ Display para mostrar etiquetas legibles
    relative_display = serializers.CharField(source='get_relative_display', read_only=True)
    
    class Meta:
        model = FamilyHistory
        fields = [
            "id",
            "patient",
            "condition",
            "relative",
            "relative_display",  # ✅ Nueva: Label legible
            "age_at_diagnosis",  # ✅ Nueva: Edad al diagnóstico
            "notes",
            "created_at",
            "updated_at",  # ✅ Nueva
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


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
    # ✅ Display para mostrar etiquetas legibles
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    smokes_currently_display = serializers.CharField(source='get_smokes_currently_display', read_only=True)
    tobacco_type_display = serializers.CharField(source='get_tobacco_type_display', read_only=True)
    smoking_frequency_display = serializers.CharField(source='get_smoking_frequency_display', read_only=True)
    drinks_alcohol_display = serializers.CharField(source='get_drinks_alcohol_display', read_only=True)
    alcohol_frequency_display = serializers.CharField(source='get_alcohol_frequency_display', read_only=True)
    alcohol_quantity_display = serializers.CharField(source='get_alcohol_quantity_display', read_only=True)
    binge_frequency_display = serializers.CharField(source='get_binge_frequency_display', read_only=True)
    exercise_frequency_display = serializers.CharField(source='get_exercise_frequency_display', read_only=True)
    exercise_intensity_display = serializers.CharField(source='get_exercise_intensity_display', read_only=True)
    diet_type_display = serializers.CharField(source='get_diet_type_display', read_only=True)
    sleep_quality_display = serializers.CharField(source='get_sleep_quality_display', read_only=True)
    uses_drugs_display = serializers.CharField(source='get_uses_drugs_display', read_only=True)
    
    class Meta:
        model = Habit
        fields = [
            "id",
            "patient",
            "type",
            "type_display",  # ✅ Label legible
            
            # === TABACO ===
            "smokes_currently",
            "smokes_currently_display",
            "tobacco_type",
            "tobacco_type_display",
            "smoking_frequency",
            "smoking_frequency_display",
            "cigarettes_per_day",
            "smoking_start_age",
            
            # === ALCOHOL ===
            "drinks_alcohol",
            "drinks_alcohol_display",
            "alcohol_frequency",
            "alcohol_frequency_display",
            "alcohol_quantity",
            "alcohol_quantity_display",
            "binge_frequency",
            "binge_frequency_display",
            
            # === ACTIVIDAD FÍSICA ===
            "exercise_frequency",
            "exercise_frequency_display",
            "exercise_intensity",
            "exercise_intensity_display",
            "activity_description",
            
            # === DIETA ===
            "diet_type",
            "diet_type_display",
            "diet_restrictions",
            
            # === SUEÑO ===
            "sleep_hours",
            "sleep_quality",
            "sleep_quality_display",
            
            # === DROGAS ===
            "uses_drugs",
            "uses_drugs_display",
            "drug_description",
            "drug_frequency",
            
            # === COMUNES ===
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "patient"]


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
    # Relaciones Unificadas
    medical_history = MedicalHistorySerializer(many=True, read_only=True)
    vaccinations = PatientVaccinationSerializer(many=True, read_only=True)
    alerts = serializers.SerializerMethodField()
    
    # Metadatos del Paciente
    full_name = serializers.ReadOnlyField()
    age = serializers.SerializerMethodField()
    
    # Ubicación Jerárquica
    address_chain = serializers.SerializerMethodField()
    full_address = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id", "full_name", "national_id", "age", "gender", "blood_type",
            "weight", "height", "email", "contact_info",
            "birthdate", "birth_place", "birth_country",
            "medical_history", # Aquí vienen Personales, Familiares, Quirúrgicos, etc.
            "vaccinations",
            "alerts",          # Para ver alergias y riesgos críticos de un vistazo
            "address",         # Campo libre
            "full_address",    # Cadena de texto legible
            "address_chain",   # Estructura de IDs para el frontend
            "tattoo",           # Para pruebas de imagen
            "profession",       # Profesión del paciente
            "skin_type",        # Tipo de piel del paciente
        ]

    def get_age(self, obj) -> Optional[int]:
        if not obj.birthdate: return None
        today = date.today()
        return today.year - obj.birthdate.year - (
            (today.month, today.day) < (obj.birthdate.month, obj.birthdate.day)
        )

    def get_alerts(self, obj):
        """Muestra alertas críticas (alergias, condiciones de riesgo)"""
        if not hasattr(obj, 'alerts'): return []
        return [{"type": a.type, "message": a.message} for a in obj.alerts.filter(is_active=True)]

    def get_full_address(self, obj):
        """Construye una dirección legible combinando la jerarquía"""
        parts = []
        n = obj.neighborhood
        if n:
            parts.extend([n.name, n.parish.name, n.parish.municipality.name, n.parish.municipality.state.name])
        if obj.address: # Añadimos el campo libre al final
            parts.append(obj.address)
        return ", ".join(parts) if parts else "Dirección no registrada"

    def get_address_chain(self, obj):
        """Mantiene la compatibilidad con el selector geográfico del Frontend"""
        n = obj.neighborhood
        if not n:
            return {"neighborhood": "N/A", "country": "N/A"}
        
        p = n.parish
        m = p.municipality if p else None
        s = m.state if m else None
        c = s.country if s else None

        return {
            "neighborhood": n.name, "neighborhood_id": n.id,
            "parish": getattr(p, 'name', "N/A"), "parish_id": getattr(p, 'id', None),
            "municipality": getattr(m, 'name', "N/A"), "municipality_id": getattr(m, 'id', None),
            "state": getattr(s, 'name', "N/A"), "state_id": getattr(s, 'id', None),
            "country": getattr(c, 'name', "N/A"), "country_id": getattr(c, 'id', None),
        }


# --- Serializers auxiliares para PATCH/POST ---
class AppointmentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField()

class AppointmentNotesUpdateSerializer(serializers.Serializer):
    notes = serializers.CharField()

class WaitingRoomStatusUpdateSerializer(serializers.Serializer):
    status = serializers.CharField()

class RegisterArrivalSerializer(serializers.Serializer):
    patient_id = serializers.IntegerField()
    appointment_id = serializers.IntegerField(required=False)
    is_emergency = serializers.BooleanField(required=False)

class RegisterWalkinSerializer(serializers.Serializer):
    patient_id = serializers.IntegerField()


class NeighborhoodDetailSerializer(serializers.Serializer):
    """
    Serializer de solo lectura para reconstruir la jerarquía completa 
    de una dirección desde el sector (Neighborhood).
    """
    def to_representation(self, instance):
        n = instance
        
        # ✅ MANEJO DEFENSIVO usando getattr()
        p = getattr(n, 'parish', None)
        m = getattr(p, 'municipality', None) if p else None
        s = getattr(m, 'state', None) if m else None
        c = getattr(s, 'country', None) if s else None
        return {
            "neighborhood": getattr(n, 'name', 'N/A'),
            "neighborhood_id": getattr(n, 'id', None),
            "parish": getattr(p, 'name', 'N/A') if p else 'N/A',
            "parish_id": getattr(p, 'id', None) if p else None,
            "municipality": getattr(m, 'name', 'N/A') if m else 'N/A',
            "municipality_id": getattr(m, 'id', None) if m else None,
            "state": getattr(s, 'name', 'N/A') if s else 'N/A',
            "state_id": getattr(s, 'id', None) if s else None,
            "country": getattr(c, 'name', 'N/A') if c else 'N/A',
            "country_id": getattr(c, 'id', None) if c else None,
        }


class DoctorMiniSerializer(serializers.ModelSerializer):
    """Para que el frontend sepa quién es el médico de un vistazo"""
    class Meta:
        model = DoctorOperator
        fields = ['id', 'name', 'specialties', 'is_verified']


class MercantilP2CTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MercantilP2CTransaction
        fields = '__all__'
        read_only_fields = ('id', 'generated_at', 'confirmed_at')


class MercantilP2CConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = MercantilP2CConfig
        fields = '__all__'
        exclude = ('secret_key', 'webhook_secret')  # No exponer secrets


class MercantilP2CCreateTransactionSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    charge_order_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


# ==========================================
# SERIALIZERS WHATSAPP
# ==========================================
class WhatsAppMessageSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    
    class Meta:
        model = WhatsAppMessage
        fields = [
            'id', 'appointment', 'patient', 'patient_name',
            'doctor', 'doctor_name', 'message_type', 'content',
            'phone_to', 'status', 'sent_at', 'delivered_at',
            'read_at', 'whatsapp_message_id', 'error_message',
            'created_at'
        ]
        read_only_fields = ['id', 'sent_at', 'whatsapp_message_id']


class WhatsAppConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorOperator
        fields = [
            'whatsapp_enabled',
            'whatsapp_business_number',
            'whatsapp_business_id',
            'whatsapp_access_token',
            'reminder_hours_before',
        ]


class PaymentGatewaySerializer(serializers.ModelSerializer):
    """Serializer para el catálogo de métodos de pago"""
    
    class Meta:
        model = PaymentGateway
        fields = [
            'id',
            'code',
            'name',
            'name_en',
            'description',
            'is_active',
            'requires_legal_account',
            'logo_url',
            'api_docs_url',
            'config_schema',
            'supports_webhook',
            'supports_api_verify',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentGatewayListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listas de métodos de pago"""
    
    class Meta:
        model = PaymentGateway
        fields = [
            'id',
            'code',
            'name',
            'name_en',
            'logo_url',
            'is_active',
            'requires_legal_account',
        ]


class DoctorPaymentConfigSerializer(serializers.ModelSerializer):
    """Serializer para configuración de pago del doctor"""
    
    doctor_name = serializers.SerializerMethodField()
    enabled_methods_details = PaymentGatewayListSerializer(
        source='enabled_methods',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = DoctorPaymentConfig
        fields = [
            'id',
            'doctor',
            'doctor_name',
            # Datos bancarios básicos
            'bank_name',
            'bank_account',
            'bank_rif',
            'bank_phone',
            'bank_account_holder',
            # Mercantil
            'mercantil_client_id',
            'mercantil_enabled',
            'mercantil_is_test_mode',
            # Banesco
            'banesco_client_id',
            'banesco_enabled',
            'banesco_is_test_mode',
            # Binance
            'binance_merchant_id',
            'binance_enabled',
            # Configuración general
            'account_type',
            'manual_verification_enabled',
            'notifications_enabled',
            # Comisiones
            'commission_doctor_percent',
            'commission_patient_percent',
            # Verificación
            'is_verified',
            'verified_at',
            'verification_notes',
            # Métodos habilitados
            'enabled_methods',
            'enabled_methods_details',
            # Timestamps
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'is_verified',
            'verified_at',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'mercantil_secret_key': {'write_only': True},
            'mercantil_webhook_secret': {'write_only': True},
            'banesco_secret_key': {'write_only': True},
            'binance_api_secret': {'write_only': True},
            'binance_webhook_secret': {'write_only': True},
        }
    
    def get_doctor_name(self, obj):
        return obj.doctor.user.get_full_name() or obj.doctor.user.username


class DoctorPaymentConfigPublicSerializer(serializers.ModelSerializer):
    """
    Serializer público (para pacientes) - solo datos necesarios para pagos.
    NO incluye credenciales sensitifas.
    """
    
    enabled_methods_details = PaymentGatewayListSerializer(
        source='enabled_methods',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = DoctorPaymentConfig
        fields = [
            'bank_name',
            'bank_account',
            'bank_rif',
            'bank_phone',
            'bank_account_holder',
            'mercantil_enabled',
            'banesco_enabled',
            'binance_enabled',
            'manual_verification_enabled',
            'enabled_methods_details',
        ]


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Serializer completo para transacciones de pago"""
    
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    payment_method_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verification_type_display = serializers.CharField(source='get_verification_type_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'uuid',
            'doctor',
            'doctor_name',
            'patient',
            'patient_name',
            'payment_method',
            'payment_method_name',
            # Montos
            'amount',
            'currency',
            'currency_display',
            'amount_ves',
            'exchange_rate_bcv',
            'description',
            # Estado
            'status',
            'status_display',
            'verification_type',
            'verification_type_display',
            # Datos del pagador
            'payer_name',
            'payer_phone',
            'payer_email',
            # Referencias
            'reference_number',
            'gateway_transaction_id',
            'bank_reference',
            # Comisiones
            'commission_doctor_amount',
            'commission_patient_amount',
            'net_amount',
            # Auditoría
            'notes',
            'internal_notes',
            # Timing
            'created_at',
            'updated_at',
            'paid_at',
            'confirmed_at',
            'expires_at',
        ]
        read_only_fields = [
            'id',
            'uuid',
            'commission_doctor_amount',
            'commission_patient_amount',
            'net_amount',
            'created_at',
            'updated_at',
            'confirmed_at',
        ]
    
    def get_doctor_name(self, obj):
        if obj.doctor:
            return obj.doctor.user.get_full_name() or obj.doctor.user.username
        return None
    
    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.user.get_full_name() or obj.patient.user.username
        return None
    
    def get_payment_method_name(self, obj):
        if obj.payment_method:
            return obj.payment_method.name
        return None


class PaymentTransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear nuevas transacciones"""
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'doctor',
            'patient',
            'payment_method',
            'amount',
            'currency',
            'description',
            'payer_name',
            'payer_phone',
            'payer_email',
        ]
    
    def create(self, validated_data):
        from django.utils import timezone
        from decimal import Decimal
        
        # Obtener BCV rate si es VES
        if validated_data.get('currency') == 'VES':
            bcv_rate = self._get_bcv_rate()
            if bcv_rate:
                validated_data['exchange_rate_bcv'] = bcv_rate
        
        # Calcular expiración (24 horas por defecto)
        validated_data['expires_at'] = timezone.now() + timezone.timedelta(hours=24)
        
        return super().create(validated_data)
    
    def _get_bcv_rate(self):
        """Obtiene tasa BCV"""
        try:
            from .models import BCVRateCache
            latest = BCVRateCache.objects.first()
            if latest:
                return latest.value
        except Exception:
            pass
        return None


class PaymentTransactionConfirmSerializer(serializers.Serializer):
    """Serializer para confirmar manually un pago"""
    reference_number = serializers.CharField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class PaymentTransactionVerifySerializer(serializers.Serializer):
    """Serializer para verificar con APIs bancarias"""
    reference_number = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    bank_code = serializers.CharField(required=False)


class PaymentWebhookSerializer(serializers.ModelSerializer):
    """Serializer para webhooks de pago"""
    
    gateway_name = serializers.SerializerMethodField()
    transaction_uuid = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PaymentWebhook
        fields = [
            'id',
            'doctor',
            'gateway',
            'gateway_name',
            'transaction',
            'transaction_uuid',
            'event_type',
            'payload',
            'headers',
            'signature_valid',
            'signature_error',
            'status',
            'status_display',
            'processing_error',
            'response_sent',
            'created_at',
            'processed_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'processed_at',
        ]
    
    def get_gateway_name(self, obj):
        return obj.gateway.name if obj.gateway else None
    
    def get_transaction_uuid(self, obj):
        return str(obj.transaction.uuid) if obj.transaction else None


# Serializer para PatientSubscription existente
class PatientSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para suscripciones de pacientes"""
    
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PatientSubscription
        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'plan_type',
            'plan_type_display',
            'currency',
            'currency_display',
            'amount',
            'status',
            'status_display',
            'start_date',
            'end_date',
            'auto_renew',
            'payment_method_preferred',
            'external_subscription_id',
            'external_customer_id',
            'cancellation_reason',
            'notes',
            'is_active',
            'days_remaining',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]
    
    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.user.get_full_name() or obj.patient.user.username
        return None
    
    def get_doctor_name(self, obj):
        if obj.doctor:
            return obj.doctor.user.get_full_name() or obj.doctor.user.username
        return None


class PatientSubscriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear suscripciones"""
    
    class Meta:
        model = PatientSubscription
        fields = [
            'doctor',
            'plan_type',
            'currency',
            'amount',
            'start_date',
            'end_date',
            'auto_renew',
            'payment_method_preferred',
        ]
    
    def create(self, validated_data):
        from django.utils import timezone
        
        # Obtener el paciente del contexto
        patient = self.context.get('patient')
        validated_data['patient'] = patient
        validated_data['status'] = 'pending'
        
        return super().create(validated_data)


class PatientInvitationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    
    class Meta:
        model = PatientInvitation
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'token', 'status', 'sent_at', 'activated_at', 'expires_at',
            'payment_reference', 'payment_amount', 'payment_date',
            'notes', 'created_at', 'updated_at', 'is_active', 'is_expired'
        ]
        read_only_fields = ['token', 'created_at', 'updated_at']


class PatientInvitationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientInvitation
        fields = ['patient', 'doctor']


class PatientInvitationActivateSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=64)
    password = serializers.CharField(min_length=8)


# ==========================================
# SERIALIZER: MÉTODOS DE PAGO DEL PACIENTE
# ==========================================
class PatientPaymentMethodSerializer(serializers.ModelSerializer):
    bank_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PatientPaymentMethod
        fields = [
            'id', 
            'mobile_phone', 
            'mobile_national_id', 
            'preferred_bank',
            'bank_name',
            'last_payment_amount',
            'crypto_wallet',
            'crypto_type',
            'created_at',
            'updated_at',
        ]
    
    def get_bank_name(self, obj):
        if obj.preferred_bank:
            from .choices import get_bank_name
            return get_bank_name(obj.preferred_bank)
        return None


class ServiceCategorySerializer(serializers.ModelSerializer):
    """Serializer para categorías de servicios."""
    services_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceCategory
        fields = [
            'id', 'name', 'description', 'icon', 'is_active',
            'services_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_services_count(self, obj):
        # CORREGIDO: Usar managers inversos estándar de Django
        # La ForeignKey 'category' en DoctorService no tiene related_name explícito
        # Por lo tanto, el manager inverso es 'doctorservice_set'
        return obj.doctorservice_set.filter(is_active=True).count()


class ServiceCategoryWriteSerializer(serializers.ModelSerializer):
    """Serializer de escritura para categorías de servicios."""
    
    class Meta:
        model = ServiceCategory
        fields = ['name', 'description', 'icon', 'is_active']


