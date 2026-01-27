# core/utils/professional_pdf.py
# -*- coding: utf-8 -*-
"""
Servicio profesional para generación de PDF con WeasyPrint optimizado y soporte multi-país
"""
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
from django.conf import settings
from django.utils import timezone
import logging
import json
import hashlib
import time
from typing import Dict, Any, Optional, Union
logger = logging.getLogger(__name__)
class PDFGenerationError(Exception):
    """Excepción personalizada para errores de generación de PDF"""
    pass
class ProfessionalPDFService:
    """Servicio profesional para generación de PDF con WeasyPrint optimizado y soporte multi-país"""
    
    def __init__(self):
        # 🔥 CORRECCIÓN: Removido FontConfiguration - causa problemas
        # self.font_config = FontConfiguration()
        self.css_cache = {}
    
    def generate_professional_pdf(
        self, 
        template_name: str, 
        context: Dict[str, Any], 
        institution_settings: Any
    ) -> bytes:
        """
        Generar PDF profesional con validación híbrida mono-médico
        """
        try:
            logger.info(f"🔍 [1] Starting PDF generation for template: {template_name}")
            logger.info(f"🔍 [2] Context keys: {list(context.keys())}")
            logger.info(f"🔍 [3] Institution settings: {list(institution_settings.keys())}")
            
            # Validación de entrada
            if not template_name or not context or not institution_settings:
                raise ValueError("Parámetros requeridos faltantes")
            
            # ✅ CORRECCIÓN: Usar get_current_user() sin parámetros
            from django.contrib.auth import get_current_user
            user = get_current_user()
            logger.info(f"🔍 [4] User authenticated: {user is not None}")
            
            if not user or not user.is_authenticated:
                raise PDFGenerationError("Usuario no autenticado")
            
            from .models import DoctorOperator, InstitutionSettings
            doctor = getattr(user, 'doctor_profile', None)
            logger.info(f"🔍 [5] Doctor profile found: {doctor is not None}")
            
            if not doctor:
                raise PDFGenerationError("Perfil de médico no encontrado")
            
            # Validar permisos para la institución
            institution = InstitutionSettings.objects.get(id=institution_settings.get('id'))
            logger.info(f"🔍 [6] Institution found: {institution.name if institution else 'None'}")
            
            from .permissions import SmartInstitutionValidator
            permission_info = SmartInstitutionValidator.get_permission_level(doctor, institution)
            logger.info(f"🔍 [7] Permission level: {permission_info.get('level')}")
            logger.info(f"🔍 [8] Has access: {permission_info.get('has_access')}")
            
            if not permission_info['has_access']:
                from .permissions import SmartInstitutionValidator
                SmartInstitutionValidator.log_access(
                    doctor, institution, 'pdf_generation_denied'
                )
                raise PDFGenerationError("Acceso denegado para generar PDF")
            
            # Determinar modo de generación
            is_emergency_mode = permission_info['is_cross_institution']
            logger.info(f"🔍 [9] Emergency mode: {is_emergency_mode}")
            
            # Añadir metadata de permisos al contexto
            enhanced_context = {
                **context,
                '_permission_level': permission_info['level'],
                '_is_emergency_mode': is_emergency_mode,
                '_is_own_institution': permission_info['is_own_institution'],
                '_expires_at': permission_info['expires_at'],
                '_access_count': permission_info['permission'].access_count,
                'generated_at': timezone.now().strftime('%d/%m/%Y %H:%M'),
                'audit_code': self._generate_audit_code(template_name, context, institution_settings),
                'institution_id': int(institution_settings.get('id', 0)),
                'patient_id': int(context.get('patient_id', 0)),
                'appointment_id': int(context.get('appointment_id', 0)),
                'template_name': str(template_name),
                'country_code': str(institution_settings.get('country_code', 'VE')),
                'compliance_info': self._get_compliance_info(institution_settings.get('country_code', 'VE'))
            }
            
            logger.info(f"🔍 [10] Enhanced context prepared, keys: {list(enhanced_context.keys())}")
            
            # Generar PDF
            pdf_bytes = self._generate_pdf_bytes(template_name, enhanced_context, institution_settings)
            
            logger.info(f"🔍 [11] PDF bytes received from _generate_pdf_bytes")
            logger.info(f"🔍 [12] Type: {type(pdf_bytes)}")
            logger.info(f"🔍 [13] Length: {len(pdf_bytes) if pdf_bytes else 'None'}")
            logger.info(f"🔍 [14] First 50 chars: {pdf_bytes[:50] if pdf_bytes else 'None'}")
            
            # Validar resultado
            if not pdf_bytes or len(pdf_bytes) < 100:
                raise PDFGenerationError("PDF generado inválido")
            
            # Logging exitoso con contexto
            from .permissions import SmartInstitutionValidator
            SmartInstitutionValidator.log_access(
                doctor, institution, f'pdf_generated_{template_name}'
            )
            
            # Log especial para emergency mode
            if is_emergency_mode:
                logger.info(f"EMERGENCY PDF: Dr {doctor.full_name} generated {template_name} from {institution.name}")
            
            logger.info(f"✅ PDF generado exitosamente: {template_name} - {permission_info['level']} access")
            logger.info(f"🔍 [15] PDF validation passed, returning {len(pdf_bytes)} bytes")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"❌ Error en generate_professional_pdf: {str(e)}")
            raise PDFGenerationError(f"No se pudo generar el PDF: {str(e)}")
    
    def _generate_pdf_bytes(
        self, 
        template_name: str, 
        context: Dict[str, Any], 
        institution_settings: Any
    ) -> bytes:
        """
        🎯 MÉTODO CRÍTICO CORREGIDO - Versión minimalista ultra-efectiva
        Basado en tests exitosos que demostraron que este método funciona perfectamente
        """
        logger.info(f"🔍 [A] Starting _generate_pdf_bytes for template: {template_name}")
        
        # Preparar contexto con tipos estrictos
        enhanced_context = self._prepare_context(template_name, context, institution_settings)
        logger.info(f"🔍 [B] Context prepared, keys: {list(enhanced_context.keys())}")
        
        # Renderizar template
        template_path = f"medical/documents/{template_name}.html"
        logger.info(f"🔍 [C] Template path: {template_path}")
        
        html_string = self._render_template(template_path, enhanced_context)
        logger.info(f"🔍 [D] HTML rendered: {len(html_string)} chars")
        logger.info(f"🔍 [E] HTML preview: {html_string[:200]}...")
        
        # 🔥 CORRECCIÓN CLAVE: WeasyPrint simple y efectivo (como en el test exitoso)
        html = HTML(
            string=html_string, 
            base_url=settings.MEDIA_ROOT or ""
        )
        logger.info(f"🔍 [F] HTML object created")
        
        # 🔥 SOLUCIÓN DEFINITIVA: Sin CSS externo, sin font_config, sin optimización
        # El template ya tiene CSS inline profesional - no necesita CSS externo
        pdf_bytes = html.write_pdf()  # Método testado y probado exitosamente
        
        logger.info(f"🔍 [G] WeasyPrint.write_pdf() called")
        logger.info(f"🔍 [H] Result type: {type(pdf_bytes)}")
        logger.info(f"🔍 [I] Result length: {len(pdf_bytes) if pdf_bytes else 'None'}")
        logger.info(f"🔍 [J] First 50 chars: {pdf_bytes[:50] if pdf_bytes else 'None'}")
        
        # 🔥 VALIDACIÓN CRÍTICA: Asegurar que siempre devuelve bytes (soluciona error TypeScript)
        if pdf_bytes is None:
            raise PDFGenerationError("WeasyPrint devolvió None al generar PDF")
        
        logger.info(f"🔍 [K] Returning from _generate_pdf_bytes: {len(pdf_bytes)} bytes")
        return pdf_bytes
    
    def _prepare_context(
        self, 
        template_name: str, 
        context: Dict[str, Any], 
        institution_settings: Any
    ) -> Dict[str, Any]:
        """
        Preparar contexto con tipos estrictos y validación
        """
        logger.info(f"🔍 [P1] Starting _prepare_context")
        enhanced_context = context.copy()
        logger.info(f"🔍 [P2] Context copied, initial keys: {list(enhanced_context.keys())}")
        
        # Validar y convertir tipos con seguridad
        try:
            context_updates = {
                'generated_at': timezone.now().strftime('%d/%m/%Y %H:%M'),
                'audit_code': self._generate_audit_code(template_name, context, institution_settings),
                'institution_id': int(institution_settings.get('id', 0)),
                'patient_id': int(context.get('patient_id', 0)),
                'appointment_id': int(context.get('appointment_id', 0)),
                'template_name': str(template_name),
                'country_code': str(institution_settings.get('country_code', 'VE')),
                'compliance_info': self._get_compliance_info(institution_settings.get('country_code', 'VE'))
            }
            enhanced_context.update(context_updates)
            logger.info(f"🔍 [P3] Context updated successfully")
            logger.info(f"🔍 [P4] Final context keys: {list(enhanced_context.keys())}")
        except (ValueError, TypeError) as e:
            logger.warning(f"⚠️ Error en conversión de datos context: {str(e)}")
            # Valores por defecto si hay error
            enhanced_context.update({
                'generated_at': timezone.now().strftime('%d/%m/%Y %H:%M'),
                'audit_code': f"ERROR_AUDIT_{int(time.time())}",
                'institution_id': 0,
                'patient_id': 0,
                'template_name': template_name,
                'country_code': 'VE',
                'compliance_info': self._get_compliance_info('VE')
            })
            logger.info(f"🔍 [P5] Context updated with defaults due to error")
        
        logger.info(f"🔍 [P6] Returning prepared context")
        return enhanced_context
    
    def _render_template(self, template_path: str, context: Dict[str, Any]) -> str:
        """Renderizar template con Django"""
        logger.info(f"🔍 [T1] Starting template render for: {template_path}")
        logger.info(f"🔍 [T2] Context has {len(context)} keys")
        
        try:
            from django.template.loader import render_to_string
            result = render_to_string(template_path, context)
            logger.info(f"🔍 [T3] Template rendered successfully: {len(result)} chars")
            logger.info(f"🔍 [T4] First 100 chars: {result[:100]}...")
            return result
        except Exception as e:
            logger.error(f"🔍 [T5] Template render error: {str(e)}")
            raise
    
    def _get_country_css(self, country_code: str) -> str:
        """Obtener CSS específico para el país"""
        logger.info(f"🔍 [C1] Getting CSS for country: {country_code}")
        
        if country_code not in self.css_cache:
            # 🔥 CORRECCIÓN: Eliminar lógica duplicada
            css_file = f"medical/css/country_{country_code.lower()}.css"
            logger.info(f"🔍 [C2] CSS file path: {css_file}")
            
            try:
                full_path = settings.TEMPLATES[0]['DIRS'][0] + '/' + css_file
                logger.info(f"🔍 [C3] Full CSS path: {full_path}")
                
                with open(full_path, 'r', encoding='utf-8') as f:
                    self.css_cache[country_code] = f.read()
                logger.info(f"🔍 [C4] CSS loaded from file: {len(self.css_cache[country_code])} chars")
            except (FileNotFoundError, IndexError, KeyError):
                logger.warning(f"⚠️ CSS específico no encontrado para {country_code}, usando por defecto")
                self.css_cache[country_code] = self._get_default_css()
                logger.info(f"🔍 [C5] Using default CSS")
        
        result = self.css_cache.get(country_code, self._get_default_css())
        logger.info(f"🔍 [C6] Returning CSS: {len(result)} chars")
        return result
    
    def _get_default_css(self) -> str:
        """CSS por defecto universal"""
        logger.info(f"🔍 [D1] Getting default CSS")
        
        try:
            # 🔥 CORRECCIÓN: Ruta absoluta para producción
            css_path = settings.TEMPLATES[0]['DIRS'][0] + '/medical/css/universal.css'
            logger.info(f"🔍 [D2] Default CSS path: {css_path}")
            
            with open(css_path, 'r', encoding='utf-8') as f:
                result = f.read()
            logger.info(f"🔍 [D3] Default CSS loaded: {len(result)} chars")
            return result
        except (FileNotFoundError, IndexError, KeyError):
            logger.error(f"❌ Error leyendo CSS por defecto")
            fallback_css = """
            body { font-family: Arial, sans-serif; }
            .medical-header { border-bottom: 2px solid #0ea5e9; }
            .soap-section { margin: 20px 0; border: 1px solid #e2e8f0; }
            """  # CSS básico como fallback
            logger.info(f"🔍 [D4] Using fallback CSS: {len(fallback_css)} chars")
            return fallback_css
    
    def _generate_audit_code(
        self, 
        template_name: str, 
        context: Dict[str, Any], 
        institution_settings: Any
    ) -> str:
        """Generar código de auditoría único"""
        logger.info(f"🔍 [A1] Generating audit code for {template_name}")
        
        try:
            audit_data = {
                'timestamp': int(time.time()),
                'appointment': int(context.get('appointment_id', 0)),
                'patient': int(context.get('patient_id', 0)),
                'template': template_name,
                'institution': int(institution_settings.get('id', 0))
            }
            
            audit_string = json.dumps(audit_data, sort_keys=True)
            result = hashlib.sha256(audit_string.encode()).hexdigest()[:16].upper()
            logger.info(f"🔍 [A2] Audit code generated: {result}")
            return result
        except Exception:
            fallback = f"ERROR_AUDIT_{int(time.time())}"
            logger.warning(f"🔍 [A3] Using fallback audit code: {fallback}")
            return fallback
    
    def _get_compliance_info(self, country_code: str) -> Dict[str, Any]:
        """Obtener información de cumplimiento regulatorio por país"""
        logger.info(f"🔍 [CM1] Getting compliance info for: {country_code}")
        
        # 🔥 CORRECCIÓN: Eliminar texto basura y restaurar datos válidos
        compliance_map = {
            'VE': {
                'authority': 'MPPSA',
                'data_retention_years': 10,
                'medical_license_validation': True,
                'prescription_format': 'venezolano'
            },
            'MX': {
                'authority': 'COFEPRIS',
                'data_retention_years': 15,
                'medical_license_validation': True,
                'prescription_format': 'mexicano'
            },
            'BR': {
                'authority': 'ANVISA',
                'data_retention_years': 20,
                'medical_license_validation': True,
                'prescription_format': 'brasileño'
            },
            'CO': {
                'authority': 'INVIMA',
                'data_retention_years': 18,
                'medical_license_validation': True,
                'prescription_format': 'colombiano'
            }
        }
        
        result = compliance_map.get(country_code, {
            'authority': 'Por definir',
            'data_retention_years': 10,
            'medical_license_validation': False,
            'prescription_format': 'español'
        })
        
        logger.info(f"🔍 [CM2] Compliance info retrieved: authority={result.get('authority')}")
        return result