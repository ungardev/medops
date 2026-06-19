"""
Medical Calculators — Centro de Diagnóstico Inteligente MEDOPZ
FASE 1: 8 calculadoras clínicas validadas
"""

from dataclasses import dataclass, field
from typing import Any, Optional, Union
from decimal import Decimal


@dataclass
class CalculatorInput:
    name: str
    label: str
    type: str
    required: bool = True
    options: list[dict] | None = None
    min_value: float | None = None
    max_value: float | None = None
    step: float | None = None
    default_unit: str | None = None
    auto_fill_from_patient: str | None = None
    auto_fill_from_lab: str | None = None


@dataclass
class CalculatorResult:
    name: str
    label: str
    value: float
    unit: str | None = None
    interpretation: str | None = None
    risk_level: str | None = None
    details: list[dict] = field(default_factory=list)


@dataclass
class CalculatorConfig:
    id: str
    name: str
    specialty: str
    category: str
    description: str
    inputs: list[CalculatorInput]
    calculate: callable
    interpret: Optional[callable] = None
    references: list[str] = field(default_factory=list)


def _get_age(birthdate) -> int | None:
    if not birthdate:
        return None
    from datetime import date

    today = date.today()
    age = today.year - birthdate.year
    if today.month < birthdate.month or (
        today.month == birthdate.month and today.day < birthdate.day
    ):
        age -= 1
    return age


# ─── 1. BMI (Índice de Masa Corporal) ────────────────────────────────────────


def calculate_bmi(
    weight_kg: float | Decimal, height_cm: float | Decimal
) -> CalculatorResult:
    h_m = float(height_cm) / 100
    bmi = float(weight_kg) / (h_m**2)
    bmi = round(bmi, 1)

    if bmi < 18.5:
        interpretation = "Bajo peso"
        risk_level = "Bajo"
    elif bmi < 25:
        interpretation = "Peso normal"
        risk_level = "Óptimo"
    elif bmi < 30:
        interpretation = "Sobrepeso"
        risk_level = "Elevado"
    elif bmi < 35:
        interpretation = "Obesidad grado I"
        risk_level = "Alto"
    elif bmi < 40:
        interpretation = "Obesidad grado II"
        risk_level = "Muy alto"
    else:
        interpretation = "Obesidad grado III (mórbida)"
        risk_level = "Extremadamente alto"

    return CalculatorResult(
        name="bmi",
        label="IMC",
        value=bmi,
        unit="kg/m²",
        interpretation=interpretation,
        risk_level=risk_level,
        details=[
            {"label": "Peso", "value": f"{float(weight_kg):.1f} kg"},
            {"label": "Altura", "value": f"{float(height_cm):.1f} cm"},
            {"label": "Clasificación OMS", "value": interpretation},
        ],
    )


# ─── 2. BSA — Mosteller ───────────────────────────────────────────────────────


def calculate_bsa(
    weight_kg: float | Decimal, height_cm: float | Decimal
) -> CalculatorResult:
    w = float(weight_kg)
    h = float(height_cm)
    bsa = ((w * h) / 3600) ** 0.5
    bsa = round(bsa, 2)

    interpretation = f"BSA de {bsa} m² — {'pediátrico' if bsa < 1.2 else 'adulto'}"

    return CalculatorResult(
        name="bsa",
        label="BSA (Mosteller)",
        value=bsa,
        unit="m²",
        interpretation=interpretation,
        details=[
            {"label": "Peso", "value": f"{w:.1f} kg"},
            {"label": "Altura", "value": f"{h:.1f} cm"},
            {"label": "Fórmula", "value": "Mosteller: √(peso × altura / 3600)"},
        ],
    )


# ─── 3. CHA2DS2-VASc ──────────────────────────────────────────────────────────


def calculate_cha2ds2_vasc(
    age: int,
    gender: str,
    chf: bool,
    hypertension: bool,
    stroke_history: bool,
    vascular_history: bool,
    target: bool,
) -> CalculatorResult:
    score = 0
    details = []

    if age >= 75:
        score += 2
        details.append({"label": "Edad ≥ 75 años", "value": "+2"})
    elif age >= 65:
        score += 1
        details.append({"label": "Edad 65-74 años", "value": "+1"})

    if gender == "F":
        score += 1
        details.append({"label": "Sexo femenino", "value": "+1"})

    if chf:
        score += 1
        details.append({"label": "Insuficiencia cardíaca", "value": "+1"})

    if hypertension:
        score += 1
        details.append({"label": "Hipertensión", "value": "+1"})

    if stroke_history:
        score += 2
        details.append({"label": "ACV o embolia previa", "value": "+2"})

    if vascular_history:
        score += 1
        details.append({"label": "Enfermedad vascular", "value": "+1"})

    if target:
        score += 1
        details.append({"label": "Diabetes mellitus", "value": "+1"})

    if score == 0:
        interpretation = "Riesgo bajo — anticoagulación no indicada"
        risk_level = "Bajo"
    elif score == 1:
        interpretation = "Riesgo bajo-moderado — considerar anticoagulación"
        risk_level = "Bajo-Moderado"
    elif score == 2:
        interpretation = "Riesgo moderado — anticoagulación recomendada"
        risk_level = "Moderado"
    else:
        interpretation = "Riesgo alto — anticoagulación strongly recomendada"
        risk_level = "Alto"

    return CalculatorResult(
        name="cha2ds2_vasc",
        label="CHA₂DS₂-VASc",
        value=score,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details,
    )


# ─── 4. HAS-BLED ─────────────────────────────────────────────────────────────


def calculate_has_bled(
    hypertension: bool,
    renal_liver: bool,
    stroke_history: bool,
    bleeding_history: bool,
    lab_inr: bool,
    age_over_65: bool,
    drugs_alcohol: bool,
) -> CalculatorResult:
    score = 0
    details = []

    if hypertension:
        score += 1
        details.append({"label": "Hipertensión no controlada", "value": "+1"})

    if renal_liver:
        score += 1
        details.append({"label": "Insuficiencia renal o hepática", "value": "+1"})

    if stroke_history:
        score += 1
        details.append({"label": "ACV previo", "value": "+1"})

    if bleeding_history:
        score += 1
        details.append({"label": "Sangrado previo o predisposición", "value": "+1"})

    if lab_inr:
        score += 1
        details.append({"label": "INR lábil o ≥ 3.0", "value": "+1"})

    if age_over_65:
        score += 1
        details.append({"label": "Edad > 65 años", "value": "+1"})

    if drugs_alcohol:
        score += 1
        details.append({"label": "Fármacos (AINES/anticoag) o alcohol", "value": "+1"})

    if score == 0:
        interpretation = "Riesgo bajo de sangrado"
        risk_level = "Bajo"
    elif score == 1 or score == 2:
        interpretation = "Riesgo moderado de sangrado"
        risk_level = "Moderado"
    else:
        interpretation = "Riesgo alto de sangrado — evaluar riesgo/beneficio"
        risk_level = "Alto"

    return CalculatorResult(
        name="has_bled",
        label="HAS-BLED",
        value=score,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details,
    )


# ─── 5. CKD-EPI 2021 (race-free) ─────────────────────────────────────────────


def calculate_ckd_epi(
    age: int,
    gender: str,
    creatinine_mgdl: float,
) -> CalculatorResult:
    if gender == "M":
        if creatinine_mgdl <= 0.7:
            adj = 1.1
            const = -0.302
        else:
            adj = 1.2
            const = -0.601
    else:
        if creatinine_mgdl <= 0.7:
            adj = 1.0
            const = -0.578
        else:
            adj = 1.1
            const = -0.278

    gfr = (
        142
        * min(creatinine_mgdl / adj, 1) ** const
        * max(creatinine_mgdl / adj, 1) ** -1.200
        * 0.9938**age
    )
    gfr = round(gfr, 1)

    if gfr >= 90:
        interpretation = f"Función renal normal o aumentada (GFR ≥ 90)"
        risk_level = "Bajo"
    elif gfr >= 60:
        interpretation = f"Insuficiencia renal leve (G3a)"
        risk_level = "Bajo-Moderado"
    elif gfr >= 45:
        interpretation = f"Insuficiencia renal moderada (G3b)"
        risk_level = "Moderado"
    elif gfr >= 30:
        interpretation = f"Insuficiencia renal moderadamente grave (G4)"
        risk_level = "Alto"
    elif gfr >= 15:
        interpretation = f"Insuficiencia renal grave (G4)"
        risk_level = "Muy alto"
    else:
        interpretation = f"Falla renal (G5) — requerirá diálisis o transplante"
        risk_level = "Extremadamente alto"

    return CalculatorResult(
        name="ckd_epi",
        label="CKD-EPI 2021",
        value=gfr,
        unit="ml/min/1.73m²",
        interpretation=interpretation,
        risk_level=risk_level,
        details=[
            {"label": "Creatinina sérica", "value": f"{creatinine_mgdl:.2f} mg/dL"},
            {"label": "Edad", "value": f"{age} años"},
            {"label": "Sexo", "value": "Masculino" if gender == "M" else "Femenino"},
            {"label": "Fórmula", "value": "CKD-EPI 2021 sin corrección por raza"},
        ],
    )


# ─── 6. GCS — Glasgow Coma Scale ─────────────────────────────────────────────


def calculate_gcs(eye: int, verbal: int, motor: int) -> CalculatorResult:
    total = eye + verbal + motor

    if total == 15:
        interpretation = "Consciencia normal"
        risk_level = "Bajo"
    elif total >= 13:
        interpretation = "Traumatismo craneoencefálico leve"
        risk_level = "Bajo"
    elif total >= 9:
        interpretation = "TCE moderado — observación estrecha"
        risk_level = "Moderado"
    elif total >= 5:
        interpretation = "TCE grave — UCI recomendada"
        risk_level = "Alto"
    else:
        interpretation = "TCE muy grave — pronóstico reservado"
        risk_level = "Muy alto"

    return CalculatorResult(
        name="gcs",
        label="GCS",
        value=total,
        unit="/15",
        interpretation=interpretation,
        risk_level=risk_level,
        details=[
            {"label": "Apertura ocular (E)", "value": f"{eye}/4"},
            {"label": "Respuesta verbal (V)", "value": f"{verbal}/5"},
            {"label": "Respuesta motora (M)", "value": f"{motor}/6"},
            {"label": "Total", "value": f"{total}/15"},
        ],
    )


# ─── 7. qSOFA ─────────────────────────────────────────────────────────────────


def calculate_qsofa(
    rr_over_22: bool, sbp_under_100: bool, altered_mental: bool
) -> CalculatorResult:
    score = sum([rr_over_22, sbp_under_100, altered_mental])
    details = [
        {"label": "FR ≥ 22/min", "value": "Sí" if rr_over_22 else "No"},
        {"label": "PAS ≤ 100 mmHg", "value": "Sí" if sbp_under_100 else "No"},
        {"label": "Alteración mental", "value": "Sí" if altered_mental else "No"},
    ]

    if score >= 2:
        interpretation = "qSOFA positivo — alto riesgo de sepsis"
        risk_level = "Alto"
        recommendation = "Considerar antibióticos y transferencia a UCI"
    elif score == 1:
        interpretation = "qSOFA intermedio — vigilancia activa"
        risk_level = "Moderado"
        recommendation = "Monitoreo cercano y reevaluación en 3-6 horas"
    else:
        interpretation = "qSOFA negativo — bajo riesgo de sepsis"
        risk_level = "Bajo"
        recommendation = "Continuar monitoreo clínico habitual"

    return CalculatorResult(
        name="qsofa",
        label="qSOFA",
        value=score,
        unit="/3",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details + [{"label": "Recomendación", "value": recommendation}],
    )


