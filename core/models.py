from django.db import models, transaction
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords, HistoricalChanges
from django.db.models import Sum
from decimal import Decimal
from django.utils import timezone
from django.conf import settings

# Create your models here.
class GeneticPredisposition(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Genetic Predisposition"
        verbose_name_plural = "Genetic Predispositions"

    def __str__(self):
        return self.name


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('Unknown', 'Unknown'),
    ]

    BLOOD_TYPES = [
        ("A+", "A+"), ("A-", "A-"),
        ("B+", "B+"), ("B-", "B-"),
        ("AB+", "AB+"), ("AB-", "AB-"),
        ("O+", "O+"), ("O-", "O-"),
    ]

    national_id = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="Cédula de Identidad",
        null=True,
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

    # 👇 Email ahora opcional
    email = models.EmailField(
        max_length=255,
        verbose_name="Correo electrónico",
        blank=True,
        null=True
    )

    # 👇 Dirección opcional
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Dirección"
    )

    # 🔹 Datos clínicos básicos
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # kg
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # cm
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPES, null=True, blank=True)
    allergies = models.TextField(blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)

    # 🔹 Predisposiciones genéticas
    genetic_predispositions = models.ManyToManyField(
        "GeneticPredisposition",
        blank=True,
        related_name="patients"
    )

    # Historial
    history = HistoricalRecords()

    # Campos operativos
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    active = models.BooleanField(default=True)

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
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
    notes = models.TextField(blank=True, null=True)

    history = HistoricalRecords()

    class Meta:
        verbose_name = "Appointment"
        verbose_name_plural = "Appointments"

    def __str__(self):
        return f"{self.patient} - {self.appointment_date} - {self.status}"

    # --- Finanzas ---
    def total_paid(self):
        agg = self.payments.filter(status='confirmed').aggregate(total=Sum('amount'))
        return agg.get('total') or Decimal('0.00')

    def balance_due(self):
        orders = self.charge_orders.exclude(status='void')
        if orders.exists():
            agg = orders.aggregate(b=Sum('balance_due'))
            return agg.get('b') or Decimal('0.00')
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

    def mark_arrived(self, priority: str = "normal", source_type: str = "scheduled"):
        if self.status == "pending":
            self.status = "arrived"
            self.arrival_time = timezone.now().time()
            self.save(update_fields=["status", "arrival_time"])
            WaitingRoomEntry.objects.get_or_create(
                appointment=self,
                patient=self.patient,
                defaults={
                    "arrival_time": timezone.now(),
                    "status": "waiting",
                    "priority": priority,
                    "source_type": source_type,
                }
            )

    def mark_completed(self):
        self.status = 'completed'
        self.save(update_fields=['status'])


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
        ("emergency", "Emergency"),
    ]

    SOURCE_CHOICES = [
        ("scheduled", "Scheduled"),
        ("walkin", "Walk-in"),
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
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="normal")
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="scheduled")
    order = models.PositiveIntegerField(default=0)

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        # 🔹 Emergencias primero, luego todos los demás por llegada
        ordering = [
            models.Case(
                models.When(priority="emergency", then=0),
                default=1,
                output_field=models.IntegerField(),
            ),
            "arrival_time",
            "order",
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

    # --- Ubicación en la cola ---
    def place_in_queue(self):
        """
        Coloca la entrada en la cola según prioridad y llegada.
        - Emergencias se agrupan arriba.
        - Normales se ordenan por arrival_time.
        """
        if self.priority == "emergency":
            last = WaitingRoomEntry.objects.filter(priority="emergency").order_by("-order").first()
        else:
            last = WaitingRoomEntry.objects.filter(priority="normal").order_by("-order").first()

        self.order = (last.order + 1) if last else 1
        self.save(update_fields=["order"])


class Diagnosis(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='diagnoses')
    icd_code = models.CharField(max_length=20)  # Ejemplo: "CA23.0"
    title = models.CharField(max_length=255)    # Ejemplo: "Asma"
    foundation_id = models.CharField(max_length=100, blank=True, null=True)  # ID único ICD-11
    description = models.TextField(blank=True, null=True)  # notas adicionales del médico

    class Meta:
        verbose_name = "Diagnosis"
        verbose_name_plural = "Diagnoses"

    def __str__(self):
        return f"{self.icd_code} - {self.title}"

    def clean(self):
        """
        Blindaje institucional:
        valida que el código ICD-11 exista en el catálogo local ICD11Entry.
        """
        from .models import ICD11Entry
        if self.icd_code and not ICD11Entry.objects.filter(icd_code=self.icd_code).exists():
            raise ValidationError({"icd_code": "ICD-11 code no reconocido por el catálogo institucional."})


class Treatment(models.Model):
    TREATMENT_TYPE_CHOICES = [
        ("pharmacological", "Farmacológico"),
        ("surgical", "Quirúrgico"),
        ("rehabilitation", "Rehabilitación"),
        ("lifestyle", "Cambio de estilo de vida"),
        ("other", "Otro"),
    ]

    STATUS_CHOICES = [
        ("active", "Activo"),
        ("completed", "Completado"),
        ("cancelled", "Cancelado"),
    ]

    diagnosis = models.ForeignKey("Diagnosis", on_delete=models.CASCADE, related_name="treatments")
    treatment_type = models.CharField(max_length=30, choices=TREATMENT_TYPE_CHOICES, default="pharmacological")
    plan = models.TextField()
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    class Meta:
        verbose_name = "Treatment"
        verbose_name_plural = "Treatments"

    def __str__(self):
        return f"{self.get_treatment_type_display()} — {self.diagnosis.icd_code}"


class Prescription(models.Model):
    ROUTE_CHOICES = [
        ("oral", "Oral"),
        ("iv", "Intravenosa"),
        ("im", "Intramuscular"),
        ("topical", "Tópica"),
        ("other", "Otro"),
    ]

    FREQUENCY_CHOICES = [
        ("daily", "Diaria"),
        ("bid", "Dos veces al día"),
        ("tid", "Tres veces al día"),
        ("qhs", "Antes de dormir"),
        ("prn", "Según necesidad"),
    ]

    UNIT_CHOICES = [
        ("mg", "Miligramos"),
        ("ml", "Mililitros"),
        ("tablet", "Tableta"),
        ("capsule", "Cápsula"),
        ("drop", "Gotas"),
    ]

    diagnosis = models.ForeignKey("Diagnosis", on_delete=models.CASCADE, related_name="prescriptions")
    medication = models.CharField(max_length=200)
    dosage = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default="mg")
    route = models.CharField(max_length=20, choices=ROUTE_CHOICES, default="oral")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default="daily")
    duration = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        verbose_name = "Prescription"
        verbose_name_plural = "Prescriptions"

    def __str__(self):
        return f"{self.medication} {self.dosage}{self.unit} — {self.get_frequency_display()}"


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmado'),
        ('rejected', 'Rechazado'),
        ('void', 'Anulado'),
    ]
    METHOD_CHOICES = [
        ('cash', 'Efectivo'),
        ('card', 'Tarjeta'),
        ('transfer', 'Transferencia'),
        ('other', 'Otro'),
    ]

    appointment = models.ForeignKey('Appointment', on_delete=models.CASCADE, related_name="payments")
    charge_order = models.ForeignKey('ChargeOrder', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reference_number = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Número de referencia / comprobante"
    )
    bank_name = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Banco emisor (si aplica)"
    )
    received_by = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Recibido por"
    )
    received_at = models.DateTimeField(
        auto_now_add=True, null=True, blank=True,
        verbose_name="Fecha de registro"
    )
    idempotency_key = models.CharField(
        max_length=200, blank=True, null=True, unique=True
    )

    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['appointment', 'charge_order', 'status']),
            models.Index(fields=['reference_number', 'method']),
        ]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"Appt {self.appointment_id} Order {self.charge_order_id} ${self.amount} {self.method} {self.status}"

    # --- Validaciones de negocio ---
    def clean(self):
        errors = {}
        if self.amount is None or self.amount <= Decimal('0.00'):
            errors['amount'] = "El monto debe ser mayor a 0."
        if self.charge_order and self.charge_order.status == 'void':
            errors['charge_order'] = "No se puede pagar una orden anulada."

        if self.method == 'transfer':
            if not self.reference_number:
                errors['reference_number'] = "Debe ingresar el número de transferencia."
            if not self.bank_name:
                errors['bank_name'] = "Debe especificar el banco emisor."
        if self.method == 'card' and not self.reference_number:
            errors['reference_number'] = "Debe ingresar el número de comprobante de la tarjeta."

        if errors:
            raise ValidationError(errors)

    # --- Confirmación blindada ---
    def confirm(self, actor: str = '', note: str = ''):
        with transaction.atomic():
            # Validar contra saldo pendiente
            self.charge_order.recalc_totals()
            if self.amount > self.charge_order.balance_due:
                raise ValidationError("El monto excede el saldo pendiente de la orden.")

            # Marcar como confirmado
            self.status = 'confirmed'
            self.save(update_fields=['status'])

            # 🔹 Recalcular totales y estado de la orden
            self.charge_order.recalc_totals()
            self.charge_order.save(update_fields=['total', 'balance_due', 'status'])

            # Evento de auditoría con severidad y notificación
            Event.objects.create(
                entity='Payment',
                entity_id=self.pk,
                action='confirm',
                metadata={'actor': actor, 'note': note},
                severity="info",     # evento informativo
                notify=True          # visible en notificaciones
            )

    # --- Rechazo blindado ---
    def reject(self, actor: str = '', reason: str = ''):
        with transaction.atomic():
            # Marcar como rechazado
            self.status = 'rejected'
            self.save(update_fields=['status'])

            # 🔹 Recalcular totales y estado de la orden
            self.charge_order.recalc_totals()
            self.charge_order.save(update_fields=['total', 'balance_due', 'status'])

            # Evento de auditoría con severidad y notificación
            Event.objects.create(
                entity='Payment',
                entity_id=self.pk,
                action='reject',
                metadata={'actor': actor, 'reason': reason},
                severity="warning",  # evento de advertencia
                notify=True          # visible en notificaciones
            )


