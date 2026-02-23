# core/management/commands/reset_financial_data.py
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import ChargeOrder, ChargeItem, Payment
class Command(BaseCommand):
    help = 'Resetea todos los datos financieros (SOLO PARA DESARROLLO/TEST)'
    
    def add_arguments(self, parser):
        parser.add_argument('--confirm', action='store_true', help='Confirmar eliminación')
    
    @transaction.atomic
    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.ERROR('Use --confirm para confirmar'))
            return
        
        self.stdout.write('Eliminando datos financieros...')
        
        # Eliminar en orden correcto por FK
        deleted_items = ChargeItem.objects.all().delete()
        deleted_payments = Payment.objects.all().delete()
        deleted_orders = ChargeOrder.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS(f'Eliminados:'))
        self.stdout.write(f'  - ChargeItems: {deleted_items[0]}')
        self.stdout.write(f'  - Payments: {deleted_payments[0]}')
        self.stdout.write(f'  - ChargeOrders: {deleted_orders[0]}')