# ─── 8. Wells PE ──────────────────────────────────────────────────────────────


def calculate_wells_pe(
    clinical_signs_DVT: bool,
    PE_likely: bool,
    hr_over_100: bool,
    immobilization_surgery: bool,
    previous_PE_DVT: bool,
    hemoptysis: bool,
    malignancy: bool,
) -> CalculatorResult:
    score = 0
    details = []

    if clinical_signs_DVT:
        score += 3.0
        details.append({"label": "Signos clínicos de TVP", "value": "+3.0"})

    if PE_likely:
        score += 3.0
        details.append(
            {"label": "EP más probable que diagnóstico alternativo", "value": "+3.0"}
        )

    if hr_over_100:
        score += 1.5
        details.append({"label": "FC > 100 lpm", "value": "+1.5"})

    if immobilization_surgery:
        score += 1.5
        details.append({"label": "Inmovilización o cirugía ≥ 3 días", "value": "+1.5"})

    if previous_PE_DVT:
        score += 1.5
        details.append({"label": "Antecedente de EP o TVP", "value": "+1.5"})

    if hemoptysis:
        score += 1.0
        details.append({"label": "Hemoptisis", "value": "+1.0"})

    if malignancy:
        score += 1.0
        details.append({"label": "Cáncer en tratamiento", "value": "+1.0"})

    score = round(score, 1)

    if score > 6:
        interpretation = "Alta probabilidad de EP"
        risk_level = "Alto"
    elif score >= 4:
        interpretation = "Probabilidad moderada de EP"
        risk_level = "Moderado-Alto"
    else:
        interpretation = "Baja probabilidad de EP"
        risk_level = "Bajo"

    return CalculatorResult(
        name="wells_pe",
        label="Wells EP",
        value=score,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details,
    )


# ─── 9. MELD — Model for End-Stage Liver Disease ──────────────────────────────


def calculate_meld(
    age: int,
    bilirubin_mgdl: float,
    inr: float,
    creatinine_mgdl: float,
) -> CalculatorResult:
    import math

    bili = max(bilirubin_mgdl, 1.0)
    inr_val = max(inr, 1.0)
    creat = max(creatinine_mgdl, 1.0)

    meld = (
        9.57 * math.log(bili) + 3.78 * math.log(inr_val) + 11.2 * math.log(creat) + 6.43
    )
    meld = round(meld, 1)
    meld = max(6.0, min(40.0, meld))

    if meld < 10:
        interpretation = "Enfermedad hepática temprana —listar para transplante"
        risk_level = "Bajo"
    elif meld < 19:
        interpretation = "Enfermedad hepática moderada — evaluar listado"
        risk_level = "Moderado"
    elif meld < 25:
        interpretation = "Enfermedad avanzada — transplante prioritario"
        risk_level = "Alto"
    else:
        interpretation = "Enfermedad muy avanzada — alto riesgo de mortalidad"
        risk_level = "Muy alto"

    return CalculatorResult(
        name="meld",
        label="MELD",
        value=meld,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=[
            {"label": "Bilirrubina", "value": f"{bilirubin_mgdl:.2f} mg/dL"},
            {"label": "INR", "value": f"{inr:.2f}"},
            {"label": "Creatinina", "value": f"{creatinine_mgdl:.2f} mg/dL"},
            {"label": "Edad", "value": f"{age} años"},
            {"label": "MELD-Na", "value": "Considerar añadir Na sérico"},
        ],
    )


# ─── 10. Framingham Risk Score — 10-Year CVD ─────────────────────────────────


def calculate_framingham(
    age: int,
    total_cholesterol: float,
    hdl_cholesterol: float,
    systolic_bp: int,
    bp_treatment: bool,
    smoking: bool,
    diabetes: bool,
    gender: str,
) -> CalculatorResult:
    points = 0
    details = []

    if gender == "M":
        if age >= 75:
            points += 12
            details.append({"label": "Edad 75+", "value": "+12"})
        elif age >= 70:
            points += 10
            details.append({"label": "Edad 70-74", "value": "+10"})
        elif age >= 65:
            points += 8
            details.append({"label": "Edad 65-69", "value": "+8"})
        elif age >= 60:
            points += 6
            details.append({"label": "Edad 60-64", "value": "+6"})
        elif age >= 55:
            points += 5
            details.append({"label": "Edad 55-59", "value": "+5"})
        elif age >= 50:
            points += 3
            details.append({"label": "Edad 50-54", "value": "+3"})
        elif age >= 45:
            points += 2
            details.append({"label": "Edad 45-49", "value": "+2"})
        else:
            points += 0
            details.append({"label": "Edad < 45", "value": "0"})

        if total_cholesterol >= 280:
            points += 5
            details.append({"label": "Colesterol total ≥ 280", "value": "+5"})
        elif total_cholesterol >= 240:
            points += 3
            details.append({"label": "Colesterol total 240-279", "value": "+3"})
        elif total_cholesterol >= 200:
            points += 1
            details.append({"label": "Colesterol total 200-239", "value": "+1"})
        else:
            details.append({"label": "Colesterol total < 200", "value": "0"})

        if hdl_cholesterol >= 60:
            points -= 2
            details.append({"label": "HDL ≥ 60 mg/dL", "value": "-2"})
        elif hdl_cholesterol >= 50:
            points += 0
            details.append({"label": "HDL 50-59 mg/dL", "value": "0"})
        elif hdl_cholesterol >= 40:
            points += 1
            details.append({"label": "HDL 40-49 mg/dL", "value": "+1"})
        else:
            points += 2
            details.append({"label": "HDL < 40 mg/dL", "value": "+2"})

        if bp_treatment:
            if systolic_bp >= 160:
                points += 4
                details.append({"label": "PAS ≥ 160 con tratamiento", "value": "+4"})
            elif systolic_bp >= 140:
                points += 3
                details.append({"label": "PAS 140-159 con tratamiento", "value": "+3"})
            else:
                points += 2
                details.append({"label": "PAS < 140 con tratamiento", "value": "+2"})
        else:
            if systolic_bp >= 160:
                points += 3
                details.append({"label": "PAS ≥ 160 sin tratamiento", "value": "+3"})
            elif systolic_bp >= 140:
                points += 2
                details.append({"label": "PAS 140-159 sin tratamiento", "value": "+2"})
            else:
                points += 0
                details.append({"label": "PAS < 140 sin tratamiento", "value": "0"})

        if smoking:
            points += 4
            details.append({"label": "Fumador activo", "value": "+4"})
        else:
            details.append({"label": "No fumador", "value": "0"})

        if diabetes:
            points += 3
            details.append({"label": "Diabetes mellitus", "value": "+3"})
        else:
            details.append({"label": "Sin diabetes", "value": "0"})

    else:
        if age >= 75:
            points += 10
            details.append({"label": "Edad 75+", "value": "+10"})
        elif age >= 70:
            points += 8
            details.append({"label": "Edad 70-74", "value": "+8"})
        elif age >= 65:
            points += 6
            details.append({"label": "Edad 65-69", "value": "+6"})
        elif age >= 60:
            points += 5
            details.append({"label": "Edad 60-64", "value": "+5"})
        elif age >= 55:
            points += 3
            details.append({"label": "Edad 55-59", "value": "+3"})
        elif age >= 50:
            points += 2
            details.append({"label": "Edad 50-54", "value": "+2"})
        elif age >= 45:
            points += 1
            details.append({"label": "Edad 45-49", "value": "+1"})
        else:
            points += 0
            details.append({"label": "Edad < 45", "value": "0"})

        if total_cholesterol >= 280:
            points += 5
            details.append({"label": "Colesterol total ≥ 280", "value": "+5"})
        elif total_cholesterol >= 240:
            points += 3
            details.append({"label": "Colesterol total 240-279", "value": "+3"})
        elif total_cholesterol >= 200:
            points += 1
            details.append({"label": "Colesterol total 200-239", "value": "+1"})
        else:
            details.append({"label": "Colesterol total < 200", "value": "0"})

        if hdl_cholesterol >= 60:
            points -= 2
            details.append({"label": "HDL ≥ 60 mg/dL", "value": "-2"})
        elif hdl_cholesterol >= 50:
            points += 0
            details.append({"label": "HDL 50-59 mg/dL", "value": "0"})
        elif hdl_cholesterol >= 40:
            points += 1
            details.append({"label": "HDL 40-49 mg/dL", "value": "+1"})
        else:
            points += 2
            details.append({"label": "HDL < 40 mg/dL", "value": "+2"})

        if bp_treatment:
            if systolic_bp >= 160:
                points += 4
                details.append({"label": "PAS ≥ 160 con tratamiento", "value": "+4"})
            elif systolic_bp >= 140:
                points += 3
                details.append({"label": "PAS 140-159 con tratamiento", "value": "+3"})
            else:
                points += 2
                details.append({"label": "PAS < 140 con tratamiento", "value": "+2"})
        else:
            if systolic_bp >= 160:
                points += 3
                details.append({"label": "PAS ≥ 160 sin tratamiento", "value": "+3"})
            elif systolic_bp >= 140:
                points += 2
                details.append({"label": "PAS 140-159 sin tratamiento", "value": "+2"})
            else:
                points += 0
                details.append({"label": "PAS < 140 sin tratamiento", "value": "0"})

        if smoking:
            points += 3
            details.append({"label": "Fumadora activa", "value": "+3"})
        else:
            details.append({"label": "No fumadora", "value": "0"})

        if diabetes:
            points += 3
            details.append({"label": "Diabetes mellitus", "value": "+3"})
        else:
            details.append({"label": "Sin diabetes", "value": "0"})

    risk_10_year = max(1, min(30, _framingham_risk_table(gender, points)))

    if risk_10_year < 10:
        interpretation = f"Riesgo cardiovascular bajo — {'<10%'}"
        risk_level = "Bajo"
    elif risk_10_year < 20:
        interpretation = f"Riesgo cardiovascular moderado — {'10-20%'}"
        risk_level = "Moderado"
    else:
        interpretation = f"Riesgo cardiovascular alto — {'>20%'}"
        risk_level = "Alto"

    return CalculatorResult(
        name="framingham",
        label="Framingham",
        value=risk_10_year,
        unit="%",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details
        + [
            {"label": "Puntos totales", "value": str(points)},
            {
                "label": "Riesgo 10 años",
                "value": f"{risk_10_year}%",
            },
        ],
    )


def _framingham_risk_table(gender: str, points: int) -> float:
    table = {
        "M": {
            -3: 0.0,
            -2: 0.0,
            -1: 0.0,
            0: 0.0,
            1: 0.0,
            2: 0.0,
            3: 0.0,
            4: 0.0,
            5: 0.0,
            6: 0.0,
            7: 0.0,
            8: 0.0,
            9: 0.0,
            10: 0.0,
            11: 0.0,
            12: 0.0,
            13: 0.0,
            14: 0.0,
            15: 1.0,
            16: 1.0,
            17: 1.0,
            18: 2.0,
            19: 2.0,
            20: 3.0,
            21: 4.0,
            22: 5.0,
            23: 6.0,
            24: 8.0,
            25: 10.0,
            26: 12.0,
            27: 16.0,
            28: 20.0,
            29: 25.0,
            30: 30.0,
        },
        "F": {
            -2: 0.0,
            -1: 0.0,
            0: 0.0,
            1: 0.0,
            2: 0.0,
            3: 0.0,
            4: 0.0,
            5: 0.0,
            6: 0.0,
            7: 0.0,
            8: 0.0,
            9: 0.0,
            10: 0.0,
            11: 1.0,
            12: 1.0,
            13: 1.0,
            14: 2.0,
            15: 3.0,
            16: 4.0,
            17: 5.0,
            18: 6.0,
            19: 8.0,
            20: 11.0,
            21: 14.0,
            22: 17.0,
            23: 22.0,
            24: 27.0,
            25: 30.0,
        },
    }
    return table.get(gender, {}).get(points, 1.0)


