from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from core.models import ICD11Entry, ICD11UpdateLog
import requests


class ICDAPIClient:
    def __init__(self, client_id, client_secret, base_url):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url.rstrip("/")
        self.token = None

    def authenticate(self):
        # Autenticación real contra ICD API (OAuth2 client_credentials)
        resp = requests.post(
            "https://icdaccessmanagement.who.int/connect/token",
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "icdapi_access",
                "grant_type": "client_credentials",
            },
        )
        resp.raise_for_status()
        self.token = resp.json()["access_token"]

    def fetch_children(self, root_code, lang="es"):
        if not self.token:
            raise CommandError("No se ha autenticado contra ICD API.")
        headers = {"Authorization": f"Bearer {self.token}"}
        url = f"{self.base_url}/entity/{root_code}/children?lang={lang}"
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        children = []
        for child in data.get("child", []):
            code = child["id"].split("/")[-1]
            title = ""
            if "title" in child and isinstance(child["title"], dict):
                title = child["title"].get("@value", "")
            children.append({"code": code, "title": title, "lang": lang})
        return children


def sync_root_codes(client, roots, lang="es"):
    stats = {"created": 0, "updated": 0, "errors": 0}
    for root in roots:
        try:
            children = client.fetch_children(root, lang=lang)
            for child in children:
                obj, created = ICD11Entry.objects.update_or_create(
                    icd_code=child["code"],
                    defaults={"title": child["title"], "language": child["lang"]},
                )
                if created:
                    stats["created"] += 1
                else:
                    stats["updated"] += 1
        except Exception as e:
            stats["errors"] += 1
    return stats


def log_update(lang, stats, source):
    # Ajustado a los campos reales del modelo ICD11UpdateLog
    ICD11UpdateLog.objects.create(
        source=source,
        added=stats.get("created", 0),
        updated=stats.get("updated", 0),
        removed=stats.get("errors", 0),
    )


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