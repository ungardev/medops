from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE core_institutionsettings
                ADD COLUMN neighborhood_id bigint NULL;

                ALTER TABLE core_institutionsettings
                ADD CONSTRAINT core_institutionsettings_neighborhood_id_fk
                FOREIGN KEY (neighborhood_id)
                REFERENCES core_neighborhood(id)
                DEFERRABLE INITIALLY DEFERRED;

                ALTER TABLE core_institutionsettings
                ALTER COLUMN address DROP NOT NULL;
            """,
            reverse_sql="""
                ALTER TABLE core_institutionsettings DROP CONSTRAINT core_institutionsettings_neighborhood_id_fk;
                ALTER TABLE core_institutionsettings DROP COLUMN neighborhood_id;
                ALTER TABLE core_institutionsettings ALTER COLUMN address SET NOT NULL;
            """
        ),
    ]
