from django.core.management.base import BaseCommand
from core.models import (
    DoctorPatientRelationship,
    Appointment,
    DoctorOperator,
    Patient,
    InstitutionSettings,
)
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Migra relaciones doctor-paciente desde Appointments existentes"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Solo muestra qué se crearía sin hacer cambios",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Fuerza la migración incluso si ya existen relaciones",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        force = options.get("force", False)

        existing_count = DoctorPatientRelationship.objects.count()
        if existing_count > 0 and not force:
            self.stdout.write(
                self.style.WARNING(
                    f"Ya existen {existing_count} relaciones. Usa --force para migrar de nuevo."
                )
            )
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING("🧪 MODO DRY-RUN - No se haran cambios")
            )

        appointments = Appointment.objects.select_related(
            "doctor", "patient", "institution"
        ).filter(status="completed")

        self.stdout.write(f"📊 Analizando {appointments.count()} citas completadas...")

        relationships_to_create = []
        relationships_by_doctor_patient = {}

        for appointment in appointments:
            key = (appointment.doctor_id, appointment.patient_id)
            if key not in relationships_by_doctor_patient:
                relationships_by_doctor_patient[key] = {
                    "doctor": appointment.doctor,
                    "patient": appointment.patient,
                    "institution": appointment.institution,
                    "count": 0,
                }
            relationships_by_doctor_patient[key]["count"] += 1

        self.stdout.write(
            f"📋 {len(relationships_by_doctor_patient)} parejas doctor-paciente únicas encontradas"
        )

        for (doctor_id, patient_id), data in relationships_by_doctor_patient.items():
            rel_data = {
                "doctor": data["doctor"],
                "patient": data["patient"],
                "relationship_type": "primary_care",
                "status": "active",
                "institution": data["institution"],
                "created_by": User.objects.filter(is_superuser=True).first(),
                "notes": f"Migrado automáticamente desde {data['count']} citas completadas",
            }

            if dry_run:
                self.stdout.write(
                    f" �would create: Dr. {data['doctor'].full_name} -> "
                    f"{data['patient'].full_name} ({data['count']} citas)"
                )
            else:
                relationships_to_create.append(DoctorPatientRelationship(**rel_data))

        if not dry_run and relationships_to_create:
            DoctorPatientRelationship.objects.bulk_create(
                relationships_to_create, ignore_conflicts=True
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ {len(relationships_to_create)} relaciones creadas"
                )
            )
        elif dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"🧪 {len(relationships_to_create)} relaciones habrían sido creadas"
                )
            )

        self.stdout.write(self.style.SUCCESS("🎉 Migración completada"))
