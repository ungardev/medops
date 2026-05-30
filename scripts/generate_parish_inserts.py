#!/usr/bin/env python3
"""
MEDOPZ - GENERADOR DE SQL PARA PARROQUIAS FALTANTES
====================================================
Este script genera un archivo SQL con INSERTs para las 808 parroquias
faltantes en producción (IDs 331-1138).

El archivo generado se ejecuta en Railway con:
    railway run psql -f /app/scripts/insert_missing_parishes.sql

Uso local:
    python scripts/generate_parish_inserts.py
"""

import os

BACKUP_PATH = r"C:\Users\ungar\Documents\Dev\Web\project\medops\backups\medops_backup_2026-04-20_1111.sql"
OUTPUT_PATH = r"C:\Users\ungar\Documents\Dev\Web\project\medops\scripts\insert_missing_parishes.sql"

# IDs que ya existen en producción (1-330)
EXISTING_IDS = set(range(1, 331))


def generate_inserts():
    print("=" * 60)
    print("GENERANDO INSERTS SQL PARA PARROQUIAS FALTANTES")
    print("=" * 60)

    missing_parishes = []

    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    in_parish = False
    for line in lines:
        if "COPY public.core_parish" in line:
            in_parish = True
            continue
        if in_parish:
            if line.strip() == "\\." or "COPY public" in line:
                break
            parts = line.strip().split("\t")
            if len(parts) >= 3:
                try:
                    pid = int(parts[0].strip())
                    if pid not in EXISTING_IDS:
                        name = parts[1].strip()
                        muni_id = int(parts[2].strip())
                        missing_parishes.append((pid, name, muni_id))
                except:
                    continue

    print(f"\nEncontradas {len(missing_parishes)} parroquias faltantes")
    print(f"Rango: {missing_parishes[0][0]} - {missing_parishes[-1][0]}")

    # Generar SQL
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write("-- MEDOPZ: Inserts para parroquias faltantes (IDs 331-1138)\n")
        f.write("-- Generado automaticamente por sync_parishes.py\n")
        f.write("-- Esta operacion SOLO inserta, no modifica ni elimina datos\n\n")

        f.write("BEGIN;\n\n")

        # Usar COPY para máximo rendimiento
        f.write("COPY core_parish (id, name, municipality_id) FROM stdin;\n")

        for pid, name, muni_id in missing_parishes:
            # Escapar tabs y saltos de linea en el nombre
            name_escaped = name.replace("\t", " ").replace("\n", " ").replace("\r", "")
            f.write(f"{pid}\t{name_escaped}\t{muni_id}\n")

        f.write("\\.\n\n")
        f.write("COMMIT;\n")

    print(f"\n[OK] SQL generado: {OUTPUT_PATH}")
    print(f"   Lineas de INSERT: {len(missing_parishes)}")

    # Verificar tamaño del archivo
    size = os.path.getsize(OUTPUT_PATH)
    print(f"   Tamaño archivo: {size / 1024:.1f} KB")


if __name__ == "__main__":
    generate_inserts()
