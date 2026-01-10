import os, time, requests
from django.core.management.base import BaseCommand
from core.models import ICD11Entry, ICD11UpdateLog

TOKEN_URL = "https://icdaccessmanagement.who.int/connect/token"
API_BASE = "https://id.who.int/icd"
RELEASE = "11/2025-01/mms"   # 👈 corregido: incluye el prefijo 11/

class Command(BaseCommand):
    help = "Importa catálogo ICD-11 completo desde ICD-API"

    def get_token(self):
        data = {
            "client_id": os.getenv("ICD_CLIENT_ID"),
            "client_secret": os.getenv("ICD_CLIENT_SECRET"),
            "scope": "icdapi_access",
            "grant_type": "client_credentials",
        }
        r = requests.post(TOKEN_URL, data=data)
        r.raise_for_status()
        return r.json()["access_token"]

    def handle(self, *args, **kwargs):
        token = self.get_token()
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

        seen, added, updated = set(), 0, 0

        def fetch_entity(entity_id, parent_code=None):
            url = f"{API_BASE}/entity/{entity_id}"   # 👈 corregido: ya no lleva /release
            r = requests.get(url, headers=headers)
            r.raise_for_status()
            payload = r.json()

            code = payload.get("code") or payload.get("theCode")
            title = payload.get("title", {}).get("en") or payload.get("title")
            definition = payload.get("definition", {}).get("en")
            foundation_id = payload.get("id")
            synonyms = payload.get("synonyms", [])

            if not code or not title:
                return

            obj, created_flag = ICD11Entry.objects.update_or_create(
                icd_code=code,
                defaults={
                    "title": title,
                    "foundation_id": foundation_id,
                    "definition": definition,
                    "synonyms": synonyms,
                    "parent_code": parent_code,
                },
            )
            if created_flag:
                nonlocal added
                added += 1
            else:
                nonlocal updated
                updated += 1

            seen.add(code)
            time.sleep(0.05)

            # Recorrer hijos
            children_url = f"{API_BASE}/entity/{entity_id}/children"   # 👈 corregido
            rc = requests.get(children_url, headers=headers)
            if rc.status_code == 200:
                for child in rc.json().get("child", []):   # 👈 la clave es "child"
                    fetch_entity(child["id"], parent_code=code)

        # Recorrer capítulos raíz desde el release
        release_url = f"{API_BASE}/release/{RELEASE}"
        r = requests.get(release_url, headers=headers)
        r.raise_for_status()
        for ch in r.json().get("child", []):   # 👈 la clave es "child"
            fetch_entity(ch["id"])

        removed = ICD11Entry.objects.exclude(icd_code__in=seen).count()
        ICD11Entry.objects.exclude(icd_code__in=seen).delete()

        ICD11UpdateLog.objects.create(
            source=f"{API_BASE}/release/{RELEASE}",
            added=added,
            updated=updated,
            removed=removed,
        )

        self.stdout.write(self.style.SUCCESS(
            f"✅ ICD-11 importado: {added} nuevos, {updated} actualizados, {removed} eliminados"
        ))
