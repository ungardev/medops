#!/bin/bash
set -e

# Archivo de log
LOGFILE="/srv/medops/deploy.log"

# Función para loguear con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOGFILE"
}

log "🚀 Iniciando despliegue de MedOps..."

# 1. Traer cambios
log "Actualizando repositorio..."
git pull origin main | tee -a "$LOGFILE"

# 2. Frontend
log "Construyendo frontend..."
cd frontend/medops
npm install >> "$LOGFILE" 2>&1
npm run build >> "$LOGFILE" 2>&1

# 3. Backend
cd /srv/medops
log "Recolectando estáticos..."
pipenv run python manage.py collectstatic --noinput >> "$LOGFILE" 2>&1

log "Aplicando migraciones..."
pipenv run python manage.py migrate >> "$LOGFILE" 2>&1

# 4. Reiniciar servicios
log "Reiniciando Gunicorn..."
sudo systemctl restart gunicorn

log "Recargando Nginx..."
sudo systemctl reload nginx

log "✅ Despliegue completado con éxito."
