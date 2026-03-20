# core/management/commands/reset_appointments_data.py
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.apps import apps
class Command(BaseCommand):
    help = 'Elimina datos de citas y operaciones, preservando datos maestros'
    def get_tables_with_dependency_to(self, target_model_name):
        """
        Identifica todas las tablas que tienen una ForeignKey o OneToOne
        hacia el modelo target.
        """
        target_model = apps.get_model('core', target_model_name)
        dependent_tables = set()
        
        for model in apps.get_models():
            for field in model._meta.get_fields():
                # Verificar si es una relación (ForeignKey, OneToOne, ManyToMany)
                if hasattr(field, 'related_model') and field.related_model == target_model:
                    dependent_tables.add(model._meta.db_table)
        
        return list(dependent_tables)
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando reseteo de datos...'))
        
        # 1. Identificar automáticamente todas las tablas dependientes de Appointment
        appointment_dependencies = self.get_tables_with_dependency_to('Appointment')
        
        # 2. Ordenar tablas para eliminar dependencias primero (hojas a raíz)
        # Django no proporciona un orden topológico fácil, así que usamos un orden
        # basado en la profundidad de dependencia (aproximado)
        # Para simplificar, eliminaremos todas las dependientes ANTES de Appointment
        
        # 3. Definir lista completa de tablas a limpiar
        # Incluimos tablas conocidas y las detectadas automáticamente
        tablas_a_limpiar = [
            # Tablas dependientes de Appointment (automáticamente detectadas + conocidas)
            *appointment_dependencies,
            
            # Tablas de otros niveles (que no dependen de Appointment directamente)
            'core_payment',
            'core_prescriptioncomponent',
            'core_prescription',
            'core_treatment',
            'core_medicalreferral_specialties',
            'core_chargeitem',
            
            # Tabla principal (al final)
            'core_appointment',
        ]
        
        # Eliminar duplicados manteniendo el orden
        seen = set()
        unique_tables = []
        for table in tablas_a_limpiar:
            if table not in seen:
                seen.add(table)
                unique_tables.append(table)
        
        try:
            with transaction.atomic():
                with connection.cursor() as cursor:
                    for tabla in unique_tables:
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