// src/components/Patients/VaccinationModal.tsx
import React, { useState, useEffect } from "react";
import { 
  BeakerIcon, 
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: any;
  vaccines: any[];
  patientId: number;
}
export default function VaccinationModal({ open, onClose, onSave, initial, vaccines, patientId }: Props) {
  const [form, setForm] = useState<any>({
    vaccine: "",
    vaccine_detail: null as any,
    date_administered: "",
    lot: "",
    center: "",
  });
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  useEffect(() => {
    if (open && initial) {
      setForm({
          vaccine: initial.vaccine || "",
          vaccine_detail: initial.vaccine_detail || null,
          date_administered: initial.date_administered || "",
          lot: initial.lot || "",
          center: initial.center || "",
        });
    } else if (open && !initial) {
      setForm({
        vaccine: "",
        vaccine_detail: null,
        date_administered: "",
        lot: "",
        center: "",
      });
    }
  }, [open, initial]);
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
  const inputClass = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelClass = "text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block";
  const sectionClass = "bg-white/5 border border-white/10 rounded-lg p-5 space-y-4";
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5 sticky top-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <BeakerIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-white">
                {initial ? "Editar Vacuna" : "Registrar Vacuna"}
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">Datos de vacunación</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Vacuna</label>
              <select
                value={form.vaccine}
                onChange={(e) => setForm({ ...form, vaccine: e.target.value })}
                className={inputClass}
              >
                <option value="">Seleccionar vacuna...</option>
                {vaccines.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha de aplicación</label>
              <input
                type="date"
                value={form.date_administered}
                onChange={(e) => setForm({ ...form, date_administered: e.target.value })}
                className={inputClass}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className={labelClass}>Número de lote</label>
              <input
                type="text"
                value={form.lot}
                onChange={(e) => setForm({ ...form, lot: e.target.value })}
                placeholder="Código del lote"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Centro de aplicación</label>
              <input
                type="text"
                value={form.center}
                onChange={(e) => setForm({ ...form, center: e.target.value })}
                placeholder="Nombre del centro"
                className={inputClass}
              />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-[10px] font-medium text-white/50">Paciente</span>
            </div>
            <p className="text-[11px] text-white/60">ID: #{patientId}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/15 bg-white/5 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-medium text-white bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all"
          >
            <CheckIcon className="w-4 h-4" />
            {initial ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}