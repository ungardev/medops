"""
Lab Report Parser — Centro de Diagnóstico Inteligente MEDOPZ
Extrae valores numéricos de resultados de laboratorio desde texto OCR.
Usa regex patterns para detectar pruebas comunes en español.
"""

import re
from dataclasses import dataclass, field
from typing import Optional

logger = logger = __import__("logging").getLogger(__name__)


@dataclass
class ParsedLabValue:
    test_name: str
    value: float
    unit: str
    reference_range: Optional[str]
    is_abnormal: bool
    abnormal_direction: str
    confidence: float
    test_type: Optional[str]
    raw_match: str


LAB_PATTERNS: list[tuple[str, str, str, str, str]] = [
    (
        "colesterol_total",
        r"(?i)colesterol[\s_-]?total[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL|MG/DL)",
        "Colesterol Total",
        "mg/dL",
        "cholesterol",
    ),
    (
        "hdl",
        r"(?i)HDL[\s_-]?colesterol[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "HDL Colesterol",
        "mg/dL",
        "lipid_profile",
    ),
    (
        "ldl",
        r"(?i)LDL[\s_-]?colesterol[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "LDL Colesterol",
        "mg/dL",
        "lipid_profile",
    ),
    (
        "trigliceridos",
        r"(?i)triglic[eé]ridos[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Triglicéridos",
        "mg/dL",
        "lipid_profile",
    ),
    (
        "colesterol",
        r"(?i)colesterol[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Colesterol Total",
        "mg/dL",
        "cholesterol",
    ),
    (
        "glucosa",
        r"(?i)glucosa[\s_-]?(?:en[\s_]?ayunas|ayuno)?[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Glucosa en Ayuno",
        "mg/dL",
        "glucose",
    ),
    (
        "glucosa_post",
        r"(?i)glucosa[\s_-]?(?:post[\s_-]?prandial|2h|post[\s_]?pandrial)[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Glucosa Post-Prandial",
        "mg/dL",
        "glucose_2h",
    ),
    (
        "hemoglobina",
        r"(?i)hemoglobina[:\s]+(\d+[.,]?\d*)\s*(?:g/dL|g/dl|g/100ml)",
        "Hemoglobina",
        "g/dL",
        "hemoglobin",
    ),
    (
        "hematocrito",
        r"(?i)hematocrito[:\s]+(\d+[.,]?\d*)\s*(?:%|%)",
        "Hematocrito",
        "%",
        "hemoglobin",
    ),
    (
        "leucocitos",
        r"(?i)leucocitos[:\s]+(\d+[.,]?\d*)\s*(?:/µL|/uL|/mm3|céls/µL)",
        "Leucocitos",
        "x10³/µL",
        "hemogram",
    ),
    (
        "leucocitos_simple",
        r"(?i)leucocitos[:\s]+(\d+[.,]?\d*)",
        "Leucocitos",
        "x10³/µL",
        "hemogram",
    ),
    (
        "plaquetas",
        r"(?i)plaquetas[:\s]+(\d+[.,]?\d*)\s*(?:/µL|/uL|/mm3)",
        "Plaquetas",
        "x10³/µL",
        "platelets",
    ),
    (
        "creatinina",
        r"(?i)creatinina[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Creatinina",
        "mg/dL",
        "renal_panel",
    ),
    (
        "bun",
        r"(?i)nitrogeno[\s_-]?ureico[\s_-]?(?:BUN)?[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "BUN / Nitrógeno Uréico",
        "mg/dL",
        "renal_panel",
    ),
    (
        "urea",
        r"(?i)urea[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Urea",
        "mg/dL",
        "renal_panel",
    ),
    (
        "bilirrubina_total",
        r"(?i)bilirrubina[\s_-]?total[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Bilirrubina Total",
        "mg/dL",
        "liver_panel",
    ),
    (
        "bilirrubina_directa",
        r"(?i)bilirrubina[\s_-]?directa[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Bilirrubina Directa",
        "mg/dL",
        "liver_panel",
    ),
    (
        "bilirrubina",
        r"(?i)bilirrubina[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Bilirrubina Total",
        "mg/dL",
        "liver_panel",
    ),
    (
        "tgo_ast",
        r"(?i)TGO[\s_-]?AST[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/L|U/I)",
        "TGO/AST",
        "U/L",
        "liver_panel",
    ),
    (
        "tgp_alt",
        r"(?i)TGP[\s_-]?ALT[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/L|U/I)",
        "TGP/ALT",
        "U/L",
        "liver_panel",
    ),
    (
        "ast",
        r"(?i)\bAST\b[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "AST/TGO",
        "U/L",
        "liver_panel",
    ),
    (
        "alt",
        r"(?i)\bALT\b[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "ALT/TGP",
        "U/L",
        "liver_panel",
    ),
    (
        "proteinas_totales",
        r"(?i)proteinas[\s_-]?totales[:\s]+(\d+[.,]?\d*)\s*(?:g/dl|g/dL)",
        "Proteínas Totales",
        "g/dL",
        "protein_total",
    ),
    (
        "albumina",
        r"(?i)albumina[:\s]+(\d+[.,]?\d*)\s*(?:g/dl|g/dL)",
        "Albúmina",
        "g/dL",
        "protein_total",
    ),
    (
        "fosfatasa_alcalina",
        r"(?i)fosfatasa[\s_-]?alcalina[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "Fosfatasa Alcalina",
        "U/L",
        "liver_panel",
    ),
    ("ggt", r"(?i)GGT[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)", "GGT", "U/L", "liver_panel"),
    (
        "amilasa",
        r"(?i)amilasa[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "Amilasa",
        "U/L",
        "amylase",
    ),
    (
        "lipasa",
        r"(?i)lipasa[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "Lipasa",
        "U/L",
        "amylase",
    ),
    (
        "sodio",
        r"(?i)sodio[\s_-]?Na[\s_:]?[:\s]+(\d+[.,]?\d*)\s*(?:mEq/L|mEq/l|mmol/L)",
        "Sodio",
        "mEq/L",
        "electrolytes",
    ),
    (
        "potasio",
        r"(?i)potasio[\s_-]?K[\s_:]?[:\s]+(\d+[.,]?\d*)\s*(?:mEq/L|mEq/l|mmol/L)",
        "Potasio",
        "mEq/L",
        "electrolytes",
    ),
    (
        "cloro",
        r"(?i)cloro[\s_-]?Cl[\s_:]?[:\s]+(\d+[.,]?\d*)\s*(?:mEq/L|mEq/l|mmol/L)",
        "Cloro",
        "mEq/L",
        "electrolytes",
    ),
    (
        "calcio",
        r"(?i)calcio[\s_-]?Ca[\s_:]?[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Calcio",
        "mg/dL",
        "bone_profile",
    ),
    (
        "fosforo",
        r"(?i)fosforo[\s_-]?P[\s_:]?[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Fósforo",
        "mg/dL",
        "bone_profile",
    ),
    (
        "magnesio",
        r"(?i)magnesio[\s_-]?Mg[\s_:]?[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Magnesio",
        "mg/dL",
        "electrolytes",
    ),
    (
        "acido_urico",
        r"(?i)acido[\s_-]?urico[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Ácido Úrico",
        "mg/dL",
        "uric_acid",
    ),
    ("inr", r"(?i)\bINR\b[:\s]+(\d+[.,]?\d*)", "INR", "", "coag_pt"),
    (
        "tp_pt",
        r"(?i)tiempo[\s_-]?de[\s_-]?protrombina[\s_-]?PT[:\s]+(\d+[.,]?\d*)\s*(?:seg|sg|segundos)",
        "Tiempo de Protrombina (PT)",
        "seg",
        "coag_pt",
    ),
    (
        "ttpk",
        r"(?i)TTPK?[:\s]+(\d+[.,]?\d*)\s*(?:seg|sg|segundos)",
        "TTPK",
        "seg",
        "coag_pt",
    ),
    (
        "fibrinogeno",
        r"(?i)fibrinogeno[:\s]+(\d+[.,]?\d*)\s*(?:mg/dl|mg/dL)",
        "Fibrinógeno",
        "mg/dL",
        "coag_pt",
    ),
    (
        "tsh",
        r"(?i)TSH[:\s]+(\d+[.,]?\d*)\s*(?:µUI/mL|uUI/mL|µIU/mL)",
        "TSH",
        "µUI/mL",
        "thyroid_panel",
    ),
    (
        "t4_libre",
        r"(?i)T4[\s_-]?libre[:\s]+(\d+[.,]?\d*)\s*(?:ng/dL|ng/dL)",
        "T4 Libre",
        "ng/dL",
        "thyroid_panel",
    ),
    (
        "t3",
        r"(?i)T3[\s_-]?(?:total)?[:\s]+(\d+[.,]?\d*)\s*(?:ng/dL|ng/dL)",
        "T3 Total",
        "ng/dL",
        "thyroid_panel",
    ),
    (
        "hb_glicosilada",
        r"(?i)hemoglobina[\s_-]?glicosilada[\s_-]?(?:HbA1c)?[:\s]+(\d+[.,]?\d*)\s*(?:%|%)",
        "HbA1c",
        "%",
        "glycated_hgb",
    ),
    (
        "hba1c",
        r"(?i)HbA1c[:\s]+(\d+[.,]?\d*)\s*(?:%|%)(?:gHb|gHb/gHb)?",
        "HbA1c",
        "%",
        "glycated_hgb",
    ),
    (
        "ferritina",
        r"(?i)ferritina[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL)",
        "Ferritina",
        "ng/mL",
        "iron_studies",
    ),
    (
        "hierro_serico",
        r"(?i)hierro[\s_-]?serico[:\s]+(\d+[.,]?\d*)\s*(?:µg/dL|ug/dL)",
        "Hierro Sérico",
        "µg/dL",
        "iron_studies",
    ),
    (
        "transferrina",
        r"(?i)transferrina[:\s]+(\d+[.,]?\d*)\s*(?:mg/dL)",
        "Transferrina",
        "mg/dL",
        "iron_studies",
    ),
    (
        "saturacion_trans",
        r"(?i)saturacion[\s_-]?de[\s_-]?transferrina[:\s]+(\d+[.,]?\d*)\s*(?:%|%)",
        "Saturación de Transferrina",
        "%",
        "iron_studies",
    ),
    (
        "vitamina_d",
        r"(?i)vitamina[\s_-]?D[\s_-]?(?:25[\s_-]?OH)?[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL)",
        "Vitamina D (25-OH)",
        "ng/mL",
        "vitamin_d",
    ),
    (
        "vitamina_b12",
        r"(?i)vitamina[\s_-]?B12[:\s]+(\d+[.,]?\d*)\s*(?:pg/mL|pg/mL)",
        "Vitamina B12",
        "pg/mL",
        "vitamin_b12",
    ),
    (
        "acido_folico",
        r"(?i)acido[\s_-]?folico[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL)",
        "Ácido Fólico",
        "ng/mL",
        "folate",
    ),
    (
        "pcr",
        r"(?i)proteina[\s_-]?C[\s_-]?reactiva[:\s]+(\d+[.,]?\d*)\s*(?:mg/L|mg/dL)",
        "PCR",
        "mg/L",
        "hemogram",
    ),
    ("vsg", r"(?i)VSG[:\s]+(\d+[.,]?\d*)\s*(?:mm/h|mm/hr)", "VSG", "mm/h", "hemogram"),
    ("ph", r"(?i)pH[:\s]+(\d+[.,]?\d*)", "pH", "", "urinalysis"),
    (
        "densidad_orina",
        r"(?i)densidad[\s_-]?orina[:\s]+(\d+[.,]?\d*)",
        "Densidad Urinaria",
        "",
        "urinalysis",
    ),
    (
        "proteinuria",
        r"(?i)proteinuria[:\s]+(\d+[.,]?\d*)\s*(?:mg/24h|mg/24hr)",
        "Proteinuria 24h",
        "mg/24h",
        "urine_24h",
    ),
    (
        "microalbuminuria",
        r"(?i)microalbuminuria[:\s]+(\d+[.,]?\d*)\s*(?:mg/L|mg/l)",
        "Microalbuminuria",
        "mg/L",
        "urine_microalbumin",
    ),
    (
        "troponina_i",
        r"(?i)troponina[\s_-]?I[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL|µg/L)",
        "Troponina I",
        "ng/mL",
        "cardiac_enzymes",
    ),
    (
        "troponina_t",
        r"(?i)troponina[\s_-]?T[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL|µg/L)",
        "Troponina T",
        "ng/mL",
        "cardiac_enzymes",
    ),
    (
        "ck_mb",
        r"(?i)CK[\s_-]?MB[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "CK-MB",
        "U/L",
        "cardiac_enzymes",
    ),
    (
        "ck_total",
        r"(?i)CK[\s_-]?total[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "CK Total",
        "U/L",
        "cardiac_enzymes",
    ),
    (
        "ldh",
        r"(?i)LDH[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "LDH",
        "U/L",
        "cardiac_enzymes",
    ),
    (
        "dhl",
        r"(?i)DHL[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "DHL",
        "U/L",
        "cardiac_enzymes",
    ),
    (
        "cpk",
        r"(?i)CPK[:\s]+(\d+[.,]?\d*)\s*(?:U/L|U/I)",
        "CPK",
        "U/L",
        "cardiac_enzymes",
    ),
    (
        "antigeno_carcino",
        r"(?i)antigeno[\s_-]?carcinoembrionario[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL)",
        "ACE",
        "ng/mL",
        "tumor_markers",
    ),
    (
        "psa",
        r"(?i)PSA[\s_-]?total[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL)",
        "PSA Total",
        "ng/mL",
        "tumor_markers",
    ),
    (
        "ca_125",
        r"(?i)CA[\s_-]?125[:\s]+(\d+[.,]?\d*)\s*(?:U/mL|U/mL)",
        "CA-125",
        "U/mL",
        "tumor_markers",
    ),
    (
        "ca_19_9",
        r"(?i)CA[\s_-]?19[\s_-]?9[:\s]+(\d+[.,]?\d*)\s*(?:U/mL|U/mL)",
        "CA-19-9",
        "U/mL",
        "tumor_markers",
    ),
    (
        "ceac",
        r"(?i)CEA[:\s]+(\d+[.,]?\d*)\s*(?:ng/mL|ng/mL)",
        "CEA",
        "ng/mL",
        "tumor_markers",
    ),
]

