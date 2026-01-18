from django.db import models, transaction
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords, HistoricalChanges
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone
from django.apps import apps
from django.conf import settings
from .choices import UNIT_CHOICES, ROUTE_CHOICES, FREQUENCY_CHOICES, PRESENTATION_CHOICES
import hashlib

# Create your models here.
class GeneticPredisposition(models.Model):
    name = models.CharField(max_length=100, unique=True)  # catálogo global, único por nombre
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Genetic Predisposition"
        verbose_name_plural = "Genetic Predispositions"

    def __str__(self):
        return self.name


class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Country"
        verbose_name_plural = "Countries"

    def __str__(self):
        return self.name


class State(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="states")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("country", "name")
        verbose_name = "State"
        verbose_name_plural = "States"

    def __str__(self):
        return f"{self.name}, {self.country.name}"


class Municipality(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name="municipalities")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("state", "name")
        verbose_name = "Municipality"
        verbose_name_plural = "Municipalities"

    def __str__(self):
        return f"{self.name}, {self.state.name}"


class City(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("state", "name")
        verbose_name = "City"
        verbose_name_plural = "Cities"

    def __str__(self):
        return f"{self.name}, {self.state.name}"


class Parish(models.Model):
    municipality = models.ForeignKey(
        "core.Municipality",
        on_delete=models.CASCADE,
        related_name="parishes",
        null=True,   # ⚡ temporal en desarrollo
        blank=True   # ⚡ temporal en desarrollo
    )
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Parish"
        verbose_name_plural = "Parishes"
        constraints = [
            models.UniqueConstraint(
                fields=["municipality", "name"],
                name="unique_parish_per_municipality"
            )
        ]

    def __str__(self):
        return f"{self.name}, {self.municipality.name if self.municipality else 'SIN-MUNICIPIO'}"


class Neighborhood(models.Model):
    parish = models.ForeignKey(
        "core.Parish",
        on_delete=models.CASCADE,
        related_name="neighborhoods",
        null=True,   # ⚡ temporal en desarrollo
        blank=True   # ⚡ temporal en desarrollo
    )
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Neighborhood"
        verbose_name_plural = "Neighborhoods"
        constraints = [
            models.UniqueConstraint(
                fields=["parish", "name"],
                name="unique_neighborhood_per_parish"
            )
        ]

    def __str__(self):
        return f"{self.name}, {self.parish.name if self.parish else 'SIN-PARROQUIA'}"


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('Other', 'Otro'),
        ('Unknown', 'No especificado'),
    ]

    BLOOD_TYPES = [
        ("A+", "A+"), ("A-", "A-"),
        ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"),
        ("O+", "O+"), ("O-", "O-"),
    ]

    # --- Identificación ---
    national_id = models.CharField(
        max_length=12, # Aumentado por si incluyes letras tipo 'V-' o 'E-'
        unique=True,
        verbose_name="Documento de Identidad",
        null=True, blank=True,
        validators=[
            MinLengthValidator(5),
            MaxLengthValidator(12)
        ]
    )

    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    second_last_name = models.CharField(max_length=100, blank=True, null=True)

    # --- Datos Demográficos ---
    birthdate = models.DateField(blank=True, null=True)
    birth_place = models.CharField(max_length=255, blank=True, null=True)
    
    # Normalizamos país de nacimiento usando el modelo Country que ya tienes
    birth_country = models.ForeignKey(
        "Country", 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name="born_patients",
        verbose_name="País de nacimiento"
    )

    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Unknown')
    
    # --- Contacto ---
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True) # Campo vital separado
    contact_info = models.TextField(blank=True, null=True, help_text="Contactos de emergencia, etc.")

    # --- Ubicación (Jerarquía Geográfica) ---
    neighborhood = models.ForeignKey(
        "Neighborhood",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="patients"
    )
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección detallada")

    # --- Perfil Clínico Base ---
    # Nota: Peso y Altura suelen variar, pero los dejamos aquí como "Base" 
    # (Lo ideal es tomarlos de Vitals en cada cita)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Peso base en kg")
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Altura base en cm")
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPES, null=True, blank=True)

    genetic_predispositions = models.ManyToManyField(
        "GeneticPredisposition",
        blank=True,
        related_name="patients"
    )

    # --- Metadatos y Auditoría ---
    history = HistoricalRecords()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "patients"
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        """Retorna el nombre completo formateado."""
        parts = [self.first_name, self.middle_name, self.last_name, self.second_last_name]
        return " ".join([p for p in parts if p]).strip()

    def __str__(self):
        return f"{self.national_id or 'S/I'} - {self.full_name}"

    def delete(self, *args, **kwargs):
        """Soft delete."""
        self.active = False
        self.save(update_fields=["active"])


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('arrived', 'Arrived'),
        ('in_consultation', 'In Consultation'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
    ]

    TYPE_CHOICES = [
        ('general', 'Consulta General'),
        ('specialized', 'Consulta Especializada'),
    ]

    # --- RELACIONES DE PODER ---
    patient = models.ForeignKey(
        'Patient', 
        on_delete=models.CASCADE, 
        related_name='appointments'
    )
    
    # NUEVO: Anclaje obligatorio a la sede. Una cita no existe sin una institución.
    institution = models.ForeignKey(
        'InstitutionSettings', 
        on_delete=models.PROTECT, # No se puede borrar la sede si tiene citas
        related_name='appointments',
        verbose_name="Sede de atención"
    )
    
    # NUEVO: Vínculo con el médico (Practitioner)
    doctor = models.ForeignKey(
        'DoctorOperator', 
        on_delete=models.CASCADE, 
        related_name='appointments',
        verbose_name="Médico tratante"
    )

    # --- DATOS TEMPORALES Y ESTADO ---
    appointment_date = models.DateField()
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    arrival_time = models.TimeField(blank=True, null=True)
    
    appointment_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='general',
        verbose_name="Tipo de consulta"
    )

    # --- BRAZO FINANCIERO INICIAL ---
    expected_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Monto esperado (Sede)"
    )
    
    notes = models.TextField(blank=True, null=True)

    # --- MÉTRICAS DE TIEMPO ---
    started_at = models.DateTimeField(blank=True, null=True, verbose_name="Inicio de consulta")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Finalización de consulta")

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Cita Médica"
        verbose_name_plural = "Citas Médicas"
        ordering = ['-appointment_date', 'arrival_time']

    def __str__(self):
        return f"{self.patient} - {self.institution.name} - {self.appointment_date}"

    # --- PROPIEDADES DE VALIDACIÓN PARA EL ADMIN ---
    @property
    def is_fully_paid(self):
        """
        Calcula si la cita está pagada. 
        Requerido por core.admin.AppointmentAdmin (list_display[8])
        """
        # Si no hay saldo pendiente, está totalmente pagada
        return self.balance_due() <= 0

    # --- FINANZAS POR SEDE ---
    def total_paid(self):
        # Filtramos pagos confirmados en esta cita
        # Usamos 'completed' o 'confirmed' según tu lógica de Payment.status
        agg = self.payments.filter(status__in=['confirmed', 'completed']).aggregate(total=Sum('amount'))
        return agg.get('total') or Decimal('0.00')

    def balance_due(self):
        # El balance es específico a la ChargeOrder de esta cita en esta sede
        orders = self.charge_orders.exclude(status='void')
        if orders.exists():
            agg = orders.aggregate(b=Sum('balance_due'))
            return agg.get('b') or Decimal('0.00')
        return max(self.expected_amount - self.total_paid(), Decimal('0.00'))

    # --- LÓGICA DE SINCRONIZACIÓN (SALA DE ESPERA) ---
    def sync_waiting_room_status(self):
        WR_Entry = apps.get_model('core', 'WaitingRoomEntry')
        status_map = {
            'arrived': 'waiting',
            'in_consultation': 'in_consultation',
            'completed': 'completed',
            'canceled': 'canceled'
        }
        if self.status in status_map:
            WR_Entry.objects.filter(appointment=self).update(status=status_map[self.status])

    # --- FLUJO DE ESTADOS Y SEGURIDAD ---
    def save(self, *args, **kwargs):
        # 1. Validación de Verificación Profesional
        if not self.doctor.is_verified:
            # Aquí podrías lanzar una excepción si fuera necesario
            pass 

        # 2. Registro automático de hora de llegada
        if self.status == 'arrived' and not self.arrival_time:
            self.arrival_time = timezone.now().time()

        super().save(*args, **kwargs)
        self.sync_waiting_room_status()

    def update_status(self, new_status: str):
        self.status = new_status
        updated_fields = ["status"]

        if new_status == "in_consultation":
            self.started_at = timezone.now()
            updated_fields.append("started_at")
        elif new_status == "completed":
            self.completed_at = timezone.now()
            updated_fields.append("completed_at")

        self.save(update_fields=updated_fields)

    def mark_arrived(self, priority: str = "normal", source_type: str = "scheduled"):
        if self.status == "pending":
            self.status = "arrived"
            self.arrival_time = timezone.now().time()
            self.save(update_fields=["status", "arrival_time"])
            
            WR_Entry = apps.get_model('core', 'WaitingRoomEntry')
            WR_Entry.objects.get_or_create(
                appointment=self,
                patient=self.patient,
                defaults={
                    "institution": self.institution, # La sala de espera hereda la sede
                    "arrival_time": timezone.now(),
                    "status": "waiting",
                    "priority": priority,
                    "source_type": source_type,
                }
            )


