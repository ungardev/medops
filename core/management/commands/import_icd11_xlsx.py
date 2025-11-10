from django.core.management.base import BaseCommand
from core.models import ICD11Entry, ICD11UpdateLog
import pandas as pd

class Command(BaseCommand):
    help = "Importa catálogo ICD-11 desde archivo XLSX (LinearizationMiniOutput-MMS-en.xlsx)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Ruta al archivo XLSX ICD-11 MMS"
        )

    def handle(self, *args, **opts):
        path = opts["file"]
        self.stdout.write(self.style.NOTICE(f"📥 Importando ICD-11 desde {path}..."))

        # Leer Excel con pandas
        df = pd.read_excel(path)

        created, updated, removed = 0, 0, 0
        seen_codes = set()

        # Ajusta los nombres de columnas según el XLSX real
        for _, row in df.iterrows():
            code = str(row.get("Code") or "").strip()
            title = str(row.get("Title") or "").strip()
            definition = str(row.get("Definition") or "").strip()
            foundation_id = str(row.get("Id") or "").strip()
            parent = str(row.get("Parent") or "").strip()

            if not code or not title:
                continue

            seen_codes.add(code)

            obj, created_flag = ICD11Entry.objects.update_or_create(
                icd_code=code,
                defaults={
                    "title": title,
                    "foundation_id": foundation_id or None,
                    "definition": definition or None,
                    "synonyms": [],  # si no hay columna de sinónimos
                    "parent_code": parent or None,
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
