# core/management/commands/cleanup_ghost_orders.py
"""
Comando de limpieza de órdenes fantasma.
Uso:
    # Ver qué se limpiaría (sin hacer cambios)
    python manage.py cleanup_ghost_orders --dry-run
    
    # Marcar órdenes vacías como void (recomendado para auditoría)
    python manage.py cleanup_ghost_orders --action=void
    
    # Eliminar órdenes vacías completamente (solo para test)
    python manage.py cleanup_ghost_orders --action=delete
    
    # Incluir órdenes void existentes en la limpieza
    python manage.py cleanup_ghost_orders --action=delete --include-void
    
    # Limpiar también citas completadas sin facturación
    python manage.py cleanup_ghost_orders --action=void --fix-appointments
    
    # Generar solo reporte
    python manage.py cleanup_ghost_orders --report-only
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from core.models import ChargeOrder, ChargeItem, Appointment, Payment
from decimal import Decimal
import json
from datetime import datetime
import os
class Command(BaseCommand):
    help = 'Limpia órdenes de cobro fantasma (vacías, sin items, $0)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo mostrar qué se limpiaría sin hacer cambios',
        )
        parser.add_argument(
            '--action',
            type=str,
            default='void',
            choices=['void', 'delete', 'report'],
            help='Acción a realizar: void (marcar como anulado), delete (eliminar), report (solo reporte)',
        )
        parser.add_argument(
            '--include-void',
            action='store_true',
            help='Incluir órdenes ya marcadas como void en la limpieza',
        )
        parser.add_argument(
            '--fix-appointments',
            action='store_true',
            help='También corregir citas completadas sin órdenes de cobro',
        )
        parser.add_argument(
            '--min-age-days',
            type=int,
            default=0,
            help='Solo procesar órdenes con más de X días de antigüedad',
        )
        parser.add_argument(
            '--report-only',
            action='store_true',
            help='Solo generar reporte JSON sin hacer cambios',
        )
        parser.add_argument(
            '--output',
            type=str,
            default=None,
            help='Archivo de salida para el reporte JSON',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        action = options['action']
        include_void = options['include_void']
        fix_appointments = options['fix_appointments']
        min_age_days = options['min_age_days']
        report_only = options['report_only']
        output_file = options['output']
        
        self.stdout.write(self.style.WARNING('=' * 60))
        self.stdout.write(self.style.WARNING('MEDOPZ - GHOST ORDERS CLEANUP UTILITY'))
        self.stdout.write(self.style.WARNING('=' * 60))
        self.stdout.write('')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 MODO DRY-RUN: No se realizarán cambios'))
        
        # 1. Diagnosticar órdenes fantasma
        ghost_orders = self.identify_ghost_orders(include_void, min_age_days)
        
        # 2. Diagnosticar citas sin facturación
        incomplete_appointments = []
        if fix_appointments:
            incomplete_appointments = self.identify_incomplete_appointments()
        
        # 3. Generar reporte
        report = self.generate_report(ghost_orders, incomplete_appointments)
        
        # 4. Mostrar resumen
        self.print_summary(report)
        
        # 5. Guardar reporte
        if output_file:
            self.save_report(report, output_file)
        
        # 6. Ejecutar limpieza si no es dry-run ni report-only
        if not dry_run and not report_only:
            if report['ghost_orders']['count'] > 0:
                self.execute_cleanup(ghost_orders, action)
            if fix_appointments and report['incomplete_appointments']['count'] > 0:
                self.fix_appointments(incomplete_appointments)
        elif report_only:
            self.stdout.write(self.style.SUCCESS('📄 Reporte generado (report-only mode)'))
        else:
            self.stdout.write(self.style.SUCCESS('✅ Dry-run completado. Use sin --dry-run para ejecutar.'))
    
    def identify_ghost_orders(self, include_void, min_age_days):
        """
        Identifica órdenes fantasma:
        - Total = $0
        - Sin items O con items de $0
        - Status 'open' (o 'void' si include_void=True)
        """
        from datetime import timedelta
        
        queryset = ChargeOrder.objects.all()
        
        # Filtrar por edad mínima
        if min_age_days > 0:
            cutoff = timezone.now() - timedelta(days=min_age_days)
            queryset = queryset.filter(issued_at__lt=cutoff)
        
        # Filtrar por status
        if include_void:
            queryset = queryset.filter(status__in=['open', 'void'])
        else:
            queryset = queryset.filter(status='open')
        
        ghost_orders = []
        
        for order in queryset:
            # Verificar si es fantasma
            items = order.items.all()
            has_real_items = any(
                item.unit_price > 0 and item.qty > 0 
                for item in items
            )
            
            if order.total == 0 and not has_real_items:
                ghost_orders.append({
                    'id': order.id,
                    'status': order.status,
                    'total': float(order.total),
                    'balance_due': float(order.balance_due),
                    'issued_at': order.issued_at.isoformat() if order.issued_at else None,
                    'appointment_id': order.appointment_id,
                    'patient_id': order.patient_id,
                    'patient_name': order.patient.full_name if order.patient else None,
                    'items_count': items.count(),
                    'payments_count': order.payments.count(),
                })
        
        return ghost_orders
    
    def identify_incomplete_appointments(self):
        """
        Identifica citas completadas sin órdenes de cobro válidas.
        """
        appointments = Appointment.objects.filter(status='completed')
        incomplete = []
        
        for appt in appointments:
            # Verificar órdenes activas (no void/waived)
            active_orders = appt.charge_orders.exclude(status__in=['void', 'waived'])
            
            if not active_orders.exists():
                incomplete.append({
                    'id': appt.id,
                    'patient_id': appt.patient_id,
                    'patient_name': appt.patient.full_name if appt.patient else None,
                    'appointment_date': str(appt.appointment_date),
                    'started_at': appt.started_at.isoformat() if appt.started_at else None,
                    'completed_at': appt.completed_at.isoformat() if appt.completed_at else None,
                    'expected_amount': float(appt.expected_amount),
                })
        
        return incomplete
    
    def generate_report(self, ghost_orders, incomplete_appointments):
        """Genera reporte estructurado."""
        return {
            'timestamp': timezone.now().isoformat(),
            'ghost_orders': {
                'count': len(ghost_orders),
                'orders': ghost_orders,
            },
            'incomplete_appointments': {
                'count': len(incomplete_appointments),
                'appointments': incomplete_appointments,
            },
            'statistics': {
                'total_charge_orders': ChargeOrder.objects.count(),
                'total_appointments': Appointment.objects.count(),
                'total_payments': Payment.objects.count(),
            }
        }
    
    def print_summary(self, report):
        """Imprime resumen en consola."""
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('📊 RESUMEN DE DIAGNÓSTICO'))
        self.stdout.write('-' * 40)
        
        # Ghost orders
        ghost_count = report['ghost_orders']['count']
        if ghost_count > 0:
            self.stdout.write(self.style.ERROR(f'🔴 Órdenes fantasma encontradas: {ghost_count}'))
            for order in report['ghost_orders']['orders'][:5]:  # Mostrar primeras 5
                self.stdout.write(f"   - Order #{order['id']}: ${order['total']} | Patient: {order['patient_name']} | Items: {order['items_count']}")
            if ghost_count > 5:
                self.stdout.write(f"   ... y {ghost_count - 5} más")
        else:
            self.stdout.write(self.style.SUCCESS('🟢 No se encontraron órdenes fantasma'))
        
        # Incomplete appointments
        incomplete_count = report['incomplete_appointments']['count']
        if incomplete_count > 0:
            self.stdout.write(self.style.WARNING(f'🟡 Citas sin facturación: {incomplete_count}'))
        
        # Statistics
        self.stdout.write('')
        self.stdout.write('📈 ESTADÍSTICAS GENERALES:')
        stats = report['statistics']
        self.stdout.write(f"   Total ChargeOrders: {stats['total_charge_orders']}")
        self.stdout.write(f"   Total Appointments: {stats['total_appointments']}")
        self.stdout.write(f"   Total Payments: {stats['total_payments']}")
        
        self.stdout.write('')
    
    def save_report(self, report, output_file):
        """Guarda reporte en archivo JSON."""
        try:
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            self.stdout.write(self.style.SUCCESS(f'📄 Reporte guardado en: {output_file}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error guardando reporte: {e}'))
    
    @transaction.atomic
    def execute_cleanup(self, ghost_orders, action):
        """Ejecuta la limpieza."""
        self.stdout.write('')
        self.stdout.write(self.style.WARNING(f'🧹 EJECUTANDO LIMPIEZA: {action.upper()}'))
        self.stdout.write('-' * 40)
        
        processed = 0
        errors = 0
        
        for order_data in ghost_orders:
            try:
                order = ChargeOrder.objects.get(id=order_data['id'])
                
                if action == 'void':
                    order.status = 'void'
                    order.save(update_fields=['status'])
                    self.stdout.write(f"   ✓ Order #{order.id} marcada como VOID")
                    
                elif action == 'delete':
                    # Eliminar items primero
                    order.items.all().delete()
                    # Eliminar orden
                    order.delete()
                    self.stdout.write(f"   ✓ Order #{order_data['id']} ELIMINADA")
                
                processed += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ✗ Error con Order #{order_data['id']}: {e}"))
                errors += 1
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ LIMPIEZA COMPLETADA'))
        self.stdout.write(f"   Procesadas: {processed}")
        self.stdout.write(f"   Errores: {errors}")
    
    @transaction.atomic
    def fix_appointments(self, incomplete_appointments):
        """Marca citas sin facturación como pendientes para revisión."""
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('🔧 CORRIGIENDO CITAS SIN FACTURACIÓN'))
        self.stdout.write('-' * 40)
        
        for appt_data in incomplete_appointments:
            try:
                appt = Appointment.objects.get(id=appt_data['id'])
                # Agregar nota para revisión
                if appt.notes:
                    appt.notes += '\n[SYSTEM] Requiere facturación - marcado por cleanup'
                else:
                    appt.notes = '[SYSTEM] Requiere facturación - marcado por cleanup'
                appt.save(update_fields=['notes'])
                self.stdout.write(f"   ✓ Appointment #{appt.id} marcado para revisión")
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ✗ Error con Appointment #{appt_data['id']}: {e}"))