# core/management/commands/seed_demo_patient.py
"""
Management Command: seed_demo_patient

Crea pacientes de demo/testing para MEDOPZ con perfil completo.

Uso:
  python manage.py seed_demo_patient --name "Ungar Villamizar"     # Auto-detecta sexo
  python manage.py seed_demo_patient --name "Maria Lopez" -f     # Forzar femenino
  python manage.py seed_demo_patient --name "Carlos Perez" -m    # Forzar masculino
  python manage.py seed_demo_patient --with-token               # Simula flujo real con invitación
  python manage.py seed_demo_patient --cleanup                   # Elimina usuarios demo

El motor de detección automática analiza el nombre para asignar
el sexo clínico y tratamiento correcto (Sr./Sra.).
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from core.models import Patient, PatientUser, PatientInvitation, InstitutionSettings


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
        'Maria Lopez' -> 'F' (termina en 'a')
        'Jose Perez' -> 'M' (no termina en 'a')
        'Andrea Gomez' -> 'F' (nombre femenino conocido)
        'Mario Bros' -> 'M' (nombre ambiguo, termina en 'o')
    """
    first_name = full_name.split()[0].lower().strip()

    if first_name in FEMALE_NAMES:
        return "F"

    if first_name.endswith("a") and first_name not in {
        "arma",
        "eco",
        "mapa",
        "nada",
        "papa",
        "zapa",
    }:
        return "F"

    return "M"


def get_prefix(full_name: str, sex: str) -> str:
    """
    Calcula el prefijo Sr./Sra. basado en el sexo.
    """
    if sex == "F":
        return "Sra."
    return "Sr."


