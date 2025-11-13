from django.db import migrations

SPECIALTY_CHOICES = [
    ("allergy_immunology", "Allergy and Immunology (Alergia e Inmunología)"),
    ("anesthesiology", "Anesthesiology (Anestesiología)"),
    ("cardiology", "Cardiology (Cardiología)"),
    ("dermatology", "Dermatology (Dermatología)"),
    ("diagnostic_radiology", "Diagnostic Radiology (Radiología Diagnóstica)"),
    ("emergency_medicine", "Emergency Medicine (Medicina de Emergencia/Urgencias)"),
    ("endocrinology", "Endocrinology (Endocrinología)"),
    ("family_medicine", "Family Medicine (Medicina Familiar)"),
    ("gastroenterology", "Gastroenterology (Gastroenterología)"),
    ("general_surgery", "General Surgery (Cirugía General)"),
    ("geriatrics", "Geriatric Medicine (Medicina Geriátrica/Geriatría)"),
    ("hematology", "Hematology (Hematología)"),
    ("infectious_disease", "Infectious Disease (Enfermedades Infecciosas)"),
    ("internal_medicine", "Internal Medicine (Medicina Interna)"),
    ("nephrology", "Nephrology (Nefrología)"),
    ("neurology", "Neurology (Neurología)"),
    ("neurosurgery", "Neurosurgery (Neurocirugía)"),
    ("nuclear_medicine", "Nuclear Medicine (Medicina Nuclear)"),
    ("obgyn", "Obstetrics and Gynecology (Obstetricia y Ginecología)"),
    ("ophthalmology", "Ophthalmology (Oftalmología)"),
    ("orthopedic_surgery", "Orthopedic Surgery (Cirugía Ortopédica/Traumatología)"),
    ("otolaryngology", "Otolaryngology (Otorrinolaringología)"),
    ("pathology", "Pathology (Patología)"),
    ("pediatrics", "Pediatrics (Pediatría)"),
    ("pmr", "Physical Medicine and Rehabilitation (Medicina Física y Rehabilitación)"),
    ("plastic_surgery", "Plastic Surgery (Cirugía Plástica)"),
    ("preventive_medicine", "Preventive Medicine (Medicina Preventiva)"),
    ("psychiatry", "Psychiatry (Psiquiatría)"),
    ("pulmonology", "Pulmonary Disease (Enfermedad Pulmonar/Neumología)"),
    ("radiation_oncology", "Radiation Oncology (Oncología Radioterápica)"),
    ("rheumatology", "Rheumatology (Reumatología)"),
    ("urology", "Urology (Urología)"),
    ("vascular_surgery", "Vascular Surgery (Cirugía Vascular)"),
    ("other", "Other (Otro)"),
]

def load_specialties(apps, schema_editor):
    Specialty = apps.get_model("core", "Specialty")
    for code, name in SPECIALTY_CHOICES:
        Specialty.objects.get_or_create(code=code, defaults={"name": name})

class Migration(migrations.Migration):

    dependencies = [
        ("core", "0023_specialty_remove_doctoroperator_specialty_and_more"),
    ]

    operations = [
        migrations.RunPython(load_specialties),
    ]