class Event(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    actor = models.CharField(max_length=100, blank=True, null=True)
    entity = models.CharField(max_length=50)
    entity_id = models.IntegerField()
    action = models.CharField(max_length=100)
    metadata = models.JSONField(blank=True, null=True)
    # 🔹 Nuevo: severidad y flag de notificación
    severity = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="info | warning | critical"
    )
    notify = models.BooleanField(default=False)

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


class ChargeOrder(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('void', 'Void'),
        ('waived', 'Waived'),  # 👈 nuevo estado para exoneraciones
    ]

    appointment = models.ForeignKey('Appointment', on_delete=models.CASCADE, related_name='charge_orders')
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE, related_name='charge_orders')
    currency = models.CharField(max_length=10, default='USD')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    issued_at = models.DateTimeField(auto_now_add=True)
    issued_by = models.CharField(max_length=100, blank=True, null=True)

    # 🔹 Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    created_by = models.CharField(max_length=100, blank=True, null=True)
    updated_by = models.CharField(max_length=100, blank=True, null=True)

    history = HistoricalRecords()

    class Meta:
        indexes = [
            models.Index(fields=['appointment', 'status']),
            models.Index(fields=['patient', 'status']),
        ]
        verbose_name = "Charge Order"
        verbose_name_plural = "Charge Orders"

    def __str__(self):
        return f"Order #{self.pk} for Appt {self.appointment_id} — {self.status}"

    def recalc_totals(self):
        """
        Recalcula total, balance_due y status de la orden
        en base a sus ítems y pagos confirmados.
        """
        items_sum = self.items.aggregate(s=Sum('subtotal')).get('s') or Decimal('0.00')
        self.total = items_sum

        confirmed = self.payments.filter(status='confirmed').aggregate(s=Sum('amount')).get('s') or Decimal('0.00')
        self.balance_due = max(self.total - confirmed, Decimal('0.00'))

        # 🔹 No tocar si está anulada o exonerada
        if self.status in ['void', 'waived']:
            return

        # 🔹 Actualizar estado
        if self.balance_due <= 0 and self.total > 0:
            self.status = 'paid'
        elif confirmed > 0:
            self.status = 'partially_paid'
        else:
            self.status = 'open'

    def clean(self):
        if self.status == 'paid' and self.balance_due != Decimal('0.00'):
            raise ValidationError("Una orden 'paid' debe tener balance_due = 0.")
        if self.status == 'waived' and self.balance_due != Decimal('0.00'):
            raise ValidationError("Una orden 'waived' debe tener balance_due = 0.")

    def mark_void(self, reason: str = '', actor: str = ''):
        """
        Marca la orden como anulada y registra un evento crítico con notificación.
        """
        if self.status == 'paid':
            raise ValidationError("No se puede anular una orden ya pagada.")
        self.status = 'void'
        self.save(update_fields=['status'])

        Event.objects.create(
            entity='ChargeOrder',
            entity_id=self.pk,
            action='void',
            metadata={'actor': actor, 'reason': reason},
            severity="critical",   # 👈 severidad alta
            notify=True            # 👈 notificación visible en Dashboard
        )

    def mark_waived(self, reason: str = '', actor: str = ''):
        """
        Marca la orden como exonerada (waived) y registra un evento informativo con notificación.
        """
        if self.status in ['paid', 'void']:
            raise ValidationError("No se puede exonerar una orden ya pagada o anulada.")
        self.status = 'waived'
        self.balance_due = Decimal('0.00')
        self.save(update_fields=['status', 'balance_due'])

        Event.objects.create(
            entity='ChargeOrder',
            entity_id=self.pk,
            action='waived',
            metadata={'actor': actor, 'reason': reason},
            severity="info",       # 👈 evento informativo
            notify=True            # 👈 notificación visible en Dashboard
        )


