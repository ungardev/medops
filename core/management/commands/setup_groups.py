from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

# Ajusta importaciones a tus modelos reales
from core.models import Payment, Appointment, Patient  # y otros si aplica


class Command(BaseCommand):
    help = "Configura grupos y permisos base para MedOps Admin"

    def handle(self, *args, **options):
        # Crear grupos
        superadmin, _ = Group.objects.get_or_create(name="Superadmin")
        finanzas, _ = Group.objects.get_or_create(name="Finanzas")
        operaciones, _ = Group.objects.get_or_create(name="Operaciones")
        medicos, _ = Group.objects.get_or_create(name="Médicos")

        # Permisos por modelo
        payment_ct = ContentType.objects.get_for_model(Payment)
        appointment_ct = ContentType.objects.get_for_model(Appointment)
        patient_ct = ContentType.objects.get_for_model(Patient)

        # Finanzas: todos los permisos sobre Payment
        finanzas_perms = Permission.objects.filter(content_type=payment_ct)
        finanzas.permissions.set(finanzas_perms)

        # Operaciones: permisos sobre Appointment (ajusta si necesitas Assignments)
        operaciones_perms = Permission.objects.filter(content_type=appointment_ct)
        operaciones.permissions.set(operaciones_perms)

        # Médicos: solo lectura de Patient y Appointment
        medicos_view_perms = Permission.objects.filter(
            content_type__in=[patient_ct, appointment_ct],
            codename__startswith="view",
        )
        medicos.permissions.set(medicos_view_perms)

        # Superadmin: no se restringe aquí; se gestiona con is_superuser=True en usuarios

        self.stdout.write(self.style.SUCCESS("✅ Grupos y permisos base configurados"))
