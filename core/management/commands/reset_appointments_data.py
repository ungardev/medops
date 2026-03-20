# core/management/commands/reset_appointments_data.py
from django.core.management.base import BaseCommand
from django.db import connection, transaction
class Command(BaseCommand):
    help = 'Elimina datos de citas y operaciones, preservando datos maestros (ICD, Medication, Geo)'
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando reseteo de datos...'))
        
        # Tablas a limpiar en orden de dependencia (hojas a raíz)
        tablas_a_limpiar = [
            # Nivel 1 (Hojas)
            'core_medicaldocument',      # Documentos médicos
            'core_payment',              # Pagos
            'core_prescriptioncomponent',# Componentes de recetas
            'core_prescription',         # Recetas
            'core_treatment',            # Tratamientos
            'core_medicalreferral_specialties', # Tabla intermedia
            'core_medicalreferral',      # Referencias médicas
            'core_chargeitem',           # Ítems de cobro
            'core_medicalreport',        # Informes médicos (NUEVO - depende de appointment)
            
            # Nivel 2 (Intermedios)
            'core_diagnosis',            # Diagnósticos
            'core_chargeorder',          # Órdenes de cobro
            'core_waitingroomentry',     # Sala de espera
            
            # Nivel 3 (Raíz)
            'core_appointment',          # Citas
        ]
        
        try:
            # Usar transacción para garantizar consistencia
            with transaction.atomic():
                with connection.cursor() as cursor:
                    for tabla in tablas_a_limpiar:
                        try:
                            cursor.execute(f"DELETE FROM {tabla};")
                            self.stdout.write(self.style.SUCCESS(f'✓ Datos eliminados de {tabla}'))
                        except Exception as e:
                            # Si la tabla no existe, ignora el error
                            if "does not exist" in str(e) or "no existe" in str(e):
                                self.stdout.write(self.style.WARNING(f'⚠️  Tabla no existe: {tabla}'))
                            else:
                                self.stdout.write(self.style.ERROR(f'✗ Error limpiando {tabla}: {e}'))
            
            self.stdout.write(self.style.SUCCESS('✓ Reinicio completado. Datos limpios.'))
            self.stdout.write(self.style.WARNING('⚠️  Preservados: ICD, Medication, Direcciones, Pacientes, Doctores.'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error crítico: {e}'))