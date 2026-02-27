from django.core.management.base import BaseCommand
from django.utils.timezone import localdate
from decimal import Decimal
from core.models import BCVRateCache
from core.services import get_bcv_rate, get_bcv_rate_logic
import logging

audit = logging.getLogger("audit")

class Command(BaseCommand):
    help = "Scrapea la tasa BCV desde el sitio oficial y la guarda en BCVRateCache"

    def handle(self, *args, **kwargs):
        today = localdate()
        try:
            rate_data = get_bcv_rate_logic()
            rate = Decimal(str(rate_data["value"]))
            
            if not isinstance(rate, Decimal) or rate <= 0:
                raise ValueError("Tasa inválida")

            BCVRateCache.objects.update_or_create(
                date=today,
                defaults={"value": rate}
            )
            audit.info(f"BCV: tasa guardada {rate} Bs/USD en BCVRateCache")
            self.stdout.write(self.style.SUCCESS(f"Tasa BCV guardada: {rate} Bs/USD"))

        except Exception as e:
            audit.error(f"BCV: error al guardar tasa → {e}")
            self.stderr.write(self.style.ERROR(f"Error al guardar tasa BCV: {e}"))
