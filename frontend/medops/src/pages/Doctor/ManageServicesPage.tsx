// src/pages/Doctor/ManageServicesPage.tsx
import React, { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useAppointmentsPending } from "@/hooks/appointments/useAppointmentsPending";
import { useUpdateAppointmentStatus } from "@/hooks/appointments/useUpdateAppointmentStatus";
import { usePendingPayments } from "@/hooks/payments/usePendingPayments";
import { useVerifyPayment } from "@/hooks/payments/useVerifyPayment";
import SimpleCalendar from "@/components/Common/SimpleCalendar";
import EliteModal from "@/components/Common/EliteModal";
import Toast from "@/components/Common/Toast";
import { Loader2 } from "lucide-react";
import { 
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  UserIcon,
  CreditCardIcon,
  CalendarIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import type { PendingPayment } from "@/types/payments";
// ✅ URL base del API para imágenes
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
// ✅ Helper para obtener URL completa de imagen
const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};
// ✅ MOTIVOS PREDEFINIDOS DE RECHAZO
const REJECTION_REASONS = [
  { id: "wrong_amount", label: "Monto incorrecto - El monto no coincide con el esperado" },
  { id: "unreadable", label: "Captura ilegible - Favor subir una más clara" },
  { id: "invalid_ref", label: "Referencia no válida - Número de referencia incorrecto" },
  { id: "wrong_bank", label: "Banco destino incorrecto" },
  { id: "other", label: "Otro motivo" },
];
export default function ManageServicesPage() {
  // ✅ Hooks de pagos
  const { data: payments, isLoading: paymentsLoading } = usePendingPayments();
  const verifyMutation = useVerifyPayment();
  
  // ✅ Hooks de citas
  const { data: appointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useAppointmentsPending();
  const updateStatus = useUpdateAppointmentStatus();
  
  // ✅ Estados - Pagos
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmAndScheduleModal, setShowConfirmAndScheduleModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // ✅ Estados - Citas
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [confirmDate, setConfirmDate] = useState<Date | null>(null);
  const [confirmTime, setConfirmTime] = useState<string>("");
  
  // ✅ Estados - Confirmar pago Y agendar
  const [confirmAndScheduleDate, setConfirmAndScheduleDate] = useState<Date | null>(null);
  
  const pendingPayments = payments ?? [];
  const pendingAppointments = appointments ?? [];
  const isLoading = paymentsLoading || appointmentsLoading;
  
  // ════════════════════════════════════════════════════════════
  // HANDLERS - PAGOS
  // ════════════════════════════════════════════════════════════
  
  const handleConfirmAndSchedule = async () => {
    if (!selectedPayment || !confirmAndScheduleDate) return;
    try {
      // 1. Confirmar el pago
      await verifyMutation.mutateAsync({
        paymentId: selectedPayment.id,
        data: { action: "confirm", notes: verificationNotes }
      });
      
      // 2. Crear la Appointment con la fecha confirmada
      const dateStr = confirmAndScheduleDate.toISOString().split('T')[0];
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          patient: selectedPayment.patient.id,
          doctor: (selectedPayment as any).charge_order?.doctor || (selectedPayment as any).doctor,
          institution: (selectedPayment as any).charge_order?.institution || (selectedPayment as any).institution,
          appointment_date: dateStr,
          tentative_date: dateStr,
          status: 'pending',
          appointment_type: 'general',
          services: [{ 
            doctor_service_id: (selectedPayment as any).charge_order?.items?.[0]?.doctor_service?.id || (selectedPayment as any).doctor_service,
            qty: 1 
          }]
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la cita');
      }
      
      setToast({ message: "Pago confirmado y cita agendada exitosamente", type: "success" });
      handleCloseConfirmAndScheduleModal();
      refetchAppointments();
    } catch (err: any) {
      setToast({ message: err.message || "Error al confirmar pago y agendar", type: "error" });
    }
  };
  
  const handleRejectPayment = async () => {
    if (!selectedPayment) return;
    
    // Construir notas con motivo predefinido + notas personalizadas
    const reasonLabel = REJECTION_REASONS.find(r => r.id === selectedReason)?.label || "";
    const fullNotes = selectedReason === "other" 
      ? verificationNotes 
      : `${reasonLabel}${verificationNotes ? ` - ${verificationNotes}` : ""}`;
    
    if (!fullNotes.trim()) {
      setToast({ message: "Debes seleccionar o escribir un motivo de rechazo", type: "error" });
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
      setToast({ message: err.message || "Error al rechazar pago", type: "error" });
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
  
  // ════════════════════════════════════════════════════════════
  // HANDLERS - CITAS
  // ════════════════════════════════════════════════════════════
  
  const handleConfirmAppointment = async () => {
    if (!selectedAppointment || !confirmDate) return;
    try {
      const dateStr = confirmDate.toISOString().split('T')[0];
      await updateStatus.mutateAsync({
        id: selectedAppointment.id,
        status: "arrived",
        appointment_date: dateStr,
      });
      setToast({ message: "Cita confirmada exitosamente", type: "success" });
      setSelectedAppointment(null);
      setConfirmDate(null);
      setConfirmTime("");
    } catch (err) {
      setToast({ message: "Error al confirmar cita", type: "error" });
    }
  };
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Portal Doctor", path: "/doctor" },
          { label: "Centro de Control", active: true }
        ]}
        stats={[
          { 
            label: "PAGOS PENDIENTES", 
            value: pendingPayments.length.toString(), 
            color: "text-amber-500"
          },
          { 
            label: "CITAS PENDIENTES", 
            value: pendingAppointments.length.toString(), 
            color: "text-blue-500"
          },
        ]}
      />
      
      {/* ════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: PAGOS PENDIENTES DE VERIFICACIÓN               */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1 border-l-2 border-amber-500/50 ml-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400/80">
            Pagos Pendientes de Verificación
          </h3>
          <span className="text-[9px] font-mono text-white/40">
            {pendingPayments.length} pendientes
          </span>
        </div>
        
        {pendingPayments.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-sm">
            <BanknotesIcon className="w-8 h-8 mx-auto text-white/20 mb-2" />
            <p className="text-white/30 text-[10px] font-mono uppercase tracking-wider">
              No hay pagos pendientes de verificación
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingPayments.map((payment) => (
              <div 
                key={payment.id} 
                className="bg-[#080808] border border-white/10 rounded-sm p-4 space-y-3 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-sm flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-amber-400/60" />
                    </div>
                    <div>
                      <p className="text-white text-[11px] font-bold">{payment.patient.full_name}</p>
                      <p className="text-white/40 text-[9px] font-mono">{payment.patient.national_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-[13px] font-bold font-mono">
                      Bs {Number(payment.amount_ves || 0).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                    </p>
                    <p className="text-white/30 text-[8px] font-mono">
                      ${Number(payment.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })} USD
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div>
                    <span className="text-white/30 uppercase tracking-wider">Referencia:</span>
                    <p className="text-white/70 font-mono font-bold">{payment.reference_number || "—"}</p>
                  </div>
                  <div>
                    <span className="text-white/30 uppercase tracking-wider">Banco:</span>
                    <p className="text-white/70 font-mono font-bold">{payment.bank_reference || "—"}</p>
                  </div>
                  <div>
                    <span className="text-white/30 uppercase tracking-wider">Fecha:</span>
                    <p className="text-white/70 font-mono font-bold">{payment.created_at?.split('T')[0] || "—"}</p>
                  </div>
                </div>
                
                {payment.screenshot && (
                  <button 
                    onClick={() => openImageModal(getFullImageUrl(payment.screenshot!))}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[9px] font-bold uppercase tracking-wider"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    Ver Captura de Pago
                  </button>
                )}
                
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowConfirmAndScheduleModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-500/20 transition-all"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Confirmar y Agendar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-bold uppercase tracking-wider rounded-sm hover:bg-red-500/20 transition-all"
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
      
      {/* ════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: CITAS PENDIENTES DE CONFIRMACIÓN               */}
      {/* ════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1 border-l-2 border-blue-500/50 ml-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/80">
            Citas Pendientes de Confirmación
          </h3>
          <span className="text-[9px] font-mono text-white/40">
            {pendingAppointments.length} pendientes
          </span>
        </div>
        
        {pendingAppointments.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-sm">
            <CalendarIcon className="w-8 h-8 mx-auto text-white/20 mb-2" />
            <p className="text-white/30 text-[10px] font-mono uppercase tracking-wider">
              No hay citas pendientes de confirmación
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingAppointments.map((apt: any) => (
              <div 
                key={apt.id} 
                className="bg-[#080808] border border-white/10 rounded-sm p-4 space-y-3 hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-sm flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-blue-400/60" />
                    </div>
                    <div>
                      <p className="text-white text-[11px] font-bold">{apt.patient?.full_name || "Paciente"}</p>
                      <p className="text-white/40 text-[9px] font-mono">ID: {apt.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 text-[11px] font-bold font-mono">
                      ${apt.expected_amount} USD
                    </p>
                    <p className="text-white/30 text-[8px]">
                      {apt.appointment_date || "Sin fecha"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                    apt.financial_status === 'confirmed' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {apt.financial_status === 'confirmed' ? 'PAGO CONFIRMADO' : 'PENDIENTE PAGO'}
                  </span>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => setSelectedAppointment(apt)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded-sm hover:bg-blue-500/20 transition-all"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Confirmar Cita
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* ════════════════════════════════════════════════════════ */}
      {/* MODALS                                                     */}
      {/* ════════════════════════════════════════════════════════ */}
      
      {/* Modal: Confirmar Pago Y Agendar */}
      <EliteModal
        open={showConfirmAndScheduleModal}
        onClose={handleCloseConfirmAndScheduleModal}
        title="CONFIRMAR_PAGO_Y_AGENDAR"
        maxWidth="max-w-lg"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
          <p className="text-sm text-white/60">
            Confirmar el pago de <span className="text-emerald-400 font-bold">
              Bs {selectedPayment ? Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE') : 0}
            </span> del paciente <span className="text-white font-bold">{selectedPayment?.patient.full_name}</span> y agendar la cita.
          </p>
          
          {selectedPayment?.screenshot && (
            <div className="mb-4">
              <p className="text-[10px] text-white/40 uppercase mb-2">Captura adjunta:</p>
              <img 
                src={getFullImageUrl(selectedPayment.screenshot)} 
                alt="Captura de pago" 
                className="max-h-40 rounded-sm border border-white/10 cursor-pointer hover:opacity-80"
                onClick={() => openImageModal(getFullImageUrl(selectedPayment.screenshot!))}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
              Seleccionar Fecha Definitiva
            </label>
            <div className="bg-black/20 p-2 rounded border border-white/10">
              <SimpleCalendar
                selectedDate={confirmAndScheduleDate}
                onDateSelect={setConfirmAndScheduleDate}
                serviceSchedules={[]}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
              placeholder="Agregar notas..."
              rows={2}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseConfirmAndScheduleModal}
              className="flex-1 px-4 py-2 border border-white/20 text-white/60 text-xs font-bold uppercase rounded-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmAndSchedule}
              disabled={!confirmAndScheduleDate || verifyMutation.isPending || updateStatus.isPending}
              className="flex-1 px-4 py-2 bg-emerald-500 text-black text-xs font-bold uppercase rounded-sm hover:bg-emerald-400 disabled:opacity-50"
            >
              {(verifyMutation.isPending || updateStatus.isPending) 
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> 
                : "Confirmar y Agendar"}
            </button>
          </div>
        </div>
      </EliteModal>
      
      {/* Modal: Rechazar Pago */}
      <EliteModal
        open={showRejectModal}
        onClose={handleCloseRejectModal}
        title="RECHAZAR_PAGO"
        maxWidth="max-w-md"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
          <p className="text-sm text-white/60">
            ¿Rechazar el pago de <span className="text-red-400 font-bold">
              Bs {selectedPayment ? Number(selectedPayment.amount_ves || 0).toLocaleString('es-VE') : 0}
            </span> del paciente <span className="text-white font-bold">{selectedPayment?.patient.full_name}</span>?
          </p>
          
          {selectedPayment?.screenshot && (
            <div className="mb-4">
              <p className="text-[10px] text-white/40 uppercase mb-2">Captura adjunta:</p>
              <img 
                src={getFullImageUrl(selectedPayment.screenshot)} 
                alt="Captura de pago" 
                className="max-h-40 rounded-sm border border-white/10 cursor-pointer hover:opacity-80"
                onClick={() => openImageModal(getFullImageUrl(selectedPayment.screenshot!))}
              />
            </div>
          )}
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
              Motivo del rechazo
            </label>
            <div className="space-y-2">
              {REJECTION_REASONS.map((reason) => (
                <label 
                  key={reason.id}
                  className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-colors ${
                    selectedReason === reason.id 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : 'bg-black/20 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection_reason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={() => setSelectedReason(reason.id)}
                    className="accent-red-500"
                  />
                  <span className={`text-[10px] ${selectedReason === reason.id ? 'text-red-400 font-bold' : 'text-white/60'}`}>
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          {selectedReason === "other" && (
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
                Especificar motivo
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
                placeholder="Escribe el motivo del rechazo..."
                rows={3}
                required
              />
            </div>
          )}
          
          {selectedReason && selectedReason !== "other" && (
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white text-xs"
                placeholder="Información adicional..."
                rows={2}
              />
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseRejectModal}
              className="flex-1 px-4 py-2 border border-white/20 text-white/60 text-xs font-bold uppercase rounded-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleRejectPayment}
              disabled={verifyMutation.isPending || !selectedReason}
              className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-bold uppercase rounded-sm hover:bg-red-400 disabled:opacity-50"
            >
              {verifyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Rechazar Pago"}
            </button>
          </div>
        </div>
      </EliteModal>
      
      {/* Modal: Confirmar Cita */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg rounded-sm shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-bold">Confirmar Cita #{selectedAppointment.id}</h3>
              <button onClick={() => setSelectedAppointment(null)} className="text-white/50 hover:text-white">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50 text-xs">Paciente</p>
                  <p className="text-white font-medium">{selectedAppointment.patient?.full_name}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Monto</p>
                  <p className="text-emerald-400 font-medium">${selectedAppointment.expected_amount}</p>
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-2">Seleccionar Fecha Definitiva</p>
                <div className="bg-black/20 p-2 rounded border border-white/10">
                  <SimpleCalendar
                    selectedDate={confirmDate}
                    onDateSelect={setConfirmDate}
                    serviceSchedules={[]}
                  />
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-2">Hora (Opcional)</p>
                <input 
                  type="time" 
                  value={confirmTime}
                  onChange={(e) => setConfirmTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 p-2 text-white rounded"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-white/10 bg-black/20">
              <button onClick={() => setSelectedAppointment(null)} className="flex-1 py-2 bg-white/10 text-white text-xs font-bold uppercase hover:bg-white/20">
                Cancelar
              </button>
              <button onClick={handleConfirmAppointment} disabled={!confirmDate || updateStatus.isPending} className="flex-1 py-2 bg-blue-500 text-white text-xs font-bold uppercase hover:bg-blue-400 disabled:opacity-50 flex justify-center items-center gap-2">
                {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                Confirmar Cita
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Ver Captura */}
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