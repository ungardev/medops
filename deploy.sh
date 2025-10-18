#!/bin/bash
set -e

echo "🚀 Iniciando despliegue de MedOps..."

# 1. Traer cambios
git pull origin main

# 2. Frontend
cd frontend/medops
npm install
npm run build

# 3. Backend
cd /srv/medops
pipenv run python manage.py collectstatic --noinput
pipenv run python manage.py migrate

# 4. Reiniciar servicios
sudo systemctl restart gunicorn
sudo systemctl reload nginx

echo "✅ Despliegue completado con éxito."
