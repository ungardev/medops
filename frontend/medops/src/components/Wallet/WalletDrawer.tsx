// src/components/Wallet/WalletDrawer.tsx
import { useState } from "react";
import {
  XMarkIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { WalletSummary } from "./WalletSummary";
import { WalletMovements } from "./WalletMovements";
import { DisbursementModal } from "./DisbursementModal";
import { useWalletSummary } from "@/hooks/wallet/useWallet";

interface WalletDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletDrawer({ isOpen, onClose }: WalletDrawerProps) {
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const { data: summary, isLoading } = useWalletSummary();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 backdrop-blur-md ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0b] border-l border-white/10 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <BanknotesIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Mi Wallet</h2>
                <p className="text-[10px] text-white/40">Balance disponible</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-white/5 rounded-lg" />
                <div className="h-16 bg-white/5 rounded-lg" />
              </div>
            ) : (
              <>
                {/* Balance Principal */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowsRightLeftIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/70">
                      Balance Disponible
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">
                    ${Number(summary?.balance || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">
                    Listo para retirar
                  </p>
                </div>

                {/* Stats Cards */}
                <WalletSummary summary={summary} />

                {/* Request Disbursement Button */}
                <button
                  onClick={() => setShowDisbursementModal(true)}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <BanknotesIcon className="w-4 h-4" />
                  Solicitar Disbursement
                </button>

                {/* Recent Movements */}
                <WalletMovements />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Disbursement Modal */}
      {showDisbursementModal && (
        <DisbursementModal
          isOpen={showDisbursementModal}
          onClose={() => setShowDisbursementModal(false)}
          currentBalance={summary?.balance || "0.00"}
        />
      )}
    </>
  );
}