# --- Señal para crear automáticamente la orden de cobro ---
@receiver(post_save, sender=Appointment)
def create_charge_order(sender, instance, created, **kwargs):
    if created and not instance.charge_orders.exists():
        from .models import ChargeOrder
        ChargeOrder.objects.create(
            appointment=instance,
            patient=instance.patient,
            currency="USD",
            status="open",
            total=Decimal('0.00'),
            balance_due=Decimal('0.00'),
        )


class WaitingRoomEntry(models.Model):
    PRIORITY_CHOICES = [
        ("normal", "Normal"),
        ("preference", "Preferencial"), # Agregamos valor humano/legal
        ("emergency", "Emergencia"),
    ]

    SOURCE_CHOICES = [
        ("scheduled", "Programada"),
        ("walkin", "Directo / Walk-in"),
    ]

    STATUS_CHOICES = [
        ("waiting", "En Espera"),
        ("in_consultation", "En Consulta"),
        ("completed", "Completado"),
        ("canceled", "Cancelado"),
        ("no_show", "No asistió"),
    ]

    # --- RELACIONES DE PODER ---
    # Segmentación por Sede: Fundamental para el Multi-Sede
    institution = models.ForeignKey(
        "InstitutionSettings", 
        on_delete=models.CASCADE, 
        related_name="waiting_room_entries"
    )

    patient = models.ForeignKey(
        "Patient", 
        on_delete=models.CASCADE,
        related_name="waiting_room_records"
    )
    
    # OneToOne garantiza que una cita no se duplique en la cola
    appointment = models.OneToOneField(
        "Appointment", 
        on_delete=models.CASCADE, # Si se borra la cita, sale de la sala
        related_name="waiting_room_entry",
        null=True, 
        blank=True
    )

    # --- CONTROL DE TIEMPOS Y FLUJO ---
    arrival_time = models.DateTimeField(default=timezone.now)
    called_at = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Hora de llamado a consultorio"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="waiting")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="normal")
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="scheduled")
    
    # Campo para reordenamiento manual por la secretaria si es necesario
    order = models.PositiveIntegerField(default=0)

    # --- AUDITORÍA ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # ORDENAMIENTO DE ÉLITE: 
        # 1. Emergencias primero.
        # 2. Preferenciales (ancianos/niños) segundo.
        # 3. Orden de llegada (arrival_time) para el resto.
        ordering = [
            models.Case(
                models.When(priority="emergency", then=0),
                models.When(priority="preference", then=1),
                default=2,
                output_field=models.IntegerField(),
            ),
            "arrival_time",
            "order",
        ]
        indexes = [
            models.Index(fields=['institution', 'status']),
        ]
        verbose_name = "Entrada de Sala de Espera"
        verbose_name_plural = "Entradas de Sala de Espera"

    def __str__(self):
        return f"{self.patient.full_name} — {self.institution.name} [{self.get_status_display()}]"

    # --- LÓGICA DE NEGOCIO ---
    @property
    def waiting_duration(self):
        """Calcula el tiempo real de espera en minutos para analítica"""
        end_time = self.called_at or timezone.now()
        diff = end_time - self.arrival_time
        return int(diff.total_seconds() // 60)

    def can_transition(self, new_status: str) -> bool:
        valid_transitions = {
            "waiting": ["in_consultation", "canceled", "no_show"],
            "in_consultation": ["completed", "canceled"],
            "completed": [],
            "canceled": [],
            "no_show": ["waiting"], # Por si llegó tarde y se re-activa
        }
        return new_status in valid_transitions.get(self.status, [])

    def update_status(self, new_status: str):
        if not self.can_transition(new_status):
             raise ValueError(f"Transición de estado inválida: {self.status} -> {new_status}")
        
        self.status = new_status
        if new_status == "in_consultation":
            self.called_at = timezone.now()
        
        self.save()
        
        # Sincronización automática con la Cita Madre
        if self.appointment:
            self.appointment.status = new_status
            if new_status == "in_consultation":
                self.appointment.started_at = timezone.now()
            elif new_status == "completed":
                self.appointment.completed_at = timezone.now()
            self.appointment.save(update_fields=['status', 'started_at', 'completed_at'])

    def place_in_queue(self):
        """Ubica al paciente al final de su categoría de prioridad en esta sede específica"""
        last = WaitingRoomEntry.objects.filter(
            institution=self.institution,
            priority=self.priority
        ).order_by("-order").first()
        
        self.order = (last.order + 1) if last else 1
        self.save(update_fields=["order"])


class Diagnosis(models.Model):
    # Niveles de madurez de la decisión médica
    TYPE_CHOICES = [
        ('presumptive', 'Presuntivo (Sospecha)'),
        ('definitive', 'Definitivo (Decretado/Confirmado)'),
        ('differential', 'Diferencial (Opción en estudio)'),
        ('provisional', 'Provisional'),
    ]

    # Estado del "Decreto"
    DECREE_STATUS_CHOICES = [
        ('under_investigation', 'En Investigación / Estudio'),
        ('awaiting_results', 'Esperando Resultados (Lab/Imagen)'),
        ('confirmed', 'Decretado / Confirmado'),
        ('ruled_out', 'Descartado / Excluido'),
        ('chronic', 'Pre-existente / Crónico'),
    ]

    appointment = models.ForeignKey(
        "Appointment", 
        on_delete=models.CASCADE, 
        related_name='diagnoses'
    )
    
    # --- VINCULACIÓN ICD-11 ---
    icd_code = models.CharField(max_length=20, verbose_name="Código CIE-11")
    title = models.CharField(max_length=255, verbose_name="Nombre de la afección")
    foundation_id = models.CharField(max_length=100, blank=True, null=True)

    # --- MÉTRICAS DE CERTEZA Y DECRETO ---
    type = models.CharField(
        max_length=20, 
        choices=TYPE_CHOICES, 
        default='presumptive'
    )
    status = models.CharField(
        max_length=20, 
        choices=DECREE_STATUS_CHOICES, 
        default='under_investigation'
    )
    
    clinical_certainty = models.PositiveIntegerField(
        default=50,
        help_text="Certeza clínica estimada (0-100%)"
    )
    
    is_main_diagnosis = models.BooleanField(
        default=False, 
        verbose_name="Diagnóstico Principal"
    )

    description = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Justificación / Notas del Decreto"
    )

    # Auditoría forense
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True
    )

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Diagnóstico"
        verbose_name_plural = "Diagnósticos"
        indexes = [
            models.Index(fields=['appointment', 'status']),
            models.Index(fields=['icd_code']),
        ]

    def __str__(self):
        return f"{self.icd_code} - {self.title} [{self.get_status_display()}]"

    def clean(self):
        # Validación institucional del catálogo
        from .models import ICD11Entry
        if self.icd_code and not ICD11Entry.objects.filter(icd_code=self.icd_code).exists():
            raise ValidationError({"icd_code": "El código CIE-11 no está en el catálogo institucional."})

    def save(self, *args, **kwargs):
        """
        Lógica Elite: Si un diagnóstico es 'Confirmado' o 'Crónico', 
        se crea/actualiza automáticamente en el historial médico del paciente.
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if self.status in ['confirmed', 'chronic']:
            MedicalHistory.objects.update_or_create(
                patient=self.appointment.patient,
                condition=self.title,
                defaults={
                    'status': 'active',
                    'source': f"Diagnóstico en Cita #{self.appointment.id}",
                    'notes': self.description or "Añadido automáticamente por decreto médico."
                }
            )


class Treatment(models.Model):
    TREATMENT_TYPE_CHOICES = [
        ("pharmacological", "Farmacológico"),
        ("surgical", "Quirúrgico / Procedimiento"),
        ("rehabilitation", "Fisioterapia / Rehabilitación"),
        ("lifestyle", "Cambio de estilo de vida / Dieta"),
        ("psychological", "Apoyo Psicológico / Terapia"), # Agregado
        ("other", "Otro"),
    ]

    STATUS_CHOICES = [
        ("active", "En curso / Activo"),
        ("completed", "Finalizado / Completado"),
        ("suspended", "Suspendido Temporalmente"), # Agregado para fármacos
        ("cancelled", "Cancelado / Contraindicado"),
    ]

    # --- Relaciones ---
    diagnosis = models.ForeignKey(
        "Diagnosis", 
        on_delete=models.CASCADE, 
        related_name="treatments"
    )
    
    # --- Definición ---
    treatment_type = models.CharField(
        max_length=30, 
        choices=TREATMENT_TYPE_CHOICES, 
        default="pharmacological"
    )
    title = models.CharField(
        max_length=200, 
        help_text="Ej: Fisioterapia lumbar, Bypass gástrico, etc."
    )
    plan = models.TextField(
        help_text="Descripción detallada del protocolo a seguir"
    )
    
    # --- Cronología ---
    start_date = models.DateField(default=timezone.now) # Mejor por defecto hoy
    end_date = models.DateField(blank=True, null=True)
    
    # --- Estado y Control ---
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="active"
    )
    is_permanent = models.BooleanField(
        default=False, 
        help_text="Marcar si es un tratamiento de por vida (ej: Insulina, Dieta para celíacos)"
    )
    notes = models.TextField(blank=True, null=True, help_text="Observaciones de evolución")

    class Meta:
        verbose_name = "Tratamiento"
        verbose_name_plural = "Tratamientos"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()}) - {self.diagnosis.title}"

    def save(self, *args, **kwargs):
        """
        Lógica Élite: Si el tratamiento es quirúrgico o permanente, 
        podemos disparar un registro en MedicalHistory.
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Si es Quirúrgico y se acaba de crear, lo registramos como antecedente quirúrgico
        if is_new and self.treatment_type == "surgical":
            from .models import MedicalHistory
            MedicalHistory.objects.get_or_create(
                patient=self.diagnosis.appointment.patient,
                condition=f"Cirugía: {self.title}",
                source="surgical", # Asegúrate de que este source exista en MedicalHistory
                notes=f"Realizado según plan en cita {self.diagnosis.appointment.id}. Plan: {self.plan}"
            )


