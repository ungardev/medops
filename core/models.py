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
from .choices import UNIT_CHOICES, ROUTE_CHOICES, FREQUENCY_CHOICES, PRESENTATION_CHOICES, MEDICATION_STATUS_CHOICES
import hashlib


def normalize_title_case(value):
    """Normaliza texto a Title Case."""
    if value:
        return value.title()
    return value


# Create your models here.
class GeneticPredisposition(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    class Meta:
        verbose_name = "Genetic Predisposition"
        verbose_name_plural = "Genetic Predispositions"
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        if self.description:
            self.description = normalize_title_case(self.description)
        super().save(*args, **kwargs)
    def __str__(self):
        return self.name


class Country(models.Model):
    name = models.CharField(max_length=100, unique=True)
    class Meta:
        verbose_name = "Country"
        verbose_name_plural = "Countries"
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        super().save(*args, **kwargs)
    def __str__(self):
        return self.name


class State(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="states")
    name = models.CharField(max_length=100)
    class Meta:
        unique_together = ("country", "name")
        verbose_name = "State"
        verbose_name_plural = "States"
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.name}, {self.country.name}"


class Municipality(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name="municipalities")
    name = models.CharField(max_length=100)
    class Meta:
        unique_together = ("state", "name")
        verbose_name = "Municipality"
        verbose_name_plural = "Municipalities"
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.name}, {self.state.name}"


class City(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=100)
    class Meta:
        unique_together = ("state", "name")
        verbose_name = "City"
        verbose_name_plural = "Cities"
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.name}, {self.state.name}"


class Parish(models.Model):
    municipality = models.ForeignKey(
        "core.Municipality",
        on_delete=models.CASCADE,
        related_name="parishes",
        null=True,
        blank=True
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
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.name}, {self.municipality.name if self.municipality else 'SIN-MUNICIPIO'}"


class Neighborhood(models.Model):
    parish = models.ForeignKey(
        "core.Parish",
        on_delete=models.CASCADE,
        related_name="neighborhoods",
        null=True,
        blank=True
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
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        super().save(*args, **kwargs)
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
        max_length=12,
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
    phone_number = models.CharField(max_length=20, blank=True, null=True)
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
    
    def save(self, *args, **kwargs):
        self.first_name = normalize_title_case(self.first_name)
        if self.middle_name:
            self.middle_name = normalize_title_case(self.middle_name)
        self.last_name = normalize_title_case(self.last_name)
        if self.second_last_name:
            self.second_last_name = normalize_title_case(self.second_last_name)
        
        super().save(*args, **kwargs)
        
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
    
    # --- MÉTRICAS ANTROPOMÉTRICAS (🆕 AGREGADOS) ---
    weight = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        help_text="Peso del paciente en kg"
    )
    height = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        help_text="Altura del paciente en cm"
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
        elif new_status == "canceled":
            # Sincronizar ChargeOrder: solo se puede cancelar si no hay pagos confirmados
            for order in self.charge_orders.exclude(status__in=['void', 'waived', 'canceled']):
                if order.payments.filter(status='confirmed').exists():
                    raise ValidationError(
                        f"No se puede cancelar: La orden #{order.id} tiene pagos confirmados. "
                        "Reversa los pagos primero."
                    )
                try:
                    order.status = 'void'
                    order.save(update_fields=['status'])
                    # Registrar evento de auditoría
                    Event = apps.get_model('core', 'Event')
                    Event.objects.create(
                        entity='ChargeOrder',
                        entity_id=order.pk,
                        action='void_by_appointment_cancel',
                        metadata={
                            'appointment_id': self.pk,
                            'reason': 'Appointment canceled by user'
                        },
                        institution=self.institution,
                        severity='warning',
                        notify=True
                    )
                except Exception:
                    pass  # Si ya está void, ignorar
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
            doctor=instance.doctor,  # NUEVO
            institution=instance.institution,  # NUEVO
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
        ("psychological", "Apoyo Psicológico / Terapia"),
        ("other", "Otro"),
    ]
    STATUS_CHOICES = [
        ("active", "En curso / Activo"),
        ("completed", "Finalizado / Completado"),
        ("suspended", "Suspendido Temporalmente"),
        ("cancelled", "Cancelado / Contraindicado"),
    ]
    # --- Relaciones ---
    diagnosis = models.ForeignKey(
        "Diagnosis", 
        on_delete=models.CASCADE, 
        related_name="treatments"
    )
    # NUEVO: CACHÉ de patient, doctor e institution para rendimiento y reportes
    patient = models.ForeignKey(
        "Patient",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        editable=False,
        related_name="treatments",
        verbose_name="Paciente asociado"
    )
    doctor = models.ForeignKey(
        "DoctorOperator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="treatments",
        verbose_name="Médico asociado"
    )
    institution = models.ForeignKey(
        "InstitutionSettings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="treatments",
        verbose_name="Sede asociada"
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
    start_date = models.DateField(default=timezone.now)
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
        indexes = [
            models.Index(fields=['doctor', 'status']), # NUEVO: Optimización para reportes por médico
            models.Index(fields=['patient', 'status']), # NUEVO: Optimización para historial por paciente
            models.Index(fields=['institution', 'status']), # NUEVO: Optimización para reportes por sede
        ]
    def __str__(self):
        return f"{self.title} ({self.get_status_display()}) - {self.diagnosis.title}"
    def save(self, *args, **kwargs):
        # NUEVO: Auto-completar patient, doctor e institution desde diagnosis → appointment
        if self.diagnosis and self.diagnosis.appointment:
            app = self.diagnosis.appointment
            if not self.patient:
                self.patient = app.patient
            if not self.doctor:
                self.doctor = app.doctor
            if not self.institution:
                self.institution = app.institution
        
        super().save(*args, **kwargs)
        
        # Si es Quirúrgico y se acaba de crear, lo registramos como antecedente quirúrgico
        is_new = self.pk is None
        if is_new and self.treatment_type == "surgical":
            from .models import MedicalHistory
            MedicalHistory.objects.get_or_create(
                patient=self.diagnosis.appointment.patient,
                condition=f"Cirugía: {self.title}",
                source="surgical",
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
    # NUEVO: CACHÉ de doctor para rendimiento y reportes
    doctor = models.ForeignKey(
        'DoctorOperator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name='payments',
        verbose_name="Médico asociado al pago"
    )
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
            models.Index(fields=['doctor', 'status']), # NUEVO: Optimización para reportes por médico
        ]
    def __str__(self):
        return f"Payment #{self.pk} - {self.amount} {self.currency} ({self.status})"
    def save(self, *args, **kwargs):
        # NUEVO: Auto-completar doctor desde appointment o charge_order
        if not self.doctor:
            if self.appointment:
                self.doctor = self.appointment.doctor
            elif self.charge_order and self.charge_order.appointment:
                self.doctor = self.charge_order.appointment.doctor
        super().save(*args, **kwargs)
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
    # NUEVO: CACHÉ de doctor e institution para rendimiento y reportes
    doctor = models.ForeignKey(
        "DoctorOperator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="medical_documents",
        verbose_name="Médico asociado"
    )
    institution = models.ForeignKey(
        "InstitutionSettings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="medical_documents",
        verbose_name="Sede asociada"
    )
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
            models.Index(fields=["doctor", "category"]), # NUEVO: Optimización para reportes por médico
            models.Index(fields=["institution", "category"]), # NUEVO: Optimización para reportes por sede
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
        # NUEVO: Auto-completar doctor e institution desde appointment
        if self.appointment:
            self.doctor = self.appointment.doctor
            self.institution = self.appointment.institution
        
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
        ('waived', 'Waived'),
    ]
    
    appointment = models.ForeignKey(
        'Appointment', 
        on_delete=models.CASCADE, 
        related_name='charge_orders'
    )
    
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
    
    doctor = models.ForeignKey(
        'DoctorOperator',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name='charge_orders',
        verbose_name="Médico emisor de cobro"
    )
    
    currency = models.CharField(max_length=10, default='USD')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    issued_at = models.DateTimeField(auto_now_add=True)
    issued_by = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_orders_created"
    )
    
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="charge_order_updates",
        verbose_name="Usuario que actualizó la orden"
    )
    
    history = HistoricalRecords()
    
    class Meta:
        ordering = ['-issued_at']  # ← AGREGAR ESTA LÍNEA
        indexes = [
            models.Index(fields=['appointment', 'status']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['institution', 'status']),
            models.Index(fields=['doctor', 'status']),
        ]
        verbose_name = "Orden de Cobro"
        verbose_name_plural = "Órdenes de Cobro"
    
    def __str__(self):
        return f"Order #{self.pk} — {self.institution.name} — {self.status}"
    
    def save(self, *args, **kwargs):
        if self.appointment:
            if not self.doctor:
                self.doctor = self.appointment.doctor
            if not self.institution:
                self.institution = self.appointment.institution
        super().save(*args, **kwargs)
    
    def recalc_totals(self):
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
        if self.status == 'paid' and self.balance_due != Decimal('0.00'):
            raise ValidationError("Inconsistencia: Una orden pagada no puede tener deuda pendiente.")
        if self.status == 'waived' and self.balance_due != Decimal('0.00'):
            raise ValidationError("Inconsistencia: Una orden exonerada debe quedar con deuda cero.")
    
    def mark_void(self, reason: str = '', actor: str = ''):
        if self.status == 'paid':
            raise ValidationError("Operación Denegada: No se puede anular un ingreso ya confirmado en caja.")
        self.status = 'void'
        self.save(update_fields=['status'])
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
        self.order.recalc_totals()
        self.order.save(update_fields=['total', 'balance_due', 'status'])
    
    def delete(self, *args, **kwargs):
        order = self.order
        super().delete(*args, **kwargs)
        order.recalc_totals()
        order.save(update_fields=['total', 'balance_due', 'status'])


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
    
    @property
    def full_address(self):
        """Genera la dirección completa incluyendo jerarquía geográfica."""
        parts = []
        
        # Dirección detallada
        if self.address:
            parts.append(self.address)
        
        # Jerarquía geográfica
        if self.neighborhood:
            parts.append(self.neighborhood.name)
            if self.neighborhood.parish:
                parts.append(self.neighborhood.parish.name)
                if self.neighborhood.parish.municipality:
                    parts.append(self.neighborhood.parish.municipality.name)
                    if self.neighborhood.parish.municipality.state:
                        parts.append(self.neighborhood.parish.municipality.state.name)
        
        return ", ".join(parts) if parts else "Sin dirección"
    
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        if self.address:
            self.address = normalize_title_case(self.address)
        super().save(*args, **kwargs)


