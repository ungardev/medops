from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from core.services.icd_sync import ICDAPIClient, sync_root_codes, log_update

class Command(BaseCommand):
    help = "Sincroniza el catálogo ICD-11 en core_icd11entry"

    def add_arguments(self, parser):
        parser.add_argument("--lang", type=str, default="es", help="Idioma: es|en")
        parser.add_argument("--roots", nargs="*", default=["01"], help="Códigos raíz a sincronizar")
        parser.add_argument("--base", type=str, default=None, help="Override base URL")

    def handle(self, *args, **options):
        lang = options["lang"]
        roots = options["roots"]
        base = options["base"] or (settings.ICD_API_BASE_ES if lang == "es" else settings.ICD_API_BASE_EN)

        client_id = getattr(settings, "ICD_CLIENT_ID", None)
        client_secret = getattr(settings, "ICD_CLIENT_SECRET", None)
        if not client_id or not client_secret:
            raise CommandError("ICD_CLIENT_ID/ICD_CLIENT_SECRET no configurados.")

        client = ICDAPIClient(client_id, client_secret, base_url=base)
        self.stdout.write(self.style.WARNING(f"Autenticando contra {base} (lang={lang})..."))
        client.authenticate()
        self.stdout.write(self.style.SUCCESS("Token obtenido."))

        self.stdout.write(self.style.WARNING(f"Sincronizando raíces: {roots}"))
        stats = sync_root_codes(client, roots=roots, lang=lang)
        log_update(lang=lang, stats=stats, source=base)

        self.stdout.write(self.style.SUCCESS(f"Sync ICD-11 completado: {stats}"))