import json
from django.core.management.base import BaseCommand
from django.utils.timezone import now
from core.models import Patient, Appointment, Payment, Event


class Command(BaseCommand):
    help = "Carga un conjunto pequeño de datos de demo para validar endpoints"

    def handle(self, *args, **options):
        # --- Limpieza previa ---
        Patient.objects.all().delete()
        Appointment.objects.all().delete()
        Payment.objects.all().delete()
        Event.objects.all().delete()

        # --- Crear pacientes ---
        p1 = Patient.objects.create(first_name="Ana", last_name="Pérez", gender="F", birthdate="1990-01-01")
        p2 = Patient.objects.create(first_name="Carlos", last_name="Gómez", gender="M", birthdate="1985-05-10")
        p3 = Patient.objects.create(first_name="María", last_name="López", gender="F", birthdate="1995-03-20")

        # --- Crear citas ---
        today = now().date()
        a1 = Appointment.objects.create(patient=p1, appointment_date=today, arrival_time="09:30", status="scheduled")
        a2 = Appointment.objects.create(patient=p2, appointment_date=today, arrival_time="10:00", status="completed")
        a3 = Appointment.objects.create(patient=p3, appointment_date=today, arrival_time="11:00", status="scheduled")
        a4 = Appointment.objects.create(patient=p1, appointment_date=today.replace(day=today.day-1), arrival_time="14:00", status="completed")

        # --- Crear pagos ---
        pay1 = Payment.objects.create(appointment=a1, amount=50, method="cash", status="pending")
        pay2 = Payment.objects.create(appointment=a2, amount=100, method="card", status="completed")
        pay3 = Payment.objects.create(appointment=a3, amount=0, method="cash", status="waived")

        # --- Crear eventos de auditoría ---
        Event.objects.create(
            entity="Patient",
            entity_id=int(p1.pk),
            action="create",
            metadata=json.dumps({"info": "Paciente creado"})
        )
        Event.objects.create(
            entity="Appointment",
            entity_id=int(a1.pk),
            action="schedule",
            metadata=json.dumps({"status": "scheduled"})
        )
        Event.objects.create(
            entity="Payment",
            entity_id=int(pay3.pk),
            action="waived",
            metadata=json.dumps({"reason": "exoneración"})
        )

        self.stdout.write(self.style.SUCCESS("✅ Datos de demo cargados correctamente"))