class ChargeItem(models.Model):
    order = models.ForeignKey('ChargeOrder', on_delete=models.CASCADE, related_name='items')
    code = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    qty = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1.00'))
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    class Meta:
        verbose_name = "Charge Item"
        verbose_name_plural = "Charge Items"

    def __str__(self):
        return f"{self.code} x{self.qty} — {self.subtotal}"

    def save(self, *args, **kwargs):
        self.subtotal = (self.qty or Decimal('0')) * (self.unit_price or Decimal('0'))
        super().save(*args, **kwargs)
        self.order.recalc_totals()
        self.order.save(update_fields=['total', 'balance_due'])


class InstitutionSettings(models.Model):
    name = models.CharField(max_length=255)         # Nombre del centro médico
    address = models.CharField(max_length=255)      # Dirección institucional
    phone = models.CharField(max_length=50)         # Teléfono de contacto
    logo = models.ImageField(upload_to="logos/")    # Logo institucional
    tax_id = models.CharField(max_length=50)        # RIF / NIT / identificación fiscal

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "auth.User", on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        verbose_name = "Configuración Institucional"
        verbose_name_plural = "Configuraciones Institucionales"

    def __str__(self):
        return self.name


# src/core/models.py
class DoctorOperator(models.Model):
    full_name = models.CharField(max_length=255)
    colegiado_id = models.CharField(
        max_length=100,
        verbose_name="Número de colegiado / ID de ejercicio"
    )
    specialty = models.CharField(max_length=100, blank=True, null=True)
    license = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    signature = models.ImageField(upload_to="signatures/", blank=True, null=True)

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "auth.User", on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        verbose_name = "Médico operador"
        verbose_name_plural = "Médicos operadores"

    def __str__(self):
        return f"{self.full_name} — {self.colegiado_id}"


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
    icd_code = models.CharField(max_length=20, unique=True)          # Ej: "CA23.0"
    title = models.CharField(max_length=255)                         # Ej: "Asma"
    foundation_id = models.CharField(max_length=100, blank=True, null=True)  # ID foundation OMS
    definition = models.TextField(blank=True, null=True)             # Texto oficial OMS
    synonyms = models.JSONField(blank=True, null=True)               # Lista de sinónimos
    parent_code = models.CharField(max_length=20, blank=True, null=True)     # Jerarquía inmediata

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


