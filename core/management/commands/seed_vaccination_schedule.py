from django.core.management.base import BaseCommand
from core.models import Vaccine, VaccinationSchedule

VENEZUELA = "Venezuela"

VACCINES = [
    # Recién nacido
    ("BCG", "Vacuna contra la tuberculosis", 0, 1),
    ("HB", "Hepatitis B", 0, 1),

    # 2 meses
    ("PENTA", "Pentavalente (DTP-HB-Hib)", 2, 1),
    ("POLIO", "Polio (IPV/OPV)", 2, 1),
    ("ROTA", "Rotavirus", 2, 1),
    ("NEUMO", "Neumococo conjugada", 2, 1),

    # 4 meses
    ("PENTA", "Pentavalente (DTP-HB-Hib)", 4, 2),
    ("POLIO", "Polio (IPV/OPV)", 4, 2),
    ("ROTA", "Rotavirus", 4, 2),
    ("NEUMO", "Neumococo conjugada", 4, 2),

    # 6 meses
    ("PENTA", "Pentavalente (DTP-HB-Hib)", 6, 3),
    ("POLIO", "Polio (IPV/OPV)", 6, 3),

    # 12 meses
    ("SRP", "Sarampión, Rubéola, Parotiditis", 12, 1),
    ("NEUMO", "Neumococo conjugada", 12, 3),

    # 18 meses
    ("DTP", "Difteria, Tétanos, Tosferina", 18, 1),
    ("POLIO", "Polio (IPV/OPV)", 18, 4),
    ("SRP", "Sarampión, Rubéola, Parotiditis", 18, 2),

    # 5 años
    ("DTP", "Difteria, Tétanos, Tosferina", 60, 2),
    ("POLIO", "Polio (IPV/OPV)", 60, 5),

    # Adolescentes
    ("VPH", "Virus del Papiloma Humano", 132, 1),  # 11 años
    ("VPH", "Virus del Papiloma Humano", 144, 2),  # 12 años

    # Adultos
    ("FA", "Fiebre Amarilla", 216, 1),  # 18 años
    ("HB", "Hepatitis B", 216, 2),
    ("HB", "Hepatitis B", 217, 3),
    ("INFLUENZA", "Influenza anual", 216, 1),
]


class Command(BaseCommand):
    help = "Seed del esquema de vacunación de Venezuela"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Iniciando seed del esquema de vacunación de Venezuela..."))

        for code, description, age_months, dose in VACCINES:
            vaccine, created = Vaccine.objects.get_or_create(
                code=code,
                defaults={
                    "name": description,
                    "description": description,
                    "country": VENEZUELA,
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"✔ Creada vacuna: {code}"))

            schedule, created_schedule = VaccinationSchedule.objects.get_or_create(
                vaccine=vaccine,
                recommended_age_months=age_months,
                dose_number=dose,
                country=VENEZUELA,
            )

            if created_schedule:
                self.stdout.write(self.style.SUCCESS(
                    f"  → Añadida dosis {dose} ({age_months} meses) para {code}"
                ))

        self.stdout.write(self.style.SUCCESS("Seed completado exitosamente."))