# ─── 11. APACHE II — ICU Mortality ───────────────────────────────────────────


def calculate_apache_ii(
    age: int,
    temp_c: float,
    map_mmhg: int,
    hr_bpm: int,
    rr_bpm: int,
    fio2: int,
    pao2_mmhg: float,
    ph_arterial: float,
    paco2_mmhg: float,
    sodium_mEqL: int,
    potassium_mEqL: float,
    creatinine_mgdl: float,
    hematocrit_pct: float,
    wbc_x1000: float,
    gcs_eye: int,
    gcs_verbal: int,
    gcs_motor: int,
    chronic_health: bool,
) -> CalculatorResult:
    gcs = gcs_eye + gcs_verbal + gcs_motor

    if age < 40:
        age_pts = 0
    elif age < 60:
        age_pts = 2
    elif age < 65:
        age_pts = 3
    elif age < 70:
        age_pts = 4
    elif age < 75:
        age_pts = 5
    else:
        age_pts = 6

    if map_mmhg < 70:
        map_pts = 4
    elif map_mmhg < 80:
        map_pts = 2
    elif map_mmhg < 100:
        map_pts = 0
    elif map_mmhg < 130:
        map_pts = 1
    elif map_mmhg < 140:
        map_pts = 2
    else:
        map_pts = 3

    if fio2 >= 50:
        aado2 = (fio2 * (713 - paco2_mmhg) - pao2_mmhg) / 100
        if aado2 < 200:
            aado2_pts = 0
        elif aado2 < 350:
            aado2_pts = 2
        elif aado2 < 500:
            aado2_pts = 3
        else:
            aado2_pts = 4
    else:
        if pao2_mmhg >= 80:
            aado2_pts = 0
        elif pao2_mmhg >= 70:
            aado2_pts = 1
        elif pao2_mmhg >= 60:
            aado2_pts = 2
        else:
            aado2_pts = 3

    if ph_arterial < 7.15:
        ph_pts = 4
    elif ph_arterial < 7.25:
        ph_pts = 3
    elif ph_arterial < 7.35:
        ph_pts = 1
    else:
        ph_pts = 0

    if paco2_mmhg < 25:
        paco2_pts = 4
    elif paco2_mmhg < 30:
        paco2_pts = 2
    elif paco2_mmhg < 45:
        paco2_pts = 0
    elif paco2_mmhg < 52:
        paco2_pts = 1
    else:
        paco2_pts = 4

    if sodium_mEqL < 111:
        na_pts = 4
    elif sodium_mEqL < 120:
        na_pts = 3
    elif sodium_mEqL < 130:
        na_pts = 2
    elif sodium_mEqL < 150:
        na_pts = 0
    elif sodium_mEqL < 151:
        na_pts = 1
    else:
        na_pts = 4

    if potassium_mEqL < 2.5:
        k_pts = 4
    elif potassium_mEqL < 3.0:
        k_pts = 2
    elif potassium_mEqL < 3.5:
        k_pts = 1
    elif potassium_mEqL < 5.5:
        k_pts = 0
    elif potassium_mEqL < 6.0:
        k_pts = 2
    else:
        k_pts = 4

    if creatinine_mgdl < 0.6:
        creat_pts = 2
    elif creatinine_mgdl < 1.5:
        creat_pts = 0
    elif creatinine_mgdl < 2.0:
        creat_pts = 2
    else:
        creat_pts = 4

    if hematocrit_pct < 30.0:
        hct_pts = 4
    elif hematocrit_pct < 35.0:
        hct_pts = 2
    elif hematocrit_pct < 46.0:
        hct_pts = 0
    else:
        hct_pts = 2

    if wbc_x1000 < 1.0:
        wbc_pts = 4
    elif wbc_x1000 < 3.0:
        wbc_pts = 2
    elif wbc_x1000 < 15.0:
        wbc_pts = 0
    else:
        wbc_pts = 2

    apache_score = (
        age_pts
        + map_pts
        + aado2_pts
        + ph_pts
        + paco2_pts
        + na_pts
        + k_pts
        + creat_pts
        + hct_pts
        + wbc_pts
        + (15 - gcs)
    )

    chronic_pts = 5 if chronic_health else 0
    total_apache = apache_score + chronic_pts

    mortality = _apache_mortality(total_apache)

    if total_apache < 10:
        interpretation = "ICU bajo riesgo — mortalidad estimada <10%"
        risk_level = "Bajo"
    elif total_apache < 20:
        interpretation = "ICU riesgo moderado — mortalidal {'15-25%'}"
        risk_level = "Moderado"
    elif total_apache < 30:
        interpretation = "ICU alto riesgo — mortalidad {'40-55%'}"
        risk_level = "Alto"
    else:
        interpretation = "ICU muy alto riesgo — mortalidad >{'75%'}"
        risk_level = "Muy alto"

    return CalculatorResult(
        name="apache_ii",
        label="APACHE II",
        value=total_apache,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=[
            {"label": "Score AG + Crónicos", "value": str(total_apache)},
            {"label": "Mortalidad estimada", "value": f"{mortality}%"},
            {"label": "GCS", "value": f"{gcs}/15"},
            {"label": "Edad pts", "value": str(age_pts)},
            {"label": "PA/FiO2 pts", "value": str(aado2_pts)},
            {"label": "Enfermedad crónica", "value": "Sí" if chronic_health else "No"},
        ],
    )


def _apache_mortality(score: int) -> int:
    if score <= 4:
        return 2
    elif score <= 9:
        return 5
    elif score <= 14:
        return 8
    elif score <= 19:
        return 15
    elif score <= 24:
        return 25
    elif score <= 29:
        return 40
    elif score <= 34:
        return 55
    elif score <= 39:
        return 75
    else:
        return 90


# ─── 12. CURB-65 — Neumonía ───────────────────────────────────────────────────


def calculate_curb65(
    confusion: bool,
    bun_mgdl: float,
    rr_over_30: bool,
    bp_diastolic_under_60: bool,
    age_over_65: bool,
) -> CalculatorResult:
    score = sum(
        [
            confusion,
            bun_mgdl > 19,
            rr_over_30,
            bp_diastolic_under_60,
            age_over_65,
        ]
    )
    details = [
        {"label": "Confusión aguda", "value": "Sí" if confusion else "No"},
        {
            "label": "BUN > 19 mg/dL",
            "value": f"{'Sí' if bun_mgdl > 19 else 'No'} ({bun_mgdl:.1f})",
        },
        {"label": "FR ≥ 30/min", "value": "Sí" if rr_over_30 else "No"},
        {"label": "PAD < 60 mmHg", "value": "Sí" if bp_diastolic_under_60 else "No"},
        {"label": "Edad ≥ 65 años", "value": "Sí" if age_over_65 else "No"},
    ]

    if score == 0:
        interpretation = "Neumonía leve — tratamiento ambulatorio"
        risk_level = "Bajo"
        recommendation = "Antibióticos orales + seguimiento"
    elif score == 1:
        interpretation = "Neumonía no severa — considerar alta"
        risk_level = "Bajo-Moderado"
        recommendation = "Antibióticos orales o alta temprana"
    elif score == 2:
        interpretation = "Neumonía severa — hospitalización"
        risk_level = "Moderado-Alto"
        recommendation = "Hospitalización + antibióticos IV"
    elif score == 3:
        interpretation = "Neumonía muy severa — UCI posible"
        risk_level = "Alto"
        recommendation = "UCI o monitorización estrecha"
    else:
        interpretation = "Neumonía crítica — UCI"
        risk_level = "Muy alto"
        recommendation = "UCI + soporte ventilatorio"

    return CalculatorResult(
        name="curb65",
        label="CURB-65",
        value=score,
        unit="/5",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details + [{"label": "Recomendación", "value": recommendation}],
    )


# ─── 13. Child-Pugh — Cirrosis ─────────────────────────────────────────────────


def calculate_child_pugh(
    bilirubin_mgdl: float,
    albumin_gdL: float,
    inr: float,
    ascites: str,
    encephalopathy: str,
) -> CalculatorResult:
    score = 0
    details = []

    if bilirubin_mgdl < 2.0:
        score += 1
        details.append({"label": "Bilirrubina < 2 mg/dL", "value": "+1"})
    elif bilirubin_mgdl <= 3.0:
        score += 2
        details.append({"label": "Bilirrubina 2-3 mg/dL", "value": "+2"})
    else:
        score += 3
        details.append({"label": "Bilirrubina > 3 mg/dL", "value": "+3"})

    if albumin_gdL > 3.5:
        score += 1
        details.append({"label": "Albúmina > 3.5 g/dL", "value": "+1"})
    elif albumin_gdL >= 2.8:
        score += 2
        details.append({"label": "Albúmina 2.8-3.5 g/dL", "value": "+2"})
    else:
        score += 3
        details.append({"label": "Albúmina < 2.8 g/dL", "value": "+3"})

    if inr < 1.7:
        score += 1
        details.append({"label": "INR < 1.7", "value": "+1"})
    elif inr <= 2.3:
        score += 2
        details.append({"label": "INR 1.7-2.3", "value": "+2"})
    else:
        score += 3
        details.append({"label": "INR > 2.3", "value": "+3"})

    ascites_map = {"none": 1, "mild": 2, "moderate": 3}
    ascites_pts = ascites_map.get(ascites, 1)
    score += ascites_pts
    details.append(
        {"label": "Ascitis", "value": f"{ascites.capitalize()} ({ascites_pts})"}
    )

    enceph_map = {"none": 1, "grade1_2": 2, "grade3_4": 3}
    enceph_pts = enceph_map.get(encephalopathy, 1)
    score += enceph_pts
    details.append(
        {
            "label": "Encefalopatía",
            "value": f"{encephalopathy.replace('_', ' ').capitalize()} ({enceph_pts})",
        }
    )

    if score <= 6:
        interpretation = "Child-Pugh A — cirrosis compensada"
        risk_level = "Bajo"
        mELD = min(10, 6 + score)
    elif score <= 9:
        interpretation = "Child-Pugh B — cirrosis descompensada"
        risk_level = "Moderado"
        mELD = 12 + (score - 6) * 2
    else:
        interpretation = "Child-Pugh C — cirrosis avanzada"
        risk_level = "Alto"
        mELD = min(25, 18 + (score - 10) * 3)

    return CalculatorResult(
        name="child_pugh",
        label="Child-Pugh",
        value=score,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details
        + [
            {"label": "Clasificación", "value": interpretation},
            {"label": "MELD estimado", "value": f"{mELD:.0f}"},
        ],
    )


# ─── CALCULATOR REGISTRY ──────────────────────────────────────────────────────


CALCULATOR_REGISTRY: dict[str, CalculatorConfig] = {}


def register_calculator(config: CalculatorConfig):
    CALCULATOR_REGISTRY[config.id] = config


register_calculator(
    CalculatorConfig(
        id="bmi",
        name="IMC",
        specialty="Medicina General",
        category="Antropometría",
        description="Índice de Quetelet. Evalúa el estado nutricional en adultos.",
        inputs=[
            CalculatorInput(
                "weight",
                "Peso",
                "number",
                required=True,
                min_value=1,
                max_value=300,
                default_unit="kg",
                auto_fill_from_patient="weight",
            ),
            CalculatorInput(
                "height",
                "Altura",
                "number",
                required=True,
                min_value=30,
                max_value=250,
                default_unit="cm",
                auto_fill_from_patient="height",
            ),
        ],
        calculate=lambda weight, height: calculate_bmi(weight, height),
        interpret=lambda result: result.interpretation,
        references=["WHO 2000", "OMS Classification 2004"],
    )
)


