// src/components/Patients/SurgeriesModal.tsx
import React, { useState } from "react";
import { 
  Activity, 
  Stethoscope, 
  Calendar, 
  Building2, 
  FileText, 
  User, 
  X, 
  Save, 
  ChevronRight 
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: any;
}

export default function SurgeriesModal({
  open,
  onClose,
  onSave,
  initial,
}: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    hospital: initial?.hospital ?? "",
    date: initial?.date ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "realizada",
    doctor: initial?.doctor ?? "",
  });

  if (!open) return null;

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  // Helper para el color del badge de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "realizada": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "programada": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "cancelada": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  return (
    <div className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-[#11141a] border border-[var(--palantir-border)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera Quirúrgica */}
        <div className="px-6 py-4 border-b border-[var(--palantir-border)] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {initial ? "Editar Intervención" : "Nueva Cirugía / Proc."}
              </h3>
              <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                Registro Quirúrgico Especializado
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Formulario Estructurado */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Nombre del Procedimiento */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
              <Stethoscope size={12} /> Procedimiento
            </label>
            <input
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-emerald-500 outline-none transition-all"
              placeholder="Ej: Apendicectomía Laparoscópica"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} /> Fecha
              </label>
              <input
                type="date"
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-emerald-500 outline-none [color-scheme:dark]"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <ChevronRight size={12} /> Estado Actual
              </label>
              <select
                className={`w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm outline-none focus:border-emerald-500 transition-all ${getStatusColor(form.status)}`}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="realizada">Realizada</option>
                <option value="programada">Programada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Hospital */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <Building2 size={12} /> Centro / Hospital
              </label>
              <input
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-emerald-500 outline-none"
                placeholder="Nombre de la institución"
                value={form.hospital}
                onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              />
            </div>

            {/* Doctor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={12} /> Cirujano Responsable
              </label>
              <input
                className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-xl py-2.5 px-4 text-sm text-white focus:border-emerald-500 outline-none"
                placeholder="Dr. / Dra."
                value={form.doctor}
                onChange={(e) => setForm({ ...form, doctor: e.target.value })}
              />
            </div>
          </div>

          {/* Descripción / Hallazgos */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
              <FileText size={12} /> Descripción y Hallazgos
            </label>
            <textarea
              className="w-full bg-[#0d1117]/50 border border-[var(--palantir-border)] rounded-xl py-3 px-4 text-sm text-white focus:border-emerald-500 outline-none min-h-[100px] resize-none"
              placeholder="Detalles de la intervención, complicaciones o hallazgos relevantes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 bg-black/20 border-t border-[var(--palantir-border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-emerald-900/20"
          >
            <Save size={16} />
            {initial ? "Actualizar Registro" : "Guardar Procedimiento"}
          </button>
        </div>
      </div>
    </div>
  );
}
