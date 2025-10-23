from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords
from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone

# Create your models here.
class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('Unknown', 'Unknown'),
    ]

    national_id = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="Cédula de Identidad",
        null=True,   # Temporalmente permitimos nulos para migrar sin bloqueos
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\d+$',
                message="La cédula solo puede contener números."
            ),
            MinLengthValidator(6, message="La cédula debe tener al menos 6 dígitos."),
            MaxLengthValidator(10, message="La cédula no puede tener más de 10 dígitos.")
        ]
    )
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    second_last_name = models.CharField(max_length=100, blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Unknown')
    contact_info = models.TextField(blank=True, null=True)

    # Historial
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Patient"
        verbose_name_plural = "Patients"
    
    def __str__(self):
        parts = [self.first_name, self.middle_name, self.last_name, self.second_last_name]
        return f"{self.national_id or 'SIN-CI'} - " + " ".join([p for p in parts if p])


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

    patient = models.ForeignKey('Patient', on_delete=models.CASCADE)
    appointment_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        null=False,
        blank=False
    )

    arrival_time = models.TimeField(blank=True, null=True)

    appointment_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='general',
        verbose_name="Tipo de consulta"
    )

    expected_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name="Monto esperado"
    )

    # 🔹 Campo para evolución clínica
    notes = models.TextField(blank=True, null=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"

    def __str__(self):
        return f"{self.patient} - {self.appointment_date} - {self.status}"

    # --- Finanzas ---
    def total_paid(self):
        agg = self.payments.aggregate(total=Sum('amount'))
        return agg.get('total') or Decimal('0.00')

    def balance_due(self):
        return max(self.expected_amount - self.total_paid(), Decimal('0.00'))

    def is_fully_paid(self):
        return self.balance_due() == Decimal('0.00')

    def set_expected_amount_by_type(self):
        if self.appointment_type == 'general':
            self.expected_amount = Decimal('50.00')
        elif self.appointment_type == 'specialized':
            self.expected_amount = Decimal('100.00')

    # --- Flujo de estados ---
    def can_transition(self, new_status: str) -> bool:
        valid_transitions = {
            "pending": ["arrived", "canceled"],
            "arrived": ["in_consultation", "canceled"],
            "in_consultation": ["completed", "canceled"],
            "completed": [],
            "canceled": [],
        }
        return new_status in valid_transitions[self.status]

    def update_status(self, new_status: str):
        if self.can_transition(new_status):
            self.status = new_status
            self.save(update_fields=["status"])
        else:
            raise ValueError(f"No se puede pasar de {self.status} a {new_status}")

    def mark_arrived(self, is_emergency: bool = False, is_walkin: bool = False):
        """
        Marca la cita como 'arrived' y crea entrada en la sala de espera.
        - Grupo A = scheduled
        - Grupo B = walkin
        - Emergency = primero en Grupo A
        """
        if self.status == "pending":
            self.status = "arrived"
            self.arrival_time = timezone.now().time()
            self.save(update_fields=["status", "arrival_time"])

            # Determinar prioridad según regla de negocio
            if is_walkin:
                priority = "walkin"   # Grupo B
            elif is_emergency:
                priority = "emergency"  # Grupo A, pero primero
            else:
                priority = "scheduled"  # Grupo A normal

            WaitingRoomEntry.objects.create(
                patient=self.patient,
                appointment=self,
                status="waiting",
                priority=priority
            )

    def mark_completed(self):
        self.status = 'completed'
        self.save(update_fields=['status'])


class WaitingRoomEntry(models.Model):
    PRIORITY_CHOICES = [
        ("scheduled", "Scheduled"),   # Grupo A
        ("walkin", "Walk-in"),        # Grupo B
        ("emergency", "Emergency"),   # Grupo A, primero
    ]

    STATUS_CHOICES = [
        ("waiting", "Waiting"),
        ("in_consultation", "In Consultation"),
        ("completed", "Completed"),
        ("canceled", "Canceled"),
    ]

    patient = models.ForeignKey("Patient", on_delete=models.CASCADE)
    appointment = models.ForeignKey("Appointment", on_delete=models.SET_NULL, null=True, blank=True)
    arrival_time = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="waiting")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="scheduled")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        # 🔹 Emergencias primero, luego scheduled (Grupo A), luego walkin (Grupo B)
        ordering = [
            models.Case(
                models.When(priority="emergency", then=0),
                models.When(priority="scheduled", then=1),
                models.When(priority="walkin", then=2),
                default=3,
                output_field=models.IntegerField(),
            ),
            "order",
            "arrival_time",
        ]
        verbose_name = "Waiting Room Entry"
        verbose_name_plural = "Waiting Room Entries"

    def __str__(self):
        return f"{self.patient} - {self.get_status_display()}"

    # --- Flujo de estados ---
    def can_transition(self, new_status: str) -> bool:
        valid_transitions = {
            "waiting": ["in_consultation", "canceled"],
            "in_consultation": ["completed", "canceled"],
            "completed": [],
            "canceled": [],
        }
        return new_status in valid_transitions[self.status]

    def update_status(self, new_status: str):
        if self.can_transition(new_status):
            self.status = new_status
            self.save(update_fields=["status"])
        else:
            raise ValueError(f"No se puede pasar de {self.status} a {new_status}")