register_calculator(
    CalculatorConfig(
        id="bsa",
        name="BSA (Mosteller)",
        specialty="Oncología / Cardiología",
        category="Antropometría",
        description="Body Surface Area. Usado para dosificación de Quimioterapia y Cardiology.",
        inputs=[
            CalculatorInput(
                "weight",
                "Peso",
                "number",
                required=True,
                min_value=1,
                max_value=300,
                default_unit="kg",
                auto_fill_from_patient="weight",
            ),
            CalculatorInput(
                "height",
                "Altura",
                "number",
                required=True,
                min_value=30,
                max_value=250,
                default_unit="cm",
                auto_fill_from_patient="height",
            ),
        ],
        calculate=lambda weight, height: calculate_bsa(weight, height),
        references=["Mosteller RD. N Engl J Med 1987;317:1098"],
    )
)


register_calculator(
    CalculatorConfig(
        id="cha2ds2_vasc",
        name="CHA₂DS₂-VASc",
        specialty="Cardiología",
        category="Embolia",
        description="Estratificación de riesgo de ACV en fibrilación auricular. Guía ESC 2020.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "gender",
                "Sexo",
                "select",
                required=True,
                options=[
                    {"value": "M", "label": "Masculino"},
                    {"value": "F", "label": "Femenino"},
                ],
                auto_fill_from_patient="gender",
            ),
            CalculatorInput("chf", "Insuficiencia Cardíaca", "boolean", required=True),
            CalculatorInput(
                "hypertension", "Hipertensión Arterial", "boolean", required=True
            ),
            CalculatorInput(
                "stroke_history", "ACV o Embolia Previa", "boolean", required=True
            ),
            CalculatorInput(
                "vascular_history", "Enfermedad Vascular", "boolean", required=True
            ),
            CalculatorInput("target", "Diabetes Mellitus", "boolean", required=True),
        ],
        calculate=lambda age,
        gender,
        chf,
        hypertension,
        stroke_history,
        vascular_history,
        target: calculate_cha2ds2_vasc(
            age, gender, chf, hypertension, stroke_history, vascular_history, target
        ),
        references=[
            "Lip GYH. Eur Heart J 2010;31:2369-2429",
            "Hindricks G. Europace 2021;23:1-90",
        ],
    )
)


register_calculator(
    CalculatorConfig(
        id="has_bled",
        name="HAS-BLED",
        specialty="Cardiología",
        category="Sangrado",
        description="Riesgo de sangrado en pacientes con anticoagulación. Guía ESC 2021.",
        inputs=[
            CalculatorInput(
                "hypertension", "Hipertensión no controlada", "boolean", required=True
            ),
            CalculatorInput(
                "renal_liver", "Insuficiencia Renal/Hepática", "boolean", required=True
            ),
            CalculatorInput("stroke_history", "ACV Previo", "boolean", required=True),
            CalculatorInput(
                "bleeding_history", "Sangrado Previo", "boolean", required=True
            ),
            CalculatorInput("lab_inr", "INR Lábil o ≥ 3.0", "boolean", required=True),
            CalculatorInput(
                "age_over_65",
                "Edad > 65 años",
                "boolean",
                required=True,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "drugs_alcohol", "Fármacos o Alcohol", "boolean", required=True
            ),
        ],
        calculate=lambda hypertension,
        renal_liver,
        stroke_history,
        bleeding_history,
        lab_inr,
        age_over_65,
        drugs_alcohol: calculate_has_bled(
            hypertension,
            renal_liver,
            stroke_history,
            bleeding_history,
            lab_inr,
            age_over_65,
            drugs_alcohol,
        ),
        references=[
            "Pisters R. Chest 2010;138:246-251",
            "Lip GYH. Eur Heart J 2011;32:315-329",
        ],
    )
)


register_calculator(
    CalculatorConfig(
        id="ckd_epi",
        name="CKD-EPI 2021",
        specialty="Nefrología / Medicina General",
        category="Función Renal",
        description="Tasa de Filtración Glomerular sin corrección por raza. NIH 2021.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "gender",
                "Sexo",
                "select",
                required=True,
                options=[
                    {"value": "M", "label": "Masculino"},
                    {"value": "F", "label": "Femenino"},
                ],
                auto_fill_from_patient="gender",
            ),
            CalculatorInput(
                "creatinine_mgdl",
                "Creatinina Sérica",
                "number",
                required=True,
                min_value=0.1,
                max_value=30,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="creatinina",
            ),
        ],
        calculate=lambda age, gender, creatinine_mgdl: calculate_ckd_epi(
            age, gender, creatinine_mgdl
        ),
        references=["Inker LA. N Engl J Med 2021;385:1737-1749"],
    )
)


register_calculator(
    CalculatorConfig(
        id="gcs",
        name="GCS",
        specialty="Medicina de Emergencia / UCI",
        category="Neurología",
        description="Escala de Coma de Glasgow. Evalúa nivel de consciciencia en TCE.",
        inputs=[
            CalculatorInput(
                "eye",
                "Apertura Ocular (E)",
                "select",
                required=True,
                options=[
                    {"value": 1, "label": "Ninguna (1)"},
                    {"value": 2, "label": "Al dolor (2)"},
                    {"value": 3, "label": "Al habla (3)"},
                    {"value": 4, "label": "Espontánea (4)"},
                ],
            ),
            CalculatorInput(
                "verbal",
                "Respuesta Verbal (V)",
                "select",
                required=True,
                options=[
                    {"value": 1, "label": "Ninguna (1)"},
                    {"value": 2, "label": "Sonidos (2)"},
                    {"value": 3, "label": "Inapropiada (3)"},
                    {"value": 4, "label": "Confusa (4)"},
                    {"value": 5, "label": "Orientada (5)"},
                ],
            ),
            CalculatorInput(
                "motor",
                "Respuesta Motora (M)",
                "select",
                required=True,
                options=[
                    {"value": 1, "label": "Ninguna (1)"},
                    {"value": 2, "label": "Extensión (2)"},
                    {"value": 3, "label": "Flexión anormal (3)"},
                    {"value": 4, "label": "Flexión normal (4)"},
                    {"value": 5, "label": "Localiza (5)"},
                    {"value": 6, "label": "Espontánea (6)"},
                ],
            ),
        ],
        calculate=lambda eye, verbal, motor: calculate_gcs(
            int(eye), int(verbal), int(motor)
        ),
        references=["Teasdale G. Lancet 1974;1:81-84"],
    )
)


register_calculator(
    CalculatorConfig(
        id="qsofa",
        name="qSOFA",
        specialty="Medicina de Emergencia / Infectología",
        category="Sepsis",
        description="Quick Sequential Organ Failure Assessment. Screening rápido de sepsis.",
        inputs=[
            CalculatorInput(
                "rr_over_22",
                "Frecuencia Respiratoria ≥ 22/min",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "sbp_under_100",
                "Presión Arterial Sistólica ≤ 100 mmHg",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "altered_mental",
                "Alteración del Estado Mental (GCS < 15)",
                "boolean",
                required=True,
            ),
        ],
        calculate=lambda rr_over_22, sbp_under_100, altered_mental: calculate_qsofa(
            bool(rr_over_22), bool(sbp_under_100), bool(altered_mental)
        ),
        references=["Singer M. JAMA 2016;315:801-810", "WHO Sepsis Guidelines 2023"],
    )
)


register_calculator(
    CalculatorConfig(
        id="wells_pe",
        name="Wells EP",
        specialty="Medicina de Emergencia / Neumología",
        category="Embolia Pulmonar",
        description="Probabilidad pre-test de Embolia Pulmonar. Wells Criteria 2001.",
        inputs=[
            CalculatorInput(
                "clinical_signs_DVT", "Signos clínicos de TVP", "boolean", required=True
            ),
            CalculatorInput(
                "PE_likely", "EP más probable que alternativa", "boolean", required=True
            ),
            CalculatorInput("hr_over_100", "FC > 100 lpm", "boolean", required=True),
            CalculatorInput(
                "immobilization_surgery",
                "Inmovilización o cirugía ≥ 3 días",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "previous_PE_DVT", "Antecedente de EP o TVP", "boolean", required=True
            ),
            CalculatorInput("hemoptysis", "Hemoptisis", "boolean", required=True),
            CalculatorInput(
                "malignancy", "Cáncer activo o en tratamiento", "boolean", required=True
            ),
        ],
        calculate=lambda clinical_signs_DVT,
        PE_likely,
        hr_over_100,
        immobilization_surgery,
        previous_PE_DVT,
        hemoptysis,
        malignancy: calculate_wells_pe(
            bool(clinical_signs_DVT),
            bool(PE_likely),
            bool(hr_over_100),
            bool(immobilization_surgery),
            bool(previous_PE_DVT),
            bool(hemoptysis),
            bool(malignancy),
        ),
        references=["Wells PS. Ann Intern Med 2001;135:98-107"],
    )
)


register_calculator(
    CalculatorConfig(
        id="meld",
        name="MELD",
        specialty="Hepatología / Transplante",
        category="Hígado",
        description="Model for End-Stage Liver Disease. Priorización para transplante hepático.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "bilirubin_mgdl",
                "Bilirrubina Total",
                "number",
                required=True,
                min_value=0.1,
                max_value=50,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="bilirrubina_total",
            ),
            CalculatorInput(
                "inr",
                "INR",
                "number",
                required=True,
                min_value=0.8,
                max_value=15,
                step=0.1,
                auto_fill_from_lab="inr",
            ),
            CalculatorInput(
                "creatinine_mgdl",
                "Creatinina Sérica",
                "number",
                required=True,
                min_value=0.1,
                max_value=30,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="creatinina",
            ),
        ],
        calculate=lambda age, bilirubin_mgdl, inr, creatinine_mgdl: calculate_meld(
            age, bilirubin_mgdl, inr, creatinine_mgdl
        ),
        references=[
            "Kamath PS. Hepatology 2001;33:464-470",
            "Wiesner R. Gastroenterology 2003;124:91-96",
        ],
    )
)


register_calculator(
    CalculatorConfig(
        id="framingham",
        name="Framingham",
        specialty="Cardiología / Medicina General",
        category="Riesgo Cardiovascular",
        description="Score de riesgo cardiovascular a 10 años. Guía ATP III/NCEP.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=20,
                max_value=80,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "gender",
                "Sexo",
                "select",
                required=True,
                options=[
                    {"value": "M", "label": "Masculino"},
                    {"value": "F", "label": "Femenino"},
                ],
                auto_fill_from_patient="gender",
            ),
            CalculatorInput(
                "total_cholesterol",
                "Colesterol Total",
                "number",
                required=True,
                min_value=100,
                max_value=400,
                default_unit="mg/dL",
                auto_fill_from_lab="colesterol_total",
            ),
            CalculatorInput(
                "hdl_cholesterol",
                "HDL Colesterol",
                "number",
                required=True,
                min_value=10,
                max_value=150,
                default_unit="mg/dL",
                auto_fill_from_lab="hdl",
            ),
            CalculatorInput(
                "systolic_bp",
                "Presión Arterial Sistólica",
                "number",
                required=True,
                min_value=80,
                max_value=250,
                default_unit="mmHg",
            ),
            CalculatorInput(
                "bp_treatment",
                "Tratamiento Antihipertensivo",
                "boolean",
                required=True,
            ),
            CalculatorInput("smoking", "Fumador Activo", "boolean", required=True),
            CalculatorInput("diabetes", "Diabetes Mellitus", "boolean", required=True),
        ],
        calculate=lambda age,
        total_cholesterol,
        hdl_cholesterol,
        systolic_bp,
        bp_treatment,
        smoking,
        diabetes,
        gender: calculate_framingham(
            age,
            total_cholesterol,
            hdl_cholesterol,
            systolic_bp,
            bp_treatment,
            smoking,
            diabetes,
            gender,
        ),
        references=[
            "Wilson PWF. Circulation 1998;97:1837-1847",
            "NCEP ATP III Guidelines 2001",
        ],
    )
)


