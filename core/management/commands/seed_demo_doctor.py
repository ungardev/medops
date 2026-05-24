# core/management/commands/seed_demo_doctor.py
"""
Management Command: seed_demo_doctor

Crea doctores de demo/testing para MEDOPZ con perfil completo.

Uso:
  python manage.py seed_demo_doctor --name "Juan Perez"       # Auto-detecta sexo
  python manage.py seed_demo_doctor --name "Maria Lopez"    # Auto → Dra.
  python manage.py seed_demo_doctor --name "Juan Perez" -m   # Forzar Dr.
  python manage.py seed_demo_doctor --name "Ana Ruiz" -f     # Forzar Dra.
  python manage.py seed_demo_doctor --name "Carlos Vega" --sex M
  python manage.py seed_demo_doctor --with-token             # Simula flujo real con invitación
  python manage.py seed_demo_doctor --cleanup                # Elimina usuarios demo

El motor de detección automática analiza el nombre para asignar
el sexo clínico y tratamiento correcto (Dr./Dra.).
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from core.models import DoctorOperator, DoctorInvitation, InstitutionSettings, Specialty
from core.models import SPECIALTY_CHOICES


# Nombres femeninos comunes para fallback automático
FEMALE_NAMES = {
    "maria",
    "ana",
    "carmen",
    "isabel",
    "rosa",
    "beatriz",
    "sofia",
    "lucia",
    "paula",
    "teresa",
    "clara",
    "julia",
    "victoria",
    "andrea",
    "margarita",
    "elena",
    "fernanda",
    "gabriela",
    "camila",
    "valentina",
    "daniela",
    "carolina",
    "angela",
    "patricia",
    "silvia",
    "mercedes",
    "gloria",
    "adriana",
    "alejandra",
    "constanza",
    "pilar",
    "laura",
    "susana",
    "natalia",
    "monica",
    "veronica",
    "catalina",
    "martina",
    "emma",
    "agustina",
    "florencia",
    "renata",
    "francisca",
    "almendra",
}


def detect_sex_from_name(full_name: str) -> str:
    """
    Detecta el sexo clínico basado en el primer nombre.

    Returns:
        'F' si el nombre termina en 'a' Y no está en la excepción de nombres ambiguos
        'M' como default

    Ejemplos:
        'Maria Lopez' → 'F' (termina en 'a')
        'Jose Perez' → 'M' (no termina en 'a')
        'Andrea Gomez' → 'F' (nombre femenino conocido)
        'Mario Bros' → 'M' (nombre ambiguo, termina en 'o')
    """
    first_name = full_name.split()[0].lower().strip()

    # Si el nombre está en la lista de nombres femenina conocidos
    if first_name in FEMALE_NAMES:
        return "F"

    # Si termina en 'a' y no es un nombre ambiguo, asumir femenino
    if first_name.endswith("a") and first_name not in {
        "arma",
        "eco",
        "mapa",
        "nada",
        "papa",
        "zapa",
    }:
        return "F"

    # Default: masculino
    return "M"


def get_prefix_and_username(full_name: str, sex: str, username_base: str) -> tuple:
    """
    Calcula el prefijo Dr./Dra. y el username adaptativo.

    Returns:
        (prefix, username) donde prefix es 'Dr.' o 'Dra.' y
        username es adaptativo (dr_xxx o dra_xxx)
    """
    if sex == "F":
        prefix = "Dra."
        username = f"dra_{username_base.replace('dr_', '')}"
    else:
        prefix = "Dr."
        username = f"dr_{username_base.replace('dra_', '')}"

    return prefix, username


class Command(BaseCommand):
    help = "Crea doctores de demo/testing para MEDOPZ con perfil completo"

    def add_arguments(self, parser):
        parser.add_argument(
            "--name",
            type=str,
            default="Juan Perez",
            help="Nombre completo del médico (el script auto-detecta el sexo)",
        )
        parser.add_argument(
            "--sex",
            type=str,
            choices=["M", "F"],
            default=None,
            help="Sexo clínico: M=Masculino, F=Femenino (auto-detectado si no se especifica)",
        )
        parser.add_argument(
            "-m",
            "--male",
            action="store_true",
            help="Forzar sexo Masculino (Dr.)",
        )
        parser.add_argument(
            "-f",
            "--female",
            action="store_true",
            help="Forzar sexo Femenino (Dra.)",
        )
        parser.add_argument(
            "--username",
            type=str,
            default=None,
            help="Username personalizado (auto-generado si no se especifica)",
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
            help="Email del médico (default: username@medopz.demo)",
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
        full_name = options["name"]

        # Determinar sexo clínico
        if options["female"]:
            sex = "F"
        elif options["male"]:
            sex = "M"
        elif options["sex"]:
            sex = options["sex"]
        else:
            # Auto-detección basada en nombre
            sex = detect_sex_from_name(full_name)
            self.stdout.write(
                self.style.SUCCESS(
                    f"  Auto-detectado: {full_name.split()[0]} → Sexo Clínico: {'Femenino' if sex == 'F' else 'Masculino'}"
                )
            )

        # Prefijo para display (NO se almacena en full_name, formal_title lo añade automáticamente)
        prefix = "Dra." if sex == "F" else "Dr."

        # Username adaptativo
        name_slug = (
            full_name.lower().replace(" ", "_").replace(".", "").replace("'", "")
        )
        default_username = f"dr_{name_slug}" if sex == "M" else f"dra_{name_slug}"
        username = options["username"] or default_username

        email = options["email"] or f"{username}@medopz.demo"
        with_token = options["with_token"]
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
                    f'⚠️  Especialidad "{specialty_code}" no existe. Usando "general_surgery" como default.'
                )
            )
            specialty, _ = Specialty.objects.get_or_create(
                code="general_surgery", defaults={"name": "Cirugía General"}
            )

        if with_token:
            self._create_invitation_flow(
                username=username,
                full_name=full_name,
                prefix=prefix,
                sex=sex,
                email=email,
                specialty=specialty,
                institution=institution,
            )
        else:
            self._create_direct_doctor(
                username=username,
                full_name=full_name,
                prefix=prefix,
                sex=sex,
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

        try:
            doctor = DoctorOperator.objects.get(user__username=username)
            user = doctor.user
            doctor_name = doctor.full_name
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

        demo_emails = [
            f"{username}@medopz.demo",
            f"dr_demo@medopz.demo",
            f"dra_demo@medopz.demo",
        ]
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
        self,
        username,
        full_name,
        prefix,
        sex,
        email,
        specialty,
        institution,
        is_verified,
    ):
        """Crea doctor directamente (bypass invitación)"""
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write(
            self.style.SUCCESS("  MEDOPZ WORKSTATION - DEMO DOCTOR CREATED")
        )
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
        self.stdout.write(self.style.SUCCESS(f"✓ User Django creado"))

        # Crear DoctorOperator
        doctor = DoctorOperator.objects.create(
            user=user,
            full_name=full_name,
            national_id=national_id,
            email=email,
            license=f"MPPS-{random.randint(100000, 999999)}",
            agregado_id=f"CMV-{random.randint(10000, 99999)}",
            is_verified=is_verified,
            is_active_license=True,
            license_expiry_date=timezone.now().date() + timedelta(days=365),
            gender=sex,
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
        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write(self.style.SUCCESS("  PERFIL PROFESIONAL"))
        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  Profesional:  {prefix} {full_name}"))
        self.stdout.write(
            self.style.SUCCESS(
                f"  Sexo Clínico: {'Femenino' if sex == 'F' else 'Masculino'}"
            )
        )
        self.stdout.write(self.style.SUCCESS(f"  Username:     {username}"))
        self.stdout.write(
            self.style.WARNING(
                "  Password:     [ Autogenerado Seguro / Establecer en Admin ]"
            )
        )
        self.stdout.write(self.style.SUCCESS(f"  Nacional:      {national_id}"))
        self.stdout.write(self.style.SUCCESS(f"  License:      {doctor.license}"))
        self.stdout.write(
            self.style.SUCCESS(f"  Verificado:    {'Sí' if is_verified else 'No'}")
        )
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("  ⚠️  CAMBIAR PASSWORD EN PRODUCCIÓN"))
        self.stdout.write("")

    def _create_invitation_flow(
        self,
        username,
        full_name,
        prefix,
        sex,
        email,
        specialty,
        institution,
    ):
        """Crea invitación (flujo real cerrado)"""
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write(self.style.SUCCESS("  MEDOPZ WORKSTATION - INVITATION FLOW"))
        self.stdout.write(self.style.SUCCESS("═" * 60))
        self.stdout.write("")

        import random

        national_id = f"V-{random.randint(10000000, 29999999)}"
        license_num = f"MPPS-{random.randint(100000, 999999)}"
        colegiao_num = f"CMV-{random.randint(10000, 99999)}"

        invitation = DoctorInvitation.objects.create(
            national_id=national_id,
            full_name=full_name,
            email=email,
            specialty=specialty,
            license_number=license_num,
            colegiado_number=colegiao_num,
            institution=institution,
            invited_by=User.objects.filter(is_superuser=True).first(),
            expires_at=timezone.now() + timedelta(days=7),
            is_used=False,
        )

        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write(self.style.SUCCESS("  INVITATION CREATED - TOKEN GENERATED"))
        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  Profesional:   {prefix} {full_name}"))
        self.stdout.write(
            self.style.SUCCESS(
                f"  Sexo Clínico:  {'Femenino' if sex == 'F' else 'Masculino'}"
            )
        )
        self.stdout.write(self.style.SUCCESS(f"  Email:        {email}"))
        self.stdout.write(
            self.style.SUCCESS(f"  Nacional:      {invitation.national_id}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"  Colegiado:     {invitation.colegiado_number}")
        )
        self.stdout.write(
            self.style.SUCCESS(f"  License:       {invitation.license_number}")
        )
        self.stdout.write(self.style.SUCCESS(f"  Especialidad:  {specialty.name}"))
        self.stdout.write(self.style.SUCCESS(f"  Institución:   {institution.name}"))
        self.stdout.write(
            self.style.SUCCESS(f"  Expira:       {invitation.expires_at}")
        )
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
        self.stdout.write(self.style.SUCCESS("  Para activar, llamar:"))
        self.stdout.write(
            self.style.SUCCESS(
                f"  POST /api/doctor/activate/ "
                f'{{"token": "{invitation.token[:16]}...", "username": "...", "password": "..."}}'
            )
        )
        self.stdout.write("")
