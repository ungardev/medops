from django.core.management.base import BaseCommand
from core.models import ICD11Entry, ICD11UpdateLog
import json

class Command(BaseCommand):
    help = "Importa catálogo ICD-11 desde JSON oficial y versiona cambios"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Ruta al archivo JSON ICD-11 Foundation"
        )

    def handle(self, *args, **opts):
        path = opts["file"]
        self.stdout.write(self.style.NOTICE(f"📥 Importando ICD-11 desde {path}..."))

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        created, updated, removed = 0, 0, 0
        seen_codes = set()

        # Adaptar a la estructura del JSON oficial ICD-11 Foundation
        for entity in data.get("entities", []):
            code = entity.get("code")
            title = (entity.get("title") or {}).get("@value")
            foundation_id = entity.get("id")
            definition = (entity.get("definition") or {}).get("@value")
            synonyms = [s.get("@value") for s in entity.get("synonyms", [])]
            parent = entity.get("parentCode")

            if not code or not title:
                continue

            seen_codes.add(code)

            obj, created_flag = ICD11Entry.objects.update_or_create(
                icd_code=code,
                defaults={
                    "title": title,
                    "foundation_id": foundation_id,
                    "definition": definition,
                    "synonyms": synonyms or [],
                    "parent_code": parent,
                }
            )
            if created_flag:
                created += 1
            else:
                updated += 1

        # Detectar códigos eliminados
        removed = ICD11Entry.objects.exclude(icd_code__in=seen_codes).count()
        ICD11Entry.objects.exclude(icd_code__in=seen_codes).delete()

        # Registrar log
        ICD11UpdateLog.objects.create(
            source=path,
            added=created,
            updated=updated,
            removed=removed,
        )

        self.stdout.write(self.style.SUCCESS(
            f"✅ ICD-11 importado: {created} nuevos, {updated} actualizados, {removed} eliminados"
        ))
