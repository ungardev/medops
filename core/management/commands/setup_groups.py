from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from core.models import Payment, Appointment, Patient

class Command(BaseCommand):
    help = "Configures base groups and permissions for MedOps Admin"

    def handle(self, *args, **options):
        # Create groups
        superadmin, _ = Group.objects.get_or_create(name="Superadmin")
        finance, _ = Group.objects.get_or_create(name="Finance")
        operations, _ = Group.objects.get_or_create(name="Operations")
        medics, _ = Group.objects.get_or_create(name="Medics")

        # Permissions for Finance
        payment_ct = ContentType.objects.get_for_model(Payment)
        finance_perms = Permission.objects.filter(content_type=payment_ct)
        finance.permissions.set(finance_perms)

        # Permissions for Operations
        appointment_ct = ContentType.objects.get_for_model(Appointment)
        operations_perms = Permission.objects.filter(content_type=appointment_ct)
        operations.permissions.set(operations_perms)

        # Permissions for Medics (read-only on Patients/Appointments)
        patient_ct = ContentType.objects.get_for_model(Patient)
        medics_view_perms = Permission.objects.filter(
            content_type__in=[appointment_ct, patient_ct],
            codename__startswith="view",
        )
        medics.permissions.set(medics_view_perms)

        self.stdout.write(self.style.SUCCESS("✅ Groups and permissions configured in English"))