class DoctorOperator(models.Model):
    # --- RELACIÓN CON EL USUARIO DE DJANGO (ACCESO AL SISTEMA) ---
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
    
    # --- INSTITUCIÓN ACTIVA (PREDETERMINADA) ---
    active_institution = models.ForeignKey(
        "InstitutionSettings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="active_for_doctors",
        verbose_name="Institución Activa (Predeterminada)",
        help_text="La institución preferida del doctor. Se usa por defecto."
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
    
    def save(self, *args, **kwargs):
        self.full_name = normalize_title_case(self.full_name)
        super().save(*args, **kwargs)


class BCVRateCache(models.Model):
    date = models.DateField(unique=True)
    value = models.DecimalField(max_digits=12, decimal_places=8)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} → {self.value}"


class MedicalReport(models.Model):
    # Relaciones de contexto
    appointment = models.ForeignKey("Appointment", on_delete=models.CASCADE, related_name="medical_reports")
    patient = models.ForeignKey("Patient", on_delete=models.CASCADE, related_name="medical_reports")
    # NUEVO: CACHÉ de doctor e institution para rendimiento y reportes
    doctor = models.ForeignKey(
        "DoctorOperator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="medical_reports",
        verbose_name="Médico asociado"
    )
    institution = models.ForeignKey(
        "InstitutionSettings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="medical_reports",
        verbose_name="Sede asociada"
    )
    # Metadatos
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, default="generated")
    file_url = models.CharField(max_length=255, blank=True, null=True)  # opcional, si guardas PDF
    class Meta:
        verbose_name = "Informe Médico"
        verbose_name_plural = "Informes Médicos"
        indexes = [
            models.Index(fields=['doctor', 'created_at']), # NUEVO: Optimización para reportes por médico
            models.Index(fields=['institution', 'created_at']), # NUEVO: Optimización para reportes por sede
        ]
    def __str__(self):
        return f"Informe Médico #{self.id} - Paciente {self.patient_id}"
    def save(self, *args, **kwargs):
        # NUEVO: Auto-completar doctor e institution desde appointment
        if self.appointment:
            self.doctor = self.appointment.doctor
            self.institution = self.appointment.institution
        super().save(*args, **kwargs)


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
    institution = models.ForeignKey(
        "InstitutionSettings", 
        on_delete=models.CASCADE, 
        related_name="test_catalog"
    )
    name = models.CharField(max_length=255, help_text="Nombre del examen")
    code = models.CharField(max_length=50, help_text="Código interno, CUPS o CPT")
    category = models.CharField(
        max_length=50, 
        choices=[
            # === LABORATORIO CLÍNICO ===
            ("lab_hematology", "Laboratorio → Hematología"),
            ("lab_biochemistry", "Laboratorio → Bioquímica"),
            ("lab_immunology", "Laboratorio → Inmunología"),
            ("lab_microbiology", "Laboratorio → Microbiología"),
            ("lab_parasitology", "Laboratorio → Parasitología"),
            ("lab_urinalysis", "Laboratorio → Uroanálisis"),
            ("lab_endocrinology", "Laboratorio → Endocrinología"),
            ("lab_toxicology", "Laboratorio → Toxicología"),
            ("lab_coagulation", "Laboratorio → Coagulación"),
            ("lab_special", "Laboratorio → Pruebas Especiales"),
            
            # === IMAGENOLOGÍA ===
            ("img_xray", "Imagenología → Rayos X"),
            ("img_ultrasound", "Imagenología → Ecografía"),
            ("img_ct", "Imagenología → Tomografía (TC)"),
            ("img_mri", "Imagenología → Resonancia (RM)"),
            ("img_mammography", "Imagenología → Mamografía"),
            ("img_densitometry", "Imagenología → Densitometría"),
            ("img_fluoroscopy", "Imagenología → Fluoroscopía"),
            ("img_angiography", "Imagenología → Angiografía"),
            ("img_nuclear", "Imagenología → Medicina Nuclear"),
            
            # === CARDIOLOGÍA ===
            ("card_ecg", "Cardiología → Electrocardiograma"),
            ("card_echo", "Cardiología → Ecocardiograma"),
            ("card_stress", "Cardiología → Prueba de Esfuerzo"),
            ("card_holter", "Cardiología → Holter / Monitoreo"),
            
            # === NEUROLOGÍA ===
            ("neuro_eeg", "Neurología → Electroencefalograma"),
            ("neuro_emg", "Neurología → Electromiografía"),
            ("neuro_evoked", "Neurología → Potenciales Evocados"),
            
            # === FUNCIÓN PULMONAR ===
            ("pulmo_spirometry", "Neumología → Espirometría"),
            ("pulmo_pft", "Neumología → Pruebas Funcionales"),
            ("pulmo_oximetry", "Neumología → Oximetría"),
            
            # === ENDOSCOPIA ===
            ("endo_gastro", "Endoscopía → Gastroscopía"),
            ("endo_colono", "Endoscopía → Colonoscopía"),
            ("endo_broncho", "Endoscopía → Broncoscopía"),
            
            # === OFTALMOLOGÍA ===
            ("ophth_slit", "Oftalmología → Lámpara de Hendidura"),
            ("ophth_oct", "Oftalmología → OCT"),
            ("ophth_visual", "Oftalmología → Campo Visual"),
            ("ophth_tonometry", "Oftalmología → Tonometría"),
            
            # === OTROS ===
            ("other_audiometry", "Otros → Audiometría"),
            ("other_biopsy", "Otros → Biopsia"),
            ("other_genetic", "Otros → Genética"),
            ("other_special", "Otros → Especiales"),
        ],
        default="lab_special"
    )
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    class Meta:
        verbose_name = "Catálogo de Examen"
        verbose_name_plural = "Catálogo de Exámenes"
        unique_together = ('institution', 'code')
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        if self.description:
            self.description = normalize_title_case(self.description)
        super().save(*args, **kwargs)
    def __str__(self):
        return f"[{self.institution.name}] {self.name} ({self.code})"


