// src/components/Wallet/DisbursementModal.tsx
import { useState } from "react";
import { XMarkIcon, BanknotesIcon, ClockIcon, BoltIcon } from "@heroicons/react/24/outline";
import { useCreateDisbursement } from "@/hooks/wallet/useWallet";
import { usePaymentConfig } from "@/hooks/payments/usePaymentConfig";
import toast from "react-hot-toast";

interface DisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string;
}

export function DisbursementModal({
  isOpen,
  onClose,
  currentBalance,
}: DisbursementModalProps) {
  const [amount, setAmount] = useState(currentBalance);
  const [disbursementType, setDisbursementType] = useState<"instant" | "batch">("instant");
  const { data: paymentConfig } = usePaymentConfig();
  const createDisbursement = useCreateDisbursement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentConfig?.bank_account || !paymentConfig?.bank_name) {
      toast.error("Configura tu cuenta bancaria primero");
      return;
    }

    try {
      const result = await createDisbursement.mutateAsync({
        amount,
        bank_code: paymentConfig.preferred_bank || "0114",
        bank_account: paymentConfig.bank_account,
        disbursement_type: disbursementType,
      });

      if (result.success) {
        toast.success(`Disbursement ${result.reference} creado exitosamente`);
        onClose();
      } else {
        toast.error(result.error || "Error creando disbursement");
      }
    } catch (error) {
      toast.error("Error al crear disbursement");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0a0a0b] border border-white/10 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Solicitar Disbursement</h2>
              <p className="text-[10px] text-white/40">Balance: ${Number(currentBalance).toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-medium text-white/60 uppercase tracking-wider mb-2">
              Monto a Retirar
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="20"
                max={currentBalance}
                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="0.00"
              />
            </div>
            <p className="text-[9px] text-white/30 mt-1">Mínimo: $20.00 USD</p>
          </div>

          {/* Disbursement Type */}
          <div>
            <label className="block text-[10px] font-medium text-white/60 uppercase tracking-wider mb-2">
              Tipo de Disbursement
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDisbursementType("instant")}
                className={`p-4 rounded-lg border transition-all ${
                  disbursementType === "instant"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                <BoltIcon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-[11px] font-medium block">Instantáneo</span>
                <span className="text-[9px] opacity-60">$40/mes plan</span>
              </button>
              <button
                type="button"
                onClick={() => setDisbursementType("batch")}
                className={`p-4 rounded-lg border transition-all ${
                  disbursementType === "batch"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                <ClockIcon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-[11px] font-medium block">Programado</span>
                <span className="text-[9px] opacity-60">Gratis, 8PM daily</span>
              </button>
            </div>
          </div>

          {/* Bank Info (read-only) */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-[9px] text-white/40 uppercase tracking-wider mb-2">Cuenta Destino</p>
            <p className="text-[11px] text-white/80 font-medium">
              {paymentConfig?.bank_name || "No configurada"}
            </p>
            <p className="text-[10px] text-white/50">
              {paymentConfig?.bank_account ? `****${paymentConfig.bank_account.slice(-4)}` : "—"}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={createDisbursement.isPending}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {createDisbursement.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-transparent animate-spin rounded-full" />
                Procesando...
              </>
            ) : (
              <>
                <BanknotesIcon className="w-4 h-4" />
                Confirmar Disbursement
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