class MedicalTest(models.Model):
    TEST_TYPE_CHOICES = [
        ("blood_test", "Análisis de sangre"),
        ("urine_test", "Análisis de orina"),
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

    appointment = models.ForeignKey(
        "Appointment",
        on_delete=models.CASCADE,
        related_name="medical_tests"
    )
    diagnosis = models.ForeignKey(
        "Diagnosis",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="medical_tests"
    )
    test_type = models.CharField(
        max_length=50,
        choices=TEST_TYPE_CHOICES
    )
    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        default="routine"   # ✅ blindaje institucional
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"   # ✅ blindaje institucional
    )
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Medical Test"
        verbose_name_plural = "Medical Tests"

    def __str__(self):
        return f"{self.get_test_type_display()} — {self.get_status_display()}"


class MedicalReferral(models.Model):
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
        ("pulmonology", "Pulmonary Disease (Enfermedad Pulmonar/Neumología)"),
        ("radiation_oncology", "Radiation Oncology (Oncología Radioterápica)"),
        ("rheumatology", "Rheumatology (Reumatología)"),
        ("urology", "Urology (Urología)"),
        ("vascular_surgery", "Vascular Surgery (Cirugía Vascular)"),
        ("other", "Other (Otro)"),
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

    appointment = models.ForeignKey("Appointment", on_delete=models.CASCADE, related_name="referrals")
    diagnosis = models.ForeignKey("Diagnosis", on_delete=models.SET_NULL, null=True, blank=True, related_name="referrals")
    specialty = models.CharField(
        max_length=50,
        choices=SPECIALTY_CHOICES,
        default="other"   # ✅ blindaje institucional
    )
    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, default="routine")
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        verbose_name = "Medical Referral"
        verbose_name_plural = "Medical Referrals"

    def __str__(self):
        return f"{self.get_specialty_display()} — {self.get_status_display()}"