class MedicalTest(models.Model):
    TEST_TYPE_CHOICES = [
        # === HEMATOLOGÍA ===
        ("hemogram", "Hemograma Completo"),
        ("hemoglobin", "Hemoglobina / Hematocrito"),
        ("platelets", "Conteo de Plaquetas"),
        ("reticulocytes", "Reticulocitos"),
        ("coag_pt", "Tiempos de Coagulación (PT/PTT/INR)"),
        ("blood_type", "Grupo Sanguíneo y Rh"),
        ("peripheral_smear", "Frotis de Sangre Periférica"),
        ("bone_marrow", "Aspirado de Médula Ósea"),
        
        # === BIOQUÍMICA ===
        ("glucose", "Glucemia"),
        ("glucose_2h", "Glucemia Post-Prandial (2h)"),
        ("glycated_hgb", "Hemoglobina Glicosilada (HbA1c)"),
        ("curva_glucosa", "Curva de Tolerancia a Glucosa"),
        ("lipid_profile", "Perfil Lipídico"),
        ("renal_panel", "Perfil Renal (BUN/Cr)"),
        ("liver_panel", "Perfil Hepático"),
        ("electrolytes", "Electrolitos Séricos"),
        ("thyroid_panel", "Perfil Tiroideo (TSH/T3/T4)"),
        ("bone_profile", "Perfil Óseo (Ca/P/FA)"),
        ("cardiac_enzymes", "Enzimas Cardíacas (Troponina/CK)"),
        ("tumor_markers", "Marcadores Tumorales"),
        ("iron_studies", "Perfil de Hierro (Ferritina)"),
        ("vitamin_d", "Vitamina D (25-OH)"),
        ("vitamin_b12", "Vitamina B12"),
        ("folate", "Ácido Fólico"),
        ("amylase", "Amilasa / Lipasa"),
        ("uric_acid", "Ácido Úrico"),
        ("protein_total", "Proteínas Totales / Albúmina"),
        ("bilirubin", "Bilirrubinas"),
        ("creatinine_clearance", "Depuración de Creatinina"),
        
        # === UROANÁLISIS ===
        ("urinalysis", "Uroanálisis Completo"),
        ("urine_culture", "Urocultivo"),
        ("urine_24h", "Orina 24 Horas"),
        ("urine_protein", "Proteinuria 24h"),
        ("urine_microalbumin", "Microalbuminuria"),
        
        # === HECES ===
        ("stool_routine", "Examen de Heces"),
        ("stool_occult", "Sangre Oculta en Heces"),
        ("stool_parasites", "Parasitológico en Heces"),
        ("stool_culture", "Coprocultivo"),
        ("stool_elisa", "Antígeno en Heces (ELISA)"),
        
        # === MICROBIOLOGÍA ===
        ("blood_culture", "Hemocultivo"),
        ("wound_culture", "Cultivo de Herida"),
        ("throat_culture", "Exudado Faríngeo"),
        ("sputum_culture", "Cultivo de Esputo"),
        ("csf_analysis", "Líquido Cefalorraquídeo"),
        ("synovial_fluid", "Líquido Sinovial"),
        ("pleural_fluid", "Líquido Pleural"),
        ("ascitic_fluid", "Líquido Ascítico"),
        ("covid_pcr", "PCR COVID-19"),
        ("covid_antigen", "Antígeno COVID-19"),
        ("covid_antibodies", "Anticuerpos COVID-19"),
        ("viral_panel", "Panel Viral"),
        ("bacterial_panel", "Panel Bacteriano"),
        ("fungus_culture", "Cultivo de Hongos"),
        ("mycobacteria", "Micobacterias (BK)"),
        
        # === INMUNOLOGÍA ===
        ("hiv_test", "Prueba VIH (ELISA/Rápida)"),
        ("hepatitis_panel", "Panel Hepatitis (A/B/C)"),
        ("autoimmune_panel", "Panel Autoinmune (ANA/ENA)"),
        ("rheumatoid_factor", "Factor Reumatoideo"),
        ("anti_ccp", "Anti-CCP"),
        ("crp", "Proteína C Reactiva (PCR)"),
        ("esr", "Velocidad de Sedimentación (VSG)"),
        ("allergy_panel", "Panel Alérgico (IgE)"),
        ("immunoglobulins", "Inmunoglobulinas (IgG/IgA/IgM)"),
        ("complement", "Complemento (C3/C4)"),
        ("cryoglobulins", "Cryoglobulinas"),
        
        # === HORMONAS ===
        ("cortisol", "Cortisol"),
        ("acth", "ACTH"),
        ("growth_hormone", "Hormona de Crecimiento"),
        ("prolactin", "Prolactina"),
        ("lh_fsh", "LH / FSH"),
        ("testosterone", "Testosterona"),
        ("estradiol", "Estradiol"),
        ("progesterone", "Progesterona"),
        ("dhea", "DHEA-S"),
        ("insulin", "Insulina"),
        ("peptide_c", "Péptido C"),
        
        # === IMAGENOLOGÍA - RAYOS X ===
        ("xray_chest", "Radiografía de Tórax"),
        ("xray_abdomen", "Radiografía de Abdomen"),
        ("xray_bone", "Radiografía Ósea"),
        ("xray_spine_cervical", "Radiografía Cervical"),
        ("xray_spine_lumbar", "Radiografía Lumbar"),
        ("xray_spine_dorsal", "Radiografía Dorsal"),
        ("xray_pelvis", "Radiografía de Pelvis"),
        ("xray_skull", "Radiografía de Cráneo"),
        ("xray_sinus", "Radiografía de Senos Paranasales"),
        ("xray_extremity", "Radiografía de Extremidades"),
        ("xray_dental", "Radiografía Dental"),
        ("xray_contrast", "Radiografía con Contraste"),
        
        # === IMAGENOLOGÍA - ECOGRAFÍA ===
        ("ultrasound_abdo", "Ecografía Abdominal"),
        ("ultrasound_pelvic", "Ecografía Pélvica"),
        ("ultrasound_thyroid", "Ecografía Tiroidea"),
        ("ultrasound_obstetric", "Ecografía Obstétrica"),
        ("ultrasound_doppler", "Doppler Vascular"),
        ("ultrasound_cardiac", "Ecocardiograma"),
        ("ultrasound_breast", "Ecografía Mamaria"),
        ("ultrasound_prostate", "Ecografía Prostática"),
        ("ultrasound_testicular", "Ecografía Testicular"),
        ("ultrasound_soft_tissue", "Ecografía de Partes Blandas"),
        ("ultrasound_joint", "Ecografía Articular"),
        
        # === IMAGENOLOGÍA - TOMOGRAFÍA ===
        ("ct_head", "TC de Cráneo"),
        ("ct_brain_angio", "TC Cerebral con Angio"),
        ("ct_abdomen", "TC Abdominal"),
        ("ct_chest", "TC de Tórax"),
        ("ct_spine", "TC de Columna"),
        ("ct_pelvis", "TC de Pelvis"),
        ("ct_neck", "TC de Cuello"),
        ("ct_sinus", "TC de Senos Paranasales"),
        ("ct_cardiac", "TC Cardíaca"),
        ("ct_angio", "TC Angiografía"),
        
        # === IMAGENOLOGÍA - RESONANCIA ===
        ("mri_brain", "RM Cerebral"),
        ("mri_spine", "RM de Columna"),
        ("mri_joint", "RM Articular"),
        ("mri_abdomen", "RM Abdominal"),
        ("mri_pelvis", "RM Pélvica"),
        ("mri_cardiac", "RM Cardíaca"),
        ("mri_angio", "RM Angiografía"),
        ("mri_prostate", "RM Prostática"),
        ("mri_breast", "RM Mamaria"),
        
        # === IMAGENOLOGÍA - OTROS ===
        ("mammography", "Mamografía"),
        ("mammography_3d", "Tomosíntesis Mamaria"),
        ("densitometry", "Densitometría Ósea"),
        ("fluoroscopy", "Fluoroscopía"),
        ("angiography", "Angiografía"),
        ("hysterosalpingography", "Histerosalpingografía"),
        ("urography", "Urografía"),
        ("cholangiography", "Colangiografía"),
        ("pet_ct", "PET-CT"),
        ("bone_scan", "Gammagrafía Ósea"),
        ("thyroid_scan", "Gammagrafía Tiroidea"),
        ("lung_scan", "Gammagrafía Pulmonar"),
        ("renal_scan", "Gammagrafía Renal"),
        
        # === CARDIOLOGÍA ===
        ("ecg_12lead", "ECG 12 Derivaciones"),
        ("ecg_holter", "Holter 24h"),
        ("ecg_event", "Monitoreo de Eventos"),
        ("echo_cardiac", "Ecocardiograma Transtorácico"),
        ("echo_transesophageal", "Ecocardiograma Transesofágico"),
        ("stress_test", "Prueba de Esfuerzo"),
        ("stress_echo", "Eco-Estrés"),
        ("ambulatory_bp", "MAPA (Presión 24h)"),
        ("tilt_test", "Prueba de Mesa Inclinada"),
        ("abi", "Índice Tobillo-Brazo"),
        
        # === NEUMOLOGÍA ===
        ("spirometry", "Espirometría"),
        ("spirometry_post", "Espirometría Post-Broncodilatador"),
        ("plethysmography", "Pletismografía"),
        ("pulse_oximetry", "Oximetría de Pulso"),
        ("sleep_study", "Polisomnografía"),
        ("capnography", "Capnografía"),
        ("diffusion_capacity", "Capacidad de Difusión"),
        
        # === NEUROLOGÍA ===
        ("eeg", "Electroencefalograma"),
        ("eeg_video", "Video-EEG"),
        ("emg", "Electromiografía"),
        ("nerve_conduction", "Conducción Nerviosa"),
        ("evoked_potentials", "Potenciales Evocados"),
        ("vep", "Potenciales Evocados Visuales"),
        ("baep", "Potenciales Evocados Auditivos"),
        ("sep", "Potenciales Evocados Somatosensoriales"),
        
        # === ENDOSCOPIA ===
        ("endoscopy_ugi", "Endoscopía Alta (EGD)"),
        ("colonoscopy", "Colonoscopía"),
        ("colonoscopy_virtual", "Colonoscopía Virtual"),
        ("bronchoscopy", "Broncoscopía"),
        ("cystoscopy", "Cistoscopía"),
        ("gastroscopy", "Gastroscopía"),
        ("sigmoidoscopy", "Sigmoidoscopía"),
        ("capsule_endoscopy", "Cápsula Endoscópica"),
        ("ercp", "CPRE"),
        ("thoracoscopy", "Toracoscopía"),
        ("laparoscopy", "Laparoscopía Diagnóstica"),
        ("arthroscopy", "Artroscopía"),
        
        # === OFTALMOLOGÍA ===
        ("visual_acuity", "Agudeza Visual"),
        ("tonometry", "Tonometría"),
        ("oct_eye", "OCT Ocular"),
        ("fundoscopy", "Fondo de Ojo"),
        ("slit_lamp", "Lámpara de Hendidura"),
        ("visual_field", "Campo Visual"),
        ("retinography", "Retinografía"),
        ("corneal_topography", "Topografía Corneal"),
        ("pachymetry", "Paquimetría"),
        ("biometry", "Biometría Ocular"),
        ("color_vision", "Test de Visión de Colores"),
        
        # === OTORRINOLARINGOLOGÍA ===
        ("audiometry", "Audiometría"),
        ("audiometry_speech", "Audiometría con Logoaudiometría"),
        ("tympanometry", "Timpanometría"),
        ("otoacoustic", "Emisiones Otoacústicas"),
        ("bera", "BERA (Potenciales Auditivos)"),
        ("nasendoscopy", "Nasofibroscopía"),
        ("laryngoscopy", "Laringoscopía"),
        ("vestibular_test", "Pruebas Vestibulares"),
        
        # === GINECO-OBSTETRICIA ===
        ("papanicolaou", "Papanicolaou"),
        ("colposcopy", "Colposcopía"),
        ("hysteroscopy", "Histeroscopía"),
        ("amniocentesis", "Amniocentesis"),
        ("chorionic_villus", "Biopsia de Vellosidades Coriónicas"),
        ("nfetal_monitoring", "Monitoreo Fetal"),
        ("biophysical_profile", "Perfil Biofísico Fetal"),
        ("semen_analysis", "Espermatograma"),
        
        # === PROCEDIMIENTOS ESPECIALES ===
        ("biopsy", "Biopsia"),
        ("biopsy_skin", "Biopsia de Piel"),
        ("biopsy_bone", "Biopsia Ósea"),
        ("biopsy_liver", "Biopsia Hepática"),
        ("biopsy_kidney", "Biopsia Renal"),
        ("biopsy_lung", "Biopsia Pulmonar"),
        ("biopsy_prostate", "Biopsia de Próstata"),
        ("biopsy_breast", "Biopsia de Mama"),
        ("puncture_lumbar", "Punción Lumbar"),
        ("thoracentesis", "Toracocentesis"),
        ("paracentesis", "Paracentesis"),
        ("arthrocentesis", "Artrocentesis"),
        ("bonemarrow_biopsy", "Biopsia de Médula Ósea"),
        
        # === GENÉTICA ===
        ("genetic_test", "Prueba Genética"),
        ("karyotype", "Cariotipo"),
        ("fish", "FISH"),
        ("pcr_genetic", "PCR Genética"),
        ("newborn_screening", "Tamizaje Neonatal"),
        ("paternity_test", "Prueba de Paternidad"),
        ("pharmacogenomics", "Farmacogenómica"),
        
        # === TOXICOLOGÍA ===
        ("drug_screen", "Tamizaje de Drogas"),
        ("alcohol_test", "Prueba de Alcohol"),
        ("heavy_metals", "Metales Pesados"),
        ("therapeutic_drug", "Monitoreo de Fármacos"),
        
        # === OTROS ===
        ("pregnancy_test", "Prueba de Embarazo"),
        ("sweat_test", "Test del Sudor"),
        ("mantoux", "Prueba de Mantoux (PPD)"),
        ("allergy_skin", "Pruebas Cutáneas de Alergia"),
        ("patch_test", "Test de Parche"),
        ("other", "Otro Examen"),
    ]
    URGENCY_CHOICES = [
        ("routine", "Rutina"),
        ("priority", "Prioridad"),
        ("urgent", "Urgente"),
        ("stat", "STAT (Inmediato)"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("collected", "Muestra Recolectada"),
        ("in_process", "En Proceso"),
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
    # NUEVO: CACHÉ de patient, doctor e institution para rendimiento y reportes
    patient = models.ForeignKey(
        "Patient",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        editable=False,
        related_name="referrals",
        verbose_name="Paciente referido"
    )
    doctor = models.ForeignKey(
        "DoctorOperator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="issued_referrals",
        verbose_name="Médico que emite la referencia"
    )
    institution = models.ForeignKey(
        "InstitutionSettings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name="issued_referrals",
        verbose_name="Sede donde se emitió"
    )
    # --- El Corazón de la Red MedOpz ---
    referred_to_doctor = models.ForeignKey(
        "DoctorOperator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_referrals",
        help_text="Médico interno registrado en MedOpz (DESTINO)"
    )
    
    referred_to_external = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Nombre del doctor o clínica externa (si no está en MedOpz) (DESTINO)"
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
        indexes = [
            models.Index(fields=['doctor', 'issued_at']), # NUEVO: Referencias emitidas por médico
            models.Index(fields=['institution', 'issued_at']), # NUEVO: Referencias emitidas por sede
            models.Index(fields=['patient', 'issued_at']), # NUEVO: Referencias de paciente
            models.Index(fields=['referred_to_doctor', 'status']), # Referencias recibidas
        ]
    def __str__(self):
        destinatario = self.referred_to_doctor.full_name if self.referred_to_doctor else self.referred_to_external
        emisor = self.doctor.full_name if self.doctor else "Desconocido"
        return f"Referencia de {emisor} a {destinatario} ({self.get_status_display()})"
    def save(self, *args, **kwargs):
        # NUEVO: Auto-completar patient, doctor e institution desde appointment
        if self.appointment:
            if not self.patient:
                self.patient = self.appointment.patient
            if not self.doctor:
                self.doctor = self.appointment.doctor
            if not self.institution:
                self.institution = self.appointment.institution
        
        # Determinamos automáticamente si es una referencia interna
        if self.referred_to_doctor:
            self.is_internal = True
        super().save(*args, **kwargs)


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
    
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        if self.description:
            self.description = normalize_title_case(self.description)
        super().save(*args, **kwargs)


class MedicationCatalog(models.Model):
    """
    Catálogo maestro de medicamentos para MEDOPZ.
    
    Puede almacenar:
    1. Medicamentos del catálogo global (institution=NULL)
    2. Medicamentos personalizados por institución (institution=ID)
    
    Los datos del INHRR se scrapean y guardan como catálogo global.
    """
    # --------------------------------------------------------------------------
    # IDENTIFICACIÓN CORE
    # --------------------------------------------------------------------------
    name = models.CharField(
        max_length=500,
        help_text="Nombre comercial o genérico principal (ej: Atamel, Loratadina + Pseudoefedrina)"
    )
    generic_name = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Principio activo (ej: Acetaminofén, Loratadina + Pseudoefedrina)"
    )
    
    # --------------------------------------------------------------------------
    # ESPECIFICACIONES TÉCNICAS
    # --------------------------------------------------------------------------
    presentation = models.CharField(
        max_length=50,
        choices=PRESENTATION_CHOICES,
        help_text="Forma farmacéutica (tableta, jarabe, cápsula, etc.)"
    )
    concentration = models.CharField(
        max_length=200,
        help_text="Concentración del medicamento (ej: 500 mg, 5mg/60mg por 5ml)"
    )
    route = models.CharField(
        max_length=20,
        choices=ROUTE_CHOICES,
        help_text="Vía de administración"
    )
    unit = models.CharField(
        max_length=20,
        choices=UNIT_CHOICES,
        help_text="Unidad de medida de la concentración"
    )
    
    # --------------------------------------------------------------------------
    # PRESENTACIÓN COMPLETA
    # --------------------------------------------------------------------------
    # Ejemplo: "Jarabe x 60 ml", "Tableta x 30", "Frasco x 100 ml"
    presentation_size = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Tamaño de la presentación (ej: Jarabe x 60 ml, Tableta x 30)"
    )
    
    # --------------------------------------------------------------------------
    # CONCENTRACIÓN DETALLADA (PARA MEDICAMENTOS COMBINADOS)
    # --------------------------------------------------------------------------
    # Ejemplo: [{"principio": "Loratadina", "cantidad": "5mg"}, {"principio": "Pseudoefedrina", "cantidad": "60mg"}]
    concentration_detail = models.JSONField(
        default=list,
        blank=True,
        help_text="Concentración detallada para medicamentos combinados"
    )
    
    # --------------------------------------------------------------------------
    # CLASIFICACIÓN Y CÓDIGOS
    # --------------------------------------------------------------------------
    code = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        help_text="Código de barras, SKU o código nacional de fármaco"
    )
    
    # Código de registro del INHRR (ej: E.F.42.246)
    inhrr_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Código de registro sanitario del INHRR (ej: E.F.42.246)"
    )
    
    # Clasificación ATC (si está disponible)
    atc_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Código ATC (Clasificación Anatómica Terapéutica)"
    )
    
    is_controlled = models.BooleanField(
        default=False,
        help_text="Marcar si requiere receta médica especial (psicotrópicos, etc.)"
    )
    
    # --------------------------------------------------------------------------
    # ACCIÓN TERAPÉUTICA
    # --------------------------------------------------------------------------
    therapeutic_action = models.TextField(
        blank=True,
        null=True,
        help_text="Acción terapéutica (ej: Antihistamínico, Antiinflamatorio)"
    )
    
    # --------------------------------------------------------------------------
    # GESTIÓN INSTITUCIONAL
    # --------------------------------------------------------------------------
    institution = models.ForeignKey(
        "InstitutionSettings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="custom_medications",
        help_text="Si es nulo, es parte del catálogo maestro global de MedOpz"
    )
    
    # --------------------------------------------------------------------------
    # ESTATUS Y AUDITORÍA
    # --------------------------------------------------------------------------
    inhrr_status = models.CharField(
        max_length=20,
        choices=MEDICATION_STATUS_CHOICES,
        default='VIGENTE',
        help_text="Estatus del medicamento según el INHRR"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # --------------------------------------------------------------------------
    # METADATOS DEL SCRAPING
    # --------------------------------------------------------------------------
    source = models.CharField(
        max_length=20,
        default='INHRR',
        help_text="Fuente de los datos (INHRR, MANUAL, etc.)"
    )
    last_scraped_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha del último scraping"
    )
    
    # --------------------------------------------------------------------------
    # BÚSQUEDA FULL-TEXT
    # --------------------------------------------------------------------------
    search_vector = models.TextField(
        blank=True,
        help_text="Vector de búsqueda para full-text search"
    )
    
    class Meta:
        verbose_name = "Medicamento"
        verbose_name_plural = "Catálogo de Medicamentos"
        unique_together = [
            ["name", "presentation", "concentration", "institution"],
        ]
        ordering = ["name", "presentation"]
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['generic_name']),
            models.Index(fields=['presentation']),
            models.Index(fields=['route']),
            models.Index(fields=['institution']),
            models.Index(fields=['inhrr_status']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        """Representación legible del medicamento."""
        institution_suffix = f" ({self.institution.name})" if self.institution else ""
        return f"{self.name} {self.get_presentation_display()} {self.concentration}{institution_suffix}"
    
    def save(self, *args, **kwargs):
        """Normalización de texto y actualización de search_vector."""
        
        # Normalizar nombre y nombre genérico a Title Case
        if self.name:
            self.name = self.name.title()
        if self.generic_name:
            self.generic_name = self.generic_name.title()
        
        # Generar search_vector para full-text search
        search_parts = [
            self.name or '',
            self.generic_name or '',
            self.presentation or '',
            self.concentration or '',
            self.therapeutic_action or '',
            self.inhrr_code or '',
        ]
        self.search_vector = ' '.join(filter(None, search_parts))
        
        super().save(*args, **kwargs)
    
    # --------------------------------------------------------------------------
    # PROPIEDADES PARA UI
    # --------------------------------------------------------------------------
    @property
    def full_name(self):
        """Nombre completo para display en UI."""
        return f"{self.name} {self.get_presentation_display()} {self.concentration}"
    
    @property
    def display_name(self):
        """Nombre para mostrar en dropdowns."""
        return self.name
    
    @property
    def medication_type(self):
        """Tipo de medicamento para display."""
        return self.presentation
    
    def to_dict(self):
        """Convierte el modelo a diccionario para APIs."""
        return {
            'id': self.id,
            'name': self.name,
            'generic_name': self.generic_name,
            'presentation': self.presentation,
            'concentration': self.concentration,
            'route': self.route,
            'unit': self.unit,
            'presentation_size': self.presentation_size,
            'concentration_detail': self.concentration_detail,
            'code': self.code,
            'inhrr_code': self.inhrr_code,
            'atc_code': self.atc_code,
            'is_controlled': self.is_controlled,
            'therapeutic_action': self.therapeutic_action,
            'is_active': self.is_active,
            'source': self.source,
        }


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
    def save(self, *args, **kwargs):
        if self.description:
            self.description = normalize_title_case(self.description)
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.patient} — {self.get_type_display()}"


