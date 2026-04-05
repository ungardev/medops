// src/components/Patients/SurgeriesModal.tsx
import React, { useState, useEffect } from "react";
import { Surgery } from "../../types/patients";
import { 
  ScissorsIcon, 
  Save,
  Loader2,
  X,
  ShieldCheckIcon,
  AlertTriangle,
} from "lucide-react";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: Surgery;
  patientId: number;
}
interface Form {
  id?: number;
  name: string;
  hospital: string;
  scheduled_date: string;
  surgery_type: string;
  status: string;
  risk_level: string;
  asa_classification: string;
  procedure_description: string;
  complications: string;
  post_op_instructions: string;
}
const SURGERY_TYPES = [
  { value: "elective", label: "Electiva / Programada" },
  { value: "emergency", label: "Emergencia" },
  { value: "ambulatory", label: "Ambulatoria" },
  { value: "minimally_invasive", label: "Mínimamente Invasiva" },
  { value: "open", label: "Cirugía Abierta" },
];
const SURGERY_STATUSES = [
  { value: "scheduled", label: "Programada" },
  { value: "pre_op", label: "En Pre-operatorio" },
  { value: "in_progress", label: "En Curso" },
  { value: "completed", label: "Completada" },
  { value: "canceled", label: "Cancelada" },
  { value: "postponed", label: "Pospuesta" },
];
const RISK_LEVELS = [
  { value: "low", label: "Bajo Riesgo" },
  { value: "moderate", label: "Riesgo Moderado" },
  { value: "high", label: "Alto Riesgo" },
  { value: "critical", label: "Crítico" },
];
const ASA_CLASSIFICATIONS = [
  { value: "", label: "No aplica" },
  { value: "I", label: "ASA I - Paciente sano" },
  { value: "II", label: "ASA II - Enfermedad leve" },
  { value: "III", label: "ASA III - Enfermedad severa" },
  { value: "IV", label: "ASA IV - Amenaza la vida" },
  { value: "V", label: "ASA V - Paciente moribundo" },
];
export default function SurgeriesModal({ open, onClose, onSave, initial, patientId }: Props) {
  const [form, setForm] = useState<Form>({
    id: undefined,
    name: "",
    hospital: "",
    scheduled_date: "",
    surgery_type: "elective",
    status: "scheduled",
    risk_level: "moderate",
    asa_classification: "",
    procedure_description: "",
    complications: "",
    post_op_instructions: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (open && initial) {
      setForm({
        id: initial.id,
        name: initial.name || "",
        hospital: initial.hospital || "",
        scheduled_date: initial.scheduled_date || "",
        surgery_type: initial.surgery_type || "elective",
        status: initial.status || "scheduled",
        risk_level: initial.risk_level || "moderate",
        asa_classification: initial.asa_classification || "",
        procedure_description: initial.procedure_description || "",
        complications: initial.complications || "",
        post_op_instructions: initial.post_op_instructions || ""
      });
    } else if (open) {
      setForm({
        id: undefined,
        name: "",
        hospital: "",
        scheduled_date: "",
        surgery_type: "elective",
        status: "scheduled",
        risk_level: "moderate",
        asa_classification: "",
        procedure_description: "",
        complications: "",
        post_op_instructions: ""
      });
    }
  }, [open, initial]);
  const handleChange = (field: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleSubmit = () => {
    setIsSaving(true);
    const payload = {
      ...form,
      patient: patientId
    };
    onSave(payload);
    setIsSaving(false);
    onClose();
  };
  const inputClass = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelClass = "text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block";
  const sectionClass = "bg-white/5 border border-white/10 rounded-lg p-5 space-y-4";
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5 sticky top-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
              <ScissorsIcon className="h-4 w-4 text-white/60" />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-white">
                {initial?.id ? "Editar Cirugía" : "Nueva Cirugía"}
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">Procedimiento quirúrgico</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Identificación */}
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Nombre del procedimiento</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej: Apendicectomía laparoscópica"
              />
            </div>
            <div>
              <label className={labelClass}>Centro médico</label>
              <input
                className={inputClass}
                value={form.hospital}
                onChange={(e) => handleChange("hospital", e.target.value)}
                placeholder="Hospital o clínica"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha programada</label>
                <input
                  type="date"
                  style={{colorScheme: 'dark'}}
                  className={inputClass}
                  value={form.scheduled_date}
                  onChange={(e) => handleChange("scheduled_date", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo de cirugía</label>
                <select
                  className={inputClass}
                  value={form.surgery_type}
                  onChange={(e) => handleChange("surgery_type", e.target.value)}
                >
                  {SURGERY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Clasificación */}
          <div className={sectionClass}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-4 h-4 text-white/40" />
              <span className="text-[11px] font-medium text-white/60">Clasificación de Riesgo</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Estado</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {SURGERY_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nivel de riesgo</label>
                <select
                  className={inputClass}
                  value={form.risk_level}
                  onChange={(e) => handleChange("risk_level", e.target.value)}
                >
                  {RISK_LEVELS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Clasificación ASA</label>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-white/30" />
                <select
                  className={inputClass}
                  value={form.asa_classification}
                  onChange={(e) => handleChange("asa_classification", e.target.value)}
                >
                  {ASA_CLASSIFICATIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Descripción del procedimiento */}
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Descripción del procedimiento</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-none`}
                value={form.procedure_description}
                onChange={(e) => handleChange("procedure_description", e.target.value)}
                placeholder="Detalles técnicos del procedimiento..."
              />
            </div>
          </div>
          {/* Post-operatorio y complicaciones */}
          <div className={`${sectionClass} border-t border-white/10 pt-5`}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Instrucciones post-operatorias</label>
                <textarea 
                  className={`${inputClass} min-h-[60px] resize-none`} 
                  value={form.post_op_instructions} 
                  onChange={(e) => handleChange("post_op_instructions", e.target.value)} 
                  placeholder="Cuidados post-operatorios..." 
                />
              </div>
              <div>
                <label className={labelClass}>Complicaciones</label>
                <textarea 
                  className={`${inputClass} min-h-[60px] resize-none`} 
                  value={form.complications} 
                  onChange={(e) => handleChange("complications", e.target.value)} 
                  placeholder="Complicaciones intra o post-operatorias..." 
                />
              </div>
            </div>
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
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-medium text-white bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                {initial?.id ? "Actualizar" : "Guardar"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}