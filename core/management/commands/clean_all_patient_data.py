from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "BORRA todos los datos de pacientes, citas, waiting room, charge orders, documentos clínicos, historial, etc. CONSERVA doctores, instituciones, servicios, geografía, diagnósticos, medicamentos, vacunas, wallets"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Fuerza la eliminación sin confirmación",
        )

    def handle(self, *args, **options):
        if not options.get("force"):
            self.stdout.write(
                self.style.ERROR("❌ Usa --force para ejecutar la limpieza.")
            )
            self.stdout.write(
                self.style.WARNING("   python manage.py clean_all_patient_data --force")
            )
            return

        self.stdout.write(
            self.style.WARNING("⚠️  INICIANDO LIMPIEZA TOTAL DE DATOS DE PACIENTES")
        )
        self.stdout.write(self.style.WARNING("⚠️  Este proceso es IRREVERSIBLE"))
        self.stdout.write("")

        tables_to_clean = [
            # Clinical data (order matters for FK)
            ("patient_vaccinations", "Vacunas de pacientes"),
            ("clinical_alerts", "Alertas clínicas"),
            ("personal_histories", "Historial personal"),
            ("family_histories", "Historial familiar"),
            ("surgeries", "Cirugías"),
            ("hospitalizations", "Hospitalizaciones"),
            ("allergies", "Alergias"),
            ("habits", "Habitos"),
            ("patient_genetic_predispositions", "Predisposiciones genéticas"),
            # Documents
            ("medical_documents", "Documentos médicos"),
            # Clinical notes and prescriptions
            ("clinical_notes", "Notas clínicas"),
            ("prescriptions", "Prescripciones"),
            ("charge_items", "Items de cargo"),
            # Transactions and orders
            ("payment_transactions", "Transacciones de pago"),
            ("charge_orders", "Órdenes de cargo"),
            # Appointments and waiting room
            ("waiting_room_entries", "Entradas sala de espera"),
            ("appointments", "Citas"),
            # Patient relationships and links
            ("patient_family_links", "Vínculos familiares"),
            ("doctor_patient_relationships", "Relaciones doctor-paciente"),
            ("patient_subscriptions", "Suscripciones"),
            ("patient_payment_methods", "Métodos de pago"),
            ("patient_invitations", "Invitaciones"),
            # Core patient tables
            ("patient_users", "Usuarios de pacientes"),
            ("patients", "Pacientes"),
            # Financial records
            ("vuelto_requests", "Solicitudes de vuelto"),
        ]

        total_deleted = 0
        errors = []

        for table_name, description in tables_to_clean:
            try:
                with connection.cursor() as cursor:
                    cursor.execute(f"DELETE FROM {table_name}")
                    deleted = cursor.rowcount
                    total_deleted += deleted

                    if deleted > 0:
                        self.stdout.write(
                            f"   🗑️  {description}: {deleted} registros eliminados"
                        )
                    else:
                        self.stdout.write(
                            f"   ✓ {description}: 0 registros (ya estaba vacío)"
                        )
            except Exception as e:
                error_msg = f"Error en {table_name}: {str(e)}"
                errors.append(error_msg)
                self.stdout.write(self.style.ERROR(f"   ❌ {description}: {error_msg}"))
                logger.error(error_msg)

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"✅ LIMPIEZA COMPLETADA"))
        self.stdout.write(f"   📊 Total registros eliminados: {total_deleted}")

        if errors:
            self.stdout.write(
                self.style.WARNING(f"   ⚠️  Errores encontrados: {len(errors)}")
            )
            for err in errors:
                self.stdout.write(self.style.ERROR(f"      - {err}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"   ✓ Sin errores"))

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS("🎉 Sistema limpio y listo para datos frescos")
        )
