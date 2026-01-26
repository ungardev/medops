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
            # Validación de entrada
            if not template_name or not context or not institution_settings:
                raise ValueError("Parámetros requeridos faltantes")
            
            # ✅ CORRECCIÓN: Usar get_current_user() sin parámetros
            from django.contrib.auth import get_current_user
            user = get_current_user()
            
            if not user or not user.is_authenticated:
                raise PDFGenerationError("Usuario no autenticado")
            
            from .models import DoctorOperator, InstitutionSettings
            doctor = getattr(user, 'doctor_profile', None)
            if not doctor:
                raise PDFGenerationError("Perfil de médico no encontrado")
            
            # Validar permisos para la institución
            institution = InstitutionSettings.objects.get(id=institution_settings.get('id'))
            from .permissions import SmartInstitutionValidator
            permission_info = SmartInstitutionValidator.get_permission_level(doctor, institution)
            
            if not permission_info['has_access']:
                from .permissions import SmartInstitutionValidator
                SmartInstitutionValidator.log_access(
                    doctor, institution, 'pdf_generation_denied'
                )
                raise PDFGenerationError("Acceso denegado para generar PDF")
            
            # Determinar modo de generación
            is_emergency_mode = permission_info['is_cross_institution']
            
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
            
            # Generar PDF
            pdf_bytes = self._generate_pdf_bytes(template_name, enhanced_context, institution_settings)
            
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
        # Preparar contexto con tipos estrictos
        enhanced_context = self._prepare_context(template_name, context, institution_settings)
        
        # Renderizar template
        template_path = f"medical/documents/{template_name}.html"
        html_string = self._render_template(template_path, enhanced_context)
        
        # 🔥 CORRECCIÓN CLAVE: WeasyPrint simple y efectivo (como en el test exitoso)
        html = HTML(
            string=html_string, 
            base_url=settings.MEDIA_ROOT or ""
        )
        
        # 🔥 SOLUCIÓN DEFINITIVA: Sin CSS externo, sin font_config, sin optimización
        # El template ya tiene CSS inline profesional - no necesita CSS externo
        pdf_bytes = html.write_pdf()  # Método testado y probado exitosamente
        
        # 🔥 VALIDACIÓN CRÍTICA: Asegurar que siempre devuelve bytes (soluciona error TypeScript)
        if pdf_bytes is None:
            raise PDFGenerationError("WeasyPrint devolvió None al generar PDF")
        
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
        enhanced_context = context.copy()
        
        # Validar y convertir tipos con seguridad
        try:
            enhanced_context.update({
                'generated_at': timezone.now().strftime('%d/%m/%Y %H:%M'),
                'audit_code': self._generate_audit_code(template_name, context, institution_settings),
                'institution_id': int(institution_settings.get('id', 0)),
                'patient_id': int(context.get('patient_id', 0)),
                'appointment_id': int(context.get('appointment_id', 0)),
                'template_name': str(template_name),
                'country_code': str(institution_settings.get('country_code', 'VE')),
                'compliance_info': self._get_compliance_info(institution_settings.get('country_code', 'VE'))
            })
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
        
        return enhanced_context
    
    def _render_template(self, template_path: str, context: Dict[str, Any]) -> str:
        """Renderizar template con Django"""
        from django.template.loader import render_to_string
        return render_to_string(template_path, context)
    
    def _get_country_css(self, country_code: str) -> str:
        """Obtener CSS específico para el país"""
        if country_code not in self.css_cache:
            # 🔥 CORRECCIÓN: Eliminar lógica duplicada
            css_file = f"medical/css/country_{country_code.lower()}.css"
            try:
                full_path = settings.TEMPLATES[0]['DIRS'][0] + '/' + css_file
                with open(full_path, 'r', encoding='utf-8') as f:
                    self.css_cache[country_code] = f.read()
            except (FileNotFoundError, IndexError, KeyError):
                self.css_cache[country_code] = self._get_default_css()
                logger.warning(f"⚠️ CSS específico no encontrado para {country_code}, usando por defecto")
        
        return self.css_cache.get(country_code, self._get_default_css())
    
    def _get_default_css(self) -> str:
        """CSS por defecto universal"""
        try:
            # 🔥 CORRECCIÓN: Ruta absoluta para producción
            css_path = settings.TEMPLATES[0]['DIRS'][0] + '/medical/css/universal.css'
            with open(css_path, 'r', encoding='utf-8') as f:
                return f.read()
        except (FileNotFoundError, IndexError, KeyError):
            logger.error(f"❌ Error leyendo CSS por defecto")
            return """
            body { font-family: Arial, sans-serif; }
            .medical-header { border-bottom: 2px solid #0ea5e9; }
            .soap-section { margin: 20px 0; border: 1px solid #e2e8f0; }
            """  # CSS básico como fallback
    
    def _generate_audit_code(
        self, 
        template_name: str, 
        context: Dict[str, Any], 
        institution_settings: Any
    ) -> str:
        """Generar código de auditoría único"""
        try:
            audit_data = {
                'timestamp': int(time.time()),
                'appointment': int(context.get('appointment_id', 0)),
                'patient': int(context.get('patient_id', 0)),
                'template': template_name,
                'institution': int(institution_settings.get('id', 0))
            }
            
            audit_string = json.dumps(audit_data, sort_keys=True)
            return hashlib.sha256(audit_string.encode()).hexdigest()[:16].upper()
        except Exception:
            return f"ERROR_AUDIT_{int(time.time())}"
    
    def _get_compliance_info(self, country_code: str) -> Dict[str, Any]:
        """Obtener información de cumplimiento regulatorio por país"""
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
        
        return compliance_map.get(country_code, {
            'authority': 'Por definir',
            'data_retention_years': 10,
            'medical_license_validation': False,
            'prescription_format': 'español'
        })