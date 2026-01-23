// src/components/Patients/VaccinationModal.tsx
import React, { useState, useEffect } from "react";
import { 
  BeakerIcon, 
  CheckIcon
} from "@heroicons/react/24/outline";
import { X } from "lucide-react";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: any;
  vaccines: any[];
  patientId: number;
}
export default function VaccinationModal({ open, onClose, onSave, initial, vaccines, patientId }: Props) {
  // 🔍 DIAGNOSTIC LOG: Verificar si este modal está abierto
  console.log('VaccinationModal open:', open);
  
  const [form, setForm] = useState<any>({
    vaccine: "",
    vaccine_detail: null as any,
    date_administered: "",
    lot: "",
    center: "",
  });
  // ⭐ NEW: Agregar soporte para tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  if (!open) return null;
  const handleSubmit = () => {
    if (!form.vaccine || !form.date_administered) {
      return;
    }
    const payload = {
      patient: patientId,
      vaccine: typeof form.vaccine === "string" ? parseInt(form.vaccine) : form.vaccine,
      vaccine_detail: form.vaccine_detail,
      dose_number: 1,
      date_administered: form.date_administered,
      lot: form.lot || "",
      center: form.center || "",
    };
    onSave(payload);
  };
  return (
    <div 
      onClick={onClose} // ✅ FIX: Agregar onClick al backdrop
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div 
        onClick={(e) => e.stopPropagation()} // ✅ FIX: Prevenir cerrar al hacer clic en el contenido
        className="bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-mono text-[var(--palantir-text)] uppercase tracking-widest">
            {initial ? "Actualizar Registro" : "Nuevo Registro"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--palantir-muted)] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
              Vacuna
            </label>
            <select
              value={form.vaccine}
              onChange={(e) => setForm({ ...form, vaccine: e.target.value })}
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
            >
              <option value="">Seleccione...</option>
              {vaccines.map((v: any) => (
                <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={form.date_administered}
              onChange={(e) => setForm({ ...form, date_administered: e.target.value })}
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
              Lote (opcional)
            </label>
            <input
              type="text"
              value={form.lot}
              onChange={(e) => setForm({ ...form, lot: e.target.value })}
              placeholder="ABC-1234"
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
              Centro (opcional)
            </label>
            <input
              type="text"
              value={form.center}
              onChange={(e) => setForm({ ...form, center: e.target.value })}
              placeholder="Nombre del centro"
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--palantir-muted)] hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm"
          >
            <CheckIcon className="w-4 h-4" />
            {initial ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}