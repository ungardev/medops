# core/management/commands/fix_categories.py
from django.core.management.base import BaseCommand
from core.models import ServiceCategory, DoctorService
from django.db import transaction
class Command(BaseCommand):
    help = 'Fix duplicate categories by merging them'
    def handle(self, *args, **options):
        # Obtener todas las categorías
        categories = ServiceCategory.objects.all()
        
        # Agrupar por nombre normalizado (minúsculas)
        name_map = {}
        for cat in categories:
            norm_name = cat.name.lower()
            if norm_name not in name_map:
                name_map[norm_name] = []
            name_map[norm_name].append(cat)
        
        # Encontrar duplicados
        duplicates = {k: v for k, v in name_map.items() if len(v) > 1}
        
        if not duplicates:
            self.stdout.write(self.style.SUCCESS('No duplicate categories found.'))
            return
        
        self.stdout.write(self.style.WARNING(f'Found {len(duplicates)} duplicate groups.'))
        
        with transaction.atomic():
            for norm_name, cats in duplicates.items():
                # Mantener la categoría con ID más bajo
                keep = sorted(cats, key=lambda x: x.id)[0]
                delete = [c for c in cats if c.id != keep.id]
                
                self.stdout.write(f'Merging "{norm_name}": keeping ID {keep.id}, deleting IDs {[c.id for c in delete]}')
                
                # Actualizar referencias en DoctorService
                for cat in delete:
                    DoctorService.objects.filter(category=cat).update(category=keep)
                    cat.delete()
        
        self.stdout.write(self.style.SUCCESS('Duplicate categories merged successfully.'))