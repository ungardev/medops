# core/middleware.py (completo corregido)
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest
from .permissions import SmartInstitutionValidator
from .models import InstitutionSettings, DoctorOperator
class InstitutionPermissionMiddleware(MiddlewareMixin):
    """Middleware liviano para permisos institucionales"""
    
    def process_request(self, request: HttpRequest):
        # Extraer institución activa
        institution_id = self._extract_institution_id(request)
        if not institution_id:
            return None
        
        try:
            institution = InstitutionSettings.objects.get(id=institution_id)
            request.current_institution = institution
            request.current_institution_id = institution_id
            
            # Si hay usuario autenticado, validar permisos
            if request.user.is_authenticated:
                doctor = getattr(request.user, 'doctor_profile', None)
                if doctor:
                    permission_info = SmartInstitutionValidator.get_permission_level(
                        doctor, institution
                    )
                    
                    request.institution_permission = permission_info
                    
                    # Logging automático para ciertas acciones
                    if request.method in ['POST', 'PUT', 'PATCH']:
                        SmartInstitutionValidator.log_access(
                            doctor, institution, f"{request.method} {request.path}", request
                        )
        
        except InstitutionSettings.DoesNotExist:
            request.current_institution = None
            request.institution_permission = None
        
        return None
    
    def _extract_institution_id(self, request: HttpRequest):
        """Extraer ID de institución de header o doctor activo"""
        # 1. Header (prioridad)
        if 'HTTP_X_INSTITUTION_ID' in request.META:
            return request.META['HTTP_X_INSTITUTION_ID']
        
        # 2. Doctor activo (fallback)
        if request.user.is_authenticated:
            doctor = getattr(request.user, 'doctor_profile', None)
            if doctor and doctor.active_institution:
                return doctor.active_institution.id
        
        return None