class Prescription(models.Model):
    # Relación base obligatoria
    diagnosis = models.ForeignKey(
        "Diagnosis", 
        on_delete=models.CASCADE, 
        related_name="prescriptions"
    )

    # --- HÍBRIDO: CATÁLOGO O TEXTO LIBRE ---
    medication_catalog = models.ForeignKey(
        "MedicationCatalog",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="prescriptions"
    )
    medication_text = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Nombre comercial o genérico manual"
    )

    # --- POSOLOGÍA ---
    dosage_form = models.CharField(max_length=100, blank=True, help_text="Ej: 1 tableta, 5ml, 2 gotas")
    route = models.CharField(max_length=20, choices=ROUTE_CHOICES, default="oral")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default="once_daily")
    duration = models.CharField(max_length=200, blank=True, null=True, help_text="Ej: Por 7 días")
    indications = models.TextField(blank=True, null=True, help_text="Instrucciones: 'Tomar con abundante agua'")

    # --- CACHÉ DE IDENTIDAD (Optimización Élite) ---
    # Almacenamos estas IDs directamente para reportes rápidos y auditoría
    doctor = models.ForeignKey("DoctorOperator", on_delete=models.SET_NULL, null=True, editable=False)
    institution = models.ForeignKey("InstitutionSettings", on_delete=models.SET_NULL, null=True, editable=False)
    patient = models.ForeignKey("Patient", on_delete=models.CASCADE, null=True, editable=False)
    
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Récipe / Receta"
        verbose_name_plural = "Récipes / Recetas"
        ordering = ["-issued_at"]

    def save(self, *args, **kwargs):
        # Al guardar, "fotografiamos" el contexto para que sea inmutable
        if self.diagnosis and self.diagnosis.appointment:
            app = self.diagnosis.appointment
            self.doctor = app.doctor
            self.institution = app.institution
            self.patient = app.patient
        
        # Si viene del catálogo, podemos autocompletar componentes si no existen
        super().save(*args, **kwargs)

    def __str__(self):
        med = self.medication_catalog.name if self.medication_catalog else self.medication_text or "Medicamento"
        return f"{med} — {self.patient.full_name if self.patient else 'Sin Paciente'}"


