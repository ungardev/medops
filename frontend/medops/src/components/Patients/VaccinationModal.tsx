// src/components/Patients/VaccinationModal.tsx
import React, { useState } from "react";
import { PatientVaccination, PatientVaccinationPayload } from "../../hooks/patients/useVaccinations";
import { Syringe, Calendar, Building2, Hash, X, Save, Clock } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: PatientVaccinationPayload) => void;
  initial?: PatientVaccination | null;
  vaccines: { id: number; code: string; name: string; dose_number?: number }[];
  patientId: number;
}

export default function VaccinationModal({
  open,
  onClose,
  onSave,
  initial,
  vaccines,
  patientId,
}: Props) {
  const [form, setForm] = useState({
    vaccineId: initial?.vaccine_detail?.id ?? "",
    dose_number: initial?.dose_number ?? "",
    date_administered: initial?.date_administered ?? "",
    center: initial?.center ?? "",
    lot: initial?.lot ?? "",
    next_dose_date: initial?.next_dose_date ?? "",
  });

  if (!open) return null;

  const handleSave = () => {
    const payload: PatientVaccinationPayload = {
      patient: patientId,
      vaccine: Number(form.vaccineId),
      dose_number: Number(form.dose_number),
      date_administered: form.date_administered,
      center: form.center || undefined,
      lot: form.lot || undefined,
      next_dose_date: form.next_dose_date || undefined,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-[#11141a] border border-[var(--palantir-border)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-[var(--palantir-border)] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Syringe size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {initial ? "Editar Inmunización" : "Registrar Vacuna"}
              </h3>
              <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">
                Registro de Prevención
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <div className="p-6 space-y-5">
          
          {/* Fila Principal: Selección de Vacuna */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
              <Syringe size={12} /> Vacuna Específica
            </label>
            <select
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
              value={form.vaccineId}
              onChange={(e) => setForm({ ...form, vaccineId: e.target.value })}
            >
              <option value="">Seleccione el biológico...</option>
              {vaccines.map((v, idx) => (
                <option key={`${v.id}-${idx}`} value={v.id}>
                  {v.code} — {v.name} {v.dose_number ? ` (Dosis ${v.dose_number})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Número de dosis */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Hash size={12} /> Nº Dosis
              </label>
              <input
                type="number"
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-blue-500 outline-none"
                value={form.dose_number}
                onChange={(e) => setForm({ ...form, dose_number: e.target.value })}
                placeholder="Ej: 1"
              />
            </div>

            {/* Fecha Aplicada */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} /> Fecha Aplicación
              </label>
              <input
                type="date"
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-blue-500 outline-none [color-scheme:dark]"
                value={form.date_administered}
                onChange={(e) => setForm({ ...form, date_administered: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Centro */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Building2 size={12} /> Centro Médico
              </label>
              <input
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-blue-500 outline-none"
                value={form.center}
                onChange={(e) => setForm({ ...form, center: e.target.value })}
                placeholder="Hospital, Clínica..."
              />
            </div>

            {/* Lote */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Hash size={12} /> Lote / Batch
              </label>
              <input
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-blue-500 outline-none"
                value={form.lot}
                onChange={(e) => setForm({ ...form, lot: e.target.value })}
                placeholder="ID de fabricación"
              />
            </div>
          </div>

          {/* Próxima Dosis (Destacado) */}
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-2">
            <label className="text-[10px] font-mono text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Programar Próxima Dosis
            </label>
            <input
              type="date"
              className="w-full bg-transparent border-b border-blue-500/30 py-1 text-sm text-white focus:border-blue-500 outline-none [color-scheme:dark]"
              value={form.next_dose_date}
              onChange={(e) => setForm({ ...form, next_dose_date: e.target.value })}
            />
            <p className="text-[9px] text-slate-500 italic mt-1">
              Opcional: Dejar en blanco si el esquema está completo.
            </p>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="p-6 bg-black/20 border-t border-[var(--palantir-border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-blue-900/20"
          >
            <Save size={16} />
            {initial ? "Actualizar Registro" : "Confirmar Aplicación"}
          </button>
        </div>
      </div>
    </div>
  );
}
