# core/utils/history.py
from core.models import Patient

def get_patient_full_history(patient_id: int, limit: int = 10):
    """
    Devuelve los últimos registros históricos de un paciente,
    incluyendo todos los campos relevantes y el snapshot de predisposiciones genéticas.
    """
    qs = (
        Patient.history
        .filter(id=patient_id)
        .values(
            "history_id",
            "history_date",
            "history_type",
            "history_change_reason",
            "first_name",
            "middle_name",
            "last_name",
            "second_last_name",
            "birthdate",
            "gender",
            "contact_info",
            "email",
            "address",
            "weight",
            "height",
            "blood_type",
            "allergies",
            "medical_history",
            "active",
            "created_at",
            "updated_at",
            "genetic_predispositions",  # 👈 snapshot serializado por la señal
        )
        .order_by("-history_date")[:limit]
    )
    return list(qs)