class PrescriptionComponent(models.Model):
    """Componentes activos (Ej: Trimetoprim + Sulfametoxazol)"""
    prescription = models.ForeignKey(
        "Prescription",
        on_delete=models.CASCADE,
        related_name="components"
    )
    substance = models.CharField(max_length=100, verbose_name="Principio Activo")
    dosage = models.CharField(max_length=50, verbose_name="Concentración (Ej: 500)")
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default="mg")

    def __str__(self):
        return f"{self.substance} {self.dosage}{self.unit}"


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('rejected', 'Rechazado'),
        ('void', 'Anulado'),
    ]
    
    METHOD_CHOICES = [
        ('cash', 'Efectivo'),
        ('card', 'Tarjeta / Punto de Venta'),
        ('transfer', 'Transferencia / Pago Móvil'),
        ('zelle', 'Zelle / Divisas'),
        ('crypto', 'Criptomonedas'),
        ('other', 'Otro'),
    ]

    # --- RELACIONES ---
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.PROTECT,
        related_name='payments'
    )
    appointment = models.ForeignKey('Appointment', on_delete=models.CASCADE, related_name="payments")
    charge_order = models.ForeignKey('ChargeOrder', on_delete=models.CASCADE, related_name='payments')

    # --- TRANSACCIÓN ---
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # --- TRAZABILIDAD EXTERNA (ELITE) ---
    # ID universal para cualquier pasarela (Mercantil, Stripe, Binance, etc.)
    gateway_transaction_id = models.CharField(
        max_length=255, 
        blank=True, null=True, 
        unique=True,
        verbose_name="ID Transacción Pasarela"
    )
    
    reference_number = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Nro. Referencia Manual / Comprobante"
    )

    # Dump de la respuesta de la API para auditoría técnica
    gateway_response_raw = models.JSONField(blank=True, null=True)

    # --- AUDITORÍA ---
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="payments_received"
    )
    received_at = models.DateTimeField(auto_now_add=True)
    cleared_at = models.DateTimeField(
        null=True, blank=True, 
        help_text="Fecha de confirmación real del banco/pasarela"
    )
    
    idempotency_key = models.CharField(max_length=200, blank=True, null=True, unique=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Registro de Pago"
        verbose_name_plural = "Registros de Pagos"
        indexes = [
            models.Index(fields=['institution', 'status']),
            models.Index(fields=['gateway_transaction_id']),
        ]

    def __str__(self):
        return f"Payment #{self.pk} - {self.amount} {self.currency} ({self.status})"

    # --- LÓGICA DE NEGOCIO ---
    def clean(self):
        if self.amount and self.amount <= Decimal('0.00'):
            raise ValidationError("El monto debe ser positivo.")
        
        if self.charge_order and self.charge_order.status in ['void', 'waived']:
            raise ValidationError("Orden no apta para pagos.")

    def confirm(self, actor_user=None):
        """Confirmación atómica con sincronización de saldos"""
        with transaction.atomic():
            order = ChargeOrder.objects.select_for_update().get(pk=self.charge_order.pk)
            
            self.status = 'confirmed'
            self.cleared_at = timezone.now()
            self.save(update_fields=['status', 'cleared_at'])

            order.recalc_totals()
            order.save()

            # Notificación al log de eventos
            Event = apps.get_model('core', 'Event')
            Event.objects.create(
                entity='Payment',
                entity_id=self.pk,
                institution=self.institution,
                action='confirm',
                actor_user=actor_user,
                severity="info",
                notify=True
            )


class Event(models.Model):
    SEVERITY_CHOICES = [
        ('info', 'Informativo'),
        ('warning', 'Advertencia'),
        ('critical', 'Crítico'),
    ]

    timestamp = models.DateTimeField(auto_now_add=True)
    
    # NUEVO: El evento ahora pertenece a un nodo. 
    # Si es un evento global (ej: sistema), puede ser null.
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.CASCADE,
        related_name='events',
        null=True,
        blank=True,
        verbose_name="Sede del evento"
    )

    # NUEVO: Trazabilidad por usuario real
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events_initiated',
        verbose_name="Usuario responsable"
    )
    # Mantenemos actor como CharField por si el evento lo dispara un sistema externo
    actor_name = models.CharField(max_length=100, blank=True, null=True)

    entity = models.CharField(max_length=50, help_text="Ej: ChargeOrder, Appointment, Payment")
    entity_id = models.IntegerField()
    action = models.CharField(max_length=100, help_text="Ej: void, cancel, confirm_payment")
    
    metadata = models.JSONField(
        blank=True, 
        null=True, 
        help_text="Snapshot de datos relevantes en formato JSON"
    )

    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='info',
    )
    
    # Este flag sirve para el sistema de notificaciones en tiempo real (WebSockets)
    notify = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False, verbose_name="Visto por administración")

    class Meta:
        verbose_name = "Evento de Auditoría"
        verbose_name_plural = "Eventos de Auditoría"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['institution', 'severity']),
            models.Index(fields=['entity', 'entity_id']),
        ]

    def __str__(self):
        actor = self.actor_user or self.actor_name or "System"
        return f"[{self.severity}] {self.entity} #{self.entity_id} - {self.action} by {actor}"

    @property
    def color_tag(self):
        """Útil para el frontend: devuelve el color del evento según severidad"""
        tags = {
            'info': 'blue',
            'warning': 'orange',
            'critical': 'red'
        }
        return tags.get(self.severity, 'gray')


# Nuevo modelo para documentos clínicos
User = get_user_model()

class DocumentCategory(models.TextChoices):
    PRESCRIPTION = "prescription", "Prescripción"
    TREATMENT = "treatment", "Tratamiento"
    MEDICAL_TEST_ORDER = "medical_test_order", "Órdenes de Exámenes"
    MEDICAL_REFERRAL = "medical_referral", "Referencia Médica"
    MEDICAL_REPORT = "medical_report", "Informe Médico General"
    EXTERNAL_STUDY = "external_study", "Estudio Externo (Laboratorio/Imagen)"
    OTHER = "other", "Otro"
    

class DocumentSource(models.TextChoices):
    SYSTEM_GENERATED = "system_generated", "Generado por el sistema"
    USER_UPLOADED = "user_uploaded", "Subido por usuario/médico"


class MedicalDocument(models.Model):
    """
    Repositorio centralizado de documentos médicos.
    Soporta generación automática (PDF) y carga manual de evidencias.
    """
    # Relaciones de contexto
    patient = models.ForeignKey("Patient", on_delete=models.CASCADE, related_name="documents")
    appointment = models.ForeignKey("Appointment", on_delete=models.SET_NULL, blank=True, null=True, related_name="documents")
    diagnosis = models.ForeignKey("Diagnosis", on_delete=models.SET_NULL, blank=True, null=True, related_name="documents")

    # Clasificación
    category = models.CharField(max_length=40, choices=DocumentCategory.choices, default=DocumentCategory.OTHER)
    source = models.CharField(max_length=20, choices=DocumentSource.choices, default=DocumentSource.SYSTEM_GENERATED)
    origin_panel = models.CharField(max_length=50, blank=True, null=True, help_text="Módulo de origen: prescriptions, tests, etc.")

    # Archivo y Metadatos Técnicos
    file = models.FileField(
        upload_to="medical_documents/%Y/%m/%d/",
        validators=[FileExtensionValidator(allowed_extensions=["pdf", "png", "jpg", "jpeg"])]
    )
    mime_type = models.CharField(max_length=100, default="application/pdf")
    size_bytes = models.PositiveIntegerField(editable=False, null=True)
    checksum_sha256 = models.CharField(max_length=64, editable=False, blank=True, null=True)
    
    # Información de Validez y Auditoría
    description = models.CharField(max_length=255, blank=True, null=True)
    template_version = models.CharField(max_length=20, blank=True, null=True)
    is_signed = models.BooleanField(default=False)
    signer_name = models.CharField(max_length=100, blank=True, null=True)
    signer_registration = models.CharField(max_length=50, blank=True, null=True)
    
    # Identificador Único de Verificación (QR/Auditoría)
    audit_code = models.CharField(max_length=64, unique=True, editable=False, null=True)

    # Trazabilidad de Usuarios
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="uploaded_documents")
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="generated_documents")

    class Meta:
        verbose_name = "Documento Médico"
        verbose_name_plural = "Documentos Médicos"
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["patient", "category"]),
            models.Index(fields=["audit_code"]),
            models.Index(fields=["uploaded_at"]),
        ]

    def __str__(self):
        return f"{self.get_category_display()} — {self.patient.full_name}"

    def clean(self):
        """Validación de integridad de negocio."""
        if self.source == DocumentSource.SYSTEM_GENERATED and self.mime_type != "application/pdf":
            raise ValidationError({"mime_type": "Los documentos generados por el sistema deben ser PDF."})

        # Categorías que requieren contexto clínico obligatorio
        clinical_categories = {
            DocumentCategory.PRESCRIPTION, 
            DocumentCategory.TREATMENT, 
            DocumentCategory.MEDICAL_TEST_ORDER, 
            DocumentCategory.MEDICAL_REFERRAL
        }
        if self.category in clinical_categories and not self.appointment:
            raise ValidationError({"appointment": "Este documento requiere estar vinculado a una consulta activa."})

    def save(self, *args, **kwargs):
        """Lógica automática de metadatos y seguridad."""
        if self.file:
            # 1. Almacenar tamaño automáticamente
            self.size_bytes = self.file.size
            
            # 2. Generar Checksum SHA256 para integridad (si es archivo nuevo)
            if not self.checksum_sha256:
                sha256 = hashlib.sha256()
                for chunk in self.file.chunks():
                    sha256.update(chunk)
                self.checksum_sha256 = sha256.hexdigest()

            # 3. Generar Audit Code único (para validación externa vía QR)
            if not self.audit_code:
                unique_str = f"{self.patient_id}-{self.uploaded_at}-{self.checksum_sha256}"
                self.audit_code = hashlib.sha1(unique_str.encode()).hexdigest()[:16].upper()

        super().save(*args, **kwargs)


