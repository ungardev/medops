from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_alter_historicalpatient_email_alter_patient_email"),
    ]

    operations = [
        migrations.AddField(
            model_name="historicalpatient",
            name="address",
            field=models.TextField(blank=True, null=True, verbose_name="Dirección"),
        ),
    ]
