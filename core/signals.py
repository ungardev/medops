from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import Appointment, Payment, Patient
from core.utils.events import log_event
import logging

logger = logging.getLogger("audit")

# --- Appointment ---
@receiver(post_save, sender=Appointment)
def appointment_created_or_updated(sender, instance, created, **kwargs):
    if created:
        log_event("Appointment", instance.id, "create", actor="system")
        logger.info(f"Appointment {instance.id} created")
    else:
        log_event("Appointment", instance.id, "update", actor="system")
        logger.info(f"Appointment {instance.id} updated")

@receiver(post_delete, sender=Appointment)
def appointment_deleted(sender, instance, **kwargs):
    log_event("Appointment", instance.id, "delete", actor="system")
    logger.info(f"Appointment {instance.id} deleted")


# --- Payment ---
@receiver(post_save, sender=Payment)
def payment_created_or_updated(sender, instance, created, **kwargs):
    if created:
        log_event("Payment", instance.id, "create", actor="system", metadata={"amount": instance.amount})
        logger.info(f"Payment {instance.id} created")
    else:
        log_event("Payment", instance.id, "update", actor="system", metadata={"amount": instance.amount})
        logger.info(f"Payment {instance.id} updated")

@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    log_event("Payment", instance.id, "delete", actor="system", metadata={"amount": instance.amount})
    logger.info(f"Payment {instance.id} deleted")


# --- Patient ---
@receiver(post_save, sender=Patient)
def patient_created_or_updated(sender, instance, created, **kwargs):
    if created:
        log_event("Patient", instance.id, "create", actor="system")
        logger.info(f"Patient {instance.id} created")
    else:
        log_event("Patient", instance.id, "update", actor="system")
        logger.info(f"Patient {instance.id} updated")

@receiver(post_delete, sender=Patient)
def patient_deleted(sender, instance, **kwargs):
    log_event("Patient", instance.id, "delete", actor="system")
    logger.info(f"Patient {instance.id} deleted")
