from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_geneticpredisposition_alter_waitingroomentry_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='weight',
            field=models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='height',
            field=models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='blood_type',
            field=models.CharField(max_length=3, null=True, blank=True, choices=[
                ("A+", "A+"), ("A-", "A-"),
                ("B+", "B+"), ("B-", "B-"),
                ("AB+", "AB+"), ("AB-", "AB-"),
                ("O+", "O+"), ("O-", "O-"),
            ]),
        ),
        migrations.AddField(
            model_name='patient',
            name='allergies',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patient',
            name='medical_history',
            field=models.TextField(blank=True, null=True),
        ),
    ]