class FamilyHistory(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="family_history"
    )
    condition = models.CharField(max_length=255)
    relative = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = "Family History"
        verbose_name_plural = "Family Histories"
    def save(self, *args, **kwargs):
        self.condition = normalize_title_case(self.condition)
        self.relative = normalize_title_case(self.relative)
        super().save(*args, **kwargs)
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
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        if self.hospital:
            self.hospital = normalize_title_case(self.hospital)
        super().save(*args, **kwargs)
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
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        if self.country:
            self.country = normalize_title_case(self.country)
        super().save(*args, **kwargs)
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
    updated_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()
    class Meta:
        verbose_name = "Allergy"
        verbose_name_plural = "Allergies"
        indexes = [
            models.Index(fields=["patient", "name"]),
        ]
    def save(self, *args, **kwargs):
        self.name = normalize_title_case(self.name)
        super().save(*args, **kwargs)
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
    onset_date = models.DateField(
        null=True, 
        blank=True, 
        verbose_name="Fecha de aparición aproximada"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()
    class Meta:
        verbose_name = "Antecedente Médico"
        verbose_name_plural = "Historial de Antecedentes"
        indexes = [
            models.Index(fields=["patient", "status"]),
        ]
    def save(self, *args, **kwargs):
        self.condition = normalize_title_case(self.condition)
        if self.notes:
            self.notes = normalize_title_case(self.notes)
        super().save(*args, **kwargs)
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


class InstitutionPermission(models.Model):
    """
    Permiso híbrido mono-médico multi-institución
    Diseñado para evolucionar a multi-usuario sin rewrites
    """
    
    ACCESS_LEVELS = [
        ('full_access', 'Acceso Completo'),
        ('emergency_access', 'Acceso de Emergencia'),
    ]
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='institution_permissions'
    )
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.CASCADE,
        related_name='user_permissions'
    )
    
    access_level = models.CharField(
        max_length=20,
        choices=ACCESS_LEVELS,
        default='full_access'
    )
    
    # Metadata para evolución futura
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='granted_permissions'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Para emergency access (24h default)"
    )
    
    # Control de evolución
    is_own_institution = models.BooleanField(
        default=True,
        help_text="True si el médico 'posee' esta institución"
    )
    
    # Auditoría
    last_accessed = models.DateTimeField(null=True, blank=True)
    access_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        unique_together = ('user', 'institution')
        ordering = ['-granted_at']
    
    def __str__(self):
        return f"{self.user.doctor_profile.full_name} - {self.institution.name} ({self.access_level})"


