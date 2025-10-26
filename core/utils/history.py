# core/utils/history.py
from core.models import Patient

def get_patient_full_history(patient_id: int, limit: int = 10):
    """
    Devuelve los últimos registros históricos de un paciente,
    incluyendo todos los campos de la tabla histórica.
    Nota: usamos .values() sin lista de campos para que incluya
    también columnas no declaradas en el modelo histórico autogenerado,
    como 'genetic_predispositions'.
    """
    qs = (
        Patient.history
        .filter(id=patient_id)
        .values()  # 👈 trae todas las columnas de la tabla
        .order_by("-history_date")[:limit]
    )
    return list(qs)