NORMAL_RANGES: dict[str, tuple[float, float, str]] = {
    "colesterol_total": (0, 200, "mg/dL"),
    "hdl": (40, 200, "mg/dL"),
    "ldl": (0, 130, "mg/dL"),
    "trigliceridos": (0, 150, "mg/dL"),
    "glucosa": (70, 100, "mg/dL"),
    "hemoglobina": (12.0, 17.5, "g/dL"),
    "hematocrito": (36.0, 50.0, "%"),
    "creatinina": (0.6, 1.2, "mg/dL"),
    "bun": (7, 20, "mg/dL"),
    "bilirrubina_total": (0.1, 1.2, "mg/dL"),
    "inr": (0.8, 1.2, ""),
    "tsh": (0.4, 4.0, "µUI/mL"),
    "hb_glicosilada": (4.0, 5.6, "%"),
}


def _parse_number(s: str) -> Optional[float]:
    try:
        normalized = s.replace(",", ".")
        return float(normalized)
    except (ValueError, TypeError):
        return None


def _detect_abnormal(key: str, value: float) -> tuple[bool, str]:
    if key in NORMAL_RANGES:
        lo, hi, _ = NORMAL_RANGES[key]
        if value < lo:
            return True, "low"
        if value > hi:
            return True, "high"
    return False, "normal"


