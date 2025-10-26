# core/management/commands/export_patient_history.py
import csv
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

class Command(BaseCommand):
    help = "Exporta el histórico de un paciente a CSV, incluyendo predisposiciones genéticas"

    def add_arguments(self, parser):
        parser.add_argument("patient_id", type=int, help="ID del paciente")
        parser.add_argument(
            "--limit",
            type=int,
            default=50,
            help="Número máximo de registros históricos a exportar (default=50)",
        )
        parser.add_argument(
            "--output",
            type=str,
            default="patient_history.csv",
            help="Ruta del archivo CSV de salida (default=patient_history.csv)",
        )

    def handle(self, *args, **options):
        patient_id = options["patient_id"]
        limit = options["limit"]
        output = options["output"]

        try:
            with connection.cursor() as cursor:
                cursor.execute(f"""
                    SELECT *
                    FROM core_historicalpatient
                    WHERE id = %s
                    ORDER BY history_date DESC
                    LIMIT %s
                """, [patient_id, limit])
                rows = cursor.fetchall()
                colnames = [desc[0] for desc in cursor.description]
        except Exception as e:
            raise CommandError(f"Error obteniendo histórico: {e}")

        if not rows:
            self.stdout.write(self.style.WARNING("No se encontraron registros históricos."))
            return

        # Escribir CSV
        with open(output, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(colnames)
            writer.writerows(rows)

        self.stdout.write(
            self.style.SUCCESS(
                f"Histórico del paciente {patient_id} exportado a {output} ({len(rows)} registros)."
            )
        )
