from django.core.management.base import BaseCommand
from django.db import models
from core.models import ChargeOrder, Payment, MedicalDocument, MedicalReport, Treatment, MedicalReferral
class Command(BaseCommand):
    help = "Rellena los campos doctor, institution y patient en modelos existentes"
    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando backfill de datos...")
        # 1. ChargeOrder - Backfill doctor
        self.stdout.write("Backfilling ChargeOrder.doctor...")
        orders_updated = ChargeOrder.objects.filter(doctor__isnull=True).update(
            doctor=models.F('appointment__doctor')
        )
        self.stdout.write(self.style.SUCCESS(f"  → {orders_updated} órdenes actualizadas"))
        # 2. Payment - Backfill doctor
        self.stdout.write("Backfilling Payment.doctor...")
        payments_updated = Payment.objects.filter(doctor__isnull=True).update(
            doctor=models.F('appointment__doctor')
        )
        self.stdout.write(self.style.SUCCESS(f"  → {payments_updated} pagos actualizados"))
        # 3. MedicalDocument - Backfill doctor e institution
        self.stdout.write("Backfilling MedicalDocument...")
        docs_updated = 0
        for doc in MedicalDocument.objects.filter(doctor__isnull=True).select_related('appointment'):
            if doc.appointment:
                doc.doctor = doc.appointment.doctor
                doc.institution = doc.appointment.institution
                doc.save(update_fields=['doctor', 'institution'])
                docs_updated += 1
        self.stdout.write(self.style.SUCCESS(f"  → {docs_updated} documentos actualizados"))
        # 4. MedicalReport - Backfill doctor e institution
        self.stdout.write("Backfilling MedicalReport...")
        reports_updated = 0
        for report in MedicalReport.objects.filter(doctor__isnull=True).select_related('appointment'):
            if report.appointment:
                report.doctor = report.appointment.doctor
                report.institution = report.appointment.institution
                report.save(update_fields=['doctor', 'institution'])
                reports_updated += 1
        self.stdout.write(self.style.SUCCESS(f"  → {reports_updated} reportes actualizados"))
        # 5. Treatment - Backfill patient, doctor, institution
        self.stdout.write("Backfilling Treatment...")
        treatments_updated = 0
        for treatment in Treatment.objects.filter(patient__isnull=True).select_related('diagnosis__appointment'):
            if treatment.diagnosis and treatment.diagnosis.appointment:
                app = treatment.diagnosis.appointment
                treatment.patient = app.patient
                treatment.doctor = app.doctor
                treatment.institution = app.institution
                treatment.save(update_fields=['patient', 'doctor', 'institution'])
                treatments_updated += 1
        self.stdout.write(self.style.SUCCESS(f"  → {treatments_updated} tratamientos actualizados"))
        # 6. MedicalReferral - Backfill patient, doctor, institution
        self.stdout.write("Backfilling MedicalReferral...")
        referrals_updated = 0
        for referral in MedicalReferral.objects.filter(patient__isnull=True).select_related('appointment'):
            if referral.appointment:
                referral.patient = referral.appointment.patient
                referral.doctor = referral.appointment.doctor
                referral.institution = referral.appointment.institution
                referral.save(update_fields=['patient', 'doctor', 'institution'])
                referrals_updated += 1
        self.stdout.write(self.style.SUCCESS(f"  → {referrals_updated} referencias actualizadas"))
        self.stdout.write(self.style.SUCCESS("\n✅ Backfill completado exitosamente!"))