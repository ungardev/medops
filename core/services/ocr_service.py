"""
OCR Service — Centro de Diagnóstico Inteligente MEDOPZ
Procesamiento de documentos clínicos: PDFs, imágenes, fotos de laboratorio.
Usa Tesseract 5 + pytesseract + OpenCV para preprocessing.
"""

import io
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


@dataclass
class OCRResult:
    text: str
    confidence: float
    language: str = "spa+eng"


class OCRService:
    """
    Servicio de OCR con image preprocessing.
    Prioriza español, con fallback a inglés.
    """

    def __init__(self, lang: str = "spa+eng"):
        self.lang = lang
        self._available_langs = self._check_available_langs()

    def _check_available_langs(self) -> list[str]:
        try:
            langs = pytesseract.get_languages()
            return langs
        except Exception:
            return ["eng"]

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocesa imagen para mejorar OCR accuracy.
        Pipeline: grayscale → denoise → threshold → deskew.
        """
        try:
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image

            denoised = cv2.fastNlMeansDenoising(gray, h=10)

            _, binary = cv2.threshold(
                denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )

            coords = np.column_stack(np.where(binary > 0))
            if len(coords) > 0:
                angle = cv2.minAreaRect(coords)[-1]
                if 45 < angle < 90:
                    angle = angle - 90
                elif -90 < angle < -45:
                    angle = angle + 90
                if abs(angle) > 0.5:
                    h, w = binary.shape
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    binary = cv2.warpAffine(binary, M, (w, h), borderValue=0)

            return binary
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {e}")
            return image

    def extract_text_from_bytes(
        self, image_bytes: bytes, preprocess: bool = True
    ) -> OCRResult:
        """
        Extrae texto de bytes de imagen con OCR.
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                image = Image.open(io.BytesIO(image_bytes))
                image = np.array(image)
                if len(image.shape) == 3:
                    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if preprocess:
                processed = self.preprocess_image(image)
            else:
                processed = image

            lang = self.lang if self.lang in self._available_langs else "eng"
            data = pytesseract.image_to_data(
                processed,
                lang=lang,
                output_type=pytesseract.Output.DICT,
                config="--psm 6",
            )

            words = []
            confidences = []
            for i, conf in enumerate(data["conf"]):
                if conf > 0:
                    words.append(data["text"][i])
                    confidences.append(float(conf))

            text = " ".join(words)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            return OCRResult(
                text=text.strip(),
                confidence=avg_confidence / 100.0,
                language=lang,
            )
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return OCRResult(text="", confidence=0.0, language=self.lang)

    def extract_from_pdf_bytes(self, pdf_bytes: bytes) -> OCRResult:
        """
        Extrae texto de PDF usando pdfplumber.
        Para PDFs escaneados (imágenes), usa OCR en la primera página.
        """
        import pdfplumber

        try:
            text_parts = []
            confidences = []

            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_num, page in enumerate(pdf.pages[:5]):
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text_parts.append(page_text.strip())
                    else:
                        img = page.to_image(resolution=200)
                        img_bytes = img.original.tobytes()
                        ocr_result = self.extract_text_from_bytes(img_bytes)
                        if ocr_result.text.strip():
                            text_parts.append(ocr_result.text.strip())
                            confidences.append(ocr_result.confidence)

            full_text = "\n".join(text_parts)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

            return OCRResult(
                text=full_text.strip(),
                confidence=avg_conf if confidences else 0.5,
                language=self.lang,
            )
        except Exception as e:
            logger.error(f"PDF text extraction failed: {e}")
            return self._pdf_scanned_fallback(pdf_bytes)

    def _pdf_scanned_fallback(self, pdf_bytes: bytes) -> OCRResult:
        """Fallback para PDFs escaneados: convierte primera página a imagen + OCR."""
        import pdfplumber

        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                if len(pdf.pages) == 0:
                    return OCRResult(text="", confidence=0.0)

                first_page = pdf.pages[0]
                img = first_page.to_image(resolution=200)
                img_bytes = img.original.tobytes()

                return self.extract_text_from_bytes(img_bytes)
        except Exception as e:
            logger.error(f"PDF scanned fallback failed: {e}")
            return OCRResult(text="", confidence=0.0)

    def extract_text(
        self, file_bytes: bytes, mime_type: str, filename: str = ""
    ) -> OCRResult:
        """
        Punto de entrada principal: detecta el tipo y ejecuta OCR apropiado.
        """
        if mime_type in ("image/png", "image/jpeg", "image/jpg", "image/webp"):
            return self.extract_text_from_bytes(file_bytes)
        elif mime_type == "application/pdf":
            return self.extract_from_pdf_bytes(file_bytes)
        elif mime_type == "image/bmp":
            return self.extract_text_from_bytes(file_bytes)
        else:
            if filename.lower().endswith(".pdf"):
                return self.extract_from_pdf_bytes(file_bytes)
            return self.extract_text_from_bytes(file_bytes)