register_calculator(
    CalculatorConfig(
        id="apache_ii",
        name="APACHE II",
        specialty="Medicina Crítica / UCI",
        category="UCI",
        description="Acute Physiology and Chronic Health Evaluation. Predice mortalidad en UCI.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "temp_c",
                "Temperatura (°C)",
                "number",
                required=True,
                min_value=30,
                max_value=45,
                step=0.1,
            ),
            CalculatorInput(
                "map_mmhg",
                "Presión Arterial Media (mmHg)",
                "number",
                required=True,
                min_value=20,
                max_value=250,
            ),
            CalculatorInput(
                "hr_bpm",
                "Frecuencia Cardíaca (lpm)",
                "number",
                required=True,
                min_value=20,
                max_value=250,
            ),
            CalculatorInput(
                "rr_bpm",
                "Frecuencia Respiratoria (/min)",
                "number",
                required=True,
                min_value=4,
                max_value=60,
            ),
            CalculatorInput(
                "fio2",
                "FiO2 (%)",
                "number",
                required=True,
                min_value=21,
                max_value=100,
            ),
            CalculatorInput(
                "pao2_mmhg",
                "PaO2 (mmHg)",
                "number",
                required=True,
                min_value=30,
                max_value=600,
            ),
            CalculatorInput(
                "ph_arterial",
                "pH Arterial",
                "number",
                required=True,
                min_value=6.8,
                max_value=7.8,
                step=0.01,
            ),
            CalculatorInput(
                "paco2_mmhg",
                "PaCO2 (mmHg)",
                "number",
                required=True,
                min_value=10,
                max_value=100,
            ),
            CalculatorInput(
                "sodium_mEqL",
                "Sodio (mEq/L)",
                "number",
                required=True,
                min_value=100,
                max_value=180,
                auto_fill_from_lab="sodio",
            ),
            CalculatorInput(
                "potassium_mEqL",
                "Potasio (mEq/L)",
                "number",
                required=True,
                min_value=1.5,
                max_value=9.0,
                step=0.1,
                auto_fill_from_lab="potasio",
            ),
            CalculatorInput(
                "creatinine_mgdl",
                "Creatinina (mg/dL)",
                "number",
                required=True,
                min_value=0.1,
                max_value=30,
                step=0.1,
                auto_fill_from_lab="creatinina",
            ),
            CalculatorInput(
                "hematocrit_pct",
                "Hematocrito (%)",
                "number",
                required=True,
                min_value=10,
                max_value=65,
                auto_fill_from_lab="hematocrito",
            ),
            CalculatorInput(
                "wbc_x1000",
                "Leucocitos (×1000/µL)",
                "number",
                required=True,
                min_value=0.1,
                max_value=100,
                step=0.1,
                auto_fill_from_lab="leucocitos",
            ),
            CalculatorInput(
                "gcs_eye",
                "GCS — Apertura Ocular",
                "select",
                required=True,
                options=[
                    {"value": 4, "label": "Espontánea (4)"},
                    {"value": 3, "label": "Al habla (3)"},
                    {"value": 2, "label": "Al dolor (2)"},
                    {"value": 1, "label": "Ninguna (1)"},
                ],
            ),
            CalculatorInput(
                "gcs_verbal",
                "GCS — Respuesta Verbal",
                "select",
                required=True,
                options=[
                    {"value": 5, "label": "Orientada (5)"},
                    {"value": 4, "label": "Confusa (4)"},
                    {"value": 3, "label": "Inapropiada (3)"},
                    {"value": 2, "label": "Sonidos (2)"},
                    {"value": 1, "label": "Ninguna (1)"},
                ],
            ),
            CalculatorInput(
                "gcs_motor",
                "GCS — Respuesta Motora",
                "select",
                required=True,
                options=[
                    {"value": 6, "label": "Espontánea (6)"},
                    {"value": 5, "label": "Localiza (5)"},
                    {"value": 4, "label": "Flexión normal (4)"},
                    {"value": 3, "label": "Flexión anormal (3)"},
                    {"value": 2, "label": "Extensión (2)"},
                    {"value": 1, "label": "Ninguna (1)"},
                ],
            ),
            CalculatorInput(
                "chronic_health",
                "Enfermedad Crónica Severa",
                "boolean",
                required=True,
            ),
        ],
        calculate=lambda **kw: calculate_apache_ii(**kw),
        references=["Knaus WA. Crit Care Med 1985;13:818-829"],
    )
)


register_calculator(
    CalculatorConfig(
        id="curb65",
        name="CURB-65",
        specialty="Medicina de Emergencia / Neumología",
        category="Neumonía",
        description="Severidad de neumonía adquirida en comunidad. Consenso IDSA/ATS.",
        inputs=[
            CalculatorInput(
                "confusion",
                "Confusión Aguda (nuevo inicio)",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "bun_mgdl",
                "BUN",
                "number",
                required=True,
                min_value=1,
                max_value=200,
                step=0.5,
                default_unit="mg/dL",
                auto_fill_from_lab="urea",
            ),
            CalculatorInput(
                "rr_over_30",
                "Frecuencia Respiratoria ≥ 30/min",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "bp_diastolic_under_60",
                "Presión Arterial Diastólica < 60 mmHg",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "age_over_65",
                "Edad ≥ 65 años",
                "boolean",
                required=True,
                auto_fill_from_patient="age",
            ),
        ],
        calculate=lambda confusion,
        bun_mgdl,
        rr_over_30,
        bp_diastolic_under_60,
        age_over_65: calculate_curb65(
            bool(confusion),
            float(bun_mgdl),
            bool(rr_over_30),
            bool(bp_diastolic_under_60),
            bool(age_over_65),
        ),
        references=[
            "Lim WS. Thorax 2003;58:377-382",
            "IDSA/ATS Community-Acquired Pneumonia Guidelines 2019",
        ],
    )
)


register_calculator(
    CalculatorConfig(
        id="child_pugh",
        name="Child-Pugh",
        specialty="Hepatología / Gastroenterología",
        category="Hígado",
        description="Clasificación de severidad de cirrosis. Evalúa prognóstico pre-transplante.",
        inputs=[
            CalculatorInput(
                "bilirubin_mgdl",
                "Bilirrubina Total (mg/dL)",
                "number",
                required=True,
                min_value=0.1,
                max_value=50,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="bilirrubina_total",
            ),
            CalculatorInput(
                "albumin_gdL",
                "Albúmina Sérica",
                "number",
                required=True,
                min_value=1.0,
                max_value=6.0,
                step=0.1,
                default_unit="g/dL",
                auto_fill_from_lab="albumina",
            ),
            CalculatorInput(
                "inr",
                "INR",
                "number",
                required=True,
                min_value=0.8,
                max_value=15,
                step=0.1,
                auto_fill_from_lab="inr",
            ),
            CalculatorInput(
                "ascites",
                "Ascitis",
                "select",
                required=True,
                options=[
                    {"value": "none", "label": "Ninguna"},
                    {"value": "mild", "label": "Leve"},
                    {"value": "moderate", "label": "Moderada-Severa"},
                ],
            ),
            CalculatorInput(
                "encephalopathy",
                "Encefalopatía Hepática",
                "select",
                required=True,
                options=[
                    {"value": "none", "label": "Ninguna"},
                    {"value": "grade1_2", "label": "Grado I-II"},
                    {"value": "grade3_4", "label": "Grado III-IV"},
                ],
            ),
        ],
        calculate=lambda bilirubin_mgdl,
        albumin_gdL,
        inr,
        ascites,
        encephalopathy: calculate_child_pugh(
            float(bilirubin_mgdl),
            float(albumin_gdL),
            float(inr),
            str(ascites),
            str(encephalopathy),
        ),
        references=[
            "Child CG. Surgery 1964;55:323-327",
            "Pugh RNH. Br J Surg 1973;60:646-649",
        ],
    )
)


# ─── 14. MELD-Na — Model for End-Stage Liver Disease with Sodium ─────────────


def calculate_meld_na(
    age: int,
    bilirubin_mgdl: float,
    inr: float,
    creatinine_mgdl: float,
    sodium_mEqL: float,
) -> CalculatorResult:
    import math

    bili = max(bilirubin_mgdl, 1.0)
    inr_val = max(inr, 1.0)
    creat = max(creatinine_mgdl, 1.0)
    na = max(min(sodium_mEqL, 140), 125)

    meld = (
        9.57 * math.log(bili) + 3.78 * math.log(inr_val) + 11.2 * math.log(creat) + 6.43
    )
    meld = max(6.0, min(40.0, meld))

    meld_na = meld + 1.59 * (135 - na)
    meld_na = max(6.0, min(40.0, meld_na))

    if meld_na < 10:
        interpretation = "MELD-Na bajo — listar para transplante"
        risk_level = "Bajo"
    elif meld_na < 19:
        interpretation = "MELD-Na moderado — evaluar listado"
        risk_level = "Moderado"
    elif meld_na < 25:
        interpretation = "MELD-Na alto — transplante prioritario"
        risk_level = "Alto"
    else:
        interpretation = "MELD-Na muy alto — alto riesgo de mortalidad"
        risk_level = "Muy alto"

    return CalculatorResult(
        name="meld_na",
        label="MELD-Na",
        value=round(meld_na, 1),
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=[
            {"label": "Bilirrubina", "value": f"{bilirubin_mgdl:.2f} mg/dL"},
            {"label": "INR", "value": f"{inr:.2f}"},
            {"label": "Creatinina", "value": f"{creatinine_mgdl:.2f} mg/dL"},
            {"label": "Sodio", "value": f"{sodium_mEqL:.0f} mEq/L"},
            {"label": "Edad", "value": f"{age} años"},
            {"label": "MELD crudo", "value": f"{meld:.1f}"},
        ],
    )


# ─── 15. SOFA — Sequential Organ Failure Assessment ───────────────────────────


