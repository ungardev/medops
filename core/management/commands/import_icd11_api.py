import os, time, requests
from django.core.management.base import BaseCommand
from core.models import ICD11Entry, ICD11UpdateLog
from requests import Response

# Contenedores locales ICD-API (ajustados con /icd)
API_BASE_ES = os.getenv("ICD_API_BASE_ES", "http://icdapi_es/icd")
API_BASE_EN = os.getenv("ICD_API_BASE_EN", "http://icdapi_en/icd")
RELEASE = "2025-01"   # release cargado en los contenedores

MAX_RETRIES = 5
RETRY_DELAY = 10  # segundos

class Command(BaseCommand):
    help = "Importa catálogo ICD-11 completo desde ICD-API local (Docker), español + inglés"

    def handle(self, *args, **kwargs):
        seen, added, updated = set(), 0, 0

        def safe_get(url: str, headers: dict) -> Response:
            """Realiza GET con reintentos para evitar ConnectionRefused en arranques lentos."""
            last_exc = None
            for attempt in range(MAX_RETRIES):
                try:
                    r: Response = requests.get(url, headers=headers, timeout=30)
                    r.raise_for_status()
                    return r
                except requests.exceptions.ConnectionError as e:
                    last_exc = e
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(RETRY_DELAY)
                    else:
                        raise
            # nunca debería llegar aquí
            raise last_exc if last_exc else RuntimeError("safe_get falló sin excepción")

        def fetch_entity(api_base, entity_id, parent_code=None, lang="en"):
            headers = {
                "Accept": "application/json",
                "Accept-Language": lang,
                "API-Version": "v2",
            }
            url = f"{api_base}/entity/{entity_id}?releaseId={RELEASE}"
            r = safe_get(url, headers)
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
            children_url = f"{api_base}/entity/{entity_id}/children?releaseId={RELEASE}"
            rc = safe_get(children_url, headers)
            if rc.status_code == 200:
                for child in rc.json().get("child", []):
                    fetch_entity(api_base, child["id"], parent_code=code, lang=lang)

        def import_linearization(api_base, lang):
            headers = {
                "Accept": "application/json",
                "Accept-Language": lang,
                "API-Version": "v2",
            }
            release_url = f"{api_base}/release/11/{RELEASE}/mms"
            r = safe_get(release_url, headers)
            for ch in r.json().get("child", []):
                fetch_entity(api_base, ch, lang=lang)

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
