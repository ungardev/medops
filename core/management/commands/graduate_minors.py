from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Patient, PatientFamilyLink
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Gradúa menores que cumplen 18 años y revoca acceso del representante"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Solo muestra qué se haría sin hacer cambios",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=0,
            help="Graduar menores que cumplan años en los últimos N días (default: 0 = solo hoy)",
        )
        parser.add_argument(
            "--notify",
            action="store_true",
            help="Enviar emails de notificación a los representantes",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        days = options.get("days", 0)
        notify = options.get("notify", False)

        today = timezone.now().date()
        if days > 0:
            start_date = today - timedelta(days=days)
        else:
            start_date = today

        self.stdout.write(f"📅 Buscando menores que cumplan 18 años desde {start_date}...")

        minor_patients = Patient.objects.filter(
            is_minor=True,
            birthdate__isnull=False,
        )

        graduating = []
        for patient in minor_patients:
            if patient.birthdate:
                age_18_date = patient.birthdate.replace(year=patient.birthdate.year + 18)
                if start_date <= age_18_date <= today:
                    graduating.append({
                        "patient": patient,
                        "graduation_date": age_18_date,
                    })

        self.stdout.write(f"📋 {len(graduating)} pacientes por graduar")

        if not graduating:
            self.stdout.write(self.style.SUCCESS("✅ No hay menores por graduar"))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING("🧪 MODO DRY-RUN"))
 for item in graduating:
                patient = item["patient"]
                family_links = PatientFamilyLink.objects.filter(
                    patient=patient,
                    status="active"
                )
                self.stdout.write(
                    f"   would graduate: {patient.full_name} "
                    f"(birthdate: {patient.birthdate}, "
                    f"links: {family_links.count()})"
                )
            return

        graduated_count = 0
        links_revoked_count = 0

        for item in graduating:
            patient = item["patient"]
            family_links = PatientFamilyLink.objects.filter(
                patient=patient,
                status="active"
            )

            for link in family_links:
                link.status = "inactive"
                link.save()
                links_revoked_count += 1
                logger.info(
                    f"Revoked family link {link.id} for patient {patient.id} "
                    f"({patient.full_name}) - patient graduated"
                )

            patient.is_minor = False
            patient.save()

            graduated_count += 1

            self.stdout.write(
                f"   ✅ Graduated: {patient.full_name} "
                f"(ID: {patient.id}, "
                f"family links revoked: {family_links.count()})"
            )

            if notify:
                self._send_notification(item)

        self.stdout.write(
            self.style.SUCCESS(
                f"🎉 {graduated_count} pacientes graduados, "
                f"{links_revoked_count} vínculos revocados"
            )
        )

    def _send_notification(self, item):
        patient = item["patient"]
        family_links = PatientFamilyLink.objects.filter(
            patient=patient,
            status="inactive"
        )

        for link in family_links:
            if link.patient_user and link.patient_user.user.email:
                self.stdout.write(
                    f"   📧 Notificación enviada a: {link.patient_user.user.email}"
                )