def calculate_sofa(
    pao2_fio2: float,
    platelets_x1000: float,
    bilirubin_mgdl: float,
    map_mmhg: int,
    gcs_score: int,
    creatinine_mgdl: float,
    on_vasopressors: bool,
) -> CalculatorResult:
    resp_pts = 0
    if pao2_fio2 >= 400:
        resp_pts = 0
    elif pao2_fio2 >= 300:
        resp_pts = 1
    elif pao2_fio2 >= 200:
        resp_pts = 2
    elif pao2_fio2 >= 100:
        resp_pts = 3
    else:
        resp_pts = 4

    coag_pts = 0
    if platelets_x1000 >= 150:
        coag_pts = 0
    elif platelets_x1000 >= 100:
        coag_pts = 1
    elif platelets_x1000 >= 50:
        coag_pts = 2
    elif platelets_x1000 >= 20:
        coag_pts = 3
    else:
        coag_pts = 4

    hep_pts = 0
    if bilirubin_mgdl < 1.2:
        hep_pts = 0
    elif bilirubin_mgdl <= 1.9:
        hep_pts = 1
    elif bilirubin_mgdl <= 3.3:
        hep_pts = 2
    elif bilirubin_mgdl <= 11.9:
        hep_pts = 3
    else:
        hep_pts = 4

    circ_pts = 0
    if on_vasopressors:
        circ_pts = 4
    elif map_mmhg < 70:
        circ_pts = 1
    else:
        circ_pts = 0

    cns_pts = 0
    if gcs_score >= 15:
        cns_pts = 0
    elif gcs_score >= 13:
        cns_pts = 1
    elif gcs_score >= 10:
        cns_pts = 2
    elif gcs_score >= 6:
        cns_pts = 3
    else:
        cns_pts = 4

    renal_pts = 0
    if creatinine_mgdl < 1.2:
        renal_pts = 0
    elif creatinine_mgdl <= 1.9:
        renal_pts = 1
    elif creatinine_mgdl <= 3.4:
        renal_pts = 2
    elif creatinine_mgdl <= 4.9:
        renal_pts = 3
    else:
        renal_pts = 4

    total = resp_pts + coag_pts + hep_pts + circ_pts + cns_pts + renal_pts

    if total < 6:
        interpretation = "Sepsis temprana — monitoreo intensivo"
        risk_level = "Moderado"
    elif total < 10:
        interpretation = "Sepsis severa — UCI necesaria"
        risk_level = "Alto"
    else:
        interpretation = "Fallo orgánico múltiple — UCI critica"
        risk_level = "Muy alto"

    return CalculatorResult(
        name="sofa",
        label="SOFA",
        value=total,
        unit="/24",
        interpretation=interpretation,
        risk_level=risk_level,
        details=[
            {"label": "Respiratorio (PaO2/FiO2)", "value": f"{resp_pts}"},
            {"label": "Coagulacion (Plaquetas)", "value": f"{coag_pts}"},
            {"label": "Hepatico (Bilirrubina)", "value": f"{hep_pts}"},
            {"label": "Cardiovascular", "value": f"{circ_pts}"},
            {"label": "SN/CNS (GCS)", "value": f"{cns_pts}"},
            {"label": "Renal (Creatinina)", "value": f"{renal_pts}"},
            {"label": "GCS score", "value": str(gcs_score)},
        ],
    )


# ─── 16. NEWS2 — National Early Warning Score 2 ───────────────────────────────


def calculate_news2(
    rr_bpm: int,
    spo2_percent: int,
    oxygen_supplement: bool,
    temperature_c: float,
    systolic_bp: int,
    hr_bpm: int,
    altered_consciousness: bool,
) -> CalculatorResult:
    score = 0
    details = []

    if rr_bpm <= 8:
        score += 3
        details.append({"label": "FR <= 8", "value": "+3"})
    elif rr_bpm <= 11:
        score += 1
        details.append({"label": "FR 9-11", "value": "+1"})
    elif rr_bpm <= 20:
        score += 0
        details.append({"label": "FR 12-20", "value": "0"})
    elif rr_bpm <= 24:
        score += 1
        details.append({"label": "FR 21-24", "value": "+1"})
    else:
        score += 3
        details.append({"label": "FR >= 25", "value": "+3"})

    if spo2_percent <= 91:
        score += 3
        details.append({"label": "SpO2 <= 91%", "value": "+3"})
    elif spo2_percent <= 93:
        score += 2
        details.append({"label": "SpO2 92-93%", "value": "+2"})
    elif spo2_percent <= 94:
        score += 1
        details.append({"label": "SpO2 94%", "value": "+1"})
    else:
        score += 0
        details.append({"label": "SpO2 >= 95%", "value": "0"})

    if oxygen_supplement:
        score += 2
        details.append({"label": "O2 suplementario", "value": "+2"})

    if temperature_c <= 35.0:
        score += 3
        details.append({"label": "Temp <= 35.0C", "value": "+3"})
    elif temperature_c <= 36.0:
        score += 1
        details.append({"label": "Temp 35.1-36.0C", "value": "+1"})
    elif temperature_c <= 38.0:
        score += 0
        details.append({"label": "Temp 36.1-38.0C", "value": "0"})
    elif temperature_c <= 39.0:
        score += 1
        details.append({"label": "Temp 38.1-39.0C", "value": "+1"})
    else:
        score += 2
        details.append({"label": "Temp >= 39.1C", "value": "+2"})

    if systolic_bp <= 90:
        score += 3
        details.append({"label": "PAS <= 90", "value": "+3"})
    elif systolic_bp <= 100:
        score += 2
        details.append({"label": "PAS 91-100", "value": "+2"})
    elif systolic_bp <= 110:
        score += 1
        details.append({"label": "PAS 101-110", "value": "+1"})
    elif systolic_bp <= 219:
        score += 0
        details.append({"label": "PAS 111-219", "value": "0"})
    else:
        score += 3
        details.append({"label": "PAS >= 220", "value": "+3"})

    if hr_bpm <= 40:
        score += 3
        details.append({"label": "FC <= 40", "value": "+3"})
    elif hr_bpm <= 50:
        score += 1
        details.append({"label": "FC 41-50", "value": "+1"})
    elif hr_bpm <= 90:
        score += 0
        details.append({"label": "FC 51-90", "value": "0"})
    elif hr_bpm <= 110:
        score += 1
        details.append({"label": "FC 91-110", "value": "+1"})
    elif hr_bpm <= 130:
        score += 2
        details.append({"label": "FC 111-130", "value": "+2"})
    else:
        score += 3
        details.append({"label": "FC >= 131", "value": "+3"})

    if altered_consciousness:
        score += 3
        details.append({"label": "Alteracion mental", "value": "+3"})

    if score == 0:
        interpretation = "Estable — monitoreo habitual"
        risk_level = "Bajo"
    elif score <= 4:
        interpretation = "Enfermedad baja — evaluacion medica"
        risk_level = "Bajo-Moderado"
    elif score <= 6:
        interpretation = "Enfermedad moderada — evaluacion urgente"
        risk_level = "Moderado"
    else:
        interpretation = "Enfermedad alta — riesgo de deterioro"
        risk_level = "Alto"

    return CalculatorResult(
        name="news2",
        label="NEWS2",
        value=score,
        unit="/20",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details,
    )


# ─── 17. TIMI Risk Score (ACS) ───────────────────────────────────────────────


def calculate_timi(
    age: int,
    ecg_changes: bool,
    angina_severe: bool,
    aspirin_use: bool,
    risk_factors_count: int,
    positive_cardiac_markers: bool,
) -> CalculatorResult:
    score = 0
    details = []

    if age >= 65:
        score += 3
        details.append({"label": "Edad >= 65", "value": "+3"})
    elif age >= 55:
        score += 1
        details.append({"label": "Edad 55-64", "value": "+1"})

    if risk_factors_count >= 3:
        score += 2
        details.append({"label": ">= 3 factores CV", "value": "+2"})
    elif risk_factors_count >= 2:
        score += 1
        details.append({"label": "2 factores CV", "value": "+1"})

    if aspirin_use:
        score += 1
        details.append({"label": "ASA en ultimos 7 dias", "value": "+1"})

    if angina_severe:
        score += 2
        details.append({"label": "Angina severa reciente", "value": "+2"})

    if ecg_changes:
        score += 1
        details.append({"label": "Cambios ST >= 0.5mm", "value": "+1"})

    if positive_cardiac_markers:
        score += 1
        details.append({"label": "Marcadores positivos", "value": "+1"})

    if score == 0:
        interpretation = "Riesgo muy bajo TIMI —可以考虑 dapartamento"
        risk_level = "Bajo"
    elif score <= 2:
        interpretation = "Riesgo bajo TIMI"
        risk_level = "Bajo-Moderado"
    elif score <= 4:
        interpretation = "Riesgo moderado TIMI"
        risk_level = "Moderado"
    else:
        interpretation = "Riesgo alto TIMI — intervencion invasiva temprana"
        risk_level = "Alto"

    return CalculatorResult(
        name="timi",
        label="TIMI",
        value=score,
        unit="/7",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details
        + [{"label": "Riesgo CV factores", "value": str(risk_factors_count)}],
    )


# ─── 18. HEART Score ───────────────────────────────────────────────────────────


def calculate_heart(
    history_score: int,
    ecg_score: int,
    age: int,
    risk_factors_count: int,
    troponin_score: int,
) -> CalculatorResult:
    score = history_score + ecg_score + age + risk_factors_count + troponin_score
    details = [
        {"label": "Historia clinica", "value": str(history_score)},
        {"label": "ECG", "value": str(ecg_score)},
        {"label": "Edad", "value": str(age)},
        {"label": "Factores de riesgo", "value": str(risk_factors_count)},
        {"label": "Troponina", "value": str(troponin_score)},
    ]

    if score <= 3:
        interpretation = "HEART bajo — alta probabilidad de dapartamento seguro"
        risk_level = "Bajo"
    elif score <= 6:
        interpretation = "HEART moderado — observar y investigar"
        risk_level = "Moderado"
    else:
        interpretation = "HEART alto — alto riesgo de MACE a 6 semanas"
        risk_level = "Alto"

    return CalculatorResult(
        name="heart",
        label="HEART",
        value=score,
        unit="/10",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details,
    )


# ─── 19. PERC Rule ─────────────────────────────────────────────────────────────


def calculate_perc(
    age_over_50: bool,
    hr_over_100: bool,
    spo2_below_95: bool,
    unilateral_leg_swelling: bool,
    hemoptysis: bool,
    surgery_trauma_month: bool,
    prior_vte: bool,
    estrogen_use: bool,
) -> CalculatorResult:
    score = sum(
        [
            age_over_50,
            hr_over_100,
            spo2_below_95,
            unilateral_leg_swelling,
            hemoptysis,
            surgery_trauma_month,
            prior_vte,
            estrogen_use,
        ]
    )
    details = [
        {"label": "Edad >= 50", "value": "Si" if age_over_50 else "No"},
        {"label": "FC > 100 lpm", "value": "Si" if hr_over_100 else "No"},
        {"label": "SpO2 < 95%", "value": "Si" if spo2_below_95 else "No"},
        {
            "label": "Edema unilateral",
            "value": "Si" if unilateral_leg_swelling else "No",
        },
        {"label": "Hemoptisis", "value": "Si" if hemoptysis else "No"},
        {
            "label": "Cirugia/trauma 1 mes",
            "value": "Si" if surgery_trauma_month else "No",
        },
        {"label": "VTE previa", "value": "Si" if prior_vte else "No"},
        {"label": "Uso de estrogenos", "value": "Si" if estrogen_use else "No"},
    ]

    if score == 0:
        interpretation = "PERC negativo — исключить PE sin D-dimero"
        risk_level = "Bajo"
        recommendation = "Descartar EP clinicamente sin laboratorio"
    else:
        interpretation = "PERC positivo — требуется D-dimero"
        risk_level = "Moderado"
        recommendation = "Solicitar D-dimero para evaluar"

    return CalculatorResult(
        name="perc",
        label="PERC",
        value=score,
        unit="/8",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details + [{"label": "Recomendacion", "value": recommendation}],
    )


# ─── 20. Caprini Score (VTE Risk) ─────────────────────────────────────────────


