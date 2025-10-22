from django.core.management.base import BaseCommand
from core.models import Patient, Appointment, Payment, Event
from core.utils.events import log_event

class Command(BaseCommand):
    help = "Poblar la tabla Event con registros históricos de pacientes, citas y pagos"

    def handle(self, *args, **options):
        created = 0

        # Pacientes
        for patient in Patient.objects.all():
            log_event("Patient", patient.id, "historical_import", actor="system")
            created += 1

        # Citas
        for appointment in Appointment.objects.all():
            log_event("Appointment", appointment.id, "historical_import", actor="system")
            created += 1

        # Pagos
        for payment in Payment.objects.all():
            log_event("Payment", payment.id, "historical_import", actor="system", metadata={"amount": payment.amount})
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Se crearon {created} eventos históricos"))
