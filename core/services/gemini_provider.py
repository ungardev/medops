"""
Gemini AI Provider — Centro de Diagnóstico Inteligente MedOps.
Usa el endpoint OpenAI-compatible de Gemini (base_url v1beta).
Gratuito: Gemini 2.5 Flash vía Google AI Studio.
"""

import os
import json
import logging
import time
from typing import Optional
from dataclasses import dataclass
from decimal import Decimal

import requests

logger = logging.getLogger(__name__)


@dataclass
class GeminiResponse:
    text: str
    raw: dict
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    model: str
    latency_ms: int
    estimated_cost_usd: Decimal


class GeminiProvider:
    """
    Cliente para Gemini vía OpenAI-compatible endpoint.

    Free tier: Gemini 2.5 Flash
    - 10 RPM, 250 RPD, 1M context
    - Endpoint: https://generativelanguage.googleapis.com/v1beta/openai/
    - No credit card required
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
    DEFAULT_MODEL = "gemini-2.5-flash"

    SYSTEM_PROMPT = """Eres un asistente médico clínico experto en análisis de documentos de laboratorio y resultados médicos. Tu rol es proporcionar análisis objetivo basado únicamente en los datos presentados en el documento.

REGLAS FUNDAMENTALES:
1. Solo infieres lo que está explícitamente en el texto del documento
2. Nunca inventas, asumes o agregas valores que no estén en el texto
3. Si un valor está fuera de rango de referencia normal, lo marcas como potencialmente anormal
4. Usas terminología médica precisa pero accesible
5. Para ICD-11, solo sugieres códigos que estén soportados por la evidencia en el texto

FORMATO DE RESPUESTA:
Tu respuesta DEBE ser JSON válido con esta estructura exacta:
{
  "clinical_summary": "string - resumen ejecutivo del documento en 2-3 oraciones",
  "interpretation": "string - interpretación clínica de los hallazgos relevantes",
  "suggested_icd_codes": [
    {
      "code": "string - código ICD-11 exacto",
      "description": "string - descripción del código",
      "confidence": 0.0-1.0,
      "justification": "string - por qué este código aplica al documento"
    }
  ],
  "abnormal_lab_flags": [
    {
      "test": "string - nombre de la prueba",
      "value": "string - valor encontrado",
      "unit": "string - unidad",
      "reference_range": "string - rango de referencia si está en el texto",
      "is_abnormal": true/false,
      "direction": "high/low/normal",
      "severity": "critical/warning/mild/normal"
    }
  ],
  "drug_mentions": [
    {
      "name": "string - nombre del medicamento",
      "dosage": "string - dosis si está presente",
      "route": "string - vía de administración si está presente",
      "frequency": "string - frecuencia si está presente"
    }
  ],
  "reasoning_trace": "string - traza breve de tu razonamiento clínico",
  "confidence_score": 0.0-1.0
}

Si no puedes determinar un valor con confianza, usa null o [] para arrays.
No incluyas texto adicional fuera del JSON."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.model = os.environ.get("GEMINI_MODEL", self.DEFAULT_MODEL)

    def _get_base_url(self) -> str:
        return self.BASE_URL

    def analyze(
        self,
        document_text: str,
        document_type: str = "lab_result",
        patient_context: Optional[str] = None,
    ) -> GeminiResponse:
        """
        Analiza texto OCR de un documento médico con Gemini.

        Args:
            document_text: Texto extraído por OCR
            document_type: Tipo de documento (lab_result, imaging_report, clinical_note)
            patient_context: Contexto opcional del paciente (alergias, meds activos, diagnósticos)
        """
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY no configurada. "
                "Obtén una gratis en https://aistudio.google.com/app/apikey"
            )

        user_content = self._build_prompt(document_text, document_type, patient_context)

        start_time = time.time()
        latency_ms = 0

        try:
            url = f"{self._get_base_url()}/chat/completions"

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            }

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_content},
                ],
                "max_tokens": 4096,
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            }

            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=60,
            )

            latency_ms = int((time.time() - start_time) * 1000)

            if response.status_code != 200:
                logger.error(
                    f"Gemini API error: {response.status_code} — {response.text}"
                )
                raise RuntimeError(
                    f"Gemini API error {response.status_code}: {response.text[:500]}"
                )

            data = response.json()

            text = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)

            cost = self._estimate_cost(prompt_tokens, completion_tokens)

            return GeminiResponse(
                text=text,
                raw=data,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                model=self.model,
                latency_ms=latency_ms,
                estimated_cost_usd=cost,
            )

        except requests.exceptions.Timeout:
            raise TimeoutError(f"Gemini API timeout después de {latency_ms}ms")
        except Exception as e:
            logger.exception(f"Error en GeminiProvider.analyze: {e}")
            raise

    def _build_prompt(
        self,
        document_text: str,
        document_type: str,
        patient_context: Optional[str],
    ) -> str:
        type_hints = {
            "lab_result": "Resultado de Laboratorio Clínico",
            "imaging_report": "Reporte de Imagenología",
            "clinical_note": "Nota Clínica",
            "prescription": "Prescripción Médica",
            "medical_report": "Informe Médico",
        }

        doc_label = type_hints.get(document_type, "Documento Médico")

        prompt = f"""Analiza el siguiente {doc_label}:

===== TEXTO DEL DOCUMENTO (OCR) =====
{document_text[:8000]}
===== FIN DEL TEXTO ====="""

        if patient_context:
            prompt += f"""

===== CONTEXTO DEL PACIENTE =====
{patient_context[:2000]}
===== FIN CONTEXTO ====="""

        prompt += """

Responde SOLO con JSON válido según el formato especificado en tus instrucciones."""

        return prompt

    def _estimate_cost(self, prompt_tokens: int, completion_tokens: int) -> Decimal:
        # Gemini 2.5 Flash pricing (free tier estimates)
        # Input: ~$0.000075 / 1K tokens, Output: ~$0.0003 / 1K tokens
        # Using conservative estimate for free tier
        input_cost = (prompt_tokens / 1000) * 0.0001
        output_cost = (completion_tokens / 1000) * 0.0004
        return Decimal(str(round(input_cost + output_cost, 6)))


def get_gemini_provider() -> GeminiProvider:
    """Factory para obtener instancia de GeminiProvider."""
    return GeminiProvider()
