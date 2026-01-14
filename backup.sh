#!/bin/bash
set -e

# Directorio de backups
BACKUP_DIR="/srv/medops/backups"
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con timestamp
BACKUP_FILE="$BACKUP_DIR/medops_backup_$(date +%F_%H%M).sql"

# Variables (tomadas de tu docker-compose)
DB_USER="medops_user"
DB_NAME="medops_db"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Iniciando backup de $DB_NAME desde Docker..."

# Ejecutar pg_dump DENTRO del contenedor 'db'
# Usamos sudo y docker-compose exec para asegurar el acceso
sudo docker-compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Opcional: Mantener solo los últimos 7 días de backups para no llenar el disco
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backup completado: $BACKUP_FILE"
