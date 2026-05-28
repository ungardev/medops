import logging
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional
from django.utils import timezone

logger = logging.getLogger(__name__)


class DisbursementService:
    """
    Servicio para gestionar disbursements a doctores via Bancaribe API #4.
    """

    def __init__(self, bancaribe_config=None):
        self.bancaribe_config = bancaribe_config

    def create_disbursement(
        self,
        doctor,
        amount: Decimal,
        bank_code: str,
        bank_account: str,
        currency: str = "USD",
        amount_ves: Optional[Decimal] = None,
        disbursement_type: str = "instant",
        scheduled_at: Optional[datetime] = None,
    ) -> dict:
        """
        Crea un disbursement para un doctor.
        """
        from core.models import Disbursement, DoctorWallet, DoctorPaymentConfig
        from core.utils.bancaribe.client import BancaribeClient

        try:
            wallet, created = DoctorWallet.objects.get_or_create(
                doctor=doctor, defaults={"balance": Decimal("0.00")}
            )

            if wallet.balance < amount:
                return {
                    "success": False,
                    "error": "Balance insuficiente en wallet",
                    "wallet_balance": str(wallet.balance),
                }

            payment_config = DoctorPaymentConfig.objects.filter(doctor=doctor).first()
            if not payment_config:
                return {"success": False, "error": "Doctor sin configuración de pago"}

            disbursement = Disbursement.objects.create(
                doctor=doctor,
                amount=amount,
                currency=currency,
                amount_ves=amount_ves,
                bank_code=bank_code,
                bank_account=bank_account,
                disbursement_type=disbursement_type,
                doctor_wallet=wallet,
                scheduled_at=scheduled_at or timezone.now(),
                status="pending",
            )

            if disbursement_type == "instant" and self.bancaribe_config:
                return self._process_instant_disbursement(disbursement, wallet)

            return {
                "success": True,
                "disbursement_id": disbursement.id,
                "reference": disbursement.reference,
                "status": disbursement.status,
                "message": "Disbursement creado y programado",
            }

        except Exception as e:
            logger.error(f"Error creando disbursement: {e}")
            return {"success": False, "error": str(e)}

    def _process_instant_disbursement(self, disbursement, wallet) -> dict:
        """
        Procesa disbursement instantáneo via Bancaribe.
        """
        from core.utils.bancaribe.client import BancaribeClient

        try:
            client = BancaribeClient(
                client_id=self.bancaribe_config.client_id,
                client_secret=self.bancaribe_config.client_secret,
                is_test_mode=self.bancaribe_config.is_test_mode,
            )

            result = client.transferencia(
                source_account=self.bancaribe_config.settlement_account,
                dest_bank_code=disbursement.bank_code,
                dest_account=disbursement.bank_account,
                amount=float(disbursement.amount),
                reference=disbursement.reference,
                concept="Pago MEDOPZ - Honorarios Médicos",
            )

            if result.get("success"):
                disbursement.status = "processing"
                disbursement.bancaribe_reference = result.get("bancaribe_reference", "")
                disbursement.raw_response = result.get("raw_response", {})
                disbursement.save()

                wallet.pending_balance += disbursement.amount
                wallet.save()

                return {
                    "success": True,
                    "disbursement_id": disbursement.id,
                    "reference": disbursement.reference,
                    "bancaribe_reference": result.get("bancaribe_reference"),
                    "status": "processing",
                }
            else:
                disbursement.status = "failed"
                disbursement.error_message = result.get(
                    "error", "Error en API Bancaribe"
                )
                disbursement.raw_response = result
                disbursement.save()

                return {
                    "success": False,
                    "error": result.get("error"),
                    "disbursement_id": disbursement.id,
                }

        except Exception as e:
            logger.error(f"Error en disbursement instantáneo: {e}")
            disbursement.status = "failed"
            disbursement.error_message = str(e)
            disbursement.save()
            return {"success": False, "error": str(e)}

    def process_batch_disbursements(self) -> dict:
        """
        Procesa todos los disbursements programados para este momento.
        Se ejecuta via Celery Beat diariamente a las 8PM.
        """
        from core.models import Disbursement

        pending = Disbursement.objects.filter(
            status="pending",
            disbursement_type="batch",
            scheduled_at__lte=timezone.now(),
        )

        processed = 0
        failed = 0

        for disbursement in pending:
            if self._process_instant_disbursement(
                disbursement, disbursement.doctor_wallet
            ):
                processed += 1
            else:
                failed += 1

        return {
            "processed": processed,
            "failed": failed,
            "total": pending.count(),
        }

    def cancel_disbursement(self, disbursement_id: int) -> dict:
        """
        Cancela un disbursement pendiente.
        """
        from core.models import Disbursement

        try:
            disbursement = Disbursement.objects.get(
                id=disbursement_id, status="pending"
            )
            disbursement.status = "cancelled"
            disbursement.save()

            if disbursement.doctor_wallet:
                disbursement.doctor_wallet.pending_balance -= disbursement.amount
                disbursement.doctor_wallet.save()

            return {"success": True, "message": "Disbursement cancelado"}

        except Disbursement.DoesNotExist:
            return {
                "success": False,
                "error": "Disbursement no encontrado o no cancelable",
            }

    def add_to_wallet(
        self,
        doctor,
        amount: Decimal,
        transaction_ref: str,
        concept: str = "Pago de paciente",
    ) -> dict:
        """
        Agrega fondos al wallet del doctor.
        """
        from core.models import DoctorWallet, PlatformEarnings, PaymentTransaction

        try:
            wallet, created = DoctorWallet.objects.get_or_create(
                doctor=doctor, defaults={"balance": Decimal("0.00")}
            )

            transaction = PaymentTransaction.objects.filter(
                reference_number=transaction_ref
            ).first()

            if transaction:
                gross_amount = Decimal(str(transaction.amount))
                commission_rate = Decimal("0.03")
                commission_amount = gross_amount * commission_rate
                net_amount = gross_amount - commission_amount

                PlatformEarnings.objects.create(
                    transaction=transaction,
                    gross_amount=gross_amount,
                    commission_rate=commission_rate,
                    commission_amount=commission_amount,
                    net_amount=net_amount,
                    currency=transaction.currency or "USD",
                    exchange_rate_bcv=transaction.exchange_rate_bcv,
                    amount_ves=transaction.amount_ves,
                )

            wallet.add_funds(amount, transaction_ref)

            return {
                "success": True,
                "wallet_balance": str(wallet.balance),
                "amount_added": str(amount),
            }

        except Exception as e:
            logger.error(f"Error agregando a wallet: {e}")
            return {"success": False, "error": str(e)}

    def get_wallet_summary(self, doctor) -> dict:
        """
        Retorna resumen del wallet del doctor.
        """
        from core.models import DoctorWallet

        try:
            wallet = DoctorWallet.objects.get(doctor=doctor)
            return {
                "success": True,
                "balance": str(wallet.balance),
                "pending_balance": str(wallet.pending_balance),
                "total_earned": str(wallet.total_earned),
                "total_disbursed": str(wallet.total_disbursed),
                "last_disbursement_at": wallet.last_disbursement_at,
            }
        except DoctorWallet.DoesNotExist:
            return {
                "success": True,
                "balance": "0.00",
                "pending_balance": "0.00",
                "total_earned": "0.00",
                "total_disbursed": "0.00",
                "last_disbursement_at": None,
            }