def calculate_caprini(
    age_over_40: bool,
    age_41_60: bool,
    age_61_74: bool,
    age_over_75: bool,
    bmi_over_25: bool,
    bmi_over_30: bool,
    bmi_over_40: bool,
    prior_vte: bool,
    cancer_history: bool,
    surgery_history: bool,
    bedridden_over_3days: bool,
    major_surgery_over_45min: bool,
    varicosity: bool,
    swolen_legs: bool,
    pregnancy_postpartum: bool,
    oral_contraceptive: bool,
    hormone_replacement: bool,
    confined_to_chair: bool,
    inflammatory_bowel: bool,
    central_venous: bool,
) -> CalculatorResult:
    score = 0
    details = []

    if age_over_75:
        score += 5
        details.append({"label": "Edad > 75", "value": "+5"})
    elif age_61_74:
        score += 3
        details.append({"label": "Edad 61-74", "value": "+3"})
    elif age_41_60:
        score += 2
        details.append({"label": "Edad 41-60", "value": "+2"})
    elif age_over_40:
        score += 1
        details.append({"label": "Edad > 40", "value": "+1"})

    if bmi_over_40:
        score += 6
        details.append({"label": "BMI > 40", "value": "+6"})
    elif bmi_over_30:
        score += 5
        details.append({"label": "BMI > 30", "value": "+5"})
    elif bmi_over_25:
        score += 1
        details.append({"label": "BMI > 25", "value": "+1"})

    if prior_vte:
        score += 5
        details.append({"label": "VTE previa", "value": "+5"})

    if cancer_history:
        score += 2
        details.append({"label": "Cancer activo/historial", "value": "+2"})

    if bedridden_over_3days:
        score += 2
        details.append({"label": "Bedrest > 3 dias", "value": "+2"})

    if major_surgery_over_45min:
        score += 2
        details.append({"label": "Cirugia > 45 min", "value": "+2"})

    if confined_to_chair:
        score += 2
        details.append({"label": "Confinado a silla", "value": "+2"})

    if swolen_legs:
        score += 1
        details.append({"label": "Piernas hinchadas", "value": "+1"})

    if varicosity:
        score += 1
        details.append({"label": "Varicosidad", "value": "+1"})

    if inflammatory_bowel:
        score += 1
        details.append({"label": "EII (Crohn/Colitis)", "value": "+1"})

    if central_venous:
        score += 2
        details.append({"label": "Cateter venoso central", "value": "+2"})

    if pregnancy_postpartum:
        score += 1
        details.append({"label": "Embarazo/posparto", "value": "+1"})

    if oral_contraceptive:
        score += 1
        details.append({"label": "Anticonceptivos orales", "value": "+1"})

    if hormone_replacement:
        score += 1
        details.append({"label": "TRH", "value": "+1"})

    if score == 0:
        interpretation = "Riesgo muy bajo VTE"
        risk_level = "Bajo"
    elif score <= 2:
        interpretation = "Riesgo bajo VTE — profilaxis mecГnica"
        risk_level = "Bajo-Moderado"
    elif score <= 4:
        interpretation = "Riesgo moderado VTE — considerar farmacolуgico"
        risk_level = "Moderado"
    else:
        interpretation = "Riesgo alto VTE — profilaxis farmacolуgica obligatoria"
        risk_level = "Alto"

    return CalculatorResult(
        name="caprini",
        label="Caprini",
        value=score,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details,
    )


# ─── 21. RCRI — Revised Cardiac Risk Index (Lee) ───────────────────────────────


def calculate_rcri(
    high_risk_surgery: bool,
    ischemic_heart_disease: bool,
    chf_history: bool,
    stroke_tia: bool,
    diabetes_insulin: bool,
    creatinine_over_2: bool,
) -> CalculatorResult:
    score = sum(
        [
            high_risk_surgery,
            ischemic_heart_disease,
            chf_history,
            stroke_tia,
            diabetes_insulin,
            creatinine_over_2,
        ]
    )
    details = [
        {
            "label": "Cirugia de alto riesgo",
            "value": "Si" if high_risk_surgery else "No",
        },
        {
            "label": "Cardiopatia isquemica",
            "value": "Si" if ischemic_heart_disease else "No",
        },
        {"label": "ICC historial", "value": "Si" if chf_history else "No"},
        {"label": "ACV/AIT previo", "value": "Si" if stroke_tia else "No"},
        {
            "label": "DM insulinodependiente",
            "value": "Si" if diabetes_insulin else "No",
        },
        {"label": "Creatinina > 2 mg/dL", "value": "Si" if creatinine_over_2 else "No"},
    ]

    if score == 0:
        interpretation = "Riesgo cardiaco muy bajo — <1% eventos"
        risk_level = "Bajo"
        risk_pct = "<1%"
    elif score == 1:
        interpretation = "Riesgo cardiaco bajo — ~1% eventos"
        risk_level = "Bajo-Moderado"
        risk_pct = "~1%"
    elif score == 2:
        interpretation = "Riesgo cardiaco moderado — ~5% eventos"
        risk_level = "Moderado"
        risk_pct = "~5%"
    else:
        interpretation = "Riesgo cardiaco alto — >10% eventos"
        risk_level = "Alto"
        risk_pct = ">10%"

    return CalculatorResult(
        name="rcri",
        label="RCRI",
        value=score,
        unit="/6",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details + [{"label": "Riesgo eventos cardiacos", "value": risk_pct}],
    )


# ─── 22. ORBIT Bleeding Score ──────────────────────────────────────────────────


def calculate_orbit(
    age: int,
    hemoglobin_low: bool,
    renal_impaired: bool,
    antiplatelet_use: bool,
    bleeding_history: bool,
) -> CalculatorResult:
    score = 0
    details = []

    if age >= 75:
        score += 2
        details.append({"label": "Edad >= 75", "value": "+2"})
    elif age >= 65:
        score += 1
        details.append({"label": "Edad 65-74", "value": "+1"})

    if hemoglobin_low:
        score += 2
        details.append({"label": "Hb baja (<13 v / <12 m)", "value": "+2"})

    if renal_impaired:
        score += 2
        details.append({"label": "Funcion renal mala (eGFR <45)", "value": "+2"})

    if antiplatelet_use:
        score += 1
        details.append({"label": "Antiagregante plaquetario", "value": "+1"})

    if bleeding_history:
        score += 2
        details.append({"label": "Historial de sangrado", "value": "+2"})

    if score == 0:
        interpretation = "Riesgo de sangrado bajo — anticoagulacion segura"
        risk_level = "Bajo"
    elif score <= 2:
        interpretation = "Riesgo de sangrado moderado — evaluar riesgo/beneficio"
        risk_level = "Moderado"
    elif score <= 3:
        interpretation = "Riesgo de sangrado alto — considerar alternativa"
        risk_level = "Alto"
    else:
        interpretation = "Riesgo de sangrado muy alto — anticoagulacion contraindicada"
        risk_level = "Muy alto"

    return CalculatorResult(
        name="orbit",
        label="ORBIT",
        value=score,
        unit="puntos",
        interpretation=interpretation,
        risk_level=risk_level,
        details=details,
    )


register_calculator(
    CalculatorConfig(
        id="meld_na",
        name="MELD-Na",
        specialty="Hepatologia / Transplante",
        category="Higado",
        description="Refinamiento del MELD con sodio serico. Mejor priorizacion para transplante hepatico.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "bilirubin_mgdl",
                "Bilirrubina Total",
                "number",
                required=True,
                min_value=0.1,
                max_value=50,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="bilirrubina_total",
            ),
            CalculatorInput(
                "inr",
                "INR",
                "number",
                required=True,
                min_value=0.8,
                max_value=15,
                step=0.1,
                auto_fill_from_lab="inr",
            ),
            CalculatorInput(
                "creatinine_mgdl",
                "Creatinina",
                "number",
                required=True,
                min_value=0.1,
                max_value=30,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="creatinina",
            ),
            CalculatorInput(
                "sodium_mEqL",
                "Sodio Serico",
                "number",
                required=True,
                min_value=100,
                max_value=150,
                default_unit="mEq/L",
                auto_fill_from_lab="sodio",
            ),
        ],
        calculate=lambda age,
        bilirubin_mgdl,
        inr,
        creatinine_mgdl,
        sodium_mEqL: calculate_meld_na(
            age, bilirubin_mgdl, inr, creatinine_mgdl, sodium_mEqL
        ),
        references=["Kim WR. Am J Transplant 2008;8:956-961"],
    )
)

register_calculator(
    CalculatorConfig(
        id="sofa",
        name="SOFA",
        specialty="Medicina Critica / UCI",
        category="Sepsis",
        description="Sequential Organ Failure Assessment. Evalua disfuncion organica en sepsis.",
        inputs=[
            CalculatorInput(
                "pao2_fio2",
                "PaO2/FiO2 ratio",
                "number",
                required=True,
                min_value=50,
                max_value=500,
            ),
            CalculatorInput(
                "platelets_x1000",
                "Plaquetas (x1000/uL)",
                "number",
                required=True,
                min_value=1,
                max_value=800,
                default_unit="x1000/uL",
                auto_fill_from_lab="plaquetas",
            ),
            CalculatorInput(
                "bilirubin_mgdl",
                "Bilirrubina Total",
                "number",
                required=True,
                min_value=0.1,
                max_value=50,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="bilirrubina_total",
            ),
            CalculatorInput(
                "map_mmhg",
                "Presion Arterial Media (mmHg)",
                "number",
                required=True,
                min_value=20,
                max_value=200,
            ),
            CalculatorInput(
                "gcs_score",
                "GCS Score",
                "number",
                required=True,
                min_value=3,
                max_value=15,
            ),
            CalculatorInput(
                "creatinine_mgdl",
                "Creatinina",
                "number",
                required=True,
                min_value=0.1,
                max_value=30,
                step=0.1,
                default_unit="mg/dL",
                auto_fill_from_lab="creatinina",
            ),
            CalculatorInput(
                "on_vasopressors", "Vasopresores en uso", "boolean", required=True
            ),
        ],
        calculate=lambda **kw: calculate_sofa(**kw),
        references=["Vincent JL. Intensive Care Med 1996;22:707-710"],
    )
)

register_calculator(
    CalculatorConfig(
        id="news2",
        name="NEWS2",
        specialty="Medicina de Emergencia / Enfermeria",
        category="Signos Vitales",
        description="National Early Warning Score 2. Deteccion de deterioro clinico en pacientes hospitalizados.",
        inputs=[
            CalculatorInput(
                "rr_bpm",
                "Frecuencia Respiratoria (/min)",
                "number",
                required=True,
                min_value=4,
                max_value=60,
            ),
            CalculatorInput(
                "spo2_percent",
                "SpO2 (%)",
                "number",
                required=True,
                min_value=70,
                max_value=100,
            ),
            CalculatorInput(
                "oxygen_supplement", "O2 Suplementario", "boolean", required=True
            ),
            CalculatorInput(
                "temperature_c",
                "Temperatura (C)",
                "number",
                required=True,
                min_value=30,
                max_value=45,
                step=0.1,
            ),
            CalculatorInput(
                "systolic_bp",
                "PAS (mmHg)",
                "number",
                required=True,
                min_value=50,
                max_value=300,
            ),
            CalculatorInput(
                "hr_bpm",
                "FC (lpm)",
                "number",
                required=True,
                min_value=20,
                max_value=250,
            ),
            CalculatorInput(
                "altered_consciousness", "Alteracion Mental", "boolean", required=True
            ),
        ],
        calculate=lambda rr_bpm,
        spo2_percent,
        oxygen_supplement,
        temperature_c,
        systolic_bp,
        hr_bpm,
        altered_consciousness: calculate_news2(
            rr_bpm,
            spo2_percent,
            oxygen_supplement,
            temperature_c,
            systolic_bp,
            hr_bpm,
            altered_consciousness,
        ),
        references=["Royal College of Physicians. NEWS2 2017"],
    )
)

