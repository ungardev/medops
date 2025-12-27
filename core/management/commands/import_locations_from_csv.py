import csv
from django.core.management.base import BaseCommand
from core.models import State, Municipality, City, Parish

class Command(BaseCommand):
    help = "Importa estados, municipios, ciudades y parroquias desde CSV exportados de MariaDB"

    def handle(self, *args, **options):
        # Estados
        with open('/srv/medops/data/estados.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)  # saltar encabezado
            for row in reader:
                State.objects.get_or_create(id=row[0], name=row[1])

        # Municipios
        with open('/srv/medops/data/municipios.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)
            for row in reader:
                Municipality.objects.get_or_create(id=row[0], name=row[2], state_id=row[1])

        # Ciudades
        with open('/srv/medops/data/ciudades.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)
            for row in reader:
                City.objects.get_or_create(id=row[0], name=row[2], state_id=row[1])

        # Parroquias
        with open('/srv/medops/data/parroquias.csv', newline='', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter='\t')
            next(reader)
            for row in reader:
                Parish.objects.get_or_create(id=row[0], name=row[2], municipality_id=row[1])

        self.stdout.write(self.style.SUCCESS("Datos importados desde CSV de MariaDB"))
