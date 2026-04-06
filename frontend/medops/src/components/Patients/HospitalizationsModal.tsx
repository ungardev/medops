// src/components/Patients/HospitalizationsModal.tsx
import React, { useState, useEffect } from "react";
import { Hospitalization } from "../../types/patients";
import { 
  Bed,
  Save,
  Loader2,
  X,
} from "lucide-react";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: Hospitalization;
  patientId: number;
}
interface Form {
  id?: number;
  ward: string;
  room_number: string;
  bed_number: string;
  admission_type: string;
  status: string;
  admission_date: string;
  expected_discharge_date: string;
  chief_complaint: string;
  clinical_summary: string;
  allergies_at_admission: string;
  daily_notes: string;
}
const ADMISSION_TYPES = [
  { value: "emergency", label: "Emergencia" },
  { value: "scheduled", label: "Programada" },
  { value: "transfer", label: "Transferencia" },
  { value: "observation", label: "Observación" },
];
const HOSPITALIZATION_STATUSES = [
  { value: "admitted", label: "Admitido" },
  { value: "stable", label: "Estable" },
  { value: "critical", label: "Crítico" },
  { value: "improving", label: "En Mejoría" },
  { value: "awaiting_discharge", label: "Esperando Alta" },
  { value: "discharged", label: "Dado de Alta" },
];
export default function HospitalizationsModal({ open, onClose, onSave, initial, patientId }: Props) {
  const [form, setForm] = useState<Form>({
    id: undefined,
    ward: "",
    room_number: "",
    bed_number: "",
    admission_type: "emergency",
    status: "admitted",
    admission_date: "",
    expected_discharge_date: "",
    chief_complaint: "",
    clinical_summary: "",
    allergies_at_admission: "",
    daily_notes: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (open && initial) {
      setForm({
        id: initial.id,
        ward: initial.ward || "",
        room_number: initial.room_number || "",
        bed_number: initial.bed_number || "",
        admission_type: initial.admission_type || "emergency",
        status: initial.status || "admitted",
        admission_date: initial.admission_date ? initial.admission_date.split("T")[0] : "",
        expected_discharge_date: initial.expected_discharge_date || "",
        chief_complaint: initial.chief_complaint || "",
        clinical_summary: initial.clinical_summary || "",
        allergies_at_admission: initial.allergies_at_admission || "",
        daily_notes: initial.daily_notes || ""
      });
    } else if (open) {
      setForm({
        id: undefined,
        ward: "",
        room_number: "",
        bed_number: "",
        admission_type: "emergency",
        status: "admitted",
        admission_date: new Date().toISOString().split("T")[0],
        expected_discharge_date: "",
        chief_complaint: "",
        clinical_summary: "",
        allergies_at_admission: "",
        daily_notes: ""
      });
    }
  }, [open, initial]);
  const handleChange = (field: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleSubmit = () => {
    setIsSaving(true);
    const activeInstitutionId = localStorage.getItem("active_institution_id");
    const payload = {
      ...form,
      patient: patientId,
      institution: activeInstitutionId ? parseInt(activeInstitutionId) : undefined,
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
              <Bed className="h-4 w-4 text-white/60" />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-white">
                {initial?.id ? "Editar Hospitalización" : "Nueva Admisión"}
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">Registro de hospitalización</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Asignación de cama */}
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Pabellón / Sala</label>
              <input
                className={inputClass}
                value={form.ward}
                onChange={(e) => handleChange("ward", e.target.value)}
                placeholder="Ej: Medicina Interna, UCI, Pediatría"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Número de habitación</label>
                <input
                  className={inputClass}
                  value={form.room_number}
                  onChange={(e) => handleChange("room_number", e.target.value)}
                  placeholder="Ej: 301"
                />
              </div>
              <div>
                <label className={labelClass}>Número de cama</label>
                <input
                  className={inputClass}
                  value={form.bed_number}
                  onChange={(e) => handleChange("bed_number", e.target.value)}
                  placeholder="Ej: A, B, 1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Tipo de admisión</label>
                <select
                  className={inputClass}
                  value={form.admission_type}
                  onChange={(e) => handleChange("admission_type", e.target.value)}
                >
                  {ADMISSION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {HOSPITALIZATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {/* Cronología */}
          <div className={sectionClass}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha de ingreso</label>
                <input
                  type="datetime-local"
                  style={{colorScheme: 'dark'}}
                  className={inputClass}
                  value={form.admission_date}
                  onChange={(e) => handleChange("admission_date", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Fecha estimada de alta</label>
                <input
                  type="date"
                  style={{colorScheme: 'dark'}}
                  className={inputClass}
                  value={form.expected_discharge_date}
                  onChange={(e) => handleChange("expected_discharge_date", e.target.value)}
                />
              </div>
            </div>
          </div>
          {/* Clínica */}
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Motivo principal de ingreso</label>
              <textarea
                className={`${inputClass} min-h-[60px] resize-none`}
                value={form.chief_complaint}
                onChange={(e) => handleChange("chief_complaint", e.target.value)}
                placeholder="Motivo de la hospitalización..."
              />
            </div>
            <div>
              <label className={labelClass}>Resumen clínico</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-none`}
                value={form.clinical_summary}
                onChange={(e) => handleChange("clinical_summary", e.target.value)}
                placeholder="Resumen del estado clínico del paciente..."
              />
            </div>
            <div>
              <label className={labelClass}>Alergias al ingreso</label>
              <textarea
                className={`${inputClass} min-h-[50px] resize-none`}
                value={form.allergies_at_admission}
                onChange={(e) => handleChange("allergies_at_admission", e.target.value)}
                placeholder="Alergias conocidas al momento del ingreso..."
              />
            </div>
          </div>
          {/* Notas de evolución */}
          <div className={`${sectionClass} border-t border-white/10 pt-5`}>
            <div>
              <label className={labelClass}>Notas de evolución</label>
              <textarea 
                className={`${inputClass} min-h-[100px] resize-none`} 
                value={form.daily_notes} 
                onChange={(e) => handleChange("daily_notes", e.target.value)} 
                placeholder="Notas diarias de evolución del paciente..." 
              />
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