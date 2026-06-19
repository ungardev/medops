"""
Document Parser Service — Centro de Diagnóstico Inteligente MEDOPZ
Orquesta OCR + Lab Parsing + detección de tipo de documento.
"""

import hashlib
import logging
from dataclasses import dataclass, asdict
from datetime import date
from typing import Any, Optional

from .ocr_service import OCRService
from .lab_parser import LabReportParser

logger = logging.getLogger(__name__)


@dataclass
class ParsedLabValueOutput:
    test_name: str
    value: float
    unit: str
    reference_range: Optional[str]
    is_abnormal: bool
    abnormal_direction: str
    confidence: float
    test_type: Optional[str]


@dataclass
class ParsedDocument:
    raw_text: str
    confidence_score: float
    document_type: str
    lab_values: list[dict[str, Any]]
    patient_name_extracted: Optional[str]
    date_extracted: Optional[str]
    parsing_warnings: list[str]


class DocumentParserService:
    """
    Servicio unificado para parsing de documentos clínicos.
    Recibe bytes → ejecuta OCR → parsea contenido → retorna estructura.
    """

    MAX_FILE_SIZE = 10 * 1024 * 1024
    ALLOWED_MIMES = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/bmp",
        "image/webp",
    }

    def __init__(self):
        self.ocr = OCRService()
        self.lab_parser = LabReportParser()

    def parse(
        self, file_bytes: bytes, mime_type: str, filename: str = ""
    ) -> ParsedDocument:
        warnings = []

        if len(file_bytes) > self.MAX_FILE_SIZE:
            warnings.append(
                f"File exceeds 10MB limit ({len(file_bytes) / 1024 / 1024:.1f}MB)"
            )

        if mime_type not in self.ALLOWED_MIMES:
            warnings.append(f"Unsupported mime type: {mime_type}")

        if not file_bytes:
            return ParsedDocument(
                raw_text="",
                confidence_score=0.0,
                document_type="unknown",
                lab_values=[],
                patient_name_extracted=None,
                date_extracted=None,
                parsing_warnings=["Empty file provided"],
            )

        ocr_result = self.ocr.extract_text(file_bytes, mime_type, filename)
        raw_text = ocr_result.text
        confidence = ocr_result.confidence

        if not raw_text.strip():
            warnings.append("No text extracted from document")

        document_type = self.lab_parser.detect_document_type(raw_text)

        lab_values: list[dict[str, Any]] = []
        if document_type == "lab_result":
            parsed = self.lab_parser.parse(raw_text)
            lab_values = [
                {
                    "test_name": lv.test_name,
                    "value": lv.value,
                    "unit": lv.unit,
                    "reference_range": lv.reference_range,
                    "is_abnormal": lv.is_abnormal,
                    "abnormal_direction": lv.abnormal_direction,
                    "confidence": lv.confidence,
                    "test_type": lv.test_type,
                }
                for lv in parsed
            ]

        patient_name = self._extract_patient_name(raw_text)
        doc_date = self._extract_date(raw_text)

        return ParsedDocument(
            raw_text=raw_text,
            confidence_score=confidence,
            document_type=document_type,
            lab_values=lab_values,
            patient_name_extracted=patient_name,
            date_extracted=doc_date,
            parsing_warnings=warnings,
        )

    def _extract_patient_name(self, text: str) -> Optional[str]:
        import re

        patterns = [
            r"(?:paciente|patient|name|nombre)[:\s]+([A-ZÁÉÍÓÚÑ\s]{3,50})",
            r"(?:Sr\.|Sra\.|Srta\.)[:\s]+([A-ZÁÉÍÓÚÑ\s]{3,50})",
        ]
        for pattern in patterns:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return m.group(1).strip()
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        import re
        from datetime import datetime

        patterns = [
            r"(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})",
            r"(\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2})",
            r"(\d{1,2}\s+(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+\d{2,4})",
        ]
        for pattern in patterns:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                return m.group(1)
        return None

    def compute_file_hash(self, file_bytes: bytes) -> str:
        sha = hashlib.sha256()
        sha.update(file_bytes)
        return sha.hexdigest()
