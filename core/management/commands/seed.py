from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import (
    Patient, Appointment, WaitingRoomEntry, GeneticPredisposition,
    Payment, Diagnosis, Treatment, Prescription
)
from faker import Faker
import random
from decimal import Decimal

fake = Faker("es_ES")

class Command(BaseCommand):
    help = "Depura todas las tablas y repuebla con datos de prueba completos"

    def handle(self, *args, **kwargs):
        self.stdout.write("🧹 Limpiando base de datos...")

        # Borrar en orden para respetar claves foráneas
        WaitingRoomEntry.objects.all().delete()
        Payment.objects.all().delete()
        Prescription.objects.all().delete()
        Treatment.objects.all().delete()
        Diagnosis.objects.all().delete()
        Appointment.objects.all().delete()
        Patient.objects.all().delete()
        GeneticPredisposition.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()

        self.stdout.write("✅ Tablas depuradas")

        # Crear superusuario por defecto
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser("admin", "admin@example.com", "admin123")
            self.stdout.write("👑 Superusuario creado: admin / admin123")

        # Crear predisposiciones genéticas
        predispositions = [
            ("Diabetes", "Historial familiar de diabetes tipo 2"),
            ("Hipertensión", "Tendencia a presión arterial alta"),
            ("Asma", "Predisposición a problemas respiratorios"),
        ]
        predis_objs = [GeneticPredisposition.objects.create(name=n, description=d) for n, d in predispositions]

        # Crear pacientes
        patients = []
        for _ in range(50):
            p = Patient.objects.create(
                first_name=fake.first_name(),
                middle_name=fake.first_name() if random.random() > 0.7 else None,
                last_name=fake.last_name(),
                second_last_name=fake.last_name() if random.random() > 0.7 else None,
                birthdate=fake.date_of_birth(minimum_age=1, maximum_age=90),
                gender=random.choice(["M", "F", "Unknown"]),
                national_id=str(fake.unique.random_number(digits=8)),
                weight=round(random.uniform(50, 100), 2),
                height=round(random.uniform(150, 200), 2),
                blood_type=random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
                allergies=fake.sentence(),
                medical_history=fake.paragraph(),
                contact_info=fake.phone_number(),
                active=True,
            )
            p.genetic_predispositions.set(random.sample(predis_objs, random.randint(0, len(predis_objs))))
            patients.append(p)

        # Crear citas + pagos + diagnósticos
        appointments = []
        for p in patients:
            for _ in range(random.randint(1, 3)):
                appt_type = random.choice(["general", "specialized"])
                expected = Decimal("50.00") if appt_type == "general" else Decimal("100.00")
                appt = Appointment.objects.create(
                    patient=p,
                    appointment_date=fake.date_between(start_date="-1y", end_date="+1y"),
                    appointment_type=appt_type,
                    expected_amount=expected,
                    status=random.choice(["pending", "arrived", "completed"]),
                    notes=fake.sentence(),
                )
                appointments.append(appt)

                # Pagos
                if random.random() > 0.5:
                    paid_amount = expected if random.random() > 0.5 else expected / 2
                    Payment.objects.create(
                        appointment=appt,
                        amount=paid_amount,
                        method=random.choice(["cash", "card", "transfer"]),
                        status="paid" if paid_amount == expected else "pending",
                        reference_number=fake.uuid4() if random.random() > 0.3 else None,
                        bank_name=fake.company() if random.random() > 0.5 else None,
                        received_by=fake.name(),
                    )

                # Diagnóstico
                if random.random() > 0.4:
                    diag = Diagnosis.objects.create(
                        appointment=appt,
                        code=fake.lexify(text="DX-????"),
                        description=fake.sentence(),
                    )

                    # Tratamiento
                    if random.random() > 0.5:
                        Treatment.objects.create(
                            diagnosis=diag,
                            plan=fake.paragraph(),
                            start_date=fake.date_between(start_date="-6m", end_date="today"),
                            end_date=fake.date_between(start_date="today", end_date="+6m"),
                        )

                    # Prescripción
                    if random.random() > 0.5:
                        Prescription.objects.create(
                            diagnosis=diag,
                            medication=fake.word().capitalize(),
                            dosage=f"{random.randint(1,3)} veces al día",
                            duration=f"{random.randint(5,30)} días",
                        )

        # Sala de espera
        for p in random.sample(patients, 10):
            WaitingRoomEntry.objects.create(
                patient=p,
                appointment=p.appointment_set.first(),
                status="waiting",
                priority=random.choice(["scheduled", "walkin", "emergency"]),
            )

        self.stdout.write(self.style.SUCCESS("✅ Base repoblada con pacientes, citas, pagos, diagnósticos, tratamientos, prescripciones y sala de espera"))
