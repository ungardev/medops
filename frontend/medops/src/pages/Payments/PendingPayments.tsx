// src/pages/Payments/PendingPayments.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { usePendingPayments } from "@/hooks/payments/usePendingPayments";
import { useVerifyPayment } from "@/hooks/payments/useVerifyPayment";
import { Loader2 } from "lucide-react";
import { 
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import EliteModal from "@/components/Common/EliteModal";
import Toast from "@/components/Common/Toast";
import type { PendingPayment } from "@/types/payments";
export default function PendingPayments() {
  const { data: payments, isLoading, error } = usePendingPayments();
  const verifyMutation = useVerifyPayment();
  
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const pendingPayments = payments ?? [];
  const handleConfirm = async () => {
    if (!selectedPayment) return;
    
    try {
      await verifyMutation.mutateAsync({
        paymentId: selectedPayment.id,
        data: { action: "confirm", notes: verificationNotes }
      });
      
      setToast({ message: "Pago confirmado exitosamente", type: "success" });
      setShowConfirmModal(false);
      setSelectedPayment(null);
      setVerificationNotes("");
    } catch (err: any) {
      setToast({ message: err.message || "Error al confirmar pago", type: "error" });
    }
  };
  const handleReject = async () => {
    if (!selectedPayment) return;
    
    try {
      await verifyMutation.mutateAsync({
        paymentId: selectedPayment.id,
        data: { action: "reject", notes: verificationNotes }
      });
      
      setToast({ message: "Pago rechazado", type: "success" });
      setShowRejectModal(false);
      setSelectedPayment(null);
      setVerificationNotes("");
    } catch (err: any) {
      setToast({ message: err.message || "Error al rechazar pago", type: "error" });
    }
  };
  const handleCloseConfirm = () => {
    setShowConfirmModal(false);
    setSelectedPayment(null);
    setVerificationNotes("");
  };
  const handleCloseReject = () => {
    setShowRejectModal(false);
    setSelectedPayment(null);
    setVerificationNotes("");
  };
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "PAGOS", path: "/payments" },
          { label: "PENDIENTES", active: true }
        ]}
        stats={[
          { 
            label: "PENDIENTES", 
            value: pendingPayments.length.toString(), 
            color: "text-amber-500"
          }
        ]}
      />
      {pendingPayments.length === 0 ? (
        <div className="text-center py-12 opacity-50">
          <BanknotesIcon className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm font-mono">No hay pagos pendientes de verificación</p>
        </div>
      ) : (
        <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 text-[9px] text-white/40 uppercase tracking-widest">
              <tr>
                <th className="p-4 text-left font-black">PACIENTE</th>
                <th className="p-4 text-left font-black">MONTO</th>
                <th className="p-4 text-left font-black">BANCO</th>
                <th className="p-4 text-left font-black">REFERENCIA</th>
                <th className="p-4 text-left font-black">CAPTURA</th>
                <th className="p-4 text-left font-black">TIPO</th>
                <th className="p-4 text-left font-black">FECHA</th>
                <th className="p-4 text-right font-black">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {pendingPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/[0.02]">
                  <td className="p-4">
                    <p className="font-bold text-white">{payment.patient.full_name}</p>
                    <p className="text-white/40 text-[9px] font-mono">{payment.patient.national_id}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-emerald-400">
                      Bs {Number(payment.amount_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-white/40 text-[9px] font-mono">
                      ${Number(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD
                    </p>
                  </td>
                  <td className="p-4 text-white/60">
                    {payment.bank_reference}
                  </td>
                  <td className="p-4 font-mono text-white/60">
                    {payment.reference_number}
                  </td>
                  <td className="p-4">
                    {(payment as any).screenshot ? (
                      <button 
                        onClick={() => openImageModal((payment as any).screenshot)}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[10px]"
                      >
                        <PhotoIcon className="w-4 h-4" />
                        Ver captura
                      </button>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                      payment.verification_type === 'automatic' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {payment.verification_type === 'automatic' ? 'Automático' : 'Manual'}
                    </span>
                  </td>
                  <td className="p-4 text-white/40 font-mono text-[9px]">
                    {payment.created_at}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowConfirmModal(true);
                        }}
                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-sm"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRejectModal(true);
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-sm"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal Confirmar */}
      <EliteModal
        open={showConfirmModal}
        onClose={handleCloseConfirm}
        title="CONFIRMAR_PAGO"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            ¿Confirmar el pago de <span className="text-emerald-400 font-bold">
              Bs {selectedPayment ? Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE') : 0}
            </span> del paciente <span className="text-white font-bold">{selectedPayment?.patient.full_name}</span>?
          </p>
          
          {/* Mostrar captura si existe */}
          {(selectedPayment as any).screenshot && (
            <div className="mb-4">
              <p className="text-[10px] text-white/40 uppercase mb-2">Captura adjunta:</p>
              <img 
                src={(selectedPayment as any).screenshot} 
                alt="Captura de pago" 
                className="max-h-40 rounded-sm border border-white/10 cursor-pointer hover:opacity-80"
                onClick={() => openImageModal((selectedPayment as any).screenshot)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
              placeholder="Agregar notas de verificación..."
              rows={3}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseConfirm}
              className="flex-1 px-4 py-2 border border-white/20 text-white/60 text-xs font-bold uppercase rounded-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={verifyMutation.isPending}
              className="flex-1 px-4 py-2 bg-emerald-500 text-black text-xs font-bold uppercase rounded-sm hover:bg-emerald-400 disabled:opacity-50"
            >
              {verifyMutation.isPending ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </EliteModal>
      {/* Modal Rechazar */}
      <EliteModal
        open={showRejectModal}
        onClose={handleCloseReject}
        title="RECHAZAR_PAGO"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            ¿Rechazar el pago de <span className="text-red-400 font-bold">
              Bs {selectedPayment ? Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE') : 0}
            </span> del paciente <span className="text-white font-bold">{selectedPayment?.patient.full_name}</span>?
          </p>
          
          {/* Mostrar captura si existe */}
          {(selectedPayment as any).screenshot && (
            <div className="mb-4">
              <p className="text-[10px] text-white/40 uppercase mb-2">Captura adjunta:</p>
              <img 
                src={(selectedPayment as any).screenshot} 
                alt="Captura de pago" 
                className="max-h-40 rounded-sm border border-white/10 cursor-pointer hover:opacity-80"
                onClick={() => openImageModal((selectedPayment as any).screenshot)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
              Razón del rechazo
            </label>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
              placeholder="Agregar razón del rechazo..."
              rows={3}
              required
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseReject}
              className="flex-1 px-4 py-2 border border-white/20 text-white/60 text-xs font-bold uppercase rounded-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleReject}
              disabled={verifyMutation.isPending}
              className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold uppercase rounded-sm hover:bg-red-400 disabled:opacity-50"
            >
              {verifyMutation.isPending ? "Rechazando..." : "Rechazar"}
            </button>
          </div>
        </div>
      </EliteModal>
      {/* Modal de Imagen */}
      <EliteModal
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        title="CAPTURA_DE_PAGO"
        maxWidth="max-w-3xl"
      >
        <div className="flex justify-center">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Captura de pago" 
              className="max-w-full max-h-[70vh] object-contain rounded-sm"
            />
          )}
        </div>
      </EliteModal>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}