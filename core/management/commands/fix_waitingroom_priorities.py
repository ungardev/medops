from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import WaitingRoomEntry

class Command(BaseCommand):
    help = "Normaliza prioridades inválidas en WaitingRoomEntry (ej. 'general') a 'scheduled'"

    def handle(self, *args, **options):
        today = timezone.localdate()
        qs = WaitingRoomEntry.objects.filter(priority="general")
        count = qs.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No se encontraron entradas con priority='general'"))
            return

        qs.update(priority="scheduled")
        self.stdout.write(self.style.SUCCESS(
            f"Se normalizaron {count} entradas con priority='general' a 'scheduled'."
        ))
