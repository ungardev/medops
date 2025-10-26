from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Appointment, Payment, Patient, WaitingRoomEntry
from core.utils.events import log_event
import logging

logger = logging.getLogger("audit")

# --- Appointment ---
@receiver(post_save, sender=Appointment)
def appointment_created_or_updated(sender, instance, created, **kwargs):
    if created:
        log_event("Appointment", instance.id, "create", actor="system")
        logger.info(f"Appointment {instance.id} created")

        # --- Nueva lógica: si es para hoy y está pendiente, crear entrada en Grupo B ---
        if instance.status == "pending" and instance.appointment_date == timezone.localdate():
            WaitingRoomEntry.objects.get_or_create(
                appointment=instance,
                patient=instance.patient,
                defaults={
                    "status": "pending",      # 👈 ahora pending
                    "priority": "scheduled",  # 👈 ahora scheduled
                }
            )
            logger.info(f"WaitingRoomEntry creado automáticamente para Appointment {instance.id}")

    else:
        log_event("Appointment", instance.id, "update", actor="system")
        logger.info(f"Appointment {instance.id} updated")

        # --- Nueva lógica: si pasa a arrived y no tiene entrada, crearla en Grupo A ---
        if instance.status == "arrived" and instance.appointment_date == timezone.localdate():
            if not WaitingRoomEntry.objects.filter(appointment=instance).exists():
                WaitingRoomEntry.objects.create(
                    appointment=instance,
                    patient=instance.patient,
                    status="arrived",
                    priority=instance.appointment_type or "scheduled",
                    arrival_time=timezone.now()
                )
                logger.info(f"WaitingRoomEntry creado automáticamente (arrived) para Appointment {instance.id}")


@receiver(post_delete, sender=Appointment)
def appointment_deleted(sender, instance, **kwargs):
    log_event("Appointment", instance.id, "delete", actor="system")
    logger.info(f"Appointment {instance.id} deleted")

    # --- Nueva lógica: borrar también la entrada en Sala de Espera asociada ---
    try:
        WaitingRoomEntry.objects.filter(appointment=instance).delete()
        logger.info(f"WaitingRoomEntry eliminado junto con Appointment {instance.id}")
    except Exception as e:
        logger.warning(f"No se pudo eliminar WaitingRoomEntry de Appointment {instance.id}: {e}")


# --- Payment ---
@receiver(post_save, sender=Payment)
def payment_created_or_updated(sender, instance, created, **kwargs):
    amount_value = float(instance.amount) if instance.amount is not None else None
    if created:
        log_event("Payment", instance.id, "create", actor="system", metadata={"amount": amount_value})
        logger.info(f"Payment {instance.id} created")
    else:
        log_event("Payment", instance.id, "update", actor="system", metadata={"amount": amount_value})
        logger.info(f"Payment {instance.id} updated")


@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    amount_value = float(instance.amount) if instance.amount is not None else None
    log_event("Payment", instance.id, "delete", actor="system", metadata={"amount": amount_value})
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
