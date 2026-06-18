"""
Medical Calculators — Centro de Diagnóstico Inteligente MEDOPZ
FASE 1: 8 calculadoras clínicas validadas
"""

from dataclasses import dataclass, field
from typing import Any
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
    interpret: callable | None = None
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
