# 🛠️ RESTORE.md
**Guía de restauración de la base de datos `medops_db` a partir de un backup SQL.**

---

## 📂 Ubicación de los backups
Todos los respaldos generados por `backup.sh` se guardan en:  
/srv/medops/backups/

Formato de nombre:
medops_backup_YYYY-MM-DD_HHMM.sql

Ejemplo:
medops_backup_2025-10-18_2002.sql

---

## 🔹 Pasos de restauración

### 1. Acceder al servidor
Conéctate al servidor Ubuntu donde corre MedOps:
```bash
ssh medops@<IP_SERVIDOR>
cd /srv/medops
```

## 2. Seleccionar el backup a restaurar
Lista los archivos disponibles:
```bash
ls -lh /srv/medops/backups/
```
Identifica el archivo  que deseas restaurar.

## 3. Detener servicios que usan la base de datos
Para evitar inconsistencias, detén temporalmente los servicios:
```bash
sudo systemctl stop gunicorn
sudo systemctl stop nginx
```

## 4. Restaurar la base de datos
⚠️ Esto sobrescribirá los datos actuales de medops_db.
```bash
psql -U medops_user -h localhost -d medops_db -f /srv/medops/backups/medops_backup_YYYY-MM-DD_HHMM.sql
```

Ejemplo:
```bash
psql -U medops_user -h localhost -d medops_db -f /srv/medops/backups/medops_backup_2025-10-18_2002.sql
```

## 5. Reiniciar servicios
Una vez restaurada la base de datos:
```bash
sudo systemctl start gunicorn
sudo systemctl start nginx
```

## ✅ Validación
1. 	Verifica que la base de datos contiene los datos esperados:
``bash
psql -U medops_user -h localhost medops_db
\dt
```

2. 	Accede a la aplicación en el navegador y confirma que funciona correctamente.