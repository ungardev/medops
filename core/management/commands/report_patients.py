from django.core.management.base import BaseCommand
from core.models import Patient
from tabulate import tabulate

class Command(BaseCommand):
    help = "Genera un reporte tabular de pacientes con su jerarquía completa"

    def handle(self, *args, **kwargs):
        patients = Patient.objects.select_related(
            "neighborhood__parish__municipality__state__country"
        )
        table = []
        for p in patients:
            barrio = p.neighborhood.name if p.neighborhood else "SIN-BARRIO"
            parroquia = p.neighborhood.parish.name if p.neighborhood and p.neighborhood.parish else "SIN-PARROQUIA"
            municipio = p.neighborhood.parish.municipality.name if p.neighborhood and p.neighborhood.parish and p.neighborhood.parish.municipality else "SIN-MUNICIPIO"
            estado = p.neighborhood.parish.municipality.state.name if p.neighborhood and p.neighborhood.parish and p.neighborhood.parish.municipality and p.neighborhood.parish.municipality.state else "SIN-ESTADO"
            pais = p.neighborhood.parish.municipality.state.country.name if p.neighborhood and p.neighborhood.parish and p.neighborhood.parish.municipality and p.neighborhood.parish.municipality.state and p.neighborhood.parish.municipality.state.country else "SIN-PAÍS"
            table.append([p.first_name, p.last_name, p.national_id, barrio, parroquia, municipio, estado, pais])

        self.stdout.write(tabulate(table, headers=["Nombre", "Apellido", "CI", "Barrio", "Parroquia", "Municipio", "Estado", "País"]))
