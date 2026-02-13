# core/management/commands/sync_icd_en.py
import requests
from django.core.management.base import BaseCommand
from core.models import ICD11Entry, ICD11UpdateLog
# Usar el contenedor ICD-API en inglés
BASE_URL = "http://icdapi_en:80/icd/release/11/2025-01/mms"
HEADERS = {
    "Accept": "application/json",
    "API-Version": "v2",
    "Accept-Language": "en"  # inglés
}
def fetch_entity(entity_id=""):
    url = f"{BASE_URL}/{entity_id}" if entity_id else BASE_URL
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()
def ingest_icd11():
    root = fetch_entity()
    queue = root.get("child", [])
    visited = set()
    added, updated = 0, 0
    while queue:
        entity_url = queue.pop(0)
        entity_id = entity_url.split("/")[-1]
        if entity_id in visited:
            continue
        visited.add(entity_id)
        data = fetch_entity(entity_id)
        code = data.get("code", "")
        title = data.get("title", {}).get("@value", "")
        foundation_id = data.get("source")
        definition = data.get("definition", {}).get("@value")
        synonyms = [t["label"]["@value"] for t in data.get("indexTerm", [])]
        exclusions = data.get("exclusion", [])
        children = data.get("child", [])
        ICD11Entry.objects.update_or_create(
            icd_code=code or entity_id,
            language="en",  # inglés
            defaults={
                "title": title,
                "foundation_id": foundation_id,
                "definition": definition,
                "synonyms": synonyms,
                "exclusions": exclusions,
                "children": children
            }
        )
        if code:
            added += 1
        else:
            updated += 1
        for child in children:
            child_id = child.split("/")[-1]
            if child_id in ("unspecified", "other"):
                continue
            queue.append(child_id)
    ICD11UpdateLog.objects.create(
        source=BASE_URL,
        added=added,
        updated=updated,
        removed=0
    )
class Command(BaseCommand):
    help = "Sincroniza ICD-11 en inglés desde el contenedor local ICD-API"
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Iniciando sincronización ICD-11 (inglés)..."))
        ingest_icd11()
        self.stdout.write(self.style.SUCCESS("Sincronización completada (inglés)."))