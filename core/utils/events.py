from core.models import Event
def log_event(entity: str, entity_id: int, action: str, actor: str = "", metadata: dict | None = None):
    """
    Registra un evento de auditoría en la base de datos.
    
    Args:
        entity (str): Nombre de la entidad (ej. "Patient", "Appointment", "Payment").
        entity_id (int): ID del objeto relacionado.
        action (str): Acción realizada (ej. "create", "update", "delete").
        actor (str): Usuario o sistema que ejecuta la acción.
        metadata (dict): Información adicional opcional.
    """
    Event.objects.create(
        entity=entity,
        entity_id=entity_id,
        action=action,
        actor_name=actor,  # ✅ Corregido (era 'actor', ahora 'actor_name')
        metadata=metadata or {}
    )