import logging
import time
from datetime import datetime, timedelta
from typing import Optional
from django.core.cache import cache

logger = logging.getLogger(__name__)


class BancaribeOAuth2Service:
    """
    Gestiona OAuth2 tokens para la API de Bancaribe.
    Implementa caché de tokens y refresh automático.
    """

    CACHE_KEY_ACCESS_TOKEN = "bancaribe_access_token"
    CACHE_KEY_TOKEN_EXPIRY = "bancaribe_token_expiry"
    CACHE_KEY_REFRESH_TOKEN = "bancaribe_refresh_token"

    def __init__(self, client_id: str, client_secret: str, is_test_mode: bool = True):
        self.client_id = client_id
        self.client_secret = client_secret
        self.is_test_mode = is_test_mode
        self.base_url = (
            "https://sandbox.bancaribe.com.ve"
            if is_test_mode
            else "https://api.bancaribe.com.ve"
        )

    def get_access_token(self, force_refresh: bool = False) -> Optional[str]:
        """
        Obtiene access token válido, usando caché si está disponible.
        """
        if not force_refresh:
            cached_token = cache.get(self.CACHE_KEY_ACCESS_TOKEN)
            cached_expiry = cache.get(self.CACHE_KEY_TOKEN_EXPIRY)
            if cached_token and cached_expiry:
                if datetime.now() < cached_expiry:
                    return cached_token

        return self._request_new_token()

    def _request_new_token(self) -> Optional[str]:
        """
        Solicita nuevo token al servidor OAuth2 de Bancaribe.
        """
        import requests

        url = f"{self.base_url}/api/v1/oauth/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        try:
            response = requests.post(url, data=data, timeout=30)
            response.raise_for_status()
            token_data = response.json()

            access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)

            if access_token:
                expiry = datetime.now() + timedelta(seconds=expires_in - 60)
                cache.set(
                    self.CACHE_KEY_ACCESS_TOKEN, access_token, timeout=expires_in - 120
                )
                cache.set(self.CACHE_KEY_TOKEN_EXPIRY, expiry, timeout=expires_in - 120)
                logger.info("Bancaribe OAuth2: Nuevo token obtenido exitosamente")
                return access_token

        except requests.RequestException as e:
            logger.error(f"Bancaribe OAuth2: Error obteniendo token: {e}")
        except Exception as e:
            logger.error(f"Bancaribe OAuth2: Error inesperado: {e}")

        return None

    def revoke_token(self) -> bool:
        """
        Revoca el token actual.
        """
        import requests

        access_token = cache.get(self.CACHE_KEY_ACCESS_TOKEN)
        if not access_token:
            return True

        url = f"{self.base_url}/api/v1/oauth/revoke"
        data = {
            "token": access_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        try:
            response = requests.post(url, data=data, timeout=30)
            cache.delete(self.CACHE_KEY_ACCESS_TOKEN)
            cache.delete(self.CACHE_KEY_TOKEN_EXPIRY)
            return response.status_code in (200, 204)
        except requests.RequestException as e:
            logger.error(f"Bancaribe OAuth2: Error revocando token: {e}")
            return False

    def get_auth_headers(self, force_refresh: bool = False) -> dict:
        """
        Retorna headers de autenticación listos para usar en requests.
        """
        token = self.get_access_token(force_refresh=force_refresh)
        if token:
            return {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }
        return {}

    def is_token_valid(self) -> bool:
        """
        Verifica si el token actual es válido.
        """
        token = cache.get(self.CACHE_KEY_ACCESS_TOKEN)
        expiry = cache.get(self.CACHE_KEY_TOKEN_EXPIRY)
        return token is not None and expiry is not None and datetime.now() < expiry
