# core/management/commands/load_svpp_schedule.py
from django.core.management.base import BaseCommand
from core.models import Vaccine, VaccinationSchedule

class Command(BaseCommand):
    help = "Carga el esquema SVPP completo para Venezuela"

    def handle(self, *args, **options):
        self.stdout.write("⚡ Eliminando esquema previo de Venezuela...")
        VaccinationSchedule.objects.filter(country="Venezuela").delete()

        # Catálogo maestro de vacunas (22 códigos oficiales)
        vaccine_defs = {
            "BCG": "Anti tuberculosis",
            "HB": "Anti Hepatitis B",
            "POLIO": "Anti poliomielitis (VPI, bVPO)",
            "DTP": "Anti Difteria, Tétanos y Pertussis",
            "HIB": "Anti Haemophilus influenzae tipo b",
            "ROTAV": "Anti rotavirus (RV1, RV5)",
            "NEUMO": "Anti Neumococo 10–20V",
            "INFLUENZA": "Anti influenza",
            "SRP": "Anti Sarampión, Rubéola y Parotiditis",
            "FA": "Anti Fiebre amarilla",
            "HA": "Anti Hepatitis A",
            "VAR": "Anti Varicela",
            "MENACWY": "Anti Meningococo A,C,Y,W-135",
            "MENB": "Men B",
            "NEUMO23": "Anti Neumococo 23V",
            "VPH": "VPH",
            "COVID": "Anti-COVID-19",
            "VSR": "Virus Sincitial Respiratorio",
            "DENGUE": "Dengue (no aprobado aún en Venezuela)",
        }

        # Crear vacunas base si no existen
        for code, name in vaccine_defs.items():
            Vaccine.objects.get_or_create(
                code=code,
                defaults={"name": name, "country": "Venezuela"}
            )

        # Esquema SVPP completo (ejemplo con edades en meses)
        svpp_data = [
            {"code": "BCG", "months": [0], "doses": [1]},
            {"code": "HB", "months": [0], "doses": [1]},
            {"code": "POLIO", "months": [2, 4, 6], "doses": [1, 2, 3]},
            {"code": "DTP", "months": [2, 4, 6], "doses": [1, 2, 3]},
            {"code": "HIB", "months": [2, 4, 6], "doses": [1, 2, 3]},
            {"code": "ROTAV", "months": [2, 4], "doses": [1, 2]},
            {"code": "NEUMO", "months": [2, 4, 12], "doses": [1, 2, 3]},
            {"code": "INFLUENZA", "months": [6, 12], "doses": [1, 2]},
            {"code": "SRP", "months": [12, 18], "doses": [1, 2]},
            {"code": "FA", "months": [12], "doses": [1]},
            {"code": "HA", "months": [12, 18], "doses": [1, 2]},
            {"code": "VAR", "months": [12, 18], "doses": [1, 2]},
            {"code": "MENACWY", "months": [12], "doses": [1]},
            {"code": "MENB", "months": [12], "doses": [1]},
            {"code": "NEUMO23", "months": [720], "doses": [1]},  # adultos mayores
            {"code": "VPH", "months": [132], "doses": [1]},      # adolescentes
            {"code": "COVID", "months": [12], "doses": [1]},     # esquema inicial
            {"code": "VSR", "months": [6], "doses": [1]},
            {"code": "DENGUE", "months": [120], "doses": [1]},   # aún no aprobado
        ]

        # Crear esquema
        for entry in svpp_data:
            vaccine = Vaccine.objects.get(code=entry["code"])
            for m, d in zip(entry["months"], entry["doses"]):
                VaccinationSchedule.objects.create(
                    vaccine=vaccine,
                    recommended_age_months=m,
                    dose_number=d,
                    country="Venezuela"
                )

        self.stdout.write(self.style.SUCCESS("✅ Esquema SVPP cargado exitosamente"))
