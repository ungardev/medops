# core/management/commands/import_icd11_api.py
import requests
from django.core.management.base import BaseCommand
from core.models import ICD11Entry, ICD11UpdateLog
# Usar puertos externos (localhost) porque el puerto 80 no está accesible internamente
API_BASE_ES = "http://localhost:8081/icd/release/11/2025-01/mms"
API_BASE_EN = "http://localhost:8082/icd/release/11/2025-01/mms"
HEADERS_ES = {
    "Accept": "application/json",
    "API-Version": "v2",
    "Accept-Language": "es"
}
HEADERS_EN = {
    "Accept": "application/json",
    "API-Version": "v2",
    "Accept-Language": "en"
}
MAX_RETRIES = 5
RETRY_DELAY = 2  # segundos
class Command(BaseCommand):
    help = "Importa ICD-11 completo desde contenedores Docker locales (español + inglés)"
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("🗃️ Iniciando importación ICD-11 bilingüe (ES + EN)..."))
        
        # Importar español
        self.stdout.write(self.style.NOTICE(f"📥 Importando español desde: {API_BASE_ES}"))
        seen_es = self.import_language(API_BASE_ES, HEADERS_ES, "es")
        
        # Importar inglés
        self.stdout.write(self.style.NOTICE(f"📥 Importando inglés desde: {API_BASE_EN}"))
        seen_en = self.import_language(API_BASE_EN, HEADERS_EN, "en")
        
        # Combinar todos los códigos vistos
        all_seen = seen_es.union(seen_en)
        
        # Limpiar registros obsoletos
        removed = ICD11Entry.objects.exclude(icd_code__in=all_seen).count()
        ICD11Entry.objects.exclude(icd_code__in=all_seen).delete()
        
        self.stdout.write(self.style.SUCCESS(
            f"✅ ICD-11 bilingüe completado: {len(seen_es)} ES, {len(seen_en)} EN, {removed} eliminados"
        ))
    def safe_get(self, url, headers):
        """Realiza GET con reintentos."""
        last_exc = None
        for attempt in range(MAX_RETRIES):
            try:
                r = requests.get(url, headers=headers, timeout=30)
                r.raise_for_status()
                return r
            except requests.exceptions.ConnectionError as e:
                last_exc = e
                if attempt < MAX_RETRIES - 1:
                    import time
                    time.sleep(RETRY_DELAY)
                else:
                    raise
        raise last_exc if last_exc else RuntimeError("safe_get falló sin excepción")
    def fetch_entity(self, api_base, headers, entity_id=""):
        """Obtiene una entidad del ICD-API."""
        url = f"{api_base}/{entity_id}" if entity_id else api_base
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        return resp.json()
    def import_language(self, api_base, headers, lang):
        """Importa todos los códigos de un idioma específico."""
        seen = set()
        added, updated = 0, 0
        
        # Obtener lista raíz
        root = self.fetch_entity(api_base, headers)
        queue = root.get("child", [])
        
        while queue:
            entity_url = queue.pop(0)
            entity_id = entity_url.split("/")[-1]
            
            if entity_id in seen:
                continue
            seen.add(entity_id)
            
            # Obtener datos de la entidad
            data = self.fetch_entity(api_base, headers, entity_id)
            
            code = data.get("code", "") or entity_id
            title = data.get("title", {}).get("@value", "")
            foundation_id = data.get("source")
            definition = data.get("definition", {}).get("@value")
            synonyms = [t["label"]["@value"] for t in data.get("indexTerm", [])]
            exclusions = data.get("exclusion", [])
            children = data.get("child", [])
            
            # Guardar en BD
            obj, created = ICD11Entry.objects.update_or_create(
                icd_code=code,
                defaults={
                    "title": title,
                    "foundation_id": foundation_id,
                    "definition": definition,
                    "synonyms": synonyms,
                    "exclusions": exclusions,
                    "children": children,
                    "language": lang,
                }
            )
            
            if created:
                added += 1
            else:
                updated += 1
            
            # Filtrar y encolar hijos válidos
            for child in children:
                child_id = child.split("/")[-1]
                if child_id not in ("unspecified", "other"):
                    queue.append(child_id)
            
            import time
            time.sleep(0.02)
        
        # Crear log
        ICD11UpdateLog.objects.create(
            source=api_base,
            added=added,
            updated=updated,
            removed=0
        )
        
        self.stdout.write(self.style.SUCCESS(
            f"   ✅ {lang.upper()}: {added} nuevos, {updated} actualizados"
        ))
        
        return seen