class AuditLog(models.Model):
    """
    Log de auditoría para acceso institucional
    """
    
    ACTION_TYPES = [
        ('login', 'Login'),
        ('view', 'View'),
        ('edit', 'Edit'),
        ('generate_pdf', 'Generate PDF'),
        ('emergency_access', 'Emergency Access'),
        ('emergency_access_refreshed', 'Emergency Access Refreshed'),
        ('institution_switch', 'Switch Institution'),
    ]
    
    # Relaciones
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    
    # Acción y contexto
    action = models.CharField(
        max_length=50,
        choices=ACTION_TYPES,
        help_text="Tipo de acción realizada"
    )
    access_level = models.CharField(
        max_length=20,
        choices=[
            ('full_access', 'Full Access'),
            ('emergency_access', 'Emergency Access'),
        ],
        help_text="Nivel de acceso utilizado"
    )
    
    # Metadata institucional
    is_own_institution = models.BooleanField(
        default=True,
        help_text="True si es institución propia del médico"
    )
    is_cross_institution = models.BooleanField(
        default=False,
        help_text="True si es cross-institution access"
    )
    
    # Información técnica
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Dirección IP del acceso"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User Agent del navegador"
    )
    
    # Timestamps
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="Cuándo ocurrió el acceso"
    )
    
    # Metadata adicional
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Información adicional en formato JSON"
    )
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['institution', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['is_cross_institution']),
        ]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.institution.name} ({self.timestamp})"
    
    @property
    def is_emergency_access(self):
        """Verificar si fue acceso de emergencia"""
        return self.access_level == 'emergency_access'
    
    @property
    def is_cross_access(self):
        """Verificar si fue cross-institution access"""
        return self.is_cross_institution


