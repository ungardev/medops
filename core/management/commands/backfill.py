from django.db import models
from core.models import ChargeOrder, Payment, MedicalDocument, MedicalReport, Treatment, MedicalReferral
# 1. ChargeOrder - Backfill doctor
print("Backfilling ChargeOrder.doctor...")
orders_updated = ChargeOrder.objects.filter(doctor__isnull=True).update(
    doctor=models.F('appointment__doctor')
)
print(f"  → {orders_updated} órdenes actualizadas")
# 2. Payment - Backfill doctor
print("Backfilling Payment.doctor...")
payments_updated = Payment.objects.filter(doctor__isnull=True).update(
    doctor=models.F('appointment__doctor')
)
print(f"  → {payments_updated} pagos actualizados")
# 3. MedicalDocument - Backfill doctor e institution
print("Backfilling MedicalDocument...")
docs_updated = 0
for doc in MedicalDocument.objects.filter(doctor__isnull=True).select_related('appointment'):
    if doc.appointment:
        doc.doctor = doc.appointment.doctor
        doc.institution = doc.appointment.institution
        doc.save(update_fields=['doctor', 'institution'])
        docs_updated += 1
print(f"  → {docs_updated} documentos actualizados")
# 4. MedicalReport - Backfill doctor e institution
print("Backfilling MedicalReport...")
reports_updated = 0
for report in MedicalReport.objects.filter(doctor__isnull=True).select_related('appointment'):
    if report.appointment:
        report.doctor = report.appointment.doctor
        report.institution = report.appointment.institution
        report.save(update_fields=['doctor', 'institution'])
        reports_updated += 1
print(f"  → {reports_updated} reportes actualizados")
# 5. Treatment - Backfill patient, doctor, institution
print("Backfilling Treatment...")
treatments_updated = 0
for treatment in Treatment.objects.filter(patient__isnull=True).select_related('diagnosis__appointment'):
    if treatment.diagnosis and treatment.diagnosis.appointment:
        app = treatment.diagnosis.appointment
        treatment.patient = app.patient
        treatment.doctor = app.doctor
        treatment.institution = app.institution
        treatment.save(update_fields=['patient', 'doctor', 'institution'])
        treatments_updated += 1
print(f"  → {treatments_updated} tratamientos actualizados")
# 6. MedicalReferral - Backfill patient, doctor, institution
print("Backfilling MedicalReferral...")
referrals_updated = 0
for referral in MedicalReferral.objects.filter(patient__isnull=True).select_related('appointment'):
    if referral.appointment:
        referral.patient = referral.appointment.patient
        referral.doctor = referral.appointment.doctor
        referral.institution = referral.appointment.institution
        referral.save(update_fields=['patient', 'doctor', 'institution'])
        referrals_updated += 1
print(f"  → {referrals_updated} referencias actualizadas")
print("\n✅ Backfill completado exitosamente!")