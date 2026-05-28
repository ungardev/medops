# core/tasks.py
"""
Tareas asíncronas de MEDOPZ.
Preparado para Celery + Redis.
Las tareas están deshabilitadas hasta que se configure Celery en Docker.
"""

import logging

logger = logging.getLogger(__name__)
# Verificar si Celery está disponible
try:
    from celery import shared_task

    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False

    def shared_task(*args, **kwargs):
        def decorator(func):
            return func

        if len(args) == 1 and callable(args[0]):
            return args[0]
        return decorator


@shared_task(bind=True)
def scrape_bcv_rate(self):
    """
    Ejecuta el scraping de la tasa BCV en background.
    Se ejecuta diariamente a las 8:00 AM via Celery Beat.
    """
    if not CELERY_AVAILABLE:
        logger.warning("Celery no disponible. Tarea scrape_bcv_rate no ejecutada.")
        return

    try:
        from core.services import get_bcv_rate_logic

        rate = get_bcv_rate_logic()
        logger.info(f"Tasa BCV actualizada: {rate}")
    except Exception as e:
        logger.error(f"Error scraping BCV: {e}")
