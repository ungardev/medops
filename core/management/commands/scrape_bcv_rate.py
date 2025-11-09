from django.core.management.base import BaseCommand
from core.models import BCVRateCache
from core.api_views import get_bcv_rate   # ✅ corregido: importar desde api_views
from datetime import date

class Command(BaseCommand):
    help = "Scrapea la tasa BCV y la guarda en cache diario"

    def handle(self, *args, **kwargs):
        rate = get_bcv_rate()
        BCVRateCache.objects.update_or_create(
            date=date.today(),
            defaults={"value": rate}
        )
        self.stdout.write(self.style.SUCCESS(f"Tasa BCV {rate} guardada"))