class MercantilP2CTransaction(models.Model):
    """
    Registro de transacciones P2C Mercantil con QR.
    Almacena tanto pagos generados como confirmados.
    """
    STATUS_CHOICES = [
        ('generated', 'QR Generado'),
        ('pending', 'Pendiente de Pago'),
        ('confirmed', 'Pago Confirmado'),
        ('expired', 'QR Expirado'),
        ('cancelled', 'Cancelado'),
        ('failed', 'Fallido'),
    ]
    
    # --- RELACIONES ---
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.CASCADE,
        related_name='p2c_transactions',
        verbose_name="Institución"
    )
    charge_order = models.ForeignKey(
        'ChargeOrder',
        on_delete=models.CASCADE,
        related_name='p2c_transactions',
        null=True,
        blank=True,
        verbose_name="Orden de Cobro Asociada"
    )
    payment = models.ForeignKey(
        'Payment',
        on_delete=models.CASCADE,
        related_name='p2c_transactions',
        null=True,
        blank=True,
        verbose_name="Pago Confirmado"
    )
    
    # --- DATOS DE TRANSACCIÓN ---
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Monto de la Transacción"
    )
    currency = models.CharField(
        max_length=3,
        default='VES',
        verbose_name="Moneda"
    )
    
    # --- DATOS ESPECÍFICOS DE P2C ---
    qr_code_data = models.TextField(
        verbose_name="Datos del Código QR",
        help_text="Contenido completo del QR generado por Mercantil"
    )
    qr_image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="URL de Imagen QR",
        help_text="URL de la imagen del QR generada (opcional)"
    )
    
    # --- IDs DE MERCANTIL ---
    mercantil_transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        verbose_name="ID Transacción Mercantil",
        help_text="ID único retornado por API de Mercantil"
    )
    merchant_order_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="ID Orden Comerciante",
        help_text="ID único de nuestra orden para rastreo"
    )
    
    # --- CONTROL DE ESTADOS ---
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='generated',
        verbose_name="Estado de Transacción"
    )
    
    # --- TIMING LIFECYCLE ---
    generated_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Generación QR"
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de Expiración QR"
    )
    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de Confirmación de Pago"
    )
    
    # --- METADATOS Y AUDITORÍA ---
    gateway_response_raw = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Respuesta Raw Gateway",
        help_text="Respuesta completa de API Mercantil"
    )
    callback_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name="Datos de Callback",
        help_text="Datos recibidos en webhook de confirmación"
    )
    
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = "Transacción P2C Mercantil"
        verbose_name_plural = "Transacciones P2C Mercantil"
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['institution', 'status']),
            models.Index(fields=['mercantil_transaction_id']),
            models.Index(fields=['merchant_order_id']),
            models.Index(fields=['status', 'generated_at']),
        ]
    
    def __str__(self):
        return f"P2C-{self.merchant_order_id} - {self.amount} {self.currency} [{self.get_status_display()}]"
    
    def is_expired(self):
        """Verifica si el QR ha expirado"""
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False
    
    def can_confirm_payment(self):
        """Verifica si la transacción puede ser confirmada"""
        return self.status == 'pending' and not self.is_expired()


