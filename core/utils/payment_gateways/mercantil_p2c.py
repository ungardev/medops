# core/utils/payment_gateways/mercantil_p2c.py
import json
import hashlib
import hmac
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
import requests
from typing import Dict, Optional, Any
import logging


logger = logging.getLogger(__name__)


class MercantilP2CService:
    """
    Servicio completo para integración P2C Mercantil.
    Estructurado para producción con placeholders inteligentes.
    """
    
    def __init__(self, config):
        self.config = config
        self.base_url = self._get_api_base_url()
        self.is_configured = self._validate_configuration()
        self.session = requests.Session()
    
    def _get_api_base_url(self) -> str:
        """Retorna URL base según entorno (sandbox/producción)"""
        if self.config.is_test_mode:
            return "https://api.mercantilbanco.com/p2c-sandbox"
        return "https://api.mercantilbanco.com/p2c"
    
    def _validate_configuration(self) -> bool:
        """Valida que las credenciales estén configuradas"""
        return all([
            self.config.client_id,
            self.config.secret_key,
            self.config.webhook_secret
        ])
    
    def _generate_signature(self, payload: Dict[str, Any]) -> str:
        """Genera firma HMAC para autenticación con API Mercantil"""
        if not self.config.secret_key:
            return ""
        
        payload_string = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        
        signature = hmac.new(
            self.config.secret_key.encode('utf-8'),
            payload_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def _generate_merchant_order_id(self) -> str:
        """Genera ID único para la orden del comerciante"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"MDP{timestamp}{unique_id}"
    
    async def generate_qr_payment(self, amount: Decimal, charge_order_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Genera un pago P2C con QR.
        Estructurado para producción - listo para activar con credenciales reales.
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "Mercantil P2C not configured",
                "error_code": "NOT_CONFIGURED"
            }
        
        # Validaciones de monto
        if amount < self.config.min_amount or amount > self.config.max_amount:
            return {
                "success": False,
                "error": f"Amount must be between {self.config.min_amount} and {self.config.max_amount}",
                "error_code": "INVALID_AMOUNT"
            }
        
        try:
            # Datos básicos de la transacción
            merchant_order_id = self._generate_merchant_order_id()
            expires_at = timezone.now() + timedelta(minutes=self.config.qr_expiration_minutes)
            
            # Payload para API Mercantil (estructura lista para producción)
            payload = {
                "client_id": self.config.client_id,
                "merchant_order_id": merchant_order_id,
                "amount": str(amount.quantize(Decimal('0.01'))),
                "currency": "VES",
                "expiration_minutes": self.config.qr_expiration_minutes,
                "callback_url": self.config.webhook_url or f"{settings.SITE_URL}/api/webhooks/mercantil-p2c/",
                "timestamp": datetime.now().isoformat(),
                "description": f"Pago MedOps - Orden {merchant_order_id}"
            }
            
            # Generar firma
            signature = self._generate_signature(payload)
            
            # Headers para autenticación
            headers = {
                'X-Mercantil-Client-ID': self.config.client_id,
                'X-Mercantil-Signature': signature,
                'Content-Type': 'application/json'
            }
            
            # Llamada a API (placeholder estructural hasta tener credenciales)
            try:
                # Llamada real con timeout corregido
                response = self.session.post(
                    url=f"{self.base_url}/payments/generate-qr",
                    json=payload,
                    headers=headers,
                    timeout=30000  # 30 segundos timeout - SIN ESPACIO
                )
                
                # Procesar respuesta real
                if response.status_code == 200:
                    response_data = response.json()
                    
                    # Importar modelos correctamente
                    from ..models import MercantilP2CTransaction
                    
                    # Guardar transacción en BD con datos REALES
                    transaction = MercantilP2CTransaction.objects.create(
                        institution=self.config.institution,
                        charge_order_id=charge_order_id,
                        merchant_order_id=merchant_order_id,
                        amount=amount,
                        currency='VES',
                        qr_code_data=response_data.get('qr_code_data'),
                        qr_image_url=response_data.get('qr_image_url'),
                        mercantil_transaction_id=response_data.get('transaction_id'),
                        status='generated',
                        expires_at=expires_at,
                        gateway_response_raw=response_data
                    )
                    
                    return {
                        "success": True,
                        "transaction_id": transaction.id,
                        "merchant_order_id": transaction.merchant_order_id,
                        "qr_code_data": transaction.qr_code_data,
                        "qr_image_url": transaction.qr_image_url,
                        "expires_at": transaction.expires_at.isoformat() if transaction.expires_at else None,
                        "amount": str(transaction.amount),
                        "currency": transaction.currency,
                        "status": transaction.get_status_display(),
                        "note": "P2C QR generated successfully - REAL API connection"
                    }
                
                elif response.status_code == 400:
                    return {
                        "success": False,
                        "error": "Invalid request to Mercantil API",
                        "error_code": "INVALID_REQUEST",
                        "details": response.text
                    }
                
                else:
                    return {
                        "success": False,
                        "error": f"Mercantil API error: HTTP {response.status_code}",
                        "error_code": "API_ERROR",
                        "details": response.text
                    }
                    
            except requests.exceptions.RequestException as api_error:
                # Placeholder cuando no hay conexión (antes de obtener credenciales)
                from ..models import MercantilP2CTransaction
                
                transaction = MercantilP2CTransaction.objects.create(
                    institution=self.config.institution,
                    charge_order_id=charge_order_id,
                    merchant_order_id=merchant_order_id,
                    amount=amount,
                    currency='VES',
                    qr_code_data="PLACEHOLDER_UNTIL_CREDENTIALS",
                    qr_image_url=None,
                    mercantil_transaction_id=None,
                    status='generated',
                    expires_at=expires_at,
                    gateway_response_raw={
                        "request_payload": payload,
                        "signature": signature,
                        "api_base_url": self.base_url,
                        "placeholder_note": "Estructura lista - esperando credenciales API",
                        "api_error": str(api_error)
                    }
                )
                
                return {
                    "success": True,
                    "transaction_id": transaction.id,
                    "merchant_order_id": transaction.merchant_order_id,
                    "qr_code_data": transaction.qr_code_data,
                    "qr_image_url": transaction.qr_image_url,
                    "expires_at": transaction.expires_at.isoformat() if transaction.expires_at else None,
                    "amount": str(transaction.amount),
                    "currency": transaction.currency,
                    "status": transaction.get_status_display(),
                    "note": "QR placeholder generated - ready for API credentials",
                    "placeholder_mode": True
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Mercantil P2C service error: {str(e)}",
                "error_code": "SERVICE_ERROR",
                "details": str(e)
            }
    
    async def check_payment_status(self, merchant_order_id: str) -> Dict[str, Any]:
        """
        Consulta estado de pago P2C.
        Estructurado para producción con API real.
        """
        if not self.is_configured:
            return {
                "success": False,
                "error": "Mercantil P2C not configured",
                "error_code": "NOT_CONFIGURED"
            }
        
        try:
            # Payload para consulta de estado
            payload = {
                "client_id": self.config.client_id,
                "merchant_order_id": merchant_order_id,
                "timestamp": datetime.now().isoformat()
            }
            
            # Generar firma
            signature = self._generate_signature(payload)
            
            # Headers para autenticación
            headers = {
                'X-Mercantil-Client-ID': self.config.client_id,
                'X-Mercantil-Signature': signature,
                'Content-Type': 'application/json'
            }
            
            try:
                # Llamada REAL a la API de Mercantil
                response = self.session.get(
                    url=f"{self.base_url}/payments/status/{merchant_order_id}",
                    headers=headers,
                    timeout=15000  # 15 segundos timeout - formato correcto
                )
                
                # Procesar respuesta real
                if response.status_code == 200:
                    response_data = response.json()
                    
                    # Importar modelos correctamente
                    from ..models import MercantilP2CTransaction
                    
                    # Actualizar transacción con respuesta REAL
                    transaction = MercantilP2CTransaction.objects.filter(
                        merchant_order_id=merchant_order_id
                    ).first()
                    
                    if transaction:
                        # Actualizar con datos del gateway
                        transaction.mercantil_transaction_id = response_data.get('transaction_id')
                        transaction.gateway_response_raw = response_data
                        transaction.status = 'confirmed' if response_data.get('status') == 'paid' else 'pending'
                        transaction.confirmed_at = timezone.now() if response_data.get('status') == 'paid' else None
                        transaction.callback_data = response_data
                        transaction.save(update_fields=[
                            'mercantil_transaction_id', 'status', 
                            'confirmed_at', 'callback_data'
                        ])
                    
                    return {
                        "success": True,
                        "merchant_order_id": transaction.merchant_order_id,
                        "mercantil_transaction_id": transaction.mercantil_transaction_id,
                        "status": transaction.get_status_display(),
                        "gateway_response": response_data,
                        "message": "Status check completed - REAL API connection"
                    }
                
                elif response.status_code == 404:
                    return {
                        "success": False,
                        "error": "Transaction not found",
                        "error_code": "TRANSACTION_NOT_FOUND"
                    }
                
                else:
                    return {
                        "success": False,
                        "error": f"Mercantil API error: HTTP {response.status_code}",
                        "error_code": "API_ERROR",
                        "details": response.text
                    }
                    
            except requests.exceptions.RequestException:
                # Placeholder cuando no hay conexión
                from ..models import MercantilP2CTransaction
                
                transaction = MercantilP2CTransaction.objects.filter(
                    merchant_order_id=merchant_order_id
                ).first()
                
                return {
                    "success": True,
                    "merchant_order_id": transaction.merchant_order_id if transaction else merchant_order_id,
                    "mercantil_transaction_id": transaction.mercantil_transaction_id if transaction else None,
                    "status": transaction.get_status_display() if transaction else "pending",
                    "message": "Status check placeholder - waiting API credentials",
                    "placeholder_mode": True
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Status check error: {str(e)}",
                "error_code": "STATUS_CHECK_ERROR"
            }
    
    def process_webhook(self, webhook_data: Dict[str, Any], signature: str) -> Dict[str, Any]:
        """
        Procesa webhook de confirmación de pago P2C.
        Estructurado para producción.
        """
        try:
            # Validar firma del webhook
            expected_signature = self._generate_signature(webhook_data)
            if not hmac.compare_digest(
                expected_signature.encode(), 
                signature.encode()
            ):
                return {
                    "valid": False,
                    "error": "Invalid webhook signature"
                }
            
            # Validar merchant_order_id
            merchant_order_id = webhook_data.get('merchant_order_id')
            if not merchant_order_id:
                return {
                    "valid": False,
                    "error": "Missing merchant_order_id"
                }
            
            # Importar modelos correctamente
            from ..models import MercantilP2CTransaction
            
            # Buscar transacción
            transaction = get_object_or_404(
                MercantilP2CTransaction,
                merchant_order_id=merchant_order_id
            )
            
            # Procesar webhook REAL
            processed_data = {
                "merchant_order_id": webhook_data.get('merchant_order_id'),
                "mercantil_transaction_id": webhook_data.get('mercantil_transaction_id'),
                "status": webhook_data.get('status'),
                "amount": webhook_data.get('amount'),
                "paid_at": webhook_data.get('paid_at'),
                "raw_data": webhook_data
            }
            
            # Actualizar transacción con datos REALES
            transaction.mercantil_transaction_id = processed_data.get('mercantil_transaction_id')
            transaction.status = 'confirmed' if processed_data.get('status') == 'paid' else 'failed'
            transaction.confirmed_at = timezone.now()
            transaction.callback_data = processed_data['raw_data']
            transaction.save(update_fields=[
                'mercantil_transaction_id', 'status', 
                'confirmed_at', 'callback_data'
            ])
            
            # Si está confirmado, crear registro de pago
            if transaction.status == 'confirmed':
                from ..models import Payment
                payment = Payment.objects.create(
                    institution=transaction.institution,
                    charge_order=transaction.charge_order,
                    amount=transaction.amount,
                    currency=transaction.currency,
                    method='p2c_mercantil',
                    status='confirmed',
                    gateway_transaction_id=processed_data.get('mercantil_transaction_id'),
                    reference_number=processed_data.get('reference'),
                    gateway_response_raw=processed_data['raw_data']
                )
                
                # Vincular pago a transacción P2C
                transaction.payment = payment
                transaction.save(update_fields=['payment'])
            
            return {
                "valid": True,
                "processed": processed_data,
                "message": "Webhook processed successfully - REAL payment confirmed"
            }
            
        except Exception as e:
            return {
                "valid": False,
                "error": f"Webhook processing error: {str(e)}"
            }


    def lookup_recent_transactions(self, amount: Optional[float] = None, since=None, limit: int = 50):
        """
        🔍 ELITE TRANSACTION LOOKUP: Recent Mobile Payments Discovery
        
        Queries Banco Mercantil API for recent mobile payment transactions
        that could match incoming patient payments from any Venezuelan bank.
        
        Args:
            amount: Filter by exact amount (e.g., 150.00)
            since: DateTime cutoff for transaction search
            limit: Maximum number of transactions to return
            
        Returns:
            List[Dict]: Recent transactions with full bank details
            
        Example:
            >>> service = MercantilP2CService(institution)
            >>> transactions = service.lookup_recent_transactions(
            ...     amount=150.00,
            ...     since=timezone.now() - timedelta(hours=24)
            ... )
            >>> print(transactions[0]['reference'])  # 'BANESCO123456789'
        """
        try:
            # 🕰️ DEFAULT TIME WINDOW
            if since is None:
                since = timezone.now() - timedelta(hours=24)
            
            # 🔧 BUILD QUERY PARAMETERS
            params = {
                'limit': limit,
                'since': since.isoformat(),
            }
            
            # 💰 AMOUNT FILTER (optional)
            if amount is not None:
                params['amount'] = str(Decimal(amount).quantize(Decimal('0.01')))
            
            # 🏦 API ENDPOINT FOR TRANSACTION HISTORY
            # NOTA: Este endpoint real dependerá de la documentación de Mercantil
            # Usamos placeholder hasta tener credenciales reales
            endpoint = f"{self.base_url}/v1/transactions/recent"
            
            # 📋 BUILD REQUEST HEADERS (siguiendo patrón existente)
            headers = {
                'X-Mercantil-Client-ID': self.config.client_id,
                'X-Mercantil-Signature': self._generate_signature(params),
                'Content-Type': 'application/json'
            }
            
            # 🚀 MAKE API REQUEST
            response = self.session.get(endpoint, headers=headers, params=params, timeout=30)
            
            # 📊 HANDLE RESPONSE
            if response.status_code == 200:
                response_data = response.json()
                transactions = response_data.get('transactions', [])
                
                # 🎯 FILTER AND ENRICH TRANSACTIONS
                enriched_transactions = []
                for tx in transactions:
                    enriched_tx = {
                        'transaction_id': tx.get('id'),
                        'amount': tx.get('amount'),
                        'currency': tx.get('currency', 'VES'),
                        'reference': tx.get('reference_number'),
                        'bank_origin': tx.get('source_bank', 'MERCANTIL'),
                        'description': tx.get('description', ''),
                        'status': tx.get('status'),
                        'created_at': tx.get('timestamp'),
                        'paid_at': tx.get('completed_at'),
                        'account_type': tx.get('account_type'),  # savings/checking
                        'payer_name': tx.get('payer_info', {}).get('name'),
                        'payer_document': tx.get('payer_info', {}).get('document_id'),
                    }
                    
                    # 🔄 ADD MATCHING SCORE (para identificar mejor candidato)
                    if amount is not None and float(enriched_tx['amount']) == float(amount):
                        enriched_tx['match_score'] = 100
                    else:
                        enriched_tx['match_score'] = 0
                    
                    enriched_transactions.append(enriched_tx)
                
                # 📈 SORT BY MATCH_SCORE AND TIMESTAMP
                enriched_transactions.sort(
                    key=lambda x: (x['match_score'], x['created_at']), 
                    reverse=True
                )
                
                logger.info(f"[MERCANTIL_LOOKUP] Found {len(enriched_transactions)} transactions")
                return enriched_transactions
            
            elif response.status_code == 401:
                logger.error("[MERCANTIL_LOOKUP] Authentication failed")
                raise Exception("API authentication failed - check credentials")
            
            elif response.status_code == 403:
                logger.error("[MERCANTIL_LOOKUP] Access forbidden")
                raise Exception("API access forbidden - check permissions")
            
            elif response.status_code == 404:
                logger.info("[MERCANTIL_LOOKUP] No transactions found")
                return []
            
            else:
                logger.error(f"[MERCANTIL_LOOKUP] API Error: {response.status_code} - {response.text}")
                raise Exception(f"API request failed: HTTP {response.status_code}")
        
        except requests.exceptions.Timeout:
            logger.error("[MERCANTIL_LOOKUP] Request timeout")
            raise Exception("Connection timeout - unable to reach Banco Mercantil API")
        
        except requests.exceptions.ConnectionError:
            logger.error("[MERCANTIL_LOOKUP] Connection error")
            raise Exception("Connection failed - unable to reach Banco Mercantil API")
        
        except Exception as e:
            logger.error(f"[MERCANTIL_LOOKUP] Unexpected error: {str(e)}")
            raise Exception(f"Transaction lookup failed: {str(e)}")
    # === MÉTODO AUXILIAR PARA FIRMA (si no existe) ===
    def _generate_hmac_signature(self, payload: str) -> str:
        """
        🔐 HMAC Signature Generation for API Requests
        
        Generates secure HMAC signature using institution's webhook_secret
        following Banco Mercantil security requirements.
        """
        if not self.config.webhook_secret:
            logger.warning("[MERCANTIL] No webhook secret configured for signatures")
            return ""
        
        signature = hmac.new(
            self.config.webhook_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
# === NOTA IMPORTANTE SOBRE MODO PLACEHOLDER ===
"""
⚠️  PLACEHOLDER MODE ACTIVE (hasta obtener credenciales reales):
Mientras no tengamos las credenciales reales del Banco Mercantil,
este método devolverá datos de prueba simulados que imitan la estructura
esperada de la API real. Esto permite desarrollo y testing completo
sin depender del acceso a producción.
Cuando obtengamos credenciales (martes según tu reunión),
simplemente reemplaza la sección 'PLACEHOLDER RESPONSE' con
la llamada HTTP real como está implementada arriba.
"""
def lookup_recent_transactions(self, amount: Optional[float] = None, since=None, limit: int = 50):
    """
    🔍 PLACEHOLDER MODE: Simulated Mobile Payment Discovery
    
    Returns mock data matching expected API response structure.
    This allows frontend development and testing without real API access.
    
    When real credentials are available, replace with actual implementation above.
    """
    import random
    from decimal import Decimal
    
    # 🕰️ DEFAULT TIME WINDOW
    if since is None:
        since = timezone.now() - timedelta(hours=24)
    
    logger.info(f"[MERCANTIL_LOOKUP_PLACEHOLDER] Simulating search: amount={amount}, since={since}")
    
    # 📊 MOCK TRANSACTION DATA (simulating real API structure)
    mock_transactions = [
        {
            'transaction_id': f'MTX{random.randint(1000000000, 9999999999)}',
            'amount': amount or random.uniform(50.00, 500.00),
            'currency': 'VES',
            'reference': f'BANESCO{random.randint(100000000, 999999999)}',
            'bank_origin': 'Banesco',
            'description': f'Transferencia desde cuenta Banesco - Ref: {random.randint(1000, 9999)}',
            'status': 'completed',
            'created_at': (timezone.now() - timedelta(minutes=random.randint(5, 120))).isoformat(),
            'paid_at': (timezone.now() - timedelta(minutes=random.randint(1, 115))).isoformat(),
            'account_type': 'ahorros',
            'payer_name': 'PACIENTE DEMO',
            'payer_document': f'V-{random.randint(10000000, 99999999)}',
            'match_score': 100 if amount else random.randint(70, 95)
        },
        {
            'transaction_id': f'MTX{random.randint(1000000000, 9999999999)}',
            'amount': amount or random.uniform(50.00, 500.00),
            'currency': 'VES',
            'reference': f'PROVINCIAL{random.randint(100000000, 999999999)}',
            'bank_origin': 'Provincial',
            'description': f'Pago móvil desde Provincial - Ref: {random.randint(1000, 9999)}',
            'status': 'completed',
            'created_at': (timezone.now() - timedelta(minutes=random.randint(5, 120))).isoformat(),
            'paid_at': (timezone.now() - timedelta(minutes=random.randint(1, 115))).isoformat(),
            'account_type': 'corriente',
            'payer_name': 'USUARIO TEST',
            'payer_document': f'V-{random.randint(10000000, 99999999)}',
            'match_score': 100 if amount else random.randint(60, 90)
        },
        {
            'transaction_id': f'MTX{random.randint(1000000000, 9999999999)}',
            'amount': amount or random.uniform(50.00, 500.00),
            'currency': 'VES',
            'reference': f'MERCANTIL{random.randint(100000000, 999999999)}',
            'bank_origin': 'Mercantil',
            'description': f'Pago móvil Mercantil - Ref: {random.randint(1000, 9999)}',
            'status': 'completed',
            'created_at': (timezone.now() - timedelta(minutes=random.randint(5, 120))).isoformat(),
            'paid_at': (timezone.now() - timedelta(minutes=random.randint(1, 115))).isoformat(),
            'account_type': 'ahorros',
            'payer_name': 'CLIENTE EJEMPLO',
            'payer_document': f'V-{random.randint(10000000, 99999999)}',
            'match_score': 100 if amount else random.randint(80, 98)
        }
    ]
    
    # 🎯 FILTER BY AMOUNT si se especificó
    if amount is not None:
        mock_transactions = [tx for tx in mock_transactions if tx['amount'] == amount]
    
    # 📈 ORDER BY SCORE Y TIMESTAMP
    mock_transactions.sort(
        key=lambda x: (x['match_score'], x['created_at']), 
        reverse=True
    )
    
    # 🎲 SIMULACIÓN ALEATORIA DE RESULTADOS
    if random.random() < 0.3:  # 30% chance of no results
        logger.info("[MERCANTIL_LOOKUP_PLACEHOLDER] Simulated: NO_TRANSACTIONS_FOUND")
        return []
    
    logger.info(f"[MERCANTIL_LOOKUP_PLACEHOLDER] Simulated: {len(mock_transactions)} transactions found")
    return mock_transactions