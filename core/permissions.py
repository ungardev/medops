# core/permissions.py
import logging
from django.utils import timezone
from datetime import timedelta
from django.http import HttpRequest
from rest_framework import permissions
from .models import InstitutionPermission, InstitutionSettings, DoctorOperator
from typing import Dict, Any, Optional
logger = logging.getLogger(__name__)
def get_client_ip(request):
    """Extraer IP del cliente request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
def get_user_agent(request):
    """Extraer User Agent del request"""
    return request.META.get('HTTP_USER_AGENT', '')
class IsDoctorOperatorOrReadOnly(permissions.BasePermission):
    """
    Permission personalizada para permitir:
    - Lectura (GET, HEAD, OPTIONS): Cualquier usuario autenticado
    - Escritura (POST, PUT, DELETE): Solo DoctorOperator
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'doctor_operator')
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'doctor_operator')
class SmartInstitutionValidator:
    """Validador híbrido mono-médico multi-institución"""
    
    @staticmethod
    def get_permission_level(doctor: DoctorOperator, institution: InstitutionSettings) -> Dict[str, Any]:
        """
        Determina nivel de acceso usando lógica híbrida
        """
        if hasattr(doctor, 'institutions'):
            institutions_list = doctor.institutions.all()
        else:
            institutions_list = []
        
        if institution in institutions_list:
            permission, created = InstitutionPermission.objects.get_or_create(
                user=doctor.user,
                institution=institution,
                defaults={
                    'access_level': 'full_access',
                    'is_own_institution': True,
                    'granted_by': doctor.user
                }
            )
            
            return {
                'has_access': True,
                'level': 'full_access',
                'is_own': True,
                'is_cross': False,
                'can_edit': True,
                'can_generate_pdf': True,
                'can_view_patients': True,
                'expires_at': None,
                'requires_approval': False,
                'permission': permission
            }
        
        permission, created = InstitutionPermission.objects.get_or_create(
            user=doctor.user,
            institution=institution,
            defaults={
                'access_level': 'emergency_access',
                'is_own_institution': False,
                'granted_by': doctor.user,
                'expires_at': timezone.now() + timedelta(hours=24)
            }
        )
        
        if permission.expires_at and permission.expires_at < timezone.now():
            permission.expires_at = timezone.now() + timedelta(hours=24)
            permission.save()
        
        return {
            'has_access': True,
            'level': 'emergency_access',
            'is_own': False,
            'is_cross': True,
            'can_edit': False,
            'can_generate_pdf': True,
            'can_view_patients': True,
            'expires_at': permission.expires_at,
            'requires_approval': False,
            'permission': permission
        }
    
    @staticmethod
    def log_access(doctor: DoctorOperator, institution: InstitutionSettings, action: str, request=None):
        """Auditoría inteligente con contexto médico"""
        permission_info = SmartInstitutionValidator.get_permission_level(doctor, institution)
        
        permission_obj = permission_info.get('permission')
        if permission_obj:
            permission_obj.last_accessed = timezone.now()
            permission_obj.access_count += 1
            permission_obj.save(update_fields=['last_accessed', 'access_count'])
        
        from .models import AuditLog
        try:
            AuditLog.objects.create(
                user=doctor.user,
                institution=institution,
                action=action,
                access_level=permission_info['level'],
                is_own_institution=permission_info['is_own'],
                is_cross_institution=permission_info['is_cross'],
                ip_address=get_client_ip(request) if request else None,
                user_agent=get_user_agent(request) if request else '',
                timestamp=timezone.now()
            )
        except Exception:
            logger.info(f"Audit: {doctor.full_name} - {action} - {institution.name}")
        
        if permission_info.get('is_cross'):
            logger.info(f"EMERGENCY ACCESS: Dr {doctor.full_name} accessing {institution.name}")