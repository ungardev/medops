from django.core.management.base import BaseCommand
from django.db import connection
from core.models import Country, State, City, Parish

class Command(BaseCommand):
    help = "Importa datos desde tablas crudas (estados, municipios, ciudades, parroquias) a los modelos jerárquicos"

    def handle(self, *args, **options):
        # 🔹 Aseguramos que exista el país Venezuela
        country, _ = Country.objects.get_or_create(name="Venezuela")

        with connection.cursor() as cursor:
            # Estados
            cursor.execute("SELECT id, nombre FROM estados;")
            for row in cursor.fetchall():
                state_id, name = row
                state, _ = State.objects.get_or_create(
                    id=state_id,
                    defaults={"name": name, "country": country}
                )
                self.stdout.write(self.style.SUCCESS(f"Estado importado: {state.name}"))

            # Ciudades
            cursor.execute("SELECT id, nombre, estado_id FROM ciudades;")
            for row in cursor.fetchall():
                city_id, name, state_id = row
                try:
                    state = State.objects.get(id=state_id)
                    city, _ = City.objects.get_or_create(
                        id=city_id,
                        defaults={"name": name, "state": state}
                    )
                    self.stdout.write(self.style.SUCCESS(f"Ciudad importada: {city.name}"))
                except State.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Ciudad {name} ignorada: estado {state_id} no existe"))

            # Parroquias
            cursor.execute("SELECT id, nombre, ciudad_id FROM parroquias;")
            for row in cursor.fetchall():
                parish_id, name, city_id = row
                try:
                    city = City.objects.get(id=city_id)
                    parish, _ = Parish.objects.get_or_create(
                        id=parish_id,
                        defaults={"name": name, "city": city}
                    )
                    self.stdout.write(self.style.SUCCESS(f"Parroquia importada: {parish.name}"))
                except City.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Parroquia {name} ignorada: ciudad {city_id} no existe"))
