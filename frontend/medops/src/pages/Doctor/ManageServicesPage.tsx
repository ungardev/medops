// src/pages/Doctor/ManageServicesPage.tsx
import React, { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { usePendingPayments } from "@/hooks/payments/usePendingPayments";
import { useVerifyPayment } from "@/hooks/payments/useVerifyPayment";
import Toast from "@/components/Common/Toast";
import VerifyPaymentModal from "@/components/Doctor/VerifyPaymentModal";
import { Loader2 } from "lucide-react";
import { 
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import type { PendingPayment } from "@/types/payments";
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
export default function ManageServicesPage() {
  const { data: payments, isLoading: paymentsLoading } = usePendingPayments();
  const verifyMutation = useVerifyPayment();
  
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmAndScheduleModal, setShowConfirmAndScheduleModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [confirmAndScheduleDate, setConfirmAndScheduleDate] = useState<Date | null>(null);
  
  const pendingPayments = (payments ?? []).filter(p => p.status !== 'confirmed');
  
  const isLoading = paymentsLoading;
  
  const handleConfirmAndSchedule = async () => {
    if (!selectedPayment || !confirmAndScheduleDate) return;
    try {
      await verifyMutation.mutateAsync({
        paymentId: selectedPayment.id,
        data: { action: "confirm", notes: verificationNotes }
      });
      
      const year = confirmAndScheduleDate.getFullYear();
      const month = String(confirmAndScheduleDate.getMonth() + 1).padStart(2, '0');
      const day = String(confirmAndScheduleDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const token = localStorage.getItem('authToken');
      
      const doctorId = (selectedPayment as any).charge_order?.doctor?.id;
      const institutionId = (selectedPayment as any).charge_order?.institution?.id;
      const doctorServiceId = (selectedPayment as any).charge_order?.items?.[0]?.doctor_service?.id;
      
      if (!doctorId || !institutionId) {
        throw new Error('Faltan datos del doctor o institución. Recarga la página e intenta de nuevo.');
      }
      
      const response = await fetch('/api/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          patient: selectedPayment.patient.id,
          doctor: doctorId,
          institution: institutionId,
          appointment_date: dateStr,
          tentative_date: dateStr,
          status: 'pending',
          appointment_type: 'general',
          services: doctorServiceId ? [{ 
            doctor_service_id: doctorServiceId,
            qty: 1 
          }] : []
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la cita');
      }
      
      setToast({ message: "Pago confirmado y cita agendada exitosamente", type: "success" });
      handleCloseConfirmAndScheduleModal();
    } catch (err: any) {
      setToast({ message: err.message || "Error al confirmar pago y agendar", type: "error" });
    }
  };
  
  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setSelectedPayment(null);
    setVerificationNotes("");
    setSelectedReason("");
  };
  
  const handleCloseConfirmAndScheduleModal = () => {
    setShowConfirmAndScheduleModal(false);
    setSelectedPayment(null);
    setVerificationNotes("");
    setConfirmAndScheduleDate(null);
  };
  
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  );
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Portal Doctor", path: "/doctor" },
          { label: "Centro de Control", active: true }
        ]}
        stats={[
          { 
            label: "Pagos Pendientes", 
            value: pendingPayments.length.toString(), 
            color: "text-amber-400"
          },
        ]}
      />
      
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-[12px] font-medium text-white/70">
            Pagos Pendientes de Verificación
          </h3>
          <span className="text-[10px] text-white/30">
            {pendingPayments.length} pendiente{pendingPayments.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {pendingPayments.length === 0 ? (
          <div className="p-8 text-center bg-white/5 border border-white/15 rounded-lg">
            <BanknotesIcon className="w-8 h-8 mx-auto text-white/15 mb-2" />
            <p className="text-white/30 text-[11px]">
              No hay pagos pendientes de verificación
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingPayments.map((payment) => (
              <div 
                key={payment.id} 
                className="bg-white/5 border border-white/15 rounded-lg p-5 space-y-3 hover:border-white/25 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-amber-400/60" />
                    </div>
                    <div>
                      <p className="text-white/80 text-[12px] font-medium">{payment.patient.full_name}</p>
                      <p className="text-white/30 text-[10px]">{payment.patient.national_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-[14px] font-semibold">
                      Bs {Number(payment.amount_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-white/30 text-[9px]">
                      ${Number(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-[10px]">
                  <div>
                    <span className="text-white/30">Referencia:</span>
                    <p className="text-white/60 font-medium">{payment.reference_number || "—"}</p>
                  </div>
                  <div>
                    <span className="text-white/30">Banco:</span>
                    <p className="text-white/60 font-medium">{payment.bank_reference || "—"}</p>
                  </div>
                  <div>
                    <span className="text-white/30">Fecha:</span>
                    <p className="text-white/60 font-medium">{payment.created_at?.split('T')[0] || "—"}</p>
                  </div>
                </div>
                
                {payment.screenshot && (
                  <button 
                    onClick={() => openImageModal(getFullImageUrl(payment.screenshot!))}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-[10px] font-medium"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    Ver Captura de Pago
                  </button>
                )}
                
                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowConfirmAndScheduleModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium rounded-lg hover:bg-emerald-500/25 transition-all"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Confirmar y Agendar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-medium rounded-lg hover:bg-red-500/15 transition-all"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      <VerifyPaymentModal
        showConfirmAndScheduleModal={showConfirmAndScheduleModal}
        selectedPayment={selectedPayment}
        confirmAndScheduleDate={confirmAndScheduleDate}
        setConfirmAndScheduleDate={setConfirmAndScheduleDate}
        verificationNotes={verificationNotes}
        setVerificationNotes={setVerificationNotes}
        onConfirmAndSchedule={handleConfirmAndSchedule}
        onCloseConfirmAndSchedule={handleCloseConfirmAndScheduleModal}
        isConfirming={verifyMutation.isPending}
        openImageModal={openImageModal}
        
        showRejectModal={showRejectModal}
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
        onRejectPayment={async () => {
          if (!selectedPayment) return;
          const REJECTION_REASONS = [
            { id: "wrong_amount", label: "Monto incorrecto" },
            { id: "unreadable", label: "Captura ilegible" },
            { id: "invalid_ref", label: "Referencia no válida" },
            { id: "wrong_bank", label: "Banco incorrecto" },
            { id: "other", label: "Otro" },
          ];
          const reasonLabel = REJECTION_REASONS.find(r => r.id === selectedReason)?.label || "";
          const fullNotes = selectedReason === "other" 
            ? verificationNotes 
            : `${reasonLabel}${verificationNotes ? ` - ${verificationNotes}` : ""}`;
          if (!fullNotes.trim()) {
            setToast({ message: "Selecciona un motivo", type: "error" });
            return;
          }
          try {
            await verifyMutation.mutateAsync({
              paymentId: selectedPayment.id,
              data: { action: "reject", notes: fullNotes }
            });
            setToast({ message: "Pago rechazado", type: "success" });
            handleCloseRejectModal();
          } catch (err: any) {
            setToast({ message: err.message || "Error al rechazar", type: "error" });
          }
        }}
        onCloseReject={handleCloseRejectModal}
        isRejecting={verifyMutation.isPending}
      />
      
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowImageModal(false)} className="absolute -top-10 right-0 text-white/60 hover:text-white">
              <XCircleIcon className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Captura de pago" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      
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