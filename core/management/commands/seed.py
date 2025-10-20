from django.core.management.base import BaseCommand
from datetime import date, time, timedelta
from decimal import Decimal
import random
from core.models import Patient, Appointment, WaitingRoomEntry, Payment, Diagnosis, Treatment, Prescription

class Command(BaseCommand):
    help = "Repuebla la base de datos con datos de prueba extendidos"

    def handle(self, *args, **options):
        # --- Limpieza previa ---
        Patient.objects.all().delete()
        Appointment.objects.all().delete()
        WaitingRoomEntry.objects.all().delete()
        Payment.objects.all().delete()
        Diagnosis.objects.all().delete()
        Treatment.objects.all().delete()
        Prescription.objects.all().delete()

        # --- Crear pacientes ---
        nombres = [
            ("Juan", "Pérez", "M"),
            ("María", "Gómez", "F"),
            ("Carlos", "Rodríguez", "M"),
            ("Ana", "Martínez", "F"),
            ("Luis", "Fernández", "M"),
            ("Sofía", "López", "F"),
            ("Pedro", "García", "M"),
            ("Lucía", "Torres", "F"),
            ("Andrés", "Ramírez", "M"),
            ("Valentina", "Morales", "F"),
        ]

        pacientes = []
        for i, (nombre, apellido, genero) in enumerate(nombres, start=1):
            p = Patient.objects.create(
                national_id=str(10000000 + i),
                first_name=nombre,
                last_name=apellido,
                gender=genero
            )
            pacientes.append(p)

        # --- Crear citas ---
        today = date.today()
        statuses = ["pending", "arrived", "in_consultation", "completed", "canceled"]
        types = ["general", "specialized"]

        appointments = []
        for i, p in enumerate(pacientes, start=1):
            appt_date = today + timedelta(days=random.choice([-1, 0, 1]))
            status = random.choice(statuses)
            appt = Appointment.objects.create(
                patient=p,
                appointment_date=appt_date,
                status=status,
                arrival_time=time(9 + (i % 5), (i * 7) % 60) if status in ["arrived", "in_consultation", "completed"] else None,
                appointment_type=random.choice(types),
                expected_amount=Decimal("50.00") if random.choice(types) == "general" else Decimal("100.00")
            )
            appointments.append(appt)

        # --- Waiting Room ---
        order_counter = 1
        for appt in appointments:
            if appt.appointment_date == today and appt.status in ["arrived", "in_consultation"]:
                WaitingRoomEntry.objects.create(
                    patient=appt.patient,
                    appointment=appt,
                    status="waiting" if appt.status == "arrived" else "in_consultation",
                    priority=random.choice(["scheduled", "walkin", "emergency"]),
                    order=order_counter
                )
                order_counter += 1

        # --- Pagos ---
        for appt in appointments:
            if appt.status in ["completed", "in_consultation", "arrived"]:
                amount = appt.expected_amount
                if random.random() < 0.3:  # 30% pagan parcial
                    paid = amount / 2
                    Payment.objects.create(appointment=appt, amount=paid, method="cash", status="paid")
                else:
                    Payment.objects.create(appointment=appt, amount=amount, method="card", status="paid")

        # --- Diagnósticos, tratamientos y prescripciones ---
        codes = ["J01", "E11", "I10", "K21", "M54"]
        descriptions = ["Sinusitis aguda", "Diabetes tipo 2", "Hipertensión", "Reflujo gastroesofágico", "Dolor lumbar"]

        for appt in appointments:
            if appt.status in ["in_consultation", "completed"]:
                code = random.choice(codes)
                desc = descriptions[codes.index(code)]
                diag = Diagnosis.objects.create(appointment=appt, code=code, description=desc)
                Treatment.objects.create(diagnosis=diag, plan=f"Plan de tratamiento para {desc}")
                Prescription.objects.create(diagnosis=diag, medication="Medicamento X", dosage="1 tableta cada 8h", duration="7 días")

        self.stdout.write(self.style.SUCCESS("✅ Base de datos repoblada con dataset extendido."))
