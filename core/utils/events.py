from core.models import Event
def log_event(
    entity: str, 
    entity_id: int, 
    action: str, 
    actor: str = "", 
    metadata: dict | None = None,
    notify: bool = False
):
    """
    Registra un evento de auditoría en la base de datos.
    
    Args:
        entity (str): Nombre de la entidad (ej. "Patient", "Appointment", "Payment").
        entity_id (int): ID del objeto relacionado.
        action (str): Acción realizada (ej. "create", "update", "delete").
        actor (str): Usuario o sistema que ejecuta la acción.
        metadata (dict): Información adicional opcional.
        notify (bool): Si True, el evento se muestra como notificación.
    """
    Event.objects.create(
        entity=entity,
        entity_id=entity_id,
        action=action,
        actor_name=actor,
        metadata=metadata or {},
        notify=notify
    )