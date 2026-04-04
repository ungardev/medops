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
  const getAlertIcon = (type: "danger" | "warning" | "info") => {
    switch (type) {
      case "danger":
        return { icon: ExclamationTriangleIcon, color: "text-red-400", bgColor: "bg-red-500/10" };
      case "warning":
        return { icon: ExclamationTriangleIcon, color: "text-amber-400", bgColor: "bg-amber-500/10" };
      case "info":
        return { icon: InformationCircleIcon, color: "text-blue-400", bgColor: "bg-blue-500/10" };
      default:
        return { icon: InformationCircleIcon, color: "text-blue-400", bgColor: "bg-blue-500/10" };
    }
  };
  useEffect(() => {
    if (initial) {
      setForm({ type: initial.type, message: initial.message });
    }
  }, [initial]);
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
    if (form.message.trim() === "") return;
    onSave(form);
  };
  const alertConfig = getAlertIcon(form.type);
  const DynamicIcon = alertConfig.icon;
  const typeLabels: Record<string, string> = {
    danger: "Peligro",
    warning: "Advertencia",
    info: "Información",
  };
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title={initial ? "Editar Alerta" : "Nueva Alerta"}
      subtitle="Agregar alerta clínica al perfil del paciente"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 ${alertConfig.bgColor} rounded-lg`}>
            <DynamicIcon className={`w-5 h-5 ${alertConfig.color}`} />
          </div>
          <div>
            <h3 className="text-[12px] font-semibold text-white">
              Tipo de Alerta
            </h3>
            <p className="text-[10px] text-white/40 mt-0.5">Seleccione la severidad de la alerta</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-4">
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Severidad</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              <option value="danger">Peligro</option>
              <option value="warning">Advertencia</option>
              <option value="info">Información</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Mensaje</label>
            <textarea
              className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all min-h-[120px] resize-none placeholder:text-white/30"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describa la alerta clínica..."
            />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full ${alertConfig.color}`} />
            <span className="text-[10px] font-medium text-white/50">Vista previa</span>
          </div>
          <p className={`text-[11px] ${alertConfig.color} leading-relaxed`}>
            {form.message || "Escriba el mensaje de la alerta..."}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onClose}
          className="px-5 py-2.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 text-white text-[11px] font-medium rounded-lg transition-all ${
            form.type === "danger" 
              ? "bg-red-500/15 hover:bg-red-500/25 border border-red-500/25" 
              : form.type === "warning"
              ? "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25"
              : "bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25"
          }`}
        >
          <DynamicIcon className="w-4 h-4" />
          {initial ? "Actualizar" : "Crear Alerta"}
        </button>
      </div>
    </EliteModal>
  );
}