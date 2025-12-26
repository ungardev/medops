from django.core.management.base import BaseCommand
from django.db import connection
from core.models import Country, State, Municipality, City, Parish

class Command(BaseCommand):
    help = "Importa datos crudos (estados, municipios, ciudades, parroquias) a los modelos jerárquicos"

    def handle(self, *args, **options):
        # 🔹 País base
        country, _ = Country.objects.get_or_create(name="Venezuela")

        with connection.cursor() as cursor:
            # Estados
            cursor.execute("SELECT id, name FROM estados;")
            for state_id, name in cursor.fetchall():
                state, _ = State.objects.get_or_create(
                    id=state_id,
                    defaults={"name": name, "country": country}
                )
                self.stdout.write(self.style.SUCCESS(f"Estado importado: {state.name}"))

            # Municipios
            cursor.execute("SELECT id, name, state_id FROM municipios;")
            for mun_id, name, state_id in cursor.fetchall():
                try:
                    state = State.objects.get(id=state_id)
                    municipality, _ = Municipality.objects.get_or_create(
                        id=mun_id,
                        defaults={"name": name, "state": state}
                    )
                    self.stdout.write(self.style.SUCCESS(f"Municipio importado: {municipality.name}"))
                except State.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Municipio {name} ignorado: state {state_id} no existe"))

            # Ciudades
            cursor.execute("SELECT id, name, state_id FROM ciudades;")
            for city_id, name, state_id in cursor.fetchall():
                try:
                    state = State.objects.get(id=state_id)
                    city, _ = City.objects.get_or_create(
                        id=city_id,
                        defaults={"name": name, "state": state}
                    )
                    self.stdout.write(self.style.SUCCESS(f"Ciudad importada: {city.name}"))
                except State.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Ciudad {name} ignorada: state {state_id} no existe"))

            # Parroquias
            cursor.execute("SELECT id, name, city_id FROM parroquias;")
            for parish_id, name, city_id in cursor.fetchall():
                try:
                    city = City.objects.get(id=city_id)
                    parish, _ = Parish.objects.get_or_create(
                        id=parish_id,
                        defaults={"name": name, "city": city}
                    )
                    self.stdout.write(self.style.SUCCESS(f"Parroquia importada: {parish.name}"))
                except City.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"Parroquia {name} ignorada: city {city_id} no existe"))
