from django.core.management.base import BaseCommand
from core.models import Vaccine, VaccinationSchedule

class Command(BaseCommand):
    help = "Carga el esquema SVPP completo para Venezuela"

    def handle(self, *args, **options):
        self.stdout.write("⚡ Eliminando esquema previo de Venezuela...")
        VaccinationSchedule.objects.filter(country="Venezuela").delete()

        svpp_data = [
            {"code": "BCG", "months": [0], "doses": [1]},
            {"code": "HB", "months": [0], "doses": [1]},
            {"code": "POLIO", "months": [2, 4, 6], "doses": [1, 2, 3]},
            {"code": "DTP", "months": [2, 4, 6], "doses": [1, 2, 3]},
            # ... completa las 22 vacunas
        ]

        for entry in svpp_data:
            vaccine = Vaccine.objects.get(code=entry["code"])
            for m, d in zip(entry["months"], entry["doses"]):
                VaccinationSchedule.objects.create(
                    vaccine=vaccine,
                    vaccine_detail=vaccine,
                    recommended_age_months=m,
                    dose_number=d,
                    country="Venezuela"
                )

        self.stdout.write(self.style.SUCCESS("✅ Esquema SVPP cargado exitosamente"))
