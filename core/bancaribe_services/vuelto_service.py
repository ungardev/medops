import logging
import secrets
import random
from decimal import Decimal
from datetime import timedelta
from typing import Optional
from django.utils import timezone

logger = logging.getLogger(__name__)


class VueltoService:
    """
    Servicio para gestionar vueltos (reembolsos) a pacientes via Bancaribe API #2.
    """

    OTP_LENGTH = 6
    OTP_VALIDITY_MINUTES = 30

    def create_vuelto_request(
        self,
        payment_transaction,
        amount: Decimal,
        patient_phone: str,
        patient_national_id: str,
        patient_bank_code: str,
        currency: str = "VES",
    ) -> dict:
        """
        Crea una solicitud de vuelto y envía OTP al paciente.
        """
        from core.models import VueltoRequest, PaymentTransaction
        from core.utils.bancaribe.client import BancaribeClient
        from core.models import BancaribeAPIConfig

        try:
            transaction = PaymentTransaction.objects.filter(
                id=payment_transaction
            ).first()
            if not transaction:
                return {"success": False, "error": "Transacción no encontrada"}

            if transaction.status != "confirmed":
                return {
                    "success": False,
                    "error": "Solo se pueden hacer vueltos de transacciones confirmadas",
                }

            otp_code = self._generate_otp()
            expires_at = timezone.now() + timedelta(minutes=self.OTP_VALIDITY_MINUTES)

            vuelto = VueltoRequest.objects.create(
                payment_transaction=transaction,
                amount=amount,
                currency=currency,
                patient_phone=patient_phone,
                patient_national_id=patient_national_id,
                patient_bank_code=patient_bank_code,
                otp_code=otp_code,
                otp_sent_at=timezone.now(),
                otp_expires_at=expires_at,
                status="pending",
            )

            sms_sent = self._send_otp_sms(patient_phone, otp_code)

            if not sms_sent:
                logger.warning(f"Failed to send OTP SMS for vuelto {vuelto.reference}")

            return {
                "success": True,
                "vuelto_id": vuelto.id,
                "reference": vuelto.reference,
                "otp_expires_at": expires_at.isoformat(),
                "sms_sent": sms_sent,
                "message": "Vuelto request created. OTP sent to patient.",
            }

        except Exception as e:
            logger.error(f"Error creating vuelto request: {e}")
            return {"success": False, "error": str(e)}

    def verify_otp_and_send_vuelto(self, vuelto_id: int, otp_code: str) -> dict:
        """
        Verifica OTP y ejecuta el Pago Móvil C2P via Bancaribe.
        """
        from core.models import VueltoRequest, BancaribeAPIConfig
        from core.utils.bancaribe.client import BancaribeClient

        try:
            vuelto = VueltoRequest.objects.filter(id=vuelto_id).first()
            if not vuelto:
                return {"success": False, "error": "Vuelto request no encontrado"}

            if vuelto.otp_verified:
                return {"success": False, "error": "OTP ya verificado"}

            if timezone.now() > vuelto.otp_expires_at:
                return {"success": False, "error": "OTP expirado"}

            if vuelto.otp_code != otp_code:
                return {"success": False, "error": "OTP inválido"}

            config = BancaribeAPIConfig.objects.filter(is_active=True).first()
            if not config:
                return {"success": False, "error": "Bancaribe no configurado"}

            client = BancaribeClient(
                client_id=config.client_id,
                client_secret=config.client_secret,
                is_test_mode=config.is_test_mode,
            )

            reference = f"VUELTO-{vuelto.reference}"
            result = client.pago_movil_c2p(
                phone=vuelto.patient_phone,
                national_id=vuelto.patient_national_id,
                bank_code=vuelto.patient_bank_code,
                amount=float(vuelto.amount),
                reference=reference,
                concept="Reembolso MEDOPZ",
            )

            if result.get("success"):
                vuelto.otp_verified = True
                vuelto.status = "sent"
                vuelto.bancaribe_reference = result.get("bancaribe_reference", "")
                vuelto.raw_response = result.get("raw_response", {})
                vuelto.save()

                return {
                    "success": True,
                    "reference": vuelto.reference,
                    "bancaribe_reference": result.get("bancaribe_reference"),
                    "status": "sent",
                    "message": "Vuelto enviado exitosamente",
                }
            else:
                vuelto.status = "failed"
                vuelto.error_message = result.get("error", "Error en API Bancaribe")
                vuelto.raw_response = result
                vuelto.save()

                return {
                    "success": False,
                    "error": result.get("error"),
                    "vuelto_id": vuelto.id,
                }

        except Exception as e:
            logger.error(f"Error verifying OTP and sending vuelto: {e}")
            return {"success": False, "error": str(e)}

    def resend_otp(self, vuelto_id: int) -> dict:
        """
        Reenvía OTP a paciente.
        """
        from core.models import VueltoRequest

        try:
            vuelto = VueltoRequest.objects.filter(
                id=vuelto_id, status="pending"
            ).first()
            if not vuelto:
                return {
                    "success": False,
                    "error": "Vuelto request no encontrado o no pendiente",
                }

            if vuelto.otp_verified:
                return {"success": False, "error": "OTP ya verificado"}

            new_otp = self._generate_otp()
            expires_at = timezone.now() + timedelta(minutes=self.OTP_VALIDITY_MINUTES)

            vuelto.otp_code = new_otp
            vuelto.otp_sent_at = timezone.now()
            vuelto.otp_expires_at = expires_at
            vuelto.save()

            sms_sent = self._send_otp_sms(vuelto.patient_phone, new_otp)

            return {
                "success": True,
                "otp_expires_at": expires_at.isoformat(),
                "sms_sent": sms_sent,
            }

        except Exception as e:
            logger.error(f"Error resending OTP: {e}")
            return {"success": False, "error": str(e)}

    def cancel_vuelto(self, vuelto_id: int) -> dict:
        """
        Cancela una solicitud de vuelto pendiente.
        """
        from core.models import VueltoRequest

        try:
            vuelto = VueltoRequest.objects.filter(
                id=vuelto_id, status="pending"
            ).first()
            if not vuelto:
                return {
                    "success": False,
                    "error": "Vuelto request no encontrado o no cancelable",
                }

            vuelto.status = "cancelled"
            vuelto.save()

            return {"success": True, "message": "Vuelto cancelado"}

        except Exception as e:
            logger.error(f"Error cancelling vuelto: {e}")
            return {"success": False, "error": str(e)}

    def get_vuelto_status(self, vuelto_id: int) -> dict:
        """
        Consulta status de un vuelto via Bancaribe.
        """
        from core.models import VueltoRequest, BancaribeAPIConfig
        from core.utils.bancaribe.client import BancaribeClient

        try:
            vuelto = VueltoRequest.objects.filter(id=vuelto_id).first()
            if not vuelto:
                return {"success": False, "error": "Vuelto request no encontrado"}

            if not vuelto.bancaribe_reference:
                return {
                    "success": True,
                    "status": vuelto.status,
                    "reference": vuelto.reference,
                    "message": "Aún no enviado a Bancaribe",
                }

            config = BancaribeAPIConfig.objects.filter(is_active=True).first()
            if not config:
                return {"success": False, "error": "Bancaribe no configurado"}

            client = BancaribeClient(
                client_id=config.client_id,
                client_secret=config.client_secret,
                is_test_mode=config.is_test_mode,
            )

            result = client.get_transaction_status(vuelto.bancaribe_reference)

            if result.get("success"):
                status_code = result.get("status_code")
                if status_code == "00":
                    nuevo_status = "delivered"
                elif status_code == "09":
                    nuevo_status = "cancelled"
                elif status_code in ("04", "05", "06", "07"):
                    nuevo_status = "expired"
                else:
                    nuevo_status = "sent"

                if nuevo_status != vuelto.status:
                    vuelto.status = nuevo_status
                    vuelto.save()

            return {
                "success": True,
                "status": nuevo_status,
                "reference": vuelto.reference,
                "bancaribe_reference": vuelto.bancaribe_reference,
                "raw_status": result,
            }

        except Exception as e:
            logger.error(f"Error getting vuelto status: {e}")
            return {"success": False, "error": str(e)}

    def _generate_otp(self) -> str:
        """Genera OTP de 6 dígitos."""
        return "".join([str(random.randint(0, 9)) for _ in range(self.OTP_LENGTH)])

    def _send_otp_sms(self, phone: str, otp_code: str) -> bool:
        """
        Envía OTP por SMS. Placeholder hasta implementar servicio SMS real.
        """
        logger.info(f"[SMS PLACEHOLDER] Sending OTP {otp_code} to {phone}")
        return True
