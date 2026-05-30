#!/usr/bin/env python3
"""
MEDOPZ - SYNC DE PARROQUIAS (MODO SEGURO)
==========================================
Este script sincroniza parroquias faltantes desde backup SQL a producción.
SOLO INSERTA, nunca modifica o elimina datos existentes.
Idempotente: puede correr múltiples veces con el mismo resultado.

Uso en Railway:
    railway run python scripts/sync_parishes_railway.py

Uso local (solo testing):
    python scripts/sync_parishes_railway.py --local
"""

import os
import sys

# Configurar Django para Railway
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medops.settings")

import django

django.setup()

from core.models import Parish, Municipality

BACKUP_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "backups",
    "medops_backup_2026-04-20_1111.sql",
)


def parse_backup_parishes():
    """Lee el backup SQL y retorna diccionario de parroquias."""
    parishes = {}

    if not os.path.exists(BACKUP_PATH):
        print(f"ERROR: Backup no encontrado en {BACKUP_PATH}")
        return parishes

    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    in_parish_section = False
    for line in lines:
        if "COPY public.core_parish" in line:
            in_parish_section = True
            continue

        if in_parish_section:
            if line.strip() == "\\." or "COPY public" in line:
                break
            parts = line.strip().split("\t")
            if len(parts) >= 3:
                try:
                    parish_id = int(parts[0].strip())
                    name = parts[1].strip()
                    municipality_id = int(parts[2].strip())
                    parishes[parish_id] = (name, municipality_id)
                except (ValueError, IndexError):
                    continue

    return parishes


def sync_parishes():
    """Sincroniza parroquias faltantes desde backup a producción."""

    print("=" * 60)
    print("MEDOPZ - SYNC DE PARROQUIAS (MODO SEGURO)")
    print("=" * 60)

    # 1. Leer backup
    print("\n[1/5] Leyendo backup (solo lectura)...")
    if not os.path.exists(BACKUP_PATH):
        print(f"       ERROR: {BACKUP_PATH} no existe")
        print("       necesitas subir el backup a Railway primero:")
        print("       railway upload backups/medops_backup_2026-04-20_1111.sql")
        return

    backup_parishes = parse_backup_parishes()
    print(f"       Backup tiene: {len(backup_parishes)} parroquias")

    if len(backup_parishes) == 0:
        print("       ERROR: No se pudieron leer parroquias del backup")
        return

    # 2. Obtener existentes en producción
    print("\n[2/5] Consultando producción...")
    existing_ids = set(Parish.objects.values_list("id", flat=True))
    print(f"       Producción tiene: {len(existing_ids)} parroquias")

    # 3. Calcular faltantes
    print("\n[3/5] Calculando faltantes...")
    missing_ids = set(backup_parishes.keys()) - existing_ids
    print(f"       Faltan en producción: {len(missing_ids)} parroquias")

    if len(missing_ids) == 0:
        print("\n✅ NO hay parroquias faltantes. Todo está sincronizado.")
        return

    # 4. Mostrar breakdown
    print("\n       Breakdown de faltantes por rango de 100:")
    ranges = {}
    for pid in sorted(missing_ids):
        range_key = f"{(pid // 100) * 100 + 1}-{(pid // 100) * 100 + 100}"
        ranges[range_key] = ranges.get(range_key, 0) + 1

    for r in sorted(ranges.keys()):
        print(f"         IDs {r}: {ranges[r]} parroquias")

    # 5. Verificar que los municipality_id existen
    print("\n[4/5] Verificando integridad referencial...")
    missing_muni_ids = set()
    for pid in missing_ids:
        muni_id = backup_parishes[pid][1]
        if not Municipality.objects.filter(id=muni_id).exists():
            missing_muni_ids.add(muni_id)

    if missing_muni_ids:
        print(
            f"       ⚠️  ATENCIÓN: {len(missing_muni_ids)} municipality_ids no existen en prod"
        )
        print(f"           IDs faltantes: {sorted(missing_muni_ids)[:20]}...")
        print("       Estas parroquias serán saltadas.")

    # 6. bulk_create
    print("\n[5/5] Insertando faltantes en producción...")
    to_create = []
    skipped = 0

    for pid in sorted(missing_ids):
        name, municipality_id = backup_parishes[pid]

        # Saltar si municipality_id no existe
        if (
            municipality_id not in missing_muni_ids
            and not Municipality.objects.filter(id=municipality_id).exists()
        ):
            skipped += 1
            continue

        to_create.append(Parish(id=pid, name=name, municipality_id=municipality_id))

    if skipped:
        print(f"       Saltadas (sin municipality válido): {skipped}")

    # Insertar en batches de 500
    batch_size = 500
    created_count = 0
    for i in range(0, len(to_create), batch_size):
        batch = to_create[i : i + batch_size]
        Parish.objects.bulk_create(batch, ignore_conflicts=True)
        created_count += len(batch)
        print(f"       Insertados: {created_count}/{len(to_create)}")

    # 7. Verificar
    final_count = Parish.objects.count()
    print("\n" + "=" * 60)
    print(f"✅ SYNC COMPLETADO")
    print(f"   Producción antes: {len(existing_ids)}")
    print(f"   Producción ahora: {final_count}")
    print(f"   Nuevos insertados: {final_count - len(existing_ids)}")
    print("=" * 60)


if __name__ == "__main__":
    # Si estamos en local sin args, solo mostrar info
    if "--local" in sys.argv or not os.environ.get("RAILWAY_ENVIRONMENT"):
        print("Este script debe correr en Railway con el backup disponible.")
        print("1. railway upload backups/medops_backup_2026-04-20_1111.sql")
        print("2. railway run python scripts/sync_parishes_railway.py")
    else:
        sync_parishes()
