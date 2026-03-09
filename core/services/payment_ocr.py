# core/services/payment_ocr.py
"""
Servicio OCR para extraer datos de capturas de pago móvil venezolano
"""
import re
import logging
from typing import Optional, Dict, Any
from django.core.files.uploadedfile import UploadedFile
logger = logging.getLogger(__name__)
class PaymentOCRService:
    """
    Procesa imágenes de pagos y extrae datos automáticamente
    """
    
    # Patrones regex para bancos venezolanos
    BANCO_PATTERNS = [
        (r'mercantil', 'mercantil'),
        (r'banesco', 'banesco'),
        (r'provincial', 'provincial'),
        (r'venezuela', 'venezuela'),
        (r'bicentenario', 'bicentenario'),
        (r'caron[ií]', 'caroni'),
        (r'exterior', 'exterior'),
        (r'tesoro', 'tesoro'),
        (r'occidente', 'occidente'),
        (r'soberano', 'soberano'),
    ]
    
    @classmethod
    def extract_data(cls, image) -> Dict[str, Any]:
        """
        Extrae datos de pago de una imagen
        Returns: dict con banco, monto, referencia, telefono, fecha, confianza
        """
        try:
            # Intentar importar pytesseract
            try:
                import pytesseract
                from PIL import Image
            except ImportError:
                return {
                    'success': False,
                    'error': 'OCR no disponible. Instale pytesseract y pillow.'
                }
            
            # Abrir imagen
            image.seek(0)
            img = Image.open(image)
            
            # Convertir a RGB si es necesario
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # OCR - extraer texto
            text = pytesseract.image_to_string(img, lang='spa+eng')
            logger.info(f"OCR extrajo {len(text)} caracteres")
            
            # Parsear datos
            data = cls._parse_payment_text(text)
            
            return {
                'success': True,
                'data': data,
                'raw_text': text,
                'confianza': cls._calculate_confidence(data)
            }
            
        except Exception as e:
            logger.error(f"Error en OCR: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @classmethod
    def _parse_payment_text(cls, text: str) -> Dict[str, Any]:
        """Parsea el texto extraído y extrae datos de pago"""
        text_upper = text.upper()
        text_clean = text.upper()
        
        # Extraer banco
        banco = cls._extract_banco(text_clean)
        
        # Extraer monto
        monto = cls._extract_monto(text)
        
        # Extraer referencia
        referencia = cls._extract_referencia(text)
        
        # Extraer teléfono
        telefono = cls._extract_telefono(text)
        
        # Extraer fecha
        fecha = cls._extract_fecha(text)
        
        return {
            'banco': banco,
            'monto': monto,
            'referencia': referencia,
            'telefono': telefono,
            'fecha': fecha
        }
    
    @classmethod
    def _extract_banco(cls, text: str) -> Optional[str]:
        """Extrae el nombre del banco del texto"""
        for pattern, banco in cls.BANCO_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return banco
        return None
    
    @classmethod
    def _extract_monto(cls, text: str) -> Optional[str]:
        """Extrae el monto del pago"""
        # Patrones comunes: "Monto: Bs 2.500.000" o "MONTO 2500000" etc
        patterns = [
            r'MONTO[:\s]*BS?\s*([\d.,]+)',
            r'TOTAL[:\s]*BS?\s*([\d.,]+)',
            r'BS\s*([\d.,]{6,})',
            r'([\d.]{7,})\s*BS',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                monto_str = match.group(1).replace('.', '').replace(',', '')
                return monto_str
        return None
    
    @classmethod
    def _extract_referencia(cls, text: str) -> Optional[str]:
        """Extrae el número de referencia"""
        patterns = [
            r'RE[F]?[:\s]*(\d{8,20})',
            r'REFIERENCIA[:\s]*(\d{8,20})',
            r'#\s*(\d{10,20})',
            r'CÓDIGO[:\s]*(\d{8,20})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None
    
    @classmethod
    def _extract_telefono(cls, text: str) -> Optional[str]:
        """Extrae el número de teléfono"""
        # Formato venezolano: 0412-123-4567 o 4121234567
        patterns = [
            r'(04\d{2}[-\s]?\d{3}[-\s]?\d{4})',
            r'(0412\d{7})',
            r'(04\d{9})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                telefono = match.group(1)
                # Normalizar formato
                telefono = re.sub(r'[^\d]', '', telefono)
                if len(telefono) == 11:
                    return f"{telefono[:4]}-{telefono[4:7]}-{telefono[7:]}"
        return None
    
    @classmethod
    def _extract_fecha(cls, text: str) -> Optional[str]:
        """Extrae la fecha del pago"""
        # Formato: DD/MM/YYYY o DD-MM-YYYY
        patterns = [
            r'(\d{2}/\d{2}/\d{4})',
            r'(\d{2}-\d{2}-\d{4})',
            r'(\d{2}\s+\w+\s+\d{4})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                fecha_str = match.group(1)
                # Convertir a formato YYYY-MM-DD si es necesario
                try:
                    from datetime import datetime
                    fecha = datetime.strptime(fecha_str, '%d/%m/%Y')
                    return fecha.strftime('%Y-%m-%d')
                except:
                    return fecha_str
        return None
    
    @classmethod
    def _calculate_confidence(cls, data: Dict[str, Any]) -> float:
        """Calcula nivel de confianza basado en campos encontrados"""
        fields_found = sum([
            1 for v in data.values() if v is not None
        ])
        return round(fields_found / 5, 2)  # 5 campos max