class ChargeOrder(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('void', 'Void'),
        ('waived', 'Waived'), # Exoneraciones para casos especiales o cortesías
    ]

    # --- RELACIONES DE PODER Y TRAZABILIDAD ---
    appointment = models.ForeignKey(
        'Appointment', 
        on_delete=models.CASCADE, 
        related_name='charge_orders'
    )
    
    # NUEVO: Anclaje financiero directo a la sede para reportes de rentabilidad inmediatos
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.PROTECT,
        related_name='charge_orders',
        verbose_name="Sede emisora de cobro"
    )

    patient = models.ForeignKey(
        'Patient', 
        on_delete=models.CASCADE, 
        related_name='charge_orders'
    )

    # --- MONETIZACIÓN ---
    currency = models.CharField(max_length=10, default='USD')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    # --- REGISTRO Y AUDITORÍA ---
    issued_at = models.DateTimeField(auto_now_add=True)
    issued_by = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    # Importante: Vinculamos al usuario que creó la orden para control interno
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_orders_created"
    )

    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['appointment', 'status']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['institution', 'status']), # NUEVO: Optimización para cierres de caja
        ]
        verbose_name = "Orden de Cobro"
        verbose_name_plural = "Órdenes de Cobro"

    def __str__(self):
        return f"Order #{self.pk} — {self.institution.name} — {self.status}"

    # --- LÓGICA DE CÁLCULO ELITE ---
    def recalc_totals(self):
        """Recalcula la salud financiera de la orden basándose en ítems y pagos."""
        items_sum = self.items.aggregate(s=Sum('subtotal')).get('s') or Decimal('0.00')
        self.total = items_sum

        confirmed_payments = self.payments.filter(status='confirmed').aggregate(s=Sum('amount')).get('s') or Decimal('0.00')
        self.balance_due = max(self.total - confirmed_payments, Decimal('0.00'))

        if self.status in ['void', 'waived']:
            return

        if self.balance_due <= 0 and self.total > 0:
            self.status = 'paid'
        elif confirmed_payments > 0:
            self.status = 'partially_paid'
        else:
            self.status = 'open'

    def clean(self):
        # Reglas de negocio inquebrantables
        if self.status == 'paid' and self.balance_due != Decimal('0.00'):
            raise ValidationError("Inconsistencia: Una orden pagada no puede tener deuda pendiente.")
        if self.status == 'waived' and self.balance_due != Decimal('0.00'):
            raise ValidationError("Inconsistencia: Una orden exonerada debe quedar con deuda cero.")

    # --- FLUJO DE EVENTOS CRÍTICOS ---
    def mark_void(self, reason: str = '', actor: str = ''):
        if self.status == 'paid':
            raise ValidationError("Operación Denegada: No se puede anular un ingreso ya confirmado en caja.")
        self.status = 'void'
        self.save(update_fields=['status'])

        # Registro en el log de eventos de MedOpz
        Event = apps.get_model('core', 'Event')
        Event.objects.create(
            entity='ChargeOrder',
            entity_id=self.pk,
            action='void',
            metadata={'actor': actor, 'reason': reason, 'institution': self.institution.name},
            severity="critical",
            notify=True
        )

# --- EL DETALLE DEL COBRO ---
class ChargeItem(models.Model):
    order = models.ForeignKey('ChargeOrder', on_delete=models.CASCADE, related_name='items')
    code = models.CharField(max_length=50, help_text="Código de servicio o baremo")
    description = models.CharField(max_length=255, blank=True, null=True)
    qty = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1.00'))
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    class Meta:
        verbose_name = "Ítem de Cobro"
        verbose_name_plural = "Ítems de Cobro"

    def __str__(self):
        return f"{self.description or self.code} (x{self.qty})"

    def save(self, *args, **kwargs):
        self.subtotal = (self.qty or Decimal('0')) * (self.unit_price or Decimal('0'))
        super().save(*args, **kwargs)
        # Sincronizamos con la orden madre para actualizar deuda y status
        self.order.recalc_totals()
        self.order.save(update_fields=['total', 'balance_due', 'status'])


class InstitutionSettings(models.Model):
    # --- IDENTIDAD FISCAL Y MARCA ---
    name = models.CharField(max_length=255, verbose_name="Nombre del centro médico")
    tax_id = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="RIF / NIT / Identificación Fiscal"
    )
    logo = models.ImageField(upload_to="logos/", verbose_name="Logo institucional")
    phone = models.CharField(max_length=50, verbose_name="Teléfono de contacto")

    # --- CONFIGURACIÓN DE PASARELA UNIVERSAL (FINTECH READY) ---
    GATEWAY_PROVIDERS = [
        ('none', 'Manual / Registro Interno'),
        ('mercantil_ve', 'Mercantil API (VE)'),
        ('banesco_ve', 'Banesco Hub (VE)'),
        ('stripe', 'Stripe Global'),
        ('binance_pay', 'Binance Pay'),
        ('paypal', 'PayPal Business'),
    ]

    active_gateway = models.CharField(
        max_length=50, 
        choices=GATEWAY_PROVIDERS, 
        default='none',
        verbose_name="Pasarela de Pagos Activa"
    )

    # Credenciales Genéricas: Se mapean dinámicamente según el proveedor
    gateway_api_key = models.CharField(max_length=255, blank=True, null=True, verbose_name="Client ID / API Key")
    gateway_api_secret = models.CharField(max_length=255, blank=True, null=True, verbose_name="Client Secret / Token")
    
    # Liquidación de Fondos (Settlement)
    settlement_bank_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Banco de Destino")
    settlement_account_id = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Cta Bancaria, Email PayPal o Wallet Address"
    )
    
    is_gateway_test_mode = models.BooleanField(
        default=True, 
        verbose_name="Modo Sandbox / Pruebas",
        help_text="Si está activo, no procesará dinero real."
    )

    # --- STATUS OPERATIVO ---
    is_active = models.BooleanField(default=True, verbose_name="Nodo Activo")

    # --- DIRECCIÓN ---
    neighborhood = models.ForeignKey(
        "core.Neighborhood",
        on_delete=models.PROTECT,
        null=True, blank=True
    )
    address = models.CharField(max_length=255, blank=True, null=True)

    # --- AUDITORÍA ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name="institution_updates"
    )

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Configuración de Sede"
        verbose_name_plural = "Configuraciones de Sedes"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.tax_id})"


