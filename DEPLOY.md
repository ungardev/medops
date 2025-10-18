# 🚀 MedOps – Guía de Despliegue

Este documento describe el flujo de despliegue de MedOps en el servidor de producción (`/srv/medops`).

---

## 📂 Requisitos previos

- Servidor Ubuntu con:
  - Python 3 + Pipenv
  - Node.js + npm
  - Nginx
  - Gunicorn (gestionado por systemd)
- Repositorio clonado en `/srv/medops`
- Script `deploy.sh` con permisos de ejecución (`chmod +x deploy.sh`)

---

## 🔄 Flujo de despliegue

Cada vez que quieras actualizar MedOps:

```bash
cd /srv/medops
./deploy.sh
```

El script realiza automáticamente:

1. 	Actualizar código
```bash
git pull origin main
```
2.  Construir frontend
```bash
cd frontend/medops
npm install
npm run build
cd /srv/medops
```
3.  Recolectar estáticos
pipenv run python manage.py collectstatic --noinput
4.  Aplicar migraciones
pipenv run python manage.py migrate
5.  Reiniciar Gunicorn
sudo systemctl restart gunicorn
6.  Recargar Nginx
sudo systemctl reload nginx

## 📝 Logs de despliegue
Cada ejecución de deploy.sh genera un registro en:
/srv/medops/deploy.log

Para revisar en tiempo real:
tail -f /srv/medops/deploy.log

## ✅ Resultado esperado
- La aplicación se actualiza con los últimos cambios.
- El frontend se reconstruye.
- Los archivos estáticos se sirven correctamente.
- Migraciones aplicadas sin errores.
- Gunicorn y Nginx reiniciados.
- Log con fecha y hora de cada despliegue.

## ⚠️ Notas
- Si el script falla, revisa deploy.log para identificar el paso exacto.
- Antes de migraciones críticas, considera hacer un backup de la base de datos.
- Para cambios en Nginx, recuerda probar la configuración antes de recargar:
sudo nginx -t



---