class Command(BaseCommand):
    help = "Crea pacientes de demo/testing para MEDOPZ con perfil completo"

    def add_arguments(self, parser):
        parser.add_argument(
            "--name",
            type=str,
            required=True,
            help="Nombre completo del paciente (el script auto-detecta el sexo)",
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
            help="Forzar sexo Masculino (Sr.)",
        )
        parser.add_argument(
            "-f",
            "--female",
            action="store_true",
            help="Forzar sexo Femenino (Sra.)",
        )
        parser.add_argument(
            "--email",
            type=str,
            default=None,
            help="Email del paciente (default: username@patient.medopz.demo)",
        )
        parser.add_argument(
            "--phone",
            type=str,
            default=None,
            help="Teléfono del paciente (opcional)",
        )
        parser.add_argument(
            "--national-id",
            type=str,
            default=None,
            help="Cédula de identidad (default: auto-generada)",
        )
        parser.add_argument(
            "--birthdate",
            type=str,
            default=None,
            help="Fecha de nacimiento (formato: YYYY-MM-DD, default: 1990-01-01)",
        )
        parser.add_argument(
            "--with-token",
            action="store_true",
            help="Crear invitación en lugar de registro directo (simula flujo real)",
        )
        parser.add_argument(
            "--verified",
            action="store_true",
            default=True,
            help="Marcar paciente como verificado (default: True)",
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
            sex = detect_sex_from_name(full_name)
            self.stdout.write(
                self.style.INFO(
                    f"  Auto-detectado: {full_name.split()[0]} -> Sexo Clínico: {'Femenino' if sex == 'F' else 'Masculino'}"
                )
            )

        # Nombre formateado con prefijo
        prefix = get_prefix(full_name, sex)
        full_name_formatted = f"{prefix} {full_name}"

        # Email
        name_slug = (
            full_name.lower().replace(" ", "_").replace(".", "").replace("'", "")
        )
        default_email = f"{name_slug}@patient.medopz.demo"
        email = options["email"] or default_email

        # Datos opcionales
        phone = options["phone"]
        national_id = options["national_id"]
        birthdate = options["birthdate"] or "1990-01-01"
        with_token = options["with_token"]
        is_verified = options["verified"]
        cleanup = options["cleanup"]

        # Cleanup si solicitado
        if cleanup:
            self._cleanup_demo_users(email)
            return

        if with_token:
            self._create_invitation_flow(
                full_name=full_name,
                full_name_formatted=full_name_formatted,
                sex=sex,
                email=email,
                phone=phone,
            )
        else:
            self._create_direct_patient(
                full_name=full_name,
                full_name_formatted=full_name_formatted,
                sex=sex,
                email=email,
                phone=phone,
                national_id=national_id,
                birthdate=birthdate,
                is_verified=is_verified,
            )

    def _cleanup_demo_users(self, email):
        """Elimina usuarios demo existentes"""
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("=" * 60))
        self.stdout.write(self.style.WARNING("  MEDOPZ PATIENT CLEANUP MODE"))
        self.stdout.write(self.style.WARNING("=" * 60))
        self.stdout.write("")

        try:
            patient_user = PatientUser.objects.get(email=email)
            patient = patient_user.patient
            user = patient_user.user
            patient_name = f"{patient.first_name} {patient.last_name}"

            # Eliminar en orden correcto (foreign keys)
            patient_user.delete()
            user.delete()

            self.stdout.write(self.style.SUCCESS(f"✓ PatientUser eliminado: {email}"))
            self.stdout.write(
                self.style.SUCCESS(f"✓ Patient eliminado: {patient_name}")
            )
            self.stdout.write(self.style.SUCCESS(f"✓ User Django eliminado"))
        except PatientUser.DoesNotExist:
            self.stdout.write(
                self.style.WARNING(f"⚠️  No existe PatientUser con email: {email}")
            )

        try:
            invitation = PatientInvitation.objects.get(email=email, status="pending")
            inv_name = invitation.patient.first_name if invitation.patient else email
            invitation.delete()
            self.stdout.write(self.style.SUCCESS(f"✓ Invitación eliminada"))
        except PatientInvitation.DoesNotExist:
            pass

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  LIMPIEZA COMPLETADA"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

    def _create_direct_patient(
        self,
        full_name,
        full_name_formatted,
        sex,
        email,
        phone,
        national_id,
        birthdate,
        is_verified,
    ):
        """Crea paciente directamente con Patient + PatientUser"""
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(
            self.style.SUCCESS("  MEDOPZ WORKSTATION - DEMO PATIENT CREATED")
        )
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

        # Verificar si el email ya existe
        if PatientUser.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  PatientUser con email "{email}" ya existe. Ejecuta con --cleanup primero.'
                )
            )
            return

        # Generar cédula si no se proporcionó
        import random

        if not national_id:
            national_id = f"V-{random.randint(10000000, 29999999)}"

        name_parts = full_name.split()
        first_name = name_parts[0] if len(name_parts) > 0 else full_name
        last_name = name_parts[-1] if len(name_parts) > 1 else ""

        # Generar password temporal seguro
        import secrets

        temp_password = secrets.token_urlsafe(16)

        # 1. Crear Patient (registro clínico)
        from datetime import datetime

        try:
            birth_date_parsed = datetime.strptime(birthdate, "%Y-%m-%d").date()
        except ValueError:
            birth_date_parsed = datetime(1990, 1, 1).date()

        patient = Patient.objects.create(
            first_name=first_name,
            last_name=last_name,
            national_id=national_id,
            birthdate=birth_date_parsed,
            gender=sex,
            email=email,
            phone_number=phone,
            active=True,
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Patient (clinical record) creado"))

        # 2. Crear Django User
        user = User.objects.create_user(
            username=email.split("@")[0],  # Use email prefix as username
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
        )
        self.stdout.write(self.style.SUCCESS(f"✓ User Django creado"))

        # 3. Crear PatientUser (autenticación del portal)
        patient_user = PatientUser.objects.create(
            user=user,
            patient=patient,
            email=email,
            is_verified=is_verified,
            is_active=True,
        )
        self.stdout.write(self.style.SUCCESS(f"✓ PatientUser (portal auth) creado"))

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write(self.style.SUCCESS("  PERFIL PROFESIONAL"))
        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  Profesional:  {full_name_formatted}"))
        self.stdout.write(
            self.style.SUCCESS(
                f"  Sexo Clínico: {'Femenino' if sex == 'F' else 'Masculino'}"
            )
        )
        self.stdout.write(self.style.SUCCESS(f"  Email:        {email}"))
        self.stdout.write(self.style.SUCCESS(f"  Username:     {email.split('@')[0]}"))
        self.stdout.write(
            self.style.WARNING(
                "  Password:     [ Autogenerado Seguro / Establecer en Admin ]"
            )
        )
        self.stdout.write(self.style.SUCCESS(f"  Nacional:      {national_id}"))
        self.stdout.write(self.style.SUCCESS(f"  Fecha Nac.:    {birthdate}"))
        self.stdout.write(
            self.style.SUCCESS(f"  Verificado:    {'Sí' if is_verified else 'No'}")
        )
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("  ⚠️  CAMBIAR PASSWORD EN PRODUCCIÓN"))
        self.stdout.write("")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("  Portal: https://patient.medopz.com"))
        self.stdout.write("")

    def _create_invitation_flow(
        self, full_name, full_name_formatted, sex, email, phone
    ):
        """Crea invitación (flujo real cerrado)"""
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(
            self.style.SUCCESS("  MEDOPZ WORKSTATION - PATIENT INVITATION FLOW")
        )
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

        import random

        # Generar cédula ficticia
        national_id = f"V-{random.randint(10000000, 29999999)}"

        name_parts = full_name.split()
        first_name = name_parts[0] if len(name_parts) > 0 else full_name
        last_name = name_parts[-1] if len(name_parts) > 1 else ""

        # Primero crear el Patient (necesario para la invitación)
        patient = Patient.objects.create(
            first_name=first_name,
            last_name=last_name,
            national_id=national_id,
            birthdate=datetime(1990, 1, 1).date(),
            gender=sex,
            email=email,
            phone_number=phone,
            active=True,
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Patient (clinical record) creado"))

        # Obtener una institución y un doctor para la invitación
        institution = InstitutionSettings.objects.first()
        admin_user = User.objects.filter(is_superuser=True).first()

        if not institution:
            self.stdout.write(
                self.style.ERROR(
                    "✗ No existe ninguna institución. No se puede crear invitación."
                )
            )
            return

        # Crear invitación de paciente
        invitation = PatientInvitation.objects.create(
            patient=patient,
            email=email,
            phone=phone,
            doctor=None,  # Podría vincularse a un doctor específico
            invited_by=admin_user,
            expires_at=timezone.now() + timedelta(days=7),
            status="pending",
            payment_reference=f"PV-{random.randint(100000, 999999)}",
        )

        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write(self.style.SUCCESS("  INVITATION CREATED - TOKEN GENERATED"))
        self.stdout.write(
            self.style.SUCCESS("  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"  Profesional:   {full_name_formatted}"))
        self.stdout.write(
            self.style.SUCCESS(
                f"  Sexo Clínico:   {'Femenino' if sex == 'F' else 'Masculino'}"
            )
        )
        self.stdout.write(self.style.SUCCESS(f"  Email:         {email}"))
        self.stdout.write(self.style.SUCCESS(f"  Nacional:       {national_id}"))
        self.stdout.write(
            self.style.SUCCESS(f"  Expira:        {invitation.expires_at}")
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
                f"  POST /api/patient-activate/ "
                f'{{"token": "{invitation.token[:16]}...", "password": "..."}}'
            )
        )
        self.stdout.write("")
