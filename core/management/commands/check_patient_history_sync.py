# core/management/commands/check_patient_history_sync.py
from django.core.management.base import BaseCommand
from django.apps import apps

class Command(BaseCommand):
    help = "Verifica que Patient y HistoricalPatient tengan los mismos campos auditables"

    def handle(self, *args, **options):
        Patient = apps.get_model("core", "Patient")
        HistoricalPatient = apps.get_model("core", "HistoricalPatient")

        # Campos a ignorar porque simple_history los añade automáticamente
        ignore_fields = {
            "id",
            "history_id",
            "history_date",
            "history_type",
            "history_user",
            "history_change_reason",
        }

        patient_fields = {f.name for f in Patient._meta.get_fields() if f.concrete} - ignore_fields
        historical_fields = {f.name for f in HistoricalPatient._meta.get_fields() if f.concrete} - ignore_fields

        missing_in_historical = patient_fields - historical_fields
        extra_in_historical = historical_fields - patient_fields

        if not missing_in_historical and not extra_in_historical:
            self.stdout.write(self.style.SUCCESS("✅ Patient y HistoricalPatient están sincronizados"))
        else:
            if missing_in_historical:
                self.stdout.write(self.style.ERROR(f"❌ Faltan en HistoricalPatient: {missing_in_historical}"))
            if extra_in_historical:
                self.stdout.write(self.style.WARNING(f"⚠️ Campos extra en HistoricalPatient: {extra_in_historical}"))
