# 🧪 RESTORE_TEST.md
**Protocolo de pruebas de restauración de la base de datos `medops_db`.**

---

## 🎯 Objetivo
Validar que los respaldos generados por `backup.sh` son restaurables y que la aplicación MedOps funciona correctamente tras la restauración.

---

## 🔹 Frecuencia recomendada
- **Mensual** en entorno de staging.
- **Trimestral** en entorno de producción (solo bajo ventana de mantenimiento).

---

## 🔹 Pasos de validación

### 1. Preparar entorno de staging
- Crear una base de datos de prueba:
  ```bash
  createdb -U medops_user medops_staging

- Confirmar que está vacía:
psql -U medops_user -d medops_staging -c "\dt"


2. Seleccionar un backup reciente
- Listar los archivos disponibles:
ls -lh /srv/medops/backups/
- Escoger el más reciente (ejemplo):
medops_backup_2025-10-18_2002.sql


3. Restaurar en staging
psql -U medops_user -d medops_staging -f /srv/medops/backups/medops_backup_2025-10-18_2002.sql


4. Validar datos
- Ingresar a la base:
psql -U medops_user medops_staging
\dt
- Confirmar que las tablas y registros existen.
5. Validar aplicación
- Configurar temporalmente la app para apuntar a medops_staging.
- Levantar el frontend/backend en modo prueba.
- Confirmar que:
- Se puede iniciar sesión.
- Los dashboards cargan datos.
- Los reportes PDF se generan.
6. Documentar resultados
- Registrar fecha, backup usado y resultado de la prueba en un log interno:
/srv/medops/restore_tests.log



✅ Criterio de éxito
- Restauración completada sin errores.
- Datos accesibles en medops_staging.
- Aplicación funcional con datos restaurados.

📌 Notas
- Nunca restaurar directamente sobre medops_db en producción sin ventana de mantenimiento.
- Mantener al menos 3 backups validados en rotación.
- Escalar cualquier error de restauración inmediatamente.

---


