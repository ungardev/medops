import csv
from django.core.management.base import BaseCommand
from core.models import State, Municipality, City, Parish, Country

class Command(BaseCommand):
    help = "Reinicia e importa estados, municipios, ciudades y parroquias desde CSV exportados de MariaDB"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("⚠ Reiniciando datos de ubicación..."))

        # Asegurar país Venezuela
        venezuela, _ = Country.objects.get_or_create(
            name="Venezuela",
            defaults={"code": "VE"}
        )

        # Limpiar tablas dependientes
        Parish.objects.all().delete()
        City.objects.all().delete()
        Municipality.objects.all().delete()
        State.objects.all().delete()

        self.stdout.write(self.style.WARNING("Tablas limpiadas: State, Municipality, City, Parish"))

        # Estados
        with open('/srv/medops/data/estados.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)  # saltar encabezado
            for row in reader:
                State.objects.create(
                    id=row[0],
                    name=row[1],
                    country=venezuela
                )

        # Municipios
        with open('/srv/medops/data/municipios.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)
            for row in reader:
                Municipality.objects.create(
                    id=row[0],
                    name=row[2],
                    state_id=row[1]
                )

        # Ciudades
        with open('/srv/medops/data/ciudades.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)
            for row in reader:
                City.objects.create(
                    id=row[0],
                    name=row[2],
                    state_id=row[1]
                )

        # Parroquias
        with open('/srv/medops/data/parroquias.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)
            for row in reader:
                Parish.objects.create(
                    id=row[0],
                    name=row[2],
                    municipality_id=row[1]
                )

        self.stdout.write(self.style.SUCCESS("✔ Importación completada: Venezuela institucionalizada con estados, municipios, ciudades y parroquias"))