register_calculator(
    CalculatorConfig(
        id="timi",
        name="TIMI",
        specialty="Cardiologia / Emergencia",
        category="Sindrome Coronario",
        description="Thrombolysis in Myocardial Infarction risk score. Estratificacion de riesgo en sindrome coronario agudo.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "risk_factors_count",
                "Factores de riesgo CV",
                "number",
                required=True,
                min_value=0,
                max_value=7,
            ),
            CalculatorInput(
                "aspirin_use", "ASA ultimos 7 dias", "boolean", required=True
            ),
            CalculatorInput(
                "angina_severe", "Angina severa reciente", "boolean", required=True
            ),
            CalculatorInput(
                "ecg_changes", "Cambios ST >= 0.5mm", "boolean", required=True
            ),
            CalculatorInput(
                "positive_cardiac_markers",
                "Marcadores positivos (Troponina)",
                "boolean",
                required=True,
            ),
        ],
        calculate=lambda age,
        risk_factors_count,
        aspirin_use,
        angina_severe,
        ecg_changes,
        positive_cardiac_markers: calculate_timi(
            age,
            ecg_changes,
            angina_severe,
            aspirin_use,
            risk_factors_count,
            positive_cardiac_markers,
        ),
        references=["Antman EM. JAMA 2000;283:1711-1717"],
    )
)

register_calculator(
    CalculatorConfig(
        id="heart",
        name="HEART",
        specialty="Medicina de Emergencia / Cardiologia",
        category="Dolor Toracico",
        description="Risk stratification for chest pain in the ED. Predice MACE a 6 semanas.",
        inputs=[
            CalculatorInput(
                "history_score",
                "Historia Clinica",
                "select",
                required=True,
                options=[
                    {"value": 0, "label": "No sospechosa (0)"},
                    {"value": 1, "label": "Poco sospechosa (1)"},
                    {"value": 2, "label": "Moderadamente sospechosa (2)"},
                ],
            ),
            CalculatorInput(
                "ecg_score",
                "ECG",
                "select",
                required=True,
                options=[
                    {"value": 0, "label": "Normal (0)"},
                    {"value": 1, "label": "No significativo (1)"},
                    {"value": 2, "label": "Significativo/LBBB nuevo (2)"},
                ],
            ),
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "risk_factors_count",
                "Factores de riesgo (HTN, DM, dislipidemia, obesity, tabaquismo, FH)",
                "number",
                required=True,
                min_value=0,
                max_value=6,
            ),
            CalculatorInput(
                "troponin_score",
                "Troponina",
                "select",
                required=True,
                options=[
                    {"value": 0, "label": "<= LSN (0)"},
                    {"value": 1, "label": "1-3x LSN (1)"},
                    {"value": 2, "label": ">3x LSN (2)"},
                ],
            ),
        ],
        calculate=lambda history_score,
        ecg_score,
        age,
        risk_factors_count,
        troponin_score: calculate_heart(
            int(history_score),
            int(ecg_score),
            int(age),
            int(risk_factors_count),
            int(troponin_score),
        ),
        references=["Six AJ. Eur Heart J 2008;29:2843-2850"],
    )
)

register_calculator(
    CalculatorConfig(
        id="perc",
        name="PERC",
        specialty="Medicina de Emergencia",
        category="Embolia Pulmonar",
        description="Pulmonary Embolism Rule-Out Criteria. Exclusion clinica de EP sin D-dimero.",
        inputs=[
            CalculatorInput("age_over_50", "Edad >= 50 anos", "boolean", required=True),
            CalculatorInput("hr_over_100", "FC > 100 lpm", "boolean", required=True),
            CalculatorInput("spo2_below_95", "SpO2 < 95%", "boolean", required=True),
            CalculatorInput(
                "unilateral_leg_swelling",
                "Edema unilateral de pierna",
                "boolean",
                required=True,
            ),
            CalculatorInput("hemoptysis", "Hemoptisis", "boolean", required=True),
            CalculatorInput(
                "surgery_trauma_month", "Cirugia/trauma 1 mes", "boolean", required=True
            ),
            CalculatorInput("prior_vte", "VTE previa", "boolean", required=True),
            CalculatorInput(
                "estrogen_use", "Uso de estrogenos", "boolean", required=True
            ),
        ],
        calculate=lambda age_over_50,
        hr_over_100,
        spo2_below_95,
        unilateral_leg_swelling,
        hemoptysis,
        surgery_trauma_month,
        prior_vte,
        estrogen_use: calculate_perc(
            bool(age_over_50),
            bool(hr_over_100),
            bool(spo2_below_95),
            bool(unilateral_leg_swelling),
            bool(hemoptysis),
            bool(surgery_trauma_month),
            bool(prior_vte),
            bool(estrogen_use),
        ),
        references=["Kline JA. Ann Emerg Med 2004;44:603-613"],
    )
)

register_calculator(
    CalculatorConfig(
        id="caprini",
        name="Caprini",
        specialty="Cirugia / Medicina Interna",
        category="Tromboprofilaxis",
        description="Caprini VTE Risk Score. Guia profilaxis antitrombotica en pacientes medicos/quirurgicos.",
        inputs=[
            CalculatorInput("age_over_40", "Edad > 40", "boolean", required=True),
            CalculatorInput("age_41_60", "Edad 41-60", "boolean", required=True),
            CalculatorInput("age_61_74", "Edad 61-74", "boolean", required=True),
            CalculatorInput("age_over_75", "Edad > 75", "boolean", required=True),
            CalculatorInput("bmi_over_25", "BMI > 25", "boolean", required=True),
            CalculatorInput("bmi_over_30", "BMI > 30", "boolean", required=True),
            CalculatorInput("bmi_over_40", "BMI > 40", "boolean", required=True),
            CalculatorInput("prior_vte", "VTE previa", "boolean", required=True),
            CalculatorInput(
                "cancer_history", "Cancer activo/historial", "boolean", required=True
            ),
            CalculatorInput(
                "surgery_history", "Cirugia mayor en 1 mes", "boolean", required=True
            ),
            CalculatorInput(
                "bedridden_over_3days", "Bedrest > 3 dias", "boolean", required=True
            ),
            CalculatorInput(
                "major_surgery_over_45min", "Cirugia > 45 min", "boolean", required=True
            ),
            CalculatorInput("varicosity", "Varicosidad", "boolean", required=True),
            CalculatorInput(
                "swolen_legs", "Piernas hinchadas", "boolean", required=True
            ),
            CalculatorInput(
                "pregnancy_postpartum", "Embarazo/posparto", "boolean", required=True
            ),
            CalculatorInput(
                "oral_contraceptive", "Anticonceptivos orales", "boolean", required=True
            ),
            CalculatorInput("hormone_replacement", "TRH", "boolean", required=True),
            CalculatorInput(
                "confined_to_chair", "Confinado a silla", "boolean", required=True
            ),
            CalculatorInput(
                "inflammatory_bowel", "EII (Crohn/Colitis)", "boolean", required=True
            ),
            CalculatorInput(
                "central_venous", "Cateter venoso central", "boolean", required=True
            ),
        ],
        calculate=lambda age_over_40,
        age_41_60,
        age_61_74,
        age_over_75,
        bmi_over_25,
        bmi_over_30,
        bmi_over_40,
        prior_vte,
        cancer_history,
        surgery_history,
        bedridden_over_3days,
        major_surgery_over_45min,
        varicosity,
        swolen_legs,
        pregnancy_postpartum,
        oral_contraceptive,
        hormone_replacement,
        confined_to_chair,
        inflammatory_bowel,
        central_venous: calculate_caprini(
            bool(age_over_40),
            bool(age_41_60),
            bool(age_61_74),
            bool(age_over_75),
            bool(bmi_over_25),
            bool(bmi_over_30),
            bool(bmi_over_40),
            bool(prior_vte),
            bool(cancer_history),
            bool(surgery_history),
            bool(bedridden_over_3days),
            bool(major_surgery_over_45min),
            bool(varicosity),
            bool(swolen_legs),
            bool(pregnancy_postpartum),
            bool(oral_contraceptive),
            bool(hormone_replacement),
            bool(confined_to_chair),
            bool(inflammatory_bowel),
            bool(central_venous),
        ),
        references=["Caprini JA. Chest 2001;120:163-170"],
    )
)

register_calculator(
    CalculatorConfig(
        id="rcri",
        name="RCRI",
        specialty="Anestesiologia / Cirugia",
        category="Riesgo Perioperatorio",
        description="Revised Cardiac Risk Index (Lee). Evalua riesgo cardiaco pre-operatorio para cirugia no cardiaca.",
        inputs=[
            CalculatorInput(
                "high_risk_surgery",
                "Cirugia de alto riesgo (suprainguinal/intraperitoneal/intratoracica)",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "ischemic_heart_disease",
                "Cardiopatia isquemica",
                "boolean",
                required=True,
            ),
            CalculatorInput("chf_history", "ICC historial", "boolean", required=True),
            CalculatorInput("stroke_tia", "ACV/AIT previo", "boolean", required=True),
            CalculatorInput(
                "diabetes_insulin", "DM insulinodependiente", "boolean", required=True
            ),
            CalculatorInput(
                "creatinine_over_2", "Creatinina > 2 mg/dL", "boolean", required=True
            ),
        ],
        calculate=lambda high_risk_surgery,
        ischemic_heart_disease,
        chf_history,
        stroke_tia,
        diabetes_insulin,
        creatinine_over_2: calculate_rcri(
            bool(high_risk_surgery),
            bool(ischemic_heart_disease),
            bool(chf_history),
            bool(stroke_tia),
            bool(diabetes_insulin),
            bool(creatinine_over_2),
        ),
        references=["Lee TH. Circulation 1999;100:1043-1049"],
    )
)

register_calculator(
    CalculatorConfig(
        id="orbit",
        name="ORBIT",
        specialty="Cardiologia / Hematologia",
        category="Sangrado",
        description="ORBIT Bleeding Risk Score. Evalua riesgo de sangrado en pacientes con anticoagulacion.",
        inputs=[
            CalculatorInput(
                "age",
                "Edad",
                "number",
                required=True,
                min_value=1,
                max_value=120,
                auto_fill_from_patient="age",
            ),
            CalculatorInput(
                "hemoglobin_low", "Hb baja (<13 v / <12 m)", "boolean", required=True
            ),
            CalculatorInput(
                "renal_impaired",
                "Funcion renal mala (eGFR <45)",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "antiplatelet_use",
                "Antiagregante plaquetario",
                "boolean",
                required=True,
            ),
            CalculatorInput(
                "bleeding_history", "Historial de sangrado", "boolean", required=True
            ),
        ],
        calculate=lambda age,
        hemoglobin_low,
        renal_impaired,
        antiplatelet_use,
        bleeding_history: calculate_orbit(
            int(age),
            bool(hemoglobin_low),
            bool(renal_impaired),
            bool(antiplatelet_use),
            bool(bleeding_history),
        ),
        references=["Sherwood MW. J Am Coll Cardiol 2015;65:2614-2623"],
    )
)


def get_calculator(id: str) -> CalculatorConfig | None:
    return CALCULATOR_REGISTRY.get(id)


def list_calculators() -> list[CalculatorConfig]:
    return list(CALCULATOR_REGISTRY.values())


def serialize_calculator(config: CalculatorConfig) -> dict[str, Any]:
    return {
        "id": config.id,
        "name": config.name,
        "specialty": config.specialty,
        "category": config.category,
        "description": config.description,
        "inputs": [
            {
                "name": inp.name,
                "label": inp.label,
                "type": inp.type,
                "required": inp.required,
                "options": inp.options,
                "min_value": inp.min_value,
                "max_value": inp.max_value,
                "step": inp.step,
                "default_unit": inp.default_unit,
                "auto_fill_from_patient": inp.auto_fill_from_patient,
                "auto_fill_from_lab": inp.auto_fill_from_lab,
            }
            for inp in config.inputs
        ],
        "references": config.references,
    }


def serialize_result(result: CalculatorResult) -> dict[str, Any]:
    return {
        "name": result.name,
        "label": result.label,
        "value": result.value,
        "unit": result.unit,
        "interpretation": result.interpretation,
        "risk_level": result.risk_level,
        "details": result.details,
    }
