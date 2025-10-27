from django.db import migrations

def forwards(apps, schema_editor):
    WaitingRoomEntry = apps.get_model("core", "WaitingRoomEntry")

    for entry in WaitingRoomEntry.objects.all():
        # Migrar valores antiguos a la nueva estructura
        if entry.priority == "scheduled":
            entry.priority = "normal"
            entry.source_type = "scheduled"
        elif entry.priority == "walkin":
            entry.priority = "normal"
            entry.source_type = "walkin"
        elif entry.priority == "emergency":
            entry.priority = "emergency"
            entry.source_type = "scheduled"
        entry.save(update_fields=["priority", "source_type"])

def backwards(apps, schema_editor):
    WaitingRoomEntry = apps.get_model("core", "WaitingRoomEntry")

    for entry in WaitingRoomEntry.objects.all():
        # Revertir a los valores antiguos
        if entry.priority == "normal" and entry.source_type == "scheduled":
            entry.priority = "scheduled"
        elif entry.priority == "normal" and entry.source_type == "walkin":
            entry.priority = "walkin"
        elif entry.priority == "emergency":
            entry.priority = "emergency"
        entry.save(update_fields=["priority"])

class Migration(migrations.Migration):

    dependencies = [
        ("core", "0007_alter_waitingroomentry_options_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
