from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils.timezone import now
from django.core.exceptions import ValidationError


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
    ]
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE)
    appointment_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    arrival_time = models.TimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"
    
    def __str__(self):
        return f"{self.patient} - {self.appointment_date} - {self.status}"


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

    appointment = models.OneToOneField(  # un pago único por cita
        'Appointment',
        on_delete=models.CASCADE,
        related_name="payment"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reference_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Número de referencia / comprobante")
    bank_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Banco emisor (si aplica)")
    received_by = models.CharField(max_length=100, blank=True, null=True, verbose_name="Recibido por")
    received_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, verbose_name="Fecha de registro")

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

        if self.method == 'cash':
            # Para efectivo no se exige referencia ni banco
            pass

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