class LabReportParser:
    """
    Parser de resultados de laboratorio desde texto OCR.
    Detecta valores numéricos, unidades, rangos de referencia y estado de normalidad.
    """

    def parse(self, text: str) -> list[ParsedLabValue]:
        if not text or not text.strip():
            return []

        results = []
        seen_keys = set()

        for key, pattern, label, unit, test_type in LAB_PATTERNS:
            if key in seen_keys:
                continue

            match = re.search(pattern, text)
            if not match:
                continue

            raw_value_str = match.group(1)
            value = _parse_number(raw_value_str)
            if value is None:
                continue

            is_abnormal, direction = _detect_abnormal(key, value)

            ref_match = re.search(
                r"(?:vr|valor[\s_-]?ref|referencia|rango)[:\s]*"
                r"(?:[\d.,]+(?:\s*[-–]\s*[\d.,]+)?)\s*(?:" + re.escape(unit) + r")?",
                text[max(0, match.start() - 60) : match.start()],
                re.IGNORECASE,
            )
            reference_range = ref_match.group(0) if ref_match else None

            confidence = 0.9 if not is_abnormal else 0.75

            results.append(
                ParsedLabValue(
                    test_name=label,
                    value=value,
                    unit=unit,
                    reference_range=reference_range,
                    is_abnormal=is_abnormal,
                    abnormal_direction=direction,
                    confidence=confidence,
                    test_type=test_type,
                    raw_match=match.group(0),
                )
            )
            seen_keys.add(key)

        results.sort(key=lambda x: x.test_name.lower())
        return results

    def detect_document_type(self, text: str) -> str:
        text_lower = text.lower()

        lab_keywords = [
            "resultado de laboratorio",
            "laboratorio clinico",
            "estudio de laboratorio",
            "glucosa",
            "colesterol",
            "hemoglobina",
            "creatinina",
            "bilirrubina",
            "trigliceridos",
            "laboratorio",
            "analisis de sangre",
            "perfil bioquimico",
            "perfil lipidico",
            "panel metabolico",
            "examen de sangre",
            "resultados",
        ]
        imaging_keywords = [
            "radiografia",
            "rx ",
            "tomografia",
            "tc ",
            "resonancia magnetica",
            "rmn",
            "ecografia",
            "ultrasonido",
            "sonar",
            "mamografia",
            "rayos x",
            "imagenologia",
            "tomografia axial",
        ]
        clinical_keywords = [
            "historia clinica",
            "consulta medica",
            "examen fisico",
            "diagnostico",
            "tratamiento",
            "prescripcion",
            "evolucion",
            "nota medica",
            "epicrisis",
        ]

        lab_score = sum(1 for kw in lab_keywords if kw in text_lower)
        imaging_score = sum(1 for kw in imaging_keywords if kw in text_lower)
        clinical_score = sum(1 for kw in clinical_keywords if kw in text_lower)

        if lab_score >= max(imaging_score, clinical_score, 2):
            return "lab_result"
        elif imaging_score >= max(lab_score, clinical_score, 1):
            return "imaging_report"
        elif clinical_score > 0:
            return "clinical_note"
        return "unknown"
