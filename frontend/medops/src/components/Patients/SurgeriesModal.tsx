// src/components/Patients/SurgeriesModal.tsx
import React, { useState, useEffect } from "react";
import { Surgery } from "../../types/patients";
import { 
  ScissorsIcon, 
  Save,
  Loader2,
  X
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
  date: string;
  type: string;
  description: string;
  notes: string;
}
const SURGERY_TYPES = [
  { value: "quirurgico", label: "Quirúrgico" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "procedimiento", label: "Procedimiento" },
  { value: "cosmetico", label: "Cosmético" },
];
export default function SurgeriesModal({ open, onClose, onSave, initial, patientId }: Props) {
  const [form, setForm] = useState<Form>({
    id: undefined,
    name: "",
    hospital: "",
    date: "",
    type: "quirurgico",
    description: "",
    notes: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (open && initial) {
      setForm({
        id: initial.id,
        name: initial.name || "",
        hospital: initial.hospital || "",
        date: initial.date || "",
        type: initial.type || "quirurgico",
        description: initial.description || "",
        notes: initial.notes || ""
      });
    } else if (open) {
      setForm({
        id: undefined,
        name: "",
        hospital: "",
        date: "",
        type: "quirurgico",
        description: "",
        notes: ""
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
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
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
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Nombre del procedimiento</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ej: Apendicectomía"
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
                <label className={labelClass}>Fecha</label>
                <input
                  type="date"
                  style={{colorScheme: 'dark'}}
                  className={inputClass}
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo</label>
                <select
                  className={inputClass}
                  value={form.type}
                  onChange={(e) => handleChange("type", e.target.value)}
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
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Descripción</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-none`}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Detalles del procedimiento..."
              />
            </div>
          </div>
          <div className={`${sectionClass} border-t border-white/10 pt-5`}>
            <label className={labelClass}>Notas clínicas</label>
            <textarea 
              className={`${inputClass} min-h-[100px] resize-none`} 
              value={form.notes} 
              onChange={(e) => handleChange("notes", e.target.value)} 
              placeholder="Observaciones adicionales..." 
            />
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