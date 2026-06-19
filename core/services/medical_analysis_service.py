"""
MedicalAnalysisService — Centro de Diagnóstico Inteligente.
Orquesta el análisis de documentos médicos con IA.
"""

import json
import logging
from decimal import Decimal
from typing import Optional, Dict, Any

from django.contrib.auth import get_user_model

from core.models import AIAnalysis, MedicalDocument, Patient
from core.services.gemini_provider import get_gemini_provider, GeminiResponse

User = get_user_model()
logger = logging.getLogger(__name__)


class MedicalAnalysisService:
    """
    Servicio de análisis médico con IA.

    Flujo:
    1. Carga el documento y verifica que tiene OCR
    2. Obtiene contexto del paciente (alergias, diagnósticos activos)
    3. Envía a Gemini con prompt estructurado
    4. Parsea respuesta JSON y persiste en AIAnalysis
    5. Devuelve resultado estructurado
    """

    def analyze_document(
        self,
        document: MedicalDocument,
        performed_by: Optional[User] = None,
        model: str = "gemini-2.5-flash",
        analysis_mode: str = "full",
    ) -> AIAnalysis:
        """
        Analiza un documento médico con IA y persiste el resultado.

        Args:
            document: MedicalDocument a analizar
            performed_by: Usuario que solicita el análisis
            model: Modelo Gemini a usar
            analysis_mode: Modo de análisis (full, summary, icd_suggestion, lab_interpretation)

        Returns:
            AIAnalysis instance guardada en BD
        """
        if not document.ocr_extracted_text:
            raise ValueError(
                f"El documento {document.id} no tiene texto OCR. "
                "Ejecuta OCR primero con /documents/{id}/reparse/"
            )

        patient = document.patient
        patient_context = self._build_patient_context(patient)

        gemini = get_gemini_provider()
        gemini.model = model

        response = gemini.analyze(
            document_text=document.ocr_extracted_text,
            document_type=document.category,
            patient_context=patient_context,
        )

        parsed = self._parse_response(response.text)

        analysis = AIAnalysis.objects.create(
            document=document,
            patient=patient,
            model_used=model,
            analysis_mode=analysis_mode,
            clinical_summary=parsed.get("clinical_summary"),
            interpretation=parsed.get("interpretation"),
            suggested_icd_codes=parsed.get("suggested_icd_codes", []),
            abnormal_lab_flags=parsed.get("abnormal_lab_flags", []),
            drug_mentions=parsed.get("drug_mentions", []),
            raw_response=response.raw,
            reasoning_trace=parsed.get("reasoning_trace"),
            confidence_score=parsed.get("confidence_score"),
            tokens_used=response.total_tokens,
            estimated_cost_usd=response.estimated_cost_usd,
            latency_ms=response.latency_ms,
            prompt_tokens=response.prompt_tokens,
            completion_tokens=response.completion_tokens,
            performed_by=performed_by,
        )

        logger.info(
            f"AIAnalysis creado: id={analysis.id}, doc={document.id}, "
            f"model={model}, tokens={response.total_tokens}, "
            f"cost=${response.estimated_cost_usd}"
        )

        return analysis

    def get_latest_analysis(self, document: MedicalDocument) -> Optional[AIAnalysis]:
        """Obtiene el análisis más reciente de un documento."""
        return (
            AIAnalysis.objects.filter(document=document)
            .order_by("-performed_at")
            .first()
        )

    def get_patient_analyses(self, patient: Patient, limit: int = 20) -> list:
        """Obtiene los últimos análisis de un paciente."""
        return list(
            AIAnalysis.objects.filter(patient=patient)
            .select_related("document")
            .order_by("-performed_at")[:limit]
        )

    def _build_patient_context(self, patient: Patient) -> Optional[str]:
        """Construye el contexto clínico del paciente para el prompt."""
        parts = []

        if patient.allergies:
            parts.append(f"ALERGIAS CONOCIDAS: {patient.allergies}")

        try:
            from core.models import MedicalHistory

            active_diagnoses = MedicalHistory.objects.filter(
                patient=patient,
                status__in=["active", "permanent", "suspected"],
            ).values_list("condition", flat=True)[:10]
            if active_diagnoses:
                parts.append(f"DIAGNÓSTICOS ACTIVOS: {', '.join(active_diagnoses)}")
        except Exception:
            pass

        try:
            from core.models import Allergy

            severe_allergies = Allergy.objects.filter(
                patient=patient,
                severity__in=["moderate", "severe"],
            ).values_list("name", flat=True)[:10]
            if severe_allergies:
                parts.append(f"ALERGIAS SEVERAS: {', '.join(severe_allergies)}")
        except Exception:
            pass

        if patient.medical_history:
            history_text = patient.medical_history[:500]
            parts.append(f"HISTORIA MÉDICA RELEVANTE: {history_text}")

        if not parts:
            return None

        return "\n\n".join(parts)

    def _parse_response(self, text: str) -> Dict[str, Any]:
        """
        Parsea la respuesta JSON de Gemini.
        Maneja errores de parseo gracefully.
        """
        try:
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(
                f"Gemini response no es JSON válido: {e}\nTexto: {text[:500]}"
            )
            return {
                "clinical_summary": text[:1000]
                if text
                else "Error parseando respuesta",
                "interpretation": None,
                "suggested_icd_codes": [],
                "abnormal_lab_flags": [],
                "drug_mentions": [],
                "reasoning_trace": f"Parse error: {e}",
                "confidence_score": 0.1,
            }


def get_medical_analysis_service() -> MedicalAnalysisService:
    return MedicalAnalysisService()
