// src/components/Patients/sections/AlertModal.tsx
import React, { useState, useEffect } from "react";
import EliteModal from "../../Common/EliteModal";
import { ExclamationTriangleIcon, ShieldCheckIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: { type: "danger" | "warning" | "info"; message: string }) => void;
  initial?: { type: "danger" | "warning" | "info"; message: string };
}
export default function AlertModal({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<{ type: "danger" | "warning" | "info"; message: string }>({
    type: initial?.type ?? "warning",
    message: initial?.message ?? "",
  });
  // Sistema dinámico de iconos por tipo de alerta
  const getAlertIcon = (type: "danger" | "warning" | "info") => {
    switch (type) {
      case "danger":
        return { icon: ExclamationTriangleIcon, color: "text-red-500", bgColor: "bg-red-500/10" };
      case "warning":
        return { icon: ExclamationTriangleIcon, color: "text-amber-500", bgColor: "bg-amber-500/10" };
      case "info":
        return { icon: InformationCircleIcon, color: "text-blue-500", bgColor: "bg-blue-500/10" };
      default:
        return { icon: InformationCircleIcon, color: "text-blue-500", bgColor: "bg-blue-500/10" };
    }
  };
  // Sincronizar estado cuando se edita una alerta existente
  useEffect(() => {
    if (initial) {
      setForm({ type: initial.type, message: initial.message });
    }
  }, [initial]);
  // Preservar soporte para tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  const handleSave = () => {
    if (form.message.trim() === "") return; // Evitar guardar mensaje vacío
    onSave(form);
  };
  // Constantes de estilos Elite
  const inputStyles = "w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-white/30 transition-all";
  const labelStyles = "text-[9px] font-black text-white/30 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-[#0a0a0a] border border-white/10 rounded-sm p-4 space-y-4";
  const alertConfig = getAlertIcon(form.type);
  const DynamicIcon = alertConfig.icon;
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title="PATIENT_ALERT_PROTOCOL"
      subtitle="MEDICAL_NOTIFICATION_SYSTEM"
      maxWidth="max-w-md"
      showDotIndicator={true}
    >
      <div className="space-y-6">
        {/* Header dinámico con icono por tipo */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 ${alertConfig.bgColor} rounded-lg ${alertConfig.color}`}>
            <DynamicIcon className="w-5 h-5" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
            ALERT_TYPE_CLASSIFICATION
          </h3>
        </div>
        {/* Formulario de Alerta */}
        <div className={sectionStyles}>
          <div>
            <label className={labelStyles}>ALERT_TYPE_CLASSIFICATION</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className={inputStyles}
            >
              <option value="danger">DANGER_PROTOCOL</option>
              <option value="warning">WARNING_PROTOCOL</option>
              <option value="info">INFORMATION_PROTOCOL</option>
            </select>
          </div>
          <div>
            <label className={labelStyles}>ALERT_MESSAGE_CONTENT</label>
            <textarea
              className={`${inputStyles} min-h-[120px] resize-none`}
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="ENTER_ALERT_MESSAGE_HERE..."
            />
          </div>
        </div>
        {/* Alert Status Display */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-1.5 h-1.5 rounded-full ${alertConfig.color}`} />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
              ALERT_STATUS_MONITOR
            </h3>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-sm p-4">
            <p className="text-[10px] font-mono text-white/80">
              TYPE: <span className={`${alertConfig.color} font-bold`}>{form.type.toUpperCase()}</span>
            </p>
            <p className="text-[10px] font-mono text-white/60 mt-1">
              MESSAGE_LENGTH: {form.message.length} characters
            </p>
          </div>
        </div>
      </div>
      {/* Elite Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-mono"
        >
          ABORT_OPERATION
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all font-mono ${
            form.type === "danger" 
              ? "bg-red-600 hover:bg-red-500" 
              : form.type === "warning"
              ? "bg-amber-600 hover:bg-amber-500"
              : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          <DynamicIcon className="w-4 h-4" />
          {initial ? "UPDATE_ALERT_RECORD" : "CREATE_ALERT_ENTRY"}
        </button>
      </div>
    </EliteModal>
  );
}