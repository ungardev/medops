# 💾 MedOps – Guía de Backups

Este documento describe cómo realizar y restaurar respaldos de la base de datos de MedOps antes de aplicar migraciones o cambios críticos.

---

## 📂 Ubicación de backups

Se recomienda guardar los respaldos en:
/srv/medops/backups/

Cada archivo tendrá un nombre con fecha y hora para trazabilidad, por ejemplo:
medops_backup_2025-10-18_1915.sql

---

## 🔄 Crear un backup

Ejecutar:

```bash
mkdir -p /srv/medops/backups
pg_dump -U medops -h localhost medops_db > /srv/medops/backups/medops_backup_$(date +%F_%H%M).sql
```

- medops → usuario de PostgreSQL
- medops_db → nombre de la base de datos
- El archivo se guarda con timestamp en /srv/medops/backups/

## ♻️ Restaurar un backup
En caso de necesitar volver atrás:
```bash
psql -U medops -h localhost medops_db < /srv/medops/backups/medops_backup_YYYY-MM-DD_HHMM.sql
```

Reemplaza YYYY-MM-DD_HHMM por la fecha y hora del backup que quieras restaurar.

## ✅ Buenas prácticas
- Haz un backup antes de cada despliegue con migraciones.
- Conserva al menos los últimos 5 respaldos.
- Automatiza la limpieza de backups viejos con un cron job si el espacio es limitado.
- Documenta en deploy.log qué backup corresponde a cada despliegue.


## ⚠️ Nota
Si usas otra base de datos (MySQL, SQLite), los comandos cambian, pero la lógica es la misma: exportar antes de migrar y tener un plan de restauración.
