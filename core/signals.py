from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Appointment, Payment, Event


@receiver(pre_save, sender=Appointment)
def log_appointment_changes(sender, instance, **kwargs):
    """
    Registra en Event cualquier cambio de estado en Appointment.
    """
    if instance.pk:  # Solo si ya existe (update, no create)
        try:
            old = Appointment.objects.get(pk=instance.pk)
        except Appointment.DoesNotExist:
            return

        if old.status != instance.status:
            Event.objects.create(
                entity="Appointment",
                entity_id=instance.pk,
                action=f"Status changed {old.status} → {instance.status}",
                metadata={"old": old.status, "new": instance.status}
            )


@receiver(pre_save, sender=Payment)
def log_payment_changes(sender, instance, **kwargs):
    """
    Registra en Event cualquier cambio de estado o método en Payment.
    """
    if instance.pk:
        try:
            old = Payment.objects.get(pk=instance.pk)
        except Payment.DoesNotExist:
            return

        if old.status != instance.status:
            Event.objects.create(
                entity="Payment",
                entity_id=instance.pk,
                action=f"Status changed {old.status} → {instance.status}",
                metadata={"old": old.status, "new": instance.status}
            )

        if old.method != instance.method:
            Event.objects.create(
                entity="Payment",
                entity_id=instance.pk,
                action=f"Method changed {old.method} → {instance.method}",
                metadata={"old": old.method, "new": instance.method}
            )
