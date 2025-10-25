from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Patient, Appointment, WaitingRoomEntry, GeneticPredisposition
from faker import Faker
import random

fake = Faker()

class Command(BaseCommand):
    help = "Depura todas las tablas y repuebla con datos de prueba"

    def handle(self, *args, **kwargs):
        self.stdout.write("🧹 Limpiando base de datos...")

        # Borrar en orden para respetar claves foráneas
        Appointment.objects.all().delete()
        WaitingRoomEntry.objects.all().delete()
        GeneticPredisposition.objects.all().delete()
        Patient.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()

        self.stdout.write("✅ Tablas depuradas")

        # Crear superusuario por defecto
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin123")
            self.stdout.write("👑 Superusuario creado: admin / admin123")

        # Crear pacientes
        patients = []
        for _ in range(50):
            p = Patient.objects.create(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                birthdate=fake.date_of_birth(minimum_age=1, maximum_age=90),
                gender=random.choice(["M", "F"]),
                national_id=fake.unique.random_number(digits=8),
                weight=round(random.uniform(50, 100), 2),
                height=round(random.uniform(150, 200), 2),
                blood_type=random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
                allergies=fake.sentence(),
                medical_history=fake.paragraph(),
                active=True,
            )
            patients.append(p)

        # Crear citas
        for p in patients:
            for _ in range(random.randint(1, 3)):
                Appointment.objects.create(
                    patient=p,
                    date=fake.date_time_between(start_date="-1y", end_date="+1y"),
                    notes=fake.sentence(),
                )

        # Crear sala de espera
        for p in random.sample(patients, 10):
            WaitingRoomEntry.objects.create(
                patient=p,
                created_at=fake.date_time_this_month(),
            )

        # Crear predisposiciones genéticas
        predispositions = [
            ("Diabetes", "Historial familiar de diabetes tipo 2"),
            ("Hipertensión", "Tendencia a presión arterial alta"),
            ("Asma", "Predisposición a problemas respiratorios"),
        ]
        for name, desc in predispositions:
            GeneticPredisposition.objects.create(name=name, description=desc)

        self.stdout.write(self.style.SUCCESS("✅ Base de datos repoblada con 50 pacientes, citas, sala de espera y predisposiciones"))