class Diagnosis(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='diagnoses')
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Diagnosis"
        verbose_name_plural = "Diagnoses"

    def __str__(self):
        return f"{self.code} ({self.appointment.pk if self.appointment else 'no-appointment'})"


class Treatment(models.Model):
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.CASCADE, related_name='treatments')
    plan = models.TextField()
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Treatment"
        verbose_name_plural = "Treatments"

    def __str__(self):
        return f"Treatment for {self.diagnosis.code}"


class Prescription(models.Model):
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.CASCADE, related_name='prescriptions')
    medication = models.CharField(max_length=200)
    dosage = models.CharField(max_length=200, blank=True, null=True)
    duration = models.CharField(max_length=200, blank=True, null=True)
    
    class Meta:
        verbose_name = "Prescription"
        verbose_name_plural = "Prescriptions"

    def __str__(self):
        return f"{self.medication} ({self.diagnosis.code})"


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('paid', 'Pagado'),
        ('canceled', 'Cancelado'),
        ('waived', 'Exonerado'),
    ]
    METHOD_CHOICES = [
        ('cash', 'Efectivo'),
        ('card', 'Tarjeta'),
        ('transfer', 'Transferencia'),
    ]

    appointment = models.ForeignKey(   # 🔹 ahora permite múltiples pagos por cita
        'Appointment',
        on_delete=models.CASCADE,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reference_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Número de referencia / comprobante")
    bank_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Banco emisor (si aplica)")
    received_by = models.CharField(max_length=100, blank=True, null=True, verbose_name="Recibido por")
    received_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, verbose_name="Fecha de registro")

    # Historial
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"{self.appointment} - {self.amount} - {self.method} - {self.status}"

    # 🔹 Validaciones de negocio
    def clean(self):
        errors = {}

        if self.method == 'transfer':
            if not self.reference_number:
                errors['reference_number'] = "Debe ingresar el número de transferencia."
            if not self.bank_name:
                errors['bank_name'] = "Debe especificar el banco emisor."

        if self.method == 'card':
            if not self.reference_number:
                errors['reference_number'] = "Debe ingresar el número de comprobante de la tarjeta."

        if errors:
            raise ValidationError(errors)


class Event(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    actor = models.CharField(max_length=100, blank=True, null=True)  # luego se enlaza a User
    entity = models.CharField(max_length=50)  # Appointment, Payment, etc.
    entity_id = models.IntegerField()
    action = models.CharField(max_length=100)
    metadata = models.JSONField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Event"
        verbose_name_plural = "Events"

    def __str__(self):
        return f"{self.timestamp} - {self.entity}({self.entity_id}) - {self.action}"


# Nuevo modelo para documentos clínicos
class MedicalDocument(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="documents")
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, blank=True, null=True, related_name="documents")
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.SET_NULL, blank=True, null=True, related_name="documents")

    file = models.FileField(upload_to="medical_documents/")
    description = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)  # Ej: "Laboratorio", "Imagenología"
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.CharField(max_length=100, blank=True, null=True)  # luego enlazable a User

    class Meta:
        verbose_name = "Medical Document"
        verbose_name_plural = "Medical Documents"

    def __str__(self):
        return f"{self.description or 'Documento'} - {self.patient}"
