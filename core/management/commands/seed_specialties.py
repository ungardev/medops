# core/management/commands/seed_specialties.py
from django.core.management.base import BaseCommand
from core.models import Specialty, SPECIALTY_CHOICES

class Command(BaseCommand):
    help = "Seed de especialidades médicas en la base de datos"

    def handle(self, *args, **kwargs):
        created = 0
        for code, name in SPECIALTY_CHOICES:
            obj, was_created = Specialty.objects.get_or_create(code=code, defaults={"name": name})
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"✅ Seed completado: {created} especialidades creadas"))
