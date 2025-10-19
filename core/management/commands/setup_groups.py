from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission, User
from django.contrib.contenttypes.models import ContentType
from core.models import Payment, Appointment, Patient

class Command(BaseCommand):
    help = "Configures base groups, permissions, and demo users for MedOps Admin"

    def handle(self, *args, **options):
        # --- Crear grupos ---
        superadmin, _ = Group.objects.get_or_create(name="Superadmin")
        finance, _ = Group.objects.get_or_create(name="Finance")
        operations, _ = Group.objects.get_or_create(name="Operations")
        medics, _ = Group.objects.get_or_create(name="Medics")

        # --- Permisos para Finance (todos los de Payment) ---
        payment_ct = ContentType.objects.get_for_model(Payment)
        finance_perms = Permission.objects.filter(content_type=payment_ct)
        finance.permissions.set(finance_perms)

        # --- Permisos para Operations (todos los de Appointment) ---
        appointment_ct = ContentType.objects.get_for_model(Appointment)
        operations_perms = Permission.objects.filter(content_type=appointment_ct)
        operations.permissions.set(operations_perms)

        # --- Permisos para Medics (solo view en Patient y Appointment) ---
        patient_ct = ContentType.objects.get_for_model(Patient)
        medics_view_perms = Permission.objects.filter(
            content_type__in=[appointment_ct, patient_ct],
            codename__startswith="view",
        )
        medics.permissions.set(medics_view_perms)

        # --- Crear usuarios demo y asignarlos a grupos ---
        demo_users = [
            ("finance_user", "finance123", finance),
            ("operations_user", "operations123", operations),
            ("medic_user", "medic123", medics),
        ]

        for username, password, group in demo_users:
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password(password)
                user.is_staff = True
                user.save()
                user.groups.add(group)
                self.stdout.write(self.style.SUCCESS(
                    f"👤 Usuario demo creado: {username} / {password} (grupo {group.name})"
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"Usuario {username} ya existía, se mantuvo sin cambios."
                ))

        # --- Superadmin demo ---
        if not User.objects.filter(username="superadmin").exists():
            sa = User.objects.create_superuser(
                username="superadmin",
                email="superadmin@medops.local",
                password="superadmin123"
            )
            sa.groups.add(superadmin)
            self.stdout.write(self.style.SUCCESS(
                "👑 Superadmin demo creado: superadmin / superadmin123"
            ))

        self.stdout.write(self.style.SUCCESS("✅ Groups, permissions, and demo users configured"))
