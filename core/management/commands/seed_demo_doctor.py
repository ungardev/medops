# core/management/commands/seed_demo_doctor.py
"""
Management Command: seed_demo_doctor

Crea doctores de demo/testing para MEDOPZ con perfil completo.

Uso:
  python manage.py seed_demo_doctor                            # Doctor directo verificado
  python manage.py seed_demo_doctor --with-token              # Simula flujo real con invitación
  python manage.py seed_demo_doctor --username dr_test2       # Username personalizado
  python manage.py seed_demo_doctor --name "Juan Perez"       # Nombre (sin prefijo Dr.)
  python manage.py seed_demo_doctor --name "Maria Lopez" --female  # Médico femenina
  python manage.py seed_demo_doctor --cleanup                 # Elimina usuarios demo antes de crear

El flag --with-token crea un DoctorInvitation y打印 el token
para demostrar el flujo real de invitación cerrado.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from core.models import DoctorOperator, DoctorInvitation, InstitutionSettings, Specialty
from core.models import SPECIALTY_CHOICES


class Command(BaseCommand):
    help = "Crea doctores de demo/testing para MEDOPZ con perfil completo"

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            type=str,
            default="dr_demo",
            help="Username del doctor (default: dr_demo)",
        )
        parser.add_argument(
            "--name",
            type=str,
            default="Juan Perez",
            help="Nombre completo del médico (sin prefijo Dr./Dra.)",
        )
        parser.add_argument(
            "--gender",
            type=str,
            choices=["M", "F"],
            default="M",
            help="Género del médico: M=Masculino (Dr.), F=Femenino (Dra.)",
        )
        parser.add_argument(
            "-f",
            "--female",
            action="store_true",
            help="Género femenino (equivale a --gender F)",
        )
        parser.add_argument(
            "--with-token",
            action="store_true",
            help="Crear invitación en lugar de doctor directo (simula flujo real)",
        )
        parser.add_argument(
            "--email",
            type=str,
            default=None,
            help="Email del doctor (default: username@medopz.demo)",
        )
        parser.add_argument(
            "--specialty",
            type=str,
            default="general_surgery",
            help=f"Código de especialidad (default: general_surgery)",
        )
        parser.add_argument(
            "--verified",
            action="store_true",
            default=True,
            help="Marcar doctor como verificado (default: True)",
        )
        parser.add_argument(
            "--cleanup",
            action="store_true",
            help="Eliminar usuarios demo existentes antes de crear",
        )

    def handle(self, *args, **options):
        # Procesar gender
        gender = "F" if options["female"] else options["gender"]

        username = options["username"]
        full_name = options["name"]
        with_token = options["with_token"]
        email = options["email"] or f"{username}@medopz.demo"
        specialty_code = options["specialty"]
        is_verified = options["verified"]
        cleanup = options["cleanup"]

        # Cleanup si solicitado
        if cleanup:
            self._cleanup_demo_users(username)
            return

        # Verificar que existe al menos una institución
        institution = InstitutionSettings.objects.first()
        if not institution:
            self.stdout.write(
                self.style.ERROR(
                    "✗ No existe ninguna institución en el sistema. "
                    "Ejecuta primero: python manage.py seed_institutions"
                )
            )
            return

        # Obtener o crear especialidad
        try:
            specialty = Specialty.objects.get(code=specialty_code)
        except Specialty.DoesNotExist:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  Especialidad "{specialty_code}" no existe. Verificando SPECIALTY_CHOICES...'
                )
            )
            available = [code for code, _ in SPECIALTY_CHOICES]
            self.stdout.write(
                self.style.WARNING(
                    f"  Códigos disponibles: {', '.join(available[:5])}..."
                )
            )
            self.stdout.write(
                self.style.WARNING(f'  Usando "general_surgery" como default.')
            )
            specialty, _ = Specialty.objects.get_or_create(
                code="general_surgery", defaults={"name": "Cirugía General"}
            )

        if with_token:
            self._create_invitation_flow(
                username=username,
                full_name=full_name,
                gender=gender,
                email=email,
                specialty=specialty,
                institution=institution,
            )
        else:
            self._create_direct_doctor(
                username=username,
                full_name=full_name,
                gender=gender,
                email=email,
                specialty=specialty,
                institution=institution,
                is_verified=is_verified,
            )

    def _cleanup_demo_users(self, username):
        """Elimina usuarios demo existentes"""
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("═" * 60))
        self.stdout.write(self.style.WARNING("  MEDOPZ CLEANUP MODE"))
        self.stdout.write(self.style.WARNING("═" * 60))
        self.stdout.write("")

        deleted_users = []
        deleted_doctors = []

        # Buscar DoctorOperator con este username
        try:
            doctor = DoctorOperator.objects.get(user__username=username)
            user = doctor.user
            doctor_name = doctor.full_name
            deleted_doctors.append(doctor_name)
            doctor.delete()
            user.delete()
            self.stdout.write(
                self.style.SUCCESS(f"✓ DoctorOperator eliminado: {doctor_name}")
            )
            self.stdout.write(self.style.SUCCESS(f"✓ User eliminado: {username}"))
        except DoctorOperator.DoesNotExist:
            self.stdout.write(
                self.style.WARNING(
                    f"⚠️  No existe DoctorOperator con username: {username}"
                )
            )

        # Buscar DoctorInvitation por email
        demo_emails = [f"{username}@medopz.demo", f"dr_demo@medopz.demo"]
        for email in demo_emails:
            try:
                invitation = DoctorInvitation.objects.get(email=email, is_used=False)
                inv_name = invitation.full_name
                invitation.delete()
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Invitación eliminada: {inv_name}")
                )
            except DoctorInvitation.DoesNotExist:
                pass

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write(self.style.SUCCESS("  LIMPIEZA COMPLETADA"))
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write("")

    def _create_direct_doctor(
        self, username, full_name, gender, email, specialty, institution, is_verified
    ):
        """Crea doctor directamente (bypass invitación)"""
        prefix = "Dra." if gender == "F" else "Dr."
        full_name_formatted = f"{prefix} {full_name}"

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write(self.style.SUCCESS("  MEDOPZ DEMO DOCTOR SEEDER"))
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write("")

        # Verificar si el usuario ya existe
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  Usuario "{username}" ya existe. Ejecuta con --cleanup primero.'
                )
            )
            return

        # Generar cédula ficticia única
        import random

        national_id = f"V-{random.randint(10000000, 29999999)}"

        # Generar password temporal seguro (no se imprime)
        import secrets

        temp_password = secrets.token_urlsafe(16)

        # Crear usuario Django
        name_parts = full_name.split()
        user = User.objects.create_user(
            username=username,
            email=email,
            password=temp_password,
            first_name=name_parts[0] if len(name_parts) > 0 else full_name,
            last_name=name_parts[-1] if len(name_parts) > 1 else "",
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Usuario Django creado"))

        # Crear DoctorOperator
        doctor = DoctorOperator.objects.create(
            user=user,
            full_name=full_name_formatted,
            national_id=national_id,
            email=email,
            license=f"MPPS-{random.randint(100000, 999999)}",
            agregado_id=f"CMV-{random.randint(10000, 99999)}",
            is_verified=is_verified,
            is_active_license=True,
            license_expiry_date=timezone.now().date() + timedelta(days=365),
            gender=gender,
        )
        self.stdout.write(self.style.SUCCESS(f"✓ DoctorOperator creado"))

        # Asignar especialidad
        doctor.specialties.add(specialty)
        self.stdout.write(self.style.SUCCESS(f"✓ Especialidad: {specialty.name}"))

        # Asignar institución
        doctor.institutions.add(institution)
        doctor.active_institution = institution
        doctor.save()
        self.stdout.write(self.style.SUCCESS(f"✓ Institución: {institution.name}"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write(self.style.SUCCESS("  DOCTOR DEMO CREADO EXITOSAMENTE"))
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  Nombre:    {full_name_formatted}"))
        self.stdout.write(self.style.SUCCESS(f"  Username:  {username}"))
        self.stdout.write(
            self.style.WARNING("  ⚠️  Password: establecer en admin o usar reset")
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"  Género:    {'Femenino' if gender == 'F' else 'Masculino'}"
            )
        )
        self.stdout.write(self.style.SUCCESS(f"  Nacional:  {national_id}"))
        self.stdout.write(self.style.SUCCESS(f"  License:   {doctor.license}"))
        self.stdout.write(self.style.SUCCESS(f"  verified:  {doctor.is_verified}"))
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("  ⚠️  CAMBIAR PASSWORD EN PRODUCCIÓN"))
        self.stdout.write("")

    def _create_invitation_flow(
        self, username, full_name, gender, email, specialty, institution
    ):
        """Crea invitación (flujo real cerrado)"""
        prefix = "Dra." if gender == "F" else "Dr."
        full_name_formatted = f"{prefix} {full_name}"

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write(self.style.SUCCESS("  MEDOPZ INVITATION FLOW SIMULATOR"))
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write("")

        # Generar credentials ficticias
        import random

        national_id = f"V-{random.randint(10000000, 29999999)}"
        license_num = f"MPPS-{random.randint(100000, 999999)}"
        colegiao_num = f"CMV-{random.randint(10000, 99999)}"

        # Crear DoctorInvitation
        invitation = DoctorInvitation.objects.create(
            national_id=national_id,
            full_name=full_name_formatted,
            email=email,
            specialty=specialty,
            license_number=license_num,
            colegiado_number=colegiao_num,
            institution=institution,
            invited_by=User.objects.filter(is_superuser=True).first(),
            expires_at=timezone.now() + timedelta(days=7),
            is_used=False,
        )

        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write(self.style.SUCCESS("  INVITATION CREATED - TOKEN GENERATED"))
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  Nombre:      {full_name_formatted}"))
        self.stdout.write(self.style.SUCCESS(f"  Email:       {email}"))
        self.stdout.write(
            self.style.SUCCESS(
                f"  Género:      {'Femenino' if gender == 'F' else 'Masculino'}"
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f"  Nacional:    {invitation.national_id}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"  Colegiado:   {invitation.colegiado_number}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"  License:     {invitation.license_number}")
        )
        self.stdout.write(self.style.SUCCESS(f"  Especialidad: {specialty.name}"))
        self.stdout.write(self.style.SUCCESS(f"  Institución:  {institution.name}"))
        self.stdout.write(self.style.SUCCESS(f"  Expira:      {invitation.expires_at}"))
        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write(self.style.WARNING("  SECURE TOKEN (no compartir):"))
        self.stdout.write(
            self.style.WARNING("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  {invitation.token}"))
        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("  Para activar, llama:"))
        self.stdout.write(
            self.style.SUCCESS(
                f"  POST /api/doctor/activate/ "
                f'{{"token": "{invitation.token[:16]}...", "username": "...", "password": "..."}}'
            )
        )
        self.stdout.write("")