class DoctorOperator(models.Model):
    # Relación con el usuario de Django (Acceso al sistema)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name="doctor_profile"
    )

    # --- IDENTIDAD Y VERIFICACIÓN ELITE ---
    full_name = models.CharField(max_length=255)
    
    # Nuevo campo para trato formal automático
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    gender = models.CharField(
        max_length=1, 
        choices=GENDER_CHOICES, 
        default='M',
        verbose_name="Sexo/Género"
    )

    is_verified = models.BooleanField(
        default=False, 
        help_text="Designa si el cirujano ha sido validado por el Colegio de Médicos."
    )
    
    colegiado_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Número de colegiado / ID de ejercicio"
    )
    
    license = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name="Licencia Sanitaria / MPPS"
    )

    # --- RELACIONES DE PODER ---
    # ManyToMany: El doctor opera en múltiples nodos (sedes)
    institutions = models.ManyToManyField(
        "InstitutionSettings", 
        related_name="operators",
        blank=True,
        help_text="Nodos de operación donde este Practitioner ejerce."
    )
    
    specialties = models.ManyToManyField(
        "Specialty", 
        related_name="doctors"
    )

    # --- CONTACTO Y FIRMA ---
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    
    signature = models.ImageField(
        upload_to="signatures/", 
        blank=True, 
        null=True,
        help_text="Firma digitalizada para validación de documentos oficiales."
    )

    # --- AUDITORÍA DE SISTEMA ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="doctor_updates"
    )

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Médico Operador"
        verbose_name_plural = "Médicos Operadores"
        ordering = ['full_name']

    # --- PROPERTIES INTELIGENTES ---
    @property
    def formal_title(self):
        """Devuelve Dr. o Dra. según el sexo registrado"""
        prefix = "Dra." if self.gender == 'F' else "Dr."
        return f"{prefix} {self.full_name}"

    def __str__(self):
        status = "[VERIFIED]" if self.is_verified else "[PENDING]"
        return f"{status} {self.formal_title} — {self.colegiado_id}"

    def clean(self):
        """Validaciones de integridad antes de persistir en DB"""
        from django.core.exceptions import ValidationError
        if self.is_verified and not self.signature:
            raise ValidationError(
                "Seguridad MedOpz: Un Médico Verificado requiere firma digitalizada para operar."
            )


class BCVRateCache(models.Model):
    date = models.DateField(unique=True)
    value = models.DecimalField(max_digits=12, decimal_places=8)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} → {self.value}"


class MedicalReport(models.Model):
    appointment = models.ForeignKey("Appointment", on_delete=models.CASCADE, related_name="medical_reports")
    patient = models.ForeignKey("Patient", on_delete=models.CASCADE, related_name="medical_reports")
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, default="generated")
    file_url = models.CharField(max_length=255, blank=True, null=True)  # opcional, si guardas PDF

    def __str__(self):
        return f"Informe Médico #{self.id} - Paciente {self.patient_id}"


# --- Catálogo institucional ICD‑11 ---
class ICD11Entry(models.Model):
    icd_code = models.CharField(max_length=20)   # Ej: "01", "CA23.0"
    title = models.CharField(max_length=255)     # Ej: "Asma"
    foundation_id = models.CharField(max_length=200, blank=True, null=True)  # ID foundation OMS o @id
    definition = models.TextField(blank=True, null=True)      # Texto oficial OMS
    synonyms = models.JSONField(blank=True, null=True)        # Lista de sinónimos
    parent_code = models.CharField(max_length=20, blank=True, null=True)     # Jerarquía inmediata
    exclusions = models.JSONField(blank=True, null=True)      # Exclusiones (lista de dicts)
    children = models.JSONField(blank=True, null=True)        # Hijos (lista de URLs o códigos)
    language = models.CharField(max_length=5, default="es")   # Idioma del entry

    # Auditoría mínima del catálogo
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        verbose_name = "ICD-11 entry"
        verbose_name_plural = "ICD-11 entries"
        indexes = [
            models.Index(fields=["icd_code"]),
            models.Index(fields=["title"]),
        ]
        unique_together = ("icd_code", "language")  # clave compuesta para bilingüe

    def __str__(self):
        return f"{self.icd_code} — {self.title}"



class ICD11UpdateLog(models.Model):
    run_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=255, blank=True, null=True)   # URL/archivo/hash de origen
    added = models.IntegerField(default=0)
    updated = models.IntegerField(default=0)
    removed = models.IntegerField(default=0)

    class Meta:
        verbose_name = "ICD-11 update log"
        verbose_name_plural = "ICD-11 update logs"

    def __str__(self):
        return f"ICD-11 update @ {self.run_at} (+{self.added} ~{self.updated} -{self.removed})"


class MedicalTestCatalog(models.Model):
    """
    Catálogo institucional de exámenes disponibles. 
    Permite que cada clínica tenga sus propios precios y códigos.
    """
    institution = models.ForeignKey(
        "InstitutionSettings", 
        on_delete=models.CASCADE, 
        related_name="test_catalog"
    )
    name = models.CharField(max_length=255, help_text="Nombre del examen (ej: Perfil Lipídico)")
    code = models.CharField(max_length=50, help_text="Código interno, CUPS o CPT")
    category = models.CharField(
        max_length=50, 
        choices=[
            ("laboratory", "Laboratorio"),
            ("imaging", "Imagenología"),
            ("cardiology", "Cardiología"),
            ("special", "Pruebas Especiales"),
        ],
        default="laboratory"
    )
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Catálogo de Examen"
        verbose_name_plural = "Catálogo de Exámenes"
        unique_together = ('institution', 'code') # No repetir códigos en la misma clínica

    def __str__(self):
        return f"[{self.institution.name}] {self.name} ({self.code})"