class MercantilP2CConfig(models.Model):
    """
    Configuración específica para integración P2C Mercantil.
    Almacena credenciales y parámetros del servicio.
    """
    
    institution = models.OneToOneField(
        'InstitutionSettings',
        on_delete=models.CASCADE,
        related_name='p2c_config',
        verbose_name="Institución"
    )
    
    # --- CREDENCIALES DE API ---
    client_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Client ID Mercantil"
    )
    secret_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Secret Key Mercantil"
    )
    webhook_secret = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Webhook Secret"
    )
    
    # --- CONFIGURACIÓN DE ENTORNO ---
    is_test_mode = models.BooleanField(
        default=True,
        verbose_name="Modo de Pruebas (Sandbox)",
        help_text="Activar modo sandbox de Mercantil"
    )
    
    # --- PARÁMETROS DE TRANSACCIÓN ---
    qr_expiration_minutes = models.PositiveIntegerField(
        default=15,
        verbose_name="Tiempo de Expiración QR (minutos)",
        help_text="Tiempo en minutos antes de que el QR expire"
    )
    max_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('1000000.00'),
        verbose_name="Monto Máximo por Transacción"
    )
    min_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('1.00'),
        verbose_name="Monto Mínimo por Transacción"
    )
    
    # --- CONFIGURACIÓN DE WEBHOOK ---
    webhook_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name="URL de Webhook",
        help_text="URL donde Mercantil enviará confirmaciones de pago"
    )
    
    # --- AUDITORÍA ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Configuración P2C Mercantil"
        verbose_name_plural = "Configuraciones P2C Mercantil"
    
    def __str__(self):
        return f"P2C Config - {self.institution.name}"
    
    def get_api_environment(self):
        """Retorna el entorno de API correspondiente"""
        return "sandbox" if self.is_test_mode else "production"


