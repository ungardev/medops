from django.core.management.base import BaseCommand
from datetime import date, time, timedelta
from decimal import Decimal
import random
from core.models import Patient, Appointment, WaitingRoomEntry, Payment, Diagnosis, Treatment, Prescription


class Command(BaseCommand):
    help = "Repuebla la base de datos simulando el flujo real del sistema (mono-médico)"

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

        today = date.today()
        appointments = []
        order_counter = 1
        in_consultation_assigned = False

        # --- Crear citas ---
        for i, p in enumerate(pacientes, start=1):
            appt_date = today + timedelta(days=random.choice([0, 0, 0, 1]))
            appt_type = random.choice(["general", "specialized"])
            expected = Decimal("50.00") if appt_type == "general" else Decimal("100.00")

            # Status inicial
            if appt_date > today:
                status = "pending"
            else:
                if not in_consultation_assigned:
                    status = "in_consultation"
                    in_consultation_assigned = True
                else:
                    status = random.choice(["pending", "arrived", "completed", "canceled"])

            appt = Appointment.objects.create(
                patient=p,
                appointment_date=appt_date,
                status=status,
                arrival_time=time(9 + (i % 5), (i * 7) % 60) if status in ["arrived", "in_consultation", "completed"] else None,
                appointment_type=appt_type,
                expected_amount=expected
            )
            appointments.append(appt)

            # --- Sala de espera (solo citas de hoy) ---
            if appt_date == today:
                if status in ["arrived", "pending"]:
                    WaitingRoomEntry.objects.create(
                        patient=p,
                        appointment=appt,
                        status="waiting",
                        priority="scheduled",
                        order=order_counter
                    )
                    order_counter += 1
                elif status == "in_consultation":
                    WaitingRoomEntry.objects.create(
                        patient=p,
                        appointment=appt,
                        status="in_consultation",
                        priority="scheduled",
                        order=order_counter
                    )
                    order_counter += 1
                elif status == "canceled":
                    WaitingRoomEntry.objects.create(
                        patient=p,
                        appointment=appt,
                        status="canceled",
                        priority="scheduled",
                        order=9999
                    )

        # --- Pagos (solo en citas completadas) ---
        for appt in appointments:
            if appt.status == "completed":
                amount = appt.expected_amount
                if random.random() < 0.2:  # 20% pagan parcial
                    paid = amount / 2
                    Payment.objects.create(
                        appointment=appt,
                        amount=paid,
                        method=random.choice(["cash", "card"]),
                        status="paid"
                    )
                else:
                    Payment.objects.create(
                        appointment=appt,
                        amount=amount,
                        method=random.choice(["cash", "card"]),
                        status="paid"
                    )

        # --- Diagnósticos, tratamientos y prescripciones ---
        codes = ["J01", "E11", "I10", "K21", "M54"]
        descriptions = ["Sinusitis aguda", "Diabetes tipo 2", "Hipertensión", "Reflujo gastroesofágico", "Dolor lumbar"]

        for appt in appointments:
            if appt.status in ["in_consultation", "completed"]:
                code = random.choice(codes)
                desc = descriptions[codes.index(code)]
                diag = Diagnosis.objects.create(appointment=appt, code=code, description=desc)
                Treatment.objects.create(diagnosis=diag, plan=f"Plan de tratamiento para {desc}")
                Prescription.objects.create(
                    diagnosis=diag,
                    medication="Medicamento X",
                    dosage="1 tableta cada 8h",
                    duration="7 días"
                )

        self.stdout.write(self.style.SUCCESS("✅ Base de datos repoblada con flujo real: pacientes, citas, sala de espera, pagos y diagnósticos."))
