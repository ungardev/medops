from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from simple_history.signals import pre_create_historical_record
from .models import Appointment, Payment, Patient, WaitingRoomEntry
from core.utils.events import log_event
import logging
logger = logging.getLogger("audit")
# --- Appointment ---
@receiver(post_save, sender=Appointment)
def appointment_created_or_updated(sender, instance, created, **kwargs):
    if created:
        # ✅ AGREGAR notify=True para notificaciones
        log_event(
            "Appointment", 
            instance.id, 
            "create", 
            actor="system",
            notify=True
        )
        logger.info(f"Appointment {instance.id} created")
        if instance.status == "pending" and instance.appointment_date == timezone.localdate():
            WaitingRoomEntry.objects.get_or_create(
                appointment=instance,
                patient=instance.patient,
                defaults={
                    "status": "pending",
                    "priority": "scheduled",
                }
            )
            logger.info(f"WaitingRoomEntry creado automáticamente (pending/scheduled) para Appointment {instance.id}")
    else:
        # ✅ AGREGAR notify=True para notificaciones
        log_event(
            "Appointment", 
            instance.id, 
            "update", 
            actor="system",
            notify=True
        )
        logger.info(f"Appointment {instance.id} updated")
        if instance.status == "arrived":
            try:
                entry = WaitingRoomEntry.objects.filter(appointment_id=instance.id).first()
                if entry:
                    entry.status = "waiting"
                    entry.priority = "scheduled"
                    entry.arrival_time = timezone.now()
                    entry.save(update_fields=["status", "priority", "arrival_time"])
                    logger.info(f"WaitingRoomEntry actualizado a 'waiting/scheduled' para Appointment {instance.id}")
                else:
                    WaitingRoomEntry.objects.create(
                        appointment=instance,
                        patient=instance.patient,
                        status="waiting",
                        priority="scheduled",
                        arrival_time=timezone.now()
                    )
                    logger.info(f"WaitingRoomEntry creado automáticamente (waiting/scheduled) para Appointment {instance.id}")
            except Exception as e:
                logger.error(f"Error sincronizando WaitingRoomEntry para Appointment {instance.id}: {e}")
@receiver(post_delete, sender=Appointment)
def appointment_deleted(sender, instance, **kwargs):
    log_event("Appointment", instance.id, "delete", actor="system", notify=True)
    logger.info(f"Appointment {instance.id} deleted")
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
        # ✅ AGREGAR notify=True para notificaciones
        log_event(
            "Payment", 
            instance.id, 
            "create", 
            actor="system",
            metadata={"amount": amount_value},
            notify=True
        )
        logger.info(f"Payment {instance.id} created")
    else:
        log_event(
            "Payment", 
            instance.id, 
            "update", 
            actor="system",
            metadata={"amount": amount_value},
            notify=True
        )
        logger.info(f"Payment {instance.id} updated")
@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    amount_value = float(instance.amount) if instance.amount is not None else None
    log_event(
        "Payment", 
        instance.id, 
        "delete", 
        actor="system",
        metadata={"amount": amount_value},
        notify=True
    )
    logger.info(f"Payment {instance.id} deleted")
# --- Patient ---
@receiver(post_save, sender=Patient)
def patient_created_or_updated(sender, instance, created, **kwargs):
    if created:
        # ✅ AGREGAR notify=True para notificaciones
        log_event("Patient", instance.id, "create", actor="system", notify=True)
        logger.info(f"Patient {instance.id} created")
    else:
        log_event("Patient", instance.id, "update", actor="system", notify=True)
        logger.info(f"Patient {instance.id} updated")
@receiver(post_delete, sender=Patient)
def patient_deleted(sender, instance, **kwargs):
    log_event("Patient", instance.id, "delete", actor="system", notify=True)
    logger.info(f"Patient {instance.id} deleted")
# --- Patient: sincronizar predisposiciones genéticas en histórico ---
@receiver(pre_create_historical_record, sender=Patient)
def update_genetic_predispositions(sender, **kwargs):
    history_instance = kwargs['history_instance']
    instance = kwargs['instance']
    try:
        predispositions = list(instance.genetic_predispositions.values_list("name", flat=True))
        history_instance.genetic_predispositions = ", ".join(predispositions)
    except Exception as e:
        logger.error(f"Error guardando predisposiciones genéticas en histórico para Patient {instance.id}: {e}")