from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_add_address_to_historicalpatient"),  # ajusta si tu último número es distinto
    ]

    operations = [
        migrations.AddField(
            model_name="historicalpatient",
            name="genetic_predispositions",
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name="Predisposiciones genéticas"
            ),
        ),
    ]
