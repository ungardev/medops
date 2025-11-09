from django.core.management.base import BaseCommand
from core.models import BCVRateCache, Event
from datetime import date

class Command(BaseCommand):
    help = "Verifica que la tasa BCV del día esté cacheada y dispara evento si falta"

    def handle(self, *args, **kwargs):
        today = date.today()
        try:
            cache = BCVRateCache.objects.get(date=today)
            self.stdout.write(self.style.SUCCESS(f"✅ Tasa BCV encontrada: {cache.value} Bs/USD"))
        except BCVRateCache.DoesNotExist:
            Event.objects.create(
                entity="BCVRateCache",
                action="missing_rate",
                actor="system",
                severity="critical",
                notify=True,
                metadata={"date": today.isoformat()},
            )
            self.stdout.write(self.style.ERROR("❌ No se encontró tasa BCV para hoy"))
