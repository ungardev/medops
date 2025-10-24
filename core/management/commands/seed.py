from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
import random

from core.models import (
    Patient, Appointment, WaitingRoomEntry, Payment,
    Diagnosis, Treatment, Prescription, MedicalDocument,
    GeneticPredisposition
)

class Command(BaseCommand):
    help = "Seed database with varied test data"

    def handle(self, *args, **kwargs):
        # Limpieza previa
        Patient.objects.all().delete()
        Appointment.objects.all().delete()
        WaitingRoomEntry.objects.all().delete()
        Payment.objects.all().delete()
        Diagnosis.objects.all().delete()
        Treatment.objects.all().delete()
        Prescription.objects.all().delete()
        MedicalDocument.objects.all().delete()
        GeneticPredisposition.objects.all().delete()

        # Predisposiciones genéticas
        predisps = [
            GeneticPredisposition.objects.create(name="Diabetes tipo 2"),
            GeneticPredisposition.objects.create(name="Hipertensión"),
            GeneticPredisposition.objects.create(name="Asma"),
        ]

        # Pacientes
        patients = [
            Patient.objects.create(
                national_id="12345678",
                first_name="Juan", last_name="Pérez",
                gender="M", birthdate="1990-01-01",
                contact_info="0414-1234567",
                blood_type="O+"
            ),
            Patient.objects.create(
                national_id="87654321",
                first_name="María", last_name="Gómez",
                gender="F", birthdate="1985-05-10",
                contact_info="0416-7654321",
                blood_type="A+"
            ),
            Patient.objects.create(
                national_id="11223344",
                first_name="Carlos", last_name="Rodríguez",
                gender="M", birthdate="1975-03-15",
                contact_info="0424-9988776",
                blood_type="B-"
            ),
        ]

        # Asignar predisposiciones
        patients[0].genetic_predispositions.add(predisps[0])
        patients[1].genetic_predispositions.add(predisps[1], predisps[2])

        # Citas
        today = timezone.now().date()
        appointments = [
            Appointment.objects.create(
                patient=patients[0],
                appointment_date=today,
                appointment_type="general",
                expected_amount=Decimal("50.00"),
                status="pending"
            ),
            Appointment.objects.create(
                patient=patients[1],
                appointment_date=today,
                appointment_type="specialized",
                expected_amount=Decimal("100.00"),
                status="pending"
            ),
            Appointment.objects.create(
                patient=patients[2],
                appointment_date=today,
                appointment_type="general",
                expected_amount=Decimal("50.00"),
                status="pending"
            ),
        ]

        # Sala de espera
        WaitingRoomEntry.objects.create(
            patient=patients[0],
            appointment=appointments[0],
            status="waiting",
            priority="scheduled"
        )
        WaitingRoomEntry.objects.create(
            patient=patients[1],
            appointment=appointments[1],
            status="waiting",
            priority="walkin"
        )
        WaitingRoomEntry.objects.create(
            patient=patients[2],
            appointment=appointments[2],
            status="waiting",
            priority="emergency"
        )

        # Pagos
        Payment.objects.create(
            appointment=appointments[0],
            amount=Decimal("50.00"),
            method="cash",
            status="paid",
            received_by="Admin"
        )
        Payment.objects.create(
            appointment=appointments[1],
            amount=Decimal("40.00"),
            method="transfer",
            status="pending",
            reference_number="TRX12345",
            bank_name="Banco de Venezuela",
            received_by="Cajero"
        )

        # Diagnósticos y tratamientos
        diag1 = Diagnosis.objects.create(
            appointment=appointments[0],
            code="J06.9",
            description="Infección aguda de vías respiratorias"
        )
        Treatment.objects.create(
            diagnosis=diag1,
            plan="Reposo, hidratación y control de fiebre",
            start_date=today
        )
        Prescription.objects.create(
            diagnosis=diag1,
            medication="Paracetamol 500mg",
            dosage="1 tableta cada 8h",
            duration="5 días"
        )

        # Documentos médicos
        MedicalDocument.objects.create(
            patient=patients[0],
            appointment=appointments[0],
            diagnosis=diag1,
            description="Examen de laboratorio - Hemograma",
            category="Laboratorio",
            file="medical_documents/hemograma.pdf",
            uploaded_by="Dr. House"
        )

        self.stdout.write(self.style.SUCCESS("✅ Base de datos poblada con datos variados"))