class BillingCategory(models.Model):
    """
    Categorías de servicios médicos para facturación.
    Ej: Consultas, Laboratorio, Imagenología, Procedimientos.
    """
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.CASCADE,
        related_name='billing_categories'
    )
    name = models.CharField(max_length=100, verbose_name="Nombre")
    code_prefix = models.CharField(max_length=10, verbose_name="Prefijo de código")
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    sort_order = models.IntegerField(default=0, verbose_name="Orden")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = ['institution', 'code_prefix']
        verbose_name = "Categoría de Facturación"
        verbose_name_plural = "Categorías de Facturación"
    
    def __str__(self):
        return f"{self.code_prefix} - {self.name}"


class BillingItem(models.Model):
    """
    Items de facturación: servicios y productos médicos.
    Ej: Consulta General, Hemograma, Radiografía de Tórax.
    """
    institution = models.ForeignKey(
        'InstitutionSettings',
        on_delete=models.CASCADE,
        related_name='billing_items'
    )
    category = models.ForeignKey(
        BillingCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    
    # Identificación
    code = models.CharField(max_length=20, verbose_name="Código")
    name = models.CharField(max_length=150, verbose_name="Nombre")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
    
    # Pricing
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Precio Unitario"
    )
    currency = models.CharField(max_length=10, default='USD', verbose_name="Moneda")
    
    # Metadatos
    estimated_duration = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Duración estimada (min)"
    )
    sort_order = models.IntegerField(default=0, verbose_name="Orden")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    
    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='billing_items_created'
    )
    
    history = HistoricalRecords()
    
    class Meta:
        ordering = ['category__sort_order', 'sort_order', 'code']
        unique_together = ['institution', 'code']
        verbose_name = "Item de Facturación"
        verbose_name_plural = "Items de Facturación"
        indexes = [
            models.Index(fields=['institution', 'is_active']),
            models.Index(fields=['institution', 'category']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"
    
    def clean(self):
        if self.unit_price < Decimal('0.00'):
            raise ValidationError({"unit_price": "El precio no puede ser negativo"})