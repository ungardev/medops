# core/middleware.py (completo corregido)
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest, JsonResponse
from .permissions import SmartInstitutionValidator
from .models import InstitutionSettings, DoctorOperator
import jwt
import logging

logger = logging.getLogger(__name__)


class JWTRoleValidationMiddleware(MiddlewareMixin):
    """
    Middleware de VALIDACION DE ROL JWT.

    Para rutas protegidas, verifica que el token JWT contenga el rol correcto:
    - /api/doctor/* → role: 'doctor'
    - /api/patient/* → role: 'patient'

    IMPORTANTE: Este middleware es DEFENSA EN PROFUNDIDAD.
    No reemplaza los permisos DRF, pero evita que tokens maliciosos
    lleguen a los view's si no tienen el rol correcto.
    """

    DOCTOR_PATHS = ["/api/doctor/", "/api/auth/doctor-"]
    PATIENT_PATHS = ["/api/patient/", "/api/patient-auth/"]

    def process_request(self, request: HttpRequest):
        path = request.path

        for doctor_path in self.DOCTOR_PATHS:
            if path.startswith(doctor_path):
                return self._validate_doctor_role(request)

        for patient_path in self.PATIENT_PATHS:
            if path.startswith(patient_path):
                return self._validate_patient_role(request)

        return None

    def _validate_doctor_role(self, request: HttpRequest):
        """Valida que el token sea de un doctor."""
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:]

        try:
            from django.conf import settings

            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

            if payload.get("role") != "doctor":
                logger.warning(
                    f"Intento de acceso doctor con token de role: {payload.get('role')}"
                )
                return JsonResponse(
                    {"error": "Token no tiene permisos de doctor"}, status=403
                )

            request.jwt_payload = payload

        except jwt.ExpiredSignatureError:
            return JsonResponse({"error": "Token expirado"}, status=401)
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token JWT invalido: {e}")
            return JsonResponse({"error": "Token invalido"}, status=401)

        return None

    def _validate_patient_role(self, request: HttpRequest):
        """Valida que el token sea de un paciente."""
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:]

        try:
            from django.conf import settings

            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

            if payload.get("role") != "patient":
                logger.warning(
                    f"Intento de acceso paciente con token de role: {payload.get('role')}"
                )
                return JsonResponse(
                    {"error": "Token no tiene permisos de paciente"}, status=403
                )

            request.jwt_payload = payload

        except jwt.ExpiredSignatureError:
            return JsonResponse({"error": "Token expirado"}, status=401)
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token JWT invalido: {e}")
            return JsonResponse({"error": "Token invalido"}, status=401)

        return None


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
                doctor = getattr(request.user, "doctor_profile", None)
                if doctor:
                    permission_info = SmartInstitutionValidator.get_permission_level(
                        doctor, institution
                    )

                    request.institution_permission = permission_info

                    # Logging automático para ciertas acciones
                    if request.method in ["POST", "PUT", "PATCH"]:
                        SmartInstitutionValidator.log_access(
                            doctor,
                            institution,
                            f"{request.method} {request.path}",
                            request,
                        )

        except InstitutionSettings.DoesNotExist:
            request.current_institution = None
            request.institution_permission = None
        except Exception as e:
            logger.warning(
                f"Database error in InstitutionPermissionMiddleware: {str(e)}"
            )
            request.current_institution = None
            request.institution_permission = None

        return None

    def _extract_institution_id(self, request: HttpRequest):
        """Extraer ID de institución de header o doctor activo"""
        # 1. Header (prioridad)
        if "HTTP_X_INSTITUTION_ID" in request.META:
            return request.META["HTTP_X_INSTITUTION_ID"]

        # 2. Doctor activo (fallback)
        if request.user.is_authenticated:
            doctor = getattr(request.user, "doctor_profile", None)
            if doctor and doctor.active_institution:
                return doctor.active_institution.id

        return None
