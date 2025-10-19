from django.core.management.base import BaseCommand
from core.models import Patient, Appointment, Payment
from datetime import date, timedelta
from decimal import Decimal

class Command(BaseCommand):
    help = "Poblar la base de datos con 6 pacientes y 2 citas cada uno"

    def handle(self, *args, **kwargs):
        # Limpiar por si acaso
        Patient.objects.all().delete()
        Appointment.objects.all().delete()
        Payment.objects.all().delete()

        patients = []
        for i in range(1, 7):
            p = Patient.objects.create(
                national_id=f"1000{i}",
                first_name=f"Nombre{i}",
                last_name=f"Apellido{i}",
                gender="M" if i % 2 == 0 else "F",
            )
            patients.append(p)

        for idx, patient in enumerate(patients, start=1):
            # Cita 1: general
            appt1 = Appointment.objects.create(
                patient=patient,
                appointment_date=date.today() - timedelta(days=idx),
                appointment_type="general",
                expected_amount=Decimal("50.00"),
                status="completed",
            )
            Payment.objects.create(
                appointment=appt1,
                amount=Decimal("50.00"),
                method="cash",
                status="paid",
            )

            # Cita 2: especializada
            appt2 = Appointment.objects.create(
                patient=patient,
                appointment_date=date.today() - timedelta(days=idx+1),
                appointment_type="specialized",
                expected_amount=Decimal("100.00"),
                status="pending",
            )
            # Pago parcial
            Payment.objects.create(
                appointment=appt2,
                amount=Decimal("50.00"),
                method="card",
                status="paid",
            )

        self.stdout.write(self.style.SUCCESS("Base de datos poblada con 6 pacientes y 2 citas cada uno"))
