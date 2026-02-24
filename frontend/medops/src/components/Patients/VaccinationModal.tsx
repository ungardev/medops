// src/components/Patients/VaccinationModal.tsx
import React, { useState, useEffect } from "react";
import { 
  BeakerIcon, 
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import EliteModal from "../Common/EliteModal";
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
  // Sincronizar formulario con datos iniciales
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
      // Reset formulario para nueva vacunación
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
  // Constantes de estilos Elite
  const inputStyles = "w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-white/30 transition-all";
  const labelStyles = "text-[9px] font-black text-white/30 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-[#0a0a0a] border border-white/10 rounded-sm p-4 space-y-4";
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title="VACCINATION_REGISTRY_PROTOCOL"
      subtitle={initial ? "UPDATE_EXISTING_RECORD" : "INITIALIZE_NEW_VACCINATION"}
      maxWidth="max-w-xl"
      showDotIndicator={true}
    >
      <div className="space-y-6">
        {/* Header con icono */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <BeakerIcon className="w-5 h-5" />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">
            VACCINATION_ADMINISTRATION_DATA
          </h3>
        </div>
        {/* Formulario de Vacunación */}
        <div className={sectionStyles}>
          <div>
            <label className={labelStyles}>VACCINE_IDENTIFIER</label>
            <select
              value={form.vaccine}
              onChange={(e) => setForm({ ...form, vaccine: e.target.value })}
              className={inputStyles}
            >
              <option value="">SELECT_VACCINE...</option>
              {vaccines.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelStyles}>ADMINISTRATION_DATE</label>
            <input
              type="date"
              value={form.date_administered}
              onChange={(e) => setForm({ ...form, date_administered: e.target.value })}
              className={inputStyles}
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label className={labelStyles}>BATCH_NUMBER</label>
            <input
              type="text"
              value={form.lot}
              onChange={(e) => setForm({ ...form, lot: e.target.value })}
              placeholder="BATCH_CODE_IDENTIFIER"
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>ADMINISTRATION_CENTER</label>
            <input
              type="text"
              value={form.center}
              onChange={(e) => setForm({ ...form, center: e.target.value })}
              placeholder="CENTER_NAME_OR_CODE"
              className={inputStyles}
            />
          </div>
        </div>
        {/* Patient Information Display */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">
              PATIENT_SUBJECT_IDENTIFIER
            </h3>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-sm p-4">
            <p className="text-[10px] font-mono text-white/80">
              PATIENT_ID: {patientId}
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
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-all font-mono"
        >
          <CheckIcon className="w-4 h-4" />
          {initial ? "UPDATE_VACCINATION_RECORD" : "CREATE_VACCINATION_ENTRY"}
        </button>
      </div>
    </EliteModal>
  );
}