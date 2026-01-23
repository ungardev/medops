// src/components/Patients/SurgeriesModal.tsx
import React, { useState, useEffect } from "react";
import { Surgery } from "../../types/patients"; // ✅ FIX: Importar Surgery desde types/patients
import { 
  ScissorsIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  BuildingOfficeIcon, 
  UserCircleIcon,
  CalendarIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { X } from "lucide-react";
// ✅ FIX: Eliminada la definición local de Surgery
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: Surgery;
  patientId: number;
}
export default function SurgeriesModal({ open, onClose, onSave, initial, patientId }: Props) {
  const [form, setForm] = useState<Partial<Surgery>>({
    name: "",
    hospital: "",
    date: "",
    type: "quirúrgico",
    description: "",
    notes: "",
    status: "programada"
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
    const payload = {
      ...form,
      patient: patientId,
      date: form.date || null,
      doctor_id: 1 // default
    };
    onSave(payload);
  };
  const handleChange = (field: keyof Surgery, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
            {initial ? "Actualizar" : "Agregar"}
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
              Procedimiento
            </label>
            <input
              type="text"
              value={form.name || ""} // ✅ FIX: Convertir null a ""
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nombre de la cirugía"
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
              Hospital (opcional)
            </label>
            <input
              type="text"
              value={form.hospital || ""} // ✅ FIX: Convertir null a ""
              onChange={(e) => handleChange("hospital", e.target.value)}
              placeholder="Nombre del hospital o centro"
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
                  Tipo
              </label>
              <select
                value={form.type || ""} // ✅ FIX: Convertir null a ""
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
              >
                <option value="quirúrgico">Quirúrgico</option>
                <option value="diagnóstico">Diagnóstico</option>
                <option value="procedimiento">Procedimiento</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
                  Fecha
              </label>
              <input
                type="date"
                value={form.date || ""} // ✅ FIX: Convertir null a ""
                onChange={(e) => handleChange("date", e.target.value)}
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={form.notes || ""} // ✅ FIX: Convertir null a ""
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Detalles adicionales..."
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-md px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[var(--palantir-active)]/40 min-h-[60px] resize-none"
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