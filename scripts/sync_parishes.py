#!/usr/bin/env python3
"""
SYNC DE PARROQUIAS - MODO SEGURO (Read-Only del Backup)
=========================================================
Este script:
1. Lee el backup SQL (SOLO LECTURA)
2. Compara con producción
3. Solo INSERTA las que faltan (bulk_create)
4. NO modifica ni elimina datos existentes
5. Es idempotente: puede correr 100 veces con el mismo resultado

Uso:
    python sync_parishes.py
"""

import os
import re
import sys

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "medops.settings")

import django

django.setup()

from core.models import Parish

BACKUP_PATH = "C:\\Users\\ungar\\Documents\\Dev\\Web\\project\\medops\\backups\\medops_backup_2026-04-20_1111.sql"
PARISH_COPY_START = 84430  # Línea donde empieza COPY public.core_parish
PARISH_COPY_END = 85575  # Línea donde termina (aproximada)


def parse_backup_parishes():
    """Lee el backup y retorna diccionario de parroquias {id: (name, municipality_id)}"""
    parishes = {}

    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    in_parish_section = False
    for i, line in enumerate(lines):
        # Detectar inicio de la sección de parroquias
        if "COPY public.core_parish" in line:
            in_parish_section = True
            continue

        # Detectar fin de la sección (próximo COPY o \.)
        if in_parish_section:
            if line.strip() == "\\." or "COPY public" in line:
                break

            # Parsear línea de dato (formato: id\tname\tmunicipality_id\n)
            # Ejemplo: "1\tAlto Orinoco\t1"
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
    """Sincroniza parroquias faltantes desde backup a producción"""

    print("=" * 60)
    print("MEDOPZ - SYNC DE PARROQUIAS (MODO SEGURO)")
    print("=" * 60)

    # 1. Leer backup
    print("\n[1/4] Leyendo backup (solo lectura)...")
    backup_parishes = parse_backup_parishes()
    print(f"       Backup tiene: {len(backup_parishes)} parroquias")

    # 2. Obtener IDs existentes en producción
    print("\n[2/4] Consultando producción...")
    existing_ids = set(Parish.objects.values_list("id", flat=True))
    existing_dict = {p.id: p for p in Parish.objects.all()}
    print(f"       Producción tiene: {len(existing_ids)} parroquias")

    # 3. Calcular faltantes
    print("\n[3/4] Calculando faltantes...")
    missing_ids = set(backup_parishes.keys()) - existing_ids
    print(f"       Faltan en producción: {len(missing_ids)} parroquias")

    if len(missing_ids) == 0:
        print("\n✅ NO hay parroquias faltantes. Todo está sincronizado.")
        return

    # 4. Mostrar breakdown por rango
    print("\n       Breakdown de faltantes:")
    ranges = {}
    for pid in sorted(missing_ids):
        range_key = f"{(pid // 100) * 100 + 1}-{(pid // 100) * 100 + 100}"
        ranges[range_key] = ranges.get(range_key, 0) + 1

    for r in sorted(ranges.keys()):
        print(f"         IDs {r}: {ranges[r]} parroquias")

    # 5. bulk_create de faltantes
    print("\n[4/4] Insertando faltantes en producción...")
    to_create = []
    for pid in sorted(missing_ids):
        name, municipality_id = backup_parishes[pid]
        to_create.append(Parish(id=pid, name=name, municipality_id=municipality_id))

    # Insertar en batches de 500
    batch_size = 500
    created_count = 0
    for i in range(0, len(to_create), batch_size):
        batch = to_create[i : i + batch_size]
        Parish.objects.bulk_create(batch, ignore_conflicts=True)
        created_count += len(batch)
        print(f"       Insertados: {created_count}/{len(to_create)}")

    # 6. Verificar resultado
    final_count = Parish.objects.count()
    print("\n" + "=" * 60)
    print(f"✅ SYNC COMPLETADO")
    print(f"   Antes: {len(existing_ids)} parroquias")
    print(f"   Ahora: {final_count} parroquias")
    print(f"   Nuevos insertados: {final_count - len(existing_ids)}")
    print("=" * 60)


if __name__ == "__main__":
    sync_parishes()
