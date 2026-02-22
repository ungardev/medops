# core/management/commands/recalc_orders.py
from django.core.management.base import BaseCommand
from core.models import ChargeOrder
class Command(BaseCommand):
    help = 'Recalcula totales de todas las órdenes de cobro'
    def handle(self, *args, **options):
        orders = ChargeOrder.objects.all()
        fixed = 0
        
        for order in orders:
            old_total = order.total
            order.recalc_totals()
            order.save(update_fields=['total', 'balance_due', 'status'])
            
            if old_total != order.total:
                fixed += 1
                self.stdout.write(
                    self.style.WARNING(f'Orden #{order.id}: ${old_total} → ${order.total}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ {fixed} órdenes corregidas de {orders.count()} totales')
        )