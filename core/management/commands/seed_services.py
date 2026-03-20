# core/management/commands/seed_services.py
from django.core.management.base import BaseCommand
from core.models import ServiceCategory, DoctorService, InstitutionSettings, DoctorOperator
class Command(BaseCommand):
    help = 'Crea categorías iniciales y un servicio de ejemplo'
    def handle(self, *args, **options):
        # 1. Crear Categorías
        categorias_data = [
            {'name': 'Consulta Medica', 'category_type': 'APPOINTMENT'},
            {'name': 'Procedimientos Medicos', 'category_type': 'PROCEDURE'},
            {'name': 'Laboratorio y Diagnostico', 'category_type': 'DIAGNOSTIC'},
            {'name': 'Medicamentos y Farmacia', 'category_type': 'PHARMACY'},
            {'name': 'Paquetes y Promociones', 'category_type': 'PACKAGE'},
            {'name': 'Servicios Administrativos', 'category_type': 'ADMIN'},
        ]
        
        for cat_data in categorias_data:
            ServiceCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'category_type': cat_data['category_type']}
            )
        
        self.stdout.write(self.style.SUCCESS('✓ Categorías iniciales creadas/verificadas'))
        # 2. Crear Servicio de Ejemplo
        try:
            category = ServiceCategory.objects.get(name='Consulta Medica')
            institution = InstitutionSettings.objects.first()
            doctor = DoctorOperator.objects.first()  # <-- NUEVO: Obtener un doctor existente
            
            if not institution:
                self.stdout.write(self.style.WARNING('⚠️  No hay instituciones. Crear una manualmente en el admin.'))
                return
            
            if not doctor:
                self.stdout.write(self.style.WARNING('⚠️  No hay doctores. Crear uno manualmente en el admin.'))
                return
            
            service, created = DoctorService.objects.get_or_create(
                name='Consulta General',
                defaults={
                    'doctor': doctor,  # <-- NUEVO: Asignar doctor
                    'category': category,
                    'institution': institution,
                    'code': 'CONS-001',
                    'price_usd': 50.00,
                    'duration_minutes': 30,
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Servicio de ejemplo creado: {service.name}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'✓ Servicio de ejemplo ya existe: {service.name}'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error creando servicio de ejemplo: {e}'))