class MedicalTest(models.Model):
    TEST_TYPE_CHOICES = [
        ("blood_test", "Análisis de sangre"),
        ("urine_test", "Análisis de orina"),
        ("stool_test", "Análisis de heces"),
        ("biopsy", "Biopsia"),
        ("genetic_test", "Prueba genética"),
        ("microbiology_culture", "Cultivo microbiológico"),
        ("xray", "Rayos X / Radiografía"),
        ("ultrasound", "Ecografía"),
        ("ct_scan", "Tomografía computarizada (TC)"),
        ("mri", "Resonancia magnética (RM)"),
        ("ecg", "Electrocardiograma"),
    ]

    URGENCY_CHOICES = [
        ("routine", "Rutina"),
        ("priority", "Prioridad"),
        ("urgent", "Urgente"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("completed", "Completado"),
        ("cancelled", "Cancelado"),
    ]

    # --- Relaciones de Contexto ---
    appointment = models.ForeignKey(
        "Appointment",
        on_delete=models.CASCADE,
        related_name="medical_tests"
    )
    institution = models.ForeignKey(
        "InstitutionSettings",
        on_delete=models.CASCADE,
        related_name="issued_medical_tests",
        null=True,
        blank=True
    )
    diagnosis = models.ForeignKey(
        "Diagnosis",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_tests"
    )

    # --- El Vínculo con el Catálogo ---
    catalog_item = models.ForeignKey(
        MedicalTestCatalog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        help_text="Vínculo al catálogo institucional para precios y códigos"
    )

    # --- Datos de la Orden ---
    test_type = models.CharField(
        max_length=50,
        choices=TEST_TYPE_CHOICES
    )
    test_name_override = models.CharField(
        max_length=255,
        blank=True,
        help_text="Se llena automáticamente del catálogo o manual si no existe en él"
    )
    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        default="routine"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )
    description = models.TextField(
        blank=True, 
        help_text="Instrucciones para el paciente (ej: Ayuno, toma de agua)"
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Orden de Examen"
        verbose_name_plural = "Órdenes de Exámenes"

    def save(self, *args, **kwargs):
        # 1. Heredar la institución de la cita si no se provee
        if not self.institution and self.appointment:
            self.institution = self.appointment.institution
        
        # 2. Si hay un ítem de catálogo, asegurar que el nombre override esté sincronizado
        if self.catalog_item and not self.test_name_override:
            self.test_name_override = self.catalog_item.name
            
        super().save(*args, **kwargs)

    def __str__(self):
        name = self.test_name_override or self.get_test_type_display()
        return f"{name} — {self.get_status_display()}"


class MedicalReferral(models.Model):
    URGENCY_CHOICES = [
        ("routine", "Rutina"),
        ("urgent", "Urgente"),
        ("stat", "Inmediato (STAT)"),
    ]

    STATUS_CHOICES = [
        ("issued", "Emitida"),
        ("accepted", "Aceptada"),
        ("rejected", "Rechazada"),
        ("completed", "Completada"), # Para cuando el referido ya atendió al paciente
    ]

    appointment = models.ForeignKey(
        "Appointment",
        on_delete=models.CASCADE,
        related_name="referrals"
    )
    diagnosis = models.ForeignKey(
        "Diagnosis",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="referrals"
    )
    specialties = models.ManyToManyField(
        "Specialty",
        related_name="referrals"
    )

    # --- El Corazón de la Red MedOpz ---
    referred_to_doctor = models.ForeignKey(
        "DoctorOperator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_referrals",
        help_text="Médico interno registrado en MedOpz"
    )
    
    referred_to_external = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Nombre del doctor o clínica externa (si no está en MedOpz)"
    )

    # Metadatos clínicos
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default="routine")
    reason = models.TextField(help_text="Motivo clínico de la referencia")
    clinical_summary = models.TextField(blank=True, null=True, help_text="Resumen para el colega")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="issued")
    
    # Tracking para el futuro
    is_internal = models.BooleanField(default=False, editable=False)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Referencia Médica"
        verbose_name_plural = "Referencias Médicas"

    def save(self, *args, **kwargs):
        # Determinamos automáticamente si es una referencia interna
        if self.referred_to_doctor:
            self.is_internal = True
        super().save(*args, **kwargs)

    def __str__(self):
        destinatario = self.referred_to_doctor.full_name if self.referred_to_doctor else self.referred_to_external
        return f"Referencia a {destinatario} ({self.get_status_display()})"


SPECIALTY_CHOICES = [
    ("allergy_immunology", "Allergy and Immunology (Alergia e Inmunología)"),
    ("anesthesiology", "Anesthesiology (Anestesiología)"),
    ("cardiology", "Cardiology (Cardiología)"),
    ("dermatology", "Dermatology (Dermatología)"),
    ("diagnostic_radiology", "Diagnostic Radiology (Radiología Diagnóstica)"),
    ("emergency_medicine", "Emergency Medicine (Medicina de Emergencia/Urgencias)"),
    ("endocrinology", "Endocrinology (Endocrinología)"),
    ("family_medicine", "Family Medicine (Medicina Familiar)"),
    ("gastroenterology", "Gastroenterology (Gastroenterología)"),
    ("general_surgery", "General Surgery (Cirugía General)"),
    ("geriatrics", "Geriatric Medicine (Medicina Geriátrica/Geriatría)"),
    ("hematology", "Hematology (Hematología)"),
    ("infectious_disease", "Infectious Disease (Enfermedades Infecciosas)"),
    ("internal_medicine", "Internal Medicine (Medicina Interna)"),
    ("nephrology", "Nephrology (Nefrología)"),
    ("neurology", "Neurology (Neurología)"),
    ("neurosurgery", "Neurosurgery (Neurocirugía)"),
    ("nuclear_medicine", "Nuclear Medicine (Medicina Nuclear)"),
    ("obgyn", "Obstetrics and Gynecology (Obstetricia y Ginecología)"),
    ("ophthalmology", "Ophthalmology (Oftalmología)"),
    ("orthopedic_surgery", "Orthopedic Surgery (Cirugía Ortopédica/Traumatología)"),
    ("otolaryngology", "Otolaryngology (Otorrinolaringología)"),
    ("pathology", "Pathology (Patología)"),
    ("pediatrics", "Pediatrics (Pediatría)"),
    ("pmr", "Physical Medicine and Rehabilitation (Medicina Física y Rehabilitación)"),
    ("plastic_surgery", "Plastic Surgery (Cirugía Plástica)"),
    ("preventive_medicine", "Preventive Medicine (Medicina Preventiva)"),
    ("psychiatry", "Psychiatry (Psiquiatría)"),
    ("pulmonology", "Pulmonary Disease (Neumonología)"),
    ("radiation_oncology", "Radiation Oncology (Oncología Radioterápica)"),
    ("rheumatology", "Rheumatology (Reumatología)"),
    ("urology", "Urology (Urología)"),
    ("vascular_surgery", "Vascular Surgery (Cirugía Vascular)"),
    ("other", "Other (Otro)"),
]

