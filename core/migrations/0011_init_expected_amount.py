from django.db import migrations
from decimal import Decimal

def set_expected_amount(apps, schema_editor):
    Appointment = apps.get_model('core', 'Appointment')
    default_amount = Decimal('50.00')  # 🔹 Ajusta aquí el valor inicial que quieras

    for appt in Appointment.objects.all():
        if appt.expected_amount == Decimal('0.00'):
            appt.expected_amount = default_amount
            appt.save(update_fields=['expected_amount'])

def unset_expected_amount(apps, schema_editor):
    Appointment = apps.get_model('core', 'Appointment')
    for appt in Appointment.objects.all():
        appt.expected_amount = Decimal('0.00')
        appt.save(update_fields=['expected_amount'])

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_appointment_expected_amount_and_more'),
    ]

    operations = [
        migrations.RunPython(set_expected_amount, unset_expected_amount),
    ]
