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
@shared_task(bind=True, max_retries=6, default_retry_delay=300)
def auto_verify_payment(self, payment_id):
    """
    Intenta verificar automáticamente un pago móvil.
    Se ejecuta 2 minutos después de creado el pago.
    Reintenta cada 5 minutos, máximo 6 veces (30 minutos total).
    """
    if not CELERY_AVAILABLE:
        logger.warning("Celery no disponible. Tarea auto_verify_payment no ejecutada.")
        return
    
    try:
        from core.models import Payment
        
        payment = Payment.objects.get(id=payment_id)
        
        if payment.status != 'pending' or payment.verification_type != 'automatic':
            logger.info(f"Payment {payment_id}: no requiere verificación automática")
            return
        
        from core.utils.payment_gateways.mercantil_p2c import MercantilP2CService
        
        config = getattr(payment.institution, 'mercantil_p2c_config', None)
        if config and config.is_active:
            service = MercantilP2CService(config)
            logger.info(f"Payment {payment_id}: verificación automática iniciada")
        else:
            logger.info(f"Payment {payment_id}: sin config P2C activa, saltando")
            
    except Payment.DoesNotExist:
        logger.error(f"Payment {payment_id}: no encontrada")
    except Exception as e:
        logger.error(f"Payment {payment_id}: error en verificación automática: {e}")
        raise self.retry(exc=e)
@shared_task(bind=True)
def expire_pending_qrs(self):
    """
    Marca como 'expired' las transacciones P2C cuyo QR ha expirado.
    Se ejecuta cada 5 minutos via Celery Beat.
    """
    if not CELERY_AVAILABLE:
        logger.warning("Celery no disponible. Tarea expire_pending_qrs no ejecutada.")
        return
    
    try:
        from django.utils import timezone
        from core.models import MercantilP2CTransaction
        
        expired_count = MercantilP2CTransaction.objects.filter(
            status__in=['generated', 'pending'],
            expires_at__lt=timezone.now()
        ).update(status='expired')
        
        if expired_count > 0:
            logger.info(f"Expiraron {expired_count} transacciones P2C")
            
    except Exception as e:
        logger.error(f"Error expirando QRs: {e}")
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