class Specialty(models.Model):
    CATEGORY_CHOICES = [
        ("medical", "Médica (Clínica)"),
        ("surgical", "Quirúrgica"),
        ("diagnostic", "Diagnóstica (Radiología/Patología)"),
        ("therapeutic", "Terapéutica (Fisioterapia/Nutrición)"),
        ("other", "Otra"),
    ]

    code = models.CharField(
        max_length=20, 
        unique=True, 
        help_text="Código estándar (ej: RNE, CPT o código interno)"
    )
    name = models.CharField(max_length=100)
    
    # --- Clasificación ---
    category = models.CharField(
        max_length=20, 
        choices=CATEGORY_CHOICES, 
        default="medical"
    )
    
    # --- Jerarquía (Permite Sub-especialidades) ---
    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='subspecialties',
        help_text="Especialidad raíz (ej: Cardiología es hijo de Medicina Interna)"
    )

    # --- Metadatos ---
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    icon_name = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        help_text="Nombre del icono para el Frontend (ej: 'heart-pulse')"
    )

    class Meta:
        verbose_name = "Especialidad"
        verbose_name_plural = "Especialidades"
        ordering = ["name"]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class MedicationCatalog(models.Model):
    # --- Identificación Core ---
    name = models.CharField(
        max_length=200, 
        help_text="Nombre comercial o genérico principal (ej: Atamel)"
    )
    generic_name = models.CharField(
        max_length=200, 
        blank=True, 
        null=True, 
        help_text="Principio activo (ej: Acetaminofén)"
    )
    
    # --- Especificaciones Técnicas ---
    presentation = models.CharField(max_length=50, choices=PRESENTATION_CHOICES)
    concentration = models.CharField(max_length=100, help_text="Ej: 500 mg, 250 mg/5 ml")
    route = models.CharField(max_length=20, choices=ROUTE_CHOICES)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES)
    
    # --- Clasificación y Códigos ---
    code = models.CharField(
        max_length=50, 
        unique=True, 
        blank=True, 
        null=True, 
        help_text="Código de barras, SKU o código nacional de fármaco"
    )
    is_controlled = models.BooleanField(
        default=False, 
        help_text="Marcar si requiere receta médica especial (psicotrópicos, etc.)"
    )
    
    # --- Gestión Institucional ---
    institution = models.ForeignKey(
        "InstitutionSettings", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="custom_medications",
        help_text="Si es nulo, es parte del catálogo maestro global de MedOpz"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Medicamento"
        verbose_name_plural = "Catálogo de Medicamentos"
        # Refinamos la unicidad para incluir la institución
        unique_together = ["name", "presentation", "concentration", "institution"]
        ordering = ["name", "presentation"]

    def __str__(self):
        return f"{self.name} ({self.generic_name or ''}) — {self.presentation} — {self.concentration}"


class PersonalHistory(models.Model):
    HISTORY_TYPES = [
        ("patologico", "Patológico"),
        ("no_patologico", "No patológico"),
        ("quirurgico", "Quirúrgico"),
        ("traumatico", "Traumático"),
        ("alergico", "Alérgico"),
        ("toxico", "Tóxico"),
        ("gineco_obstetrico", "Gineco-Obstétrico"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="personal_history"
    )
    type = models.CharField(max_length=50, choices=HISTORY_TYPES)
    description = models.TextField()
    date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Personal History"
        verbose_name_plural = "Personal Histories"

    def __str__(self):
        return f"{self.patient} — {self.get_type_display()}"


class FamilyHistory(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="family_history"
    )
    condition = models.CharField(max_length=255)
    relative = models.CharField(max_length=100)  # madre, padre, abuelo, etc.
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Family History"
        verbose_name_plural = "Family Histories"

    def __str__(self):
        return f"{self.patient} — {self.condition} ({self.relative})"


class Surgery(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="surgeries"
    )
    name = models.CharField(max_length=255)
    date = models.DateField()
    hospital = models.CharField(max_length=255, blank=True, null=True)
    complications = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Surgery"
        verbose_name_plural = "Surgeries"

    def __str__(self):
        return f"{self.patient} — {self.name}"


class Habit(models.Model):
    HABIT_TYPES = [
        ("tabaco", "Tabaco"),
        ("alcohol", "Alcohol"),
        ("actividad_fisica", "Actividad física"),
        ("dieta", "Dieta"),
        ("sueno", "Sueño"),
    ]

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="habits"
    )
    type = models.CharField(max_length=50, choices=HABIT_TYPES)
    description = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Habit"
        verbose_name_plural = "Habits"

    def __str__(self):
        return f"{self.patient} — {self.get_type_display()}"


class Vaccine(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    country = models.CharField(max_length=100, default="Venezuela")

    class Meta:
        verbose_name = "Vaccine"
        verbose_name_plural = "Vaccines"

    def __str__(self):
        return f"{self.name} ({self.code})"


class VaccinationSchedule(models.Model):
    vaccine = models.ForeignKey(
        Vaccine,
        on_delete=models.CASCADE,
        related_name="schedule"
    )
    recommended_age_months = models.PositiveIntegerField()
    dose_number = models.PositiveIntegerField()
    country = models.CharField(max_length=100, default="Venezuela")

    class Meta:
        verbose_name = "Vaccination Schedule"
        verbose_name_plural = "Vaccination Schedules"
        ordering = ["recommended_age_months", "dose_number"]

    def __str__(self):
        return f"{self.vaccine.code} — Dosis {self.dose_number} ({self.recommended_age_months} meses)"


class PatientVaccination(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="vaccinations"
    )
    vaccine = models.ForeignKey(Vaccine, on_delete=models.CASCADE)
    dose_number = models.PositiveIntegerField()
    date_administered = models.DateField()
    lot = models.CharField(max_length=100, blank=True, null=True)
    center = models.CharField(max_length=255, blank=True, null=True)
    next_dose_date = models.DateField(blank=True, null=True)

    class Meta:
        verbose_name = "Patient Vaccination"
        verbose_name_plural = "Patient Vaccinations"
        unique_together = ("patient", "vaccine", "dose_number")

    def __str__(self):
        return f"{self.patient} — {self.vaccine.code} D{self.dose_number}"


# 🔹 Modelo especializado para alergias
class Allergy(models.Model):
    patient = models.ForeignKey(
        "Patient",
        on_delete=models.CASCADE,
        related_name="allergies"
    )
    name = models.CharField(max_length=100)
    severity = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Gravedad de la alergia: leve, moderada, grave"
    )
    source = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Fuente: historia clínica, verbal, prueba"
    )
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Auditoría institucional
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Allergy"
        verbose_name_plural = "Allergies"
        indexes = [
            models.Index(fields=["patient", "name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.severity or 'N/A'})"


# 🔹 Modelo especializado para antecedentes médicos
class MedicalHistory(models.Model):
    STATUS_CHOICES = [
        ("active", "Activo / En curso"),
        ("resolved", "Resuelto / Curado"),
        ("suspected", "Sospecha"),
        ("remission", "En Remisión"),
        ("permanent", "Permanente / Crónico"),
    ]

    patient = models.ForeignKey(
        "Patient",
        on_delete=models.CASCADE,
        related_name="medical_history"
    )
    
    # El nombre de la enfermedad o antecedente
    condition = models.CharField(max_length=255, verbose_name="Afección / Antecedente")
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )
    
    source = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Fuente: historia clínica previa, diagnóstico directo, verbal"
    )
    
    notes = models.TextField(
        blank=True, 
        null=True, 
        verbose_name="Observaciones clínicas"
    )

    # Control de tiempos
    onset_date = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Fecha de aparición aproximada"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Antecedente Médico"
        verbose_name_plural = "Historial de Antecedentes"
        indexes = [
            models.Index(fields=["patient", "status"]),
        ]

    def __str__(self):
        return f"{self.condition} ({self.get_status_display()})"


class ClinicalAlert(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="alerts"
    )
    type = models.CharField(
        max_length=20,
        choices=[("danger", "Danger"), ("warning", "Warning"), ("info", "Info")]
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.type}] {self.message[:50]}"


class VitalSigns(models.Model):
    appointment = models.OneToOneField(
        "Appointment", 
        on_delete=models.CASCADE, 
        related_name="vital_signs"
    )
    # Datos biométricos
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text="Peso en kg", null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, help_text="Talla en cm", null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, help_text="°C", null=True, blank=True)
    
    # Presión Arterial (Sistólica/Diastólica)
    bp_systolic = models.PositiveIntegerField(verbose_name="Sistólica", null=True, blank=True)
    bp_diastolic = models.PositiveIntegerField(verbose_name="Diastólica", null=True, blank=True)
    
    heart_rate = models.PositiveIntegerField(verbose_name="Frecuencia Cardíaca (LPM)", null=True, blank=True)
    respiratory_rate = models.PositiveIntegerField(verbose_name="Frecuencia Respiratoria (RPM)", null=True, blank=True)
    oxygen_saturation = models.PositiveIntegerField(verbose_name="Saturación de O2 (%)", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def bmi(self):
        """Calcula el Índice de Masa Corporal automáticamente"""
        if self.weight and self.height:
            height_m = self.height / 100
            return round(float(self.weight) / float(height_m ** 2), 2)
        return None

    class Meta:
        verbose_name = "Signos Vitales"
        verbose_name_plural = "Signos Vitales"


class ClinicalNote(models.Model):
    appointment = models.OneToOneField(
        "Appointment", 
        on_delete=models.CASCADE, 
        related_name="note"
    )
    
    # Estructura clásica SOAP (Subjetivo, Objetivo, Análisis, Plan)
    subjective = models.TextField(verbose_name="Motivo de consulta / Anamnesis")
    objective = models.TextField(verbose_name="Hallazgos del examen físico", blank=True, null=True)
    analysis = models.TextField(verbose_name="Análisis clínico / Evolución", blank=True, null=True)
    plan = models.TextField(verbose_name="Plan de tratamiento / Próximos pasos", blank=True, null=True)

    # El "Sello de Seguridad"
    is_locked = models.BooleanField(
        default=False, 
        help_text="Una vez bloqueada, la nota no puede editarse (Integridad Médica)"
    )
    locked_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def lock_note(self):
        """Cierra la nota permanentemente"""
        self.is_locked = True
        self.locked_at = timezone.now()
        self.save()

    class Meta:
        verbose_name = "Nota Clínica"
        verbose_name_plural = "Notas Clínicas"


