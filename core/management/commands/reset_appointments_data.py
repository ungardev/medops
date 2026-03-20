# core/management/commands/reset_appointments_data.py
from django.core.management.base import BaseCommand
from django.db import connection, transaction
class Command(BaseCommand):
    help = 'Elimina datos operativos y de servicios, preservando datos maestros'
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando reseteo de datos...'))
        
        # Tablas a limpiar en orden de dependencia (hojas a raíz)
        tablas_a_limpiar = [
            # Nivel 1: Tablas que dependen de Appointment
            'core_payment',
            'core_prescriptioncomponent',
            'core_prescription',
            'core_treatment',
            'core_medicalreferral_specialties',
            'core_medicalreferral',
            'core_chargeitem',
            'core_medicaldocument',
            'core_medicalreport',
            'core_clinicalnote',
            'core_vitalsigns',
            'core_medicaltest',
            'core_diagnosis',
            'core_chargeorder',
            'core_waitingroomentry',
            
            # Nivel 2: Tablas que dependen de DoctorService
            'core_serviceschedule',
            'core_appointment',
            
            # Nivel 3: Tablas de servicios (a eliminar)
            'core_doctorservice',
            'core_servicecategory',
        ]
        
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    for tabla in tablas_a_limpiar:
                        try:
                            cursor.execute(f"DELETE FROM {tabla};")
                            self.stdout.write(self.style.SUCCESS(f'✓ Datos eliminados de {tabla}'))
                        except Exception as e:
                            if "does not exist" in str(e) or "no existe" in str(e):
                                self.stdout.write(self.style.WARNING(f'⚠️  Tabla no existe: {tabla}'))
                            else:
                                self.stdout.write(self.style.ERROR(f'✗ Error limpiando {tabla}: {e}'))
            
            self.stdout.write(self.style.SUCCESS('✓ Reinicio completado. Datos operativos y de servicios limpios.'))
            self.stdout.write(self.style.WARNING('⚠️  Preservados: Instituciones, Doctores, Pacientes.'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error crítico: {e}'))