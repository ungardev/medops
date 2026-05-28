import logging
import hashlib
import hmac
import time
import uuid
from typing import Optional
import requests

from .constants import BANCARIBE_ENDPOINTS, BANCARIBE_STATUS_CODES, BANCARIBE_BANKS

logger = logging.getLogger(__name__)


class BancaribeClient:
    """
    Cliente para la API de Bancaribe.
    Maneja autenticación, requests y parsing de respuestas.
    """

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        webhook_secret: Optional[str] = None,
        is_test_mode: bool = True,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.webhook_secret = webhook_secret
        self.is_test_mode = is_test_mode
        self.base_url = (
            "https://sandbox.bancaribe.com.ve"
            if is_test_mode
            else "https://api.bancaribe.com.ve"
        )

        from .oauth2 import BancaribeOAuth2Service

        self.oauth2 = BancaribeOAuth2Service(client_id, client_secret, is_test_mode)

    def _generate_reference(self, prefix: str = "") -> str:
        """
        Genera reference única para transacciones.
        Formato: PREFIX + timestamp + uuid parcial
        """
        timestamp = int(time.time())
        unique_id = uuid.uuid4().hex[:8].upper()
        return f"{prefix}{timestamp}{unique_id}"

    def _sign_payload(self, payload: dict) -> str:
        """
        Genera signature HMAC para webhook verification.
        """
        if not self.webhook_secret:
            return ""
        message = str(payload)
        signature = hmac.new(
            self.webhook_secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()
        return signature

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
        authenticated: bool = True,
    ) -> dict:
        """
        Hace request a la API de Bancaribe.
        """
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}

        if authenticated:
            auth_headers = self.oauth2.get_auth_headers()
            headers.update(auth_headers)

        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=data, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            else:
                raise ValueError(f"HTTP method {method} not supported")

            response.raise_for_status()
            return response.json() if response.content else {}

        except requests.RequestException as e:
            logger.error(f"Bancaribe API error [{method} {endpoint}]: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Bancaribe unexpected error: {e}")
            return {"success": False, "error": str(e)}

    def verify_webhook_signature(self, payload: dict, signature: str) -> bool:
        """
        Verifica que el webhook viene de Bancaribe.
        """
        if not self.webhook_secret:
            return False
        expected = self._sign_payload(payload)
        return hmac.compare_digest(expected, signature)

    def pago_movil_c2p(
        self,
        phone: str,
        national_id: str,
        bank_code: str,
        amount: float,
        reference: str,
        concept: str = "Vuelto MEDOPZ",
    ) -> dict:
        """
        API #2: Pago Móvil C2P - Para enviar vueltos a pacientes.
        """
        endpoint = BANCARIBE_ENDPOINTS["pago_movil_c2p"]

        payload = {
            "telefono": phone,
            "cedula": national_id,
            "banco": bank_code,
            "monto": amount,
            "referencia": reference,
            "concepto": concept,
            "fecha": time.strftime("%Y-%m-%d"),
        }

        result = self._make_request("POST", endpoint, data=payload)

        if result.get("success") is False:
            return result

        return {
            "success": True,
            "reference": reference,
            "status": result.get("status", "pending"),
            "bancaribe_reference": result.get("referencia_bancaribe"),
            "raw_response": result,
        }

    def transferencia(
        self,
        source_account: str,
        dest_bank_code: str,
        dest_account: str,
        amount: float,
        reference: str,
        concept: str = "Pago MEDOPZ",
    ) -> dict:
        """
        API #4: Transferencias - Para pagar a doctores.
        """
        endpoint = BANCARIBE_ENDPOINTS["transferencias"]

        payload = {
            "cuenta_origen": source_account,
            "banco_destino": dest_bank_code,
            "cuenta_destino": dest_account,
            "monto": amount,
            "referencia": reference,
            "concepto": concept,
        }

        result = self._make_request("POST", endpoint, data=payload)

        if result.get("success") is False:
            return result

        return {
            "success": True,
            "reference": reference,
            "status": result.get("status", "pending"),
            "bancaribe_reference": result.get("referencia_bancaribe"),
            "raw_response": result,
        }

    def consulta_operaciones(
        self,
        reference: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> dict:
        """
        API #9: Consulta Operaciones - Para verificar Pago Móvil.
        """
        endpoint = BANCARIBE_ENDPOINTS["consulta_operaciones"]

        params = {}
        if reference:
            params["referencia"] = reference
        if date_from:
            params["fecha_desde"] = date_from
        if date_to:
            params["fecha_hasta"] = date_to

        result = self._make_request("GET", endpoint, data=params)

        if result.get("success") is False:
            return result

        return {
            "success": True,
            "operations": result.get("operaciones", []),
            "raw_response": result,
        }

    def consulta_ops_plus(
        self,
        reference: str,
    ) -> dict:
        """
        API #10: Consulta Ops Plus - Verificación avanzada.
        """
        endpoint = BANCARIBE_ENDPOINTS["consulta_ops_plus"]
        endpoint = endpoint.format(reference=reference)

        result = self._make_request("GET", endpoint)

        if result.get("success") is False:
            return result

        return {
            "success": True,
            "operation": result,
            "raw_response": result,
        }

    def register_webhook(self, webhook_url: str, events: list) -> dict:
        """
        API #3: Registra webhook para notificaciones.
        """
        endpoint = BANCARIBE_ENDPOINTS["webhook_register"]

        payload = {
            "url": webhook_url,
            "eventos": events,
        }

        result = self._make_request("POST", endpoint, data=payload)

        if result.get("success") is False:
            return result

        return {
            "success": True,
            "webhook_id": result.get("id"),
            "raw_response": result,
        }

    def get_transaction_status(self, reference: str) -> dict:
        """
        Consulta estatus de una transacción.
        """
        endpoint = BANCARIBE_ENDPOINTS["transferencia_estatus"]
        endpoint = endpoint.format(reference=reference)

        result = self._make_request("GET", endpoint)

        if result.get("success") is False:
            return result

        status_code = result.get("status", "10")
        status_text = BANCARIBE_STATUS_CODES.get(status_code, "DESCONOCIDO")

        return {
            "success": True,
            "reference": reference,
            "status_code": status_code,
            "status_text": status_text,
            "raw_response": result,
        }
