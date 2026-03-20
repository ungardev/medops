# core/management/commands/reset_appointments_data.py
from django.core.management.base import BaseCommand
from django.db import connection, transaction
class Command(BaseCommand):
    help = 'Elimina datos de citas y operaciones, preservando datos maestros'
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando reseteo de datos...'))
        
        # Tablas a limpiar en orden de dependencia (hojas a raíz)
        tablas_a_limpiar = [
            # Nivel 1 (Hojas - tablas que dependen de otras que vamos a borrar)
            'core_medicaldocument',      # Dependencia: Appointment
            'core_payment',              # Dependencia: ChargeOrder
            'core_prescriptioncomponent',# Dependencia: Prescription
            'core_prescription',         # Dependencia: Diagnosis
            'core_treatment',            # Dependencia: Diagnosis
            'core_medicalreferral_specialties', # Dependencia: MedicalReferral
            'core_medicalreferral',      # Dependencia: Diagnosis
            'core_chargeitem',           # Dependencia: ChargeOrder
            'core_medicalreport',        # Dependencia: Appointment
            'core_clinicalnote',         # Dependencia: Appointment
            'core_vitalsigns',           # Dependencia: Appointment
            
            # Nivel 2 (Intermedios)
            'core_diagnosis',            # Dependencia: Appointment
            'core_chargeorder',          # Dependencia: Appointment
            'core_waitingroomentry',     # Dependencia: Appointment (OneToOne)
            
            # Nivel 3 (Raíz)
            'core_appointment',          # Principal
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
            
            self.stdout.write(self.style.SUCCESS('✓ Reinicio completado. Datos limpios.'))
            self.stdout.write(self.style.WARNING('⚠️  Preservados: ICD, Medication, Direcciones, Pacientes, Doctores.'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error crítico: {e}'))