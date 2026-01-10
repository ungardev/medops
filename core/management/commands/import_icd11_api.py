import os, time, requests
from django.core.management.base import BaseCommand
from core.models import ICD11Entry, ICD11UpdateLog

# Contenedores locales ICD-API
API_BASE_ES = os.getenv("ICD_API_BASE_ES", "http://localhost:8081/icd")
API_BASE_EN = os.getenv("ICD_API_BASE_EN", "http://localhost:8082/icd")
RELEASE = "2025-01"   # release cargado en los contenedores

class Command(BaseCommand):
    help = "Importa catálogo ICD-11 completo desde ICD-API local (Docker), español + inglés"

    def handle(self, *args, **kwargs):
        seen, added, updated = set(), 0, 0

        def fetch_entity(api_base, entity_id, parent_code=None, lang="en"):
            headers = {"Accept": "application/json", "Accept-Language": lang}
            url = f"{api_base}/entity/{entity_id}"
            r = requests.get(url, headers=headers)
            r.raise_for_status()
            payload = r.json()

            code = payload.get("code") or payload.get("theCode")
            title = payload.get("title", {}).get(lang) or payload.get("title")
            definition = payload.get("definition", {}).get(lang)
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
            time.sleep(0.02)

            # Recorrer hijos
            children_url = f"{api_base}/entity/{entity_id}/children"
            rc = requests.get(children_url, headers=headers)
            if rc.status_code == 200:
                for child in rc.json().get("child", []):
                    fetch_entity(api_base, child["id"], parent_code=code, lang=lang)

        def import_linearization(api_base, lang):
            headers = {"Accept": "application/json", "Accept-Language": lang}
            release_url = f"{api_base}/release/11/{RELEASE}/mms"
            r = requests.get(release_url, headers=headers)
            r.raise_for_status()
            for ch in r.json().get("child", []):
                fetch_entity(api_base, ch["id"], lang=lang)

        # Importar primero español, luego inglés
        import_linearization(API_BASE_ES, "es")
        import_linearization(API_BASE_EN, "en")

        removed = ICD11Entry.objects.exclude(icd_code__in=seen).count()
        ICD11Entry.objects.exclude(icd_code__in=seen).delete()

        ICD11UpdateLog.objects.create(
            source=f"{API_BASE_ES} + {API_BASE_EN} /release/11/{RELEASE}/mms",
            added=added,
            updated=updated,
            removed=removed,
        )

        self.stdout.write(self.style.SUCCESS(
            f"✅ ICD-11 importado (Docker local ES+EN): {added} nuevos, {updated} actualizados, {removed} eliminados"
        ))
