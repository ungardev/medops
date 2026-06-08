# core/permissions.py
import logging
from django.utils import timezone
from datetime import timedelta
from django.http import HttpRequest
from rest_framework import permissions
from .models import (
    InstitutionPermission,
    InstitutionSettings,
    DoctorOperator,
    PatientFamilyLink,
    PatientUser,
)
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def can_access_patient(patient_user: PatientUser, target_patient_id: int) -> bool:
    """
    Verifica si el patient_user tiene acceso a los datos del target_patient_id.

    Returns True si:
    - target_patient_id == patient_user.patient_id (es el mismo paciente)
    - Existe PatientFamilyLink activa entre patient_user y target_patient

    Returns False en otro caso.
    """
    if not patient_user or not target_patient_id:
        return False

    if patient_user.patient_id == target_patient_id:
        return True

    has_link = PatientFamilyLink.objects.filter(
        patient_user=patient_user, patient_id=target_patient_id, status="active"
    ).exists()

    return has_link


class HasPatientFamilyLinkOrSelf(permissions.BasePermission):
    """
    Permiso que verifica que el usuario tiene PatientFamilyLink activa
    al paciente cuyos datos está intentando acceder, o que es el paciente mismo.

    Para endpoints de paciente que reciben patient_id en query params o URL.
    """

    message = "No tienes acceso a los datos de este paciente."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if not hasattr(request.user, "patient_profile"):
            return False

        patient_user = request.user.patient_profile

        patient_id = request.query_params.get("patient")
        if not patient_id:
            patient_id = view.kwargs.get("patient_id") or view.kwargs.get("pk")

        if not patient_id:
            return False

        try:
            target_id = int(patient_id)
        except (ValueError, TypeError):
            return False

        return can_access_patient(patient_user, target_id)


class IsDoctorOperator(permissions.BasePermission):
    """
    Permiso que verifica:
    1. Usuario autenticado con Django auth
    2. Token JWT con claim 'role': 'doctor'
    3. tiene doctor_profile (DoctorOperator)
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, "doctor_profile"):
            return True

        return False

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsDoctorOperatorJWT(permissions.BasePermission):
    """
    Permiso estrico JWT que verifica claim 'role': 'doctor' en el token.
    Para endpoints que SOLO doctores con JWT valido pueden acceder.
    """

    message = "Acceso restringido a doctores con token JWT valido."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, "doctor_profile"):
            return True

        return False


class IsPatientUser(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con perfil de paciente.
    """

    def has_permission(self, request, view):
        return hasattr(request.user, "patient_profile")


class IsPatientUserOrReadOnly(permissions.BasePermission):
    """
    Permite lectura a cualquier usuario autenticado.
    Solo pacientes pueden escribir.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, "patient_profile")


def get_client_ip(request):
    """Extraer IP del cliente request"""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def get_user_agent(request):
    """Extraer User Agent del request"""
    return request.META.get("HTTP_USER_AGENT", "")


class IsDoctorOperatorOrReadOnly(permissions.BasePermission):
    """
    Permission personalizada para permitir:
    - Lectura (GET, HEAD, OPTIONS): Cualquier usuario autenticado
    - Escritura (POST, PUT, DELETE): Solo DoctorOperator
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, "doctor_profile")

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, "doctor_profile")


class SmartInstitutionValidator:
    """Validador híbrido mono-médico multi-institución"""

    @staticmethod
    def get_permission_level(
        doctor: DoctorOperator, institution: InstitutionSettings
    ) -> Dict[str, Any]:
        if hasattr(doctor, "institutions"):
            institutions_list = doctor.institutions.all()
        else:
            institutions_list = []

        if institution in institutions_list:
            permission, created = InstitutionPermission.objects.get_or_create(
                user=doctor.user,
                institution=institution,
                defaults={
                    "access_level": "full_access",
                    "is_own_institution": True,
                    "granted_by": doctor.user,
                },
            )

            return {
                "has_access": True,
                "level": "full_access",
                "is_own": True,
                "is_cross": False,
                "can_edit": True,
                "can_generate_pdf": True,
                "can_view_patients": True,
                "expires_at": None,
                "requires_approval": False,
                "permission": permission,
            }

        permission, created = InstitutionPermission.objects.get_or_create(
            user=doctor.user,
            institution=institution,
            defaults={
                "access_level": "emergency_access",
                "is_own_institution": False,
                "granted_by": doctor.user,
                "expires_at": timezone.now() + timedelta(hours=24),
            },
        )

        if permission.expires_at and permission.expires_at < timezone.now():
            permission.expires_at = timezone.now() + timedelta(hours=24)
            permission.save()

        return {
            "has_access": True,
            "level": "emergency_access",
            "is_own": False,
            "is_cross": True,
            "can_edit": False,
            "can_generate_pdf": True,
            "can_view_patients": True,
            "expires_at": permission.expires_at,
            "requires_approval": False,
            "permission": permission,
        }

    @staticmethod
    def log_access(
        doctor: DoctorOperator,
        institution: InstitutionSettings,
        action: str,
        request=None,
    ):
        permission_info = SmartInstitutionValidator.get_permission_level(
            doctor, institution
        )

        permission_obj = permission_info.get("permission")
        if permission_obj:
            permission_obj.last_accessed = timezone.now()
            permission_obj.access_count += 1
            permission_obj.save(update_fields=["last_accessed", "access_count"])

        from .models import AuditLog

        try:
            AuditLog.objects.create(
                user=doctor.user,
                institution=institution,
                action=action,
                access_level=permission_info["level"],
                is_own_institution=permission_info["is_own"],
                is_cross_institution=permission_info["is_cross"],
                ip_address=get_client_ip(request) if request else None,
                user_agent=get_user_agent(request) if request else "",
                timestamp=timezone.now(),
            )
        except Exception:
            logger.info(f"Audit: {doctor.full_name} - {action} - {institution.name}")

        if permission_info.get("is_cross"):
            logger.info(
                f"EMERGENCY ACCESS: Dr {doctor.full_name} accessing {institution.name}"
            )
