# core/management/commands/export_patient_history.py
import csv
from django.core.management.base import BaseCommand, CommandError
from core.utils.history import get_patient_full_history

class Command(BaseCommand):
    help = "Exporta el histórico de un paciente a CSV"

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
            history = get_patient_full_history(patient_id, limit=limit)
        except Exception as e:
            raise CommandError(f"Error obteniendo histórico: {e}")

        if not history:
            self.stdout.write(self.style.WARNING("No se encontraron registros históricos."))
            return

        # Escribir CSV
        fieldnames = list(history[0].keys())
        with open(output, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for row in history:
                writer.writerow(row)

        self.stdout.write(
            self.style.SUCCESS(
                f"Histórico del paciente {patient_id} exportado a {output} ({len(history)} registros)."
            )
        )
