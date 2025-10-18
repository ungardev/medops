#!/bin/bash
set -e

# Directorio de backups
BACKUP_DIR="/srv/medops/backups"
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con timestamp
BACKUP_FILE="$BACKUP_DIR/medops_backup_$(date +%F_%H%M).sql"

# Usuario y base de datos (ajusta si es necesario)
DB_USER="medops"
DB_NAME="medops_db"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Iniciando backup de $DB_NAME..."

# Crear backup
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$BACKUP_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backup completado: $BACKUP_FILE"
