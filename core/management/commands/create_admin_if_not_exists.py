from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
import os

User = get_user_model()


class Command(BaseCommand):
    help = "Creates admin superuser from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME)"

    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL", "").strip()
        password = os.environ.get("ADMIN_PASSWORD", "").strip()
        username = os.environ.get(
            "ADMIN_USERNAME", email.split("@")[0] if email else "admin"
        ).strip()

        if not email:
            self.stdout.write(
                self.style.WARNING(
                    "ADMIN_EMAIL not set. Skipping admin creation. "
                    "Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME in Railway env vars."
                )
            )
            return

        if not password:
            self.stdout.write(
                self.style.WARNING("ADMIN_PASSWORD not set. Cannot create admin user.")
            )
            return

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin user created: {email}"))
        else:
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.username = username
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Admin user updated: {email}"))
