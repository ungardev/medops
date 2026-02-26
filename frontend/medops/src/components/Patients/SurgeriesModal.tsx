// src/components/Patients/SurgeriesModal.tsx
import React, { useState, useEffect } from "react";
import { Surgery } from "../../types/patients";
import { 
  ScissorsIcon, 
  Save,
  Loader2
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
  { value: "quirurgico", label: "QUIRURGICO" },
  { value: "diagnostico", label: "DIAGNOSTICO" },
  { value: "procedimiento", label: "PROCEDIMIENTO" },
  { value: "cosmetico", label: "COSMETICO" },
];
const inputStyles = "w-full bg-black/40 border border-white/20 rounded-sm px-4 py-3 text-[13px] text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all";
const labelStyles = "text-[11px] font-bold text-white/70 uppercase tracking-[0.1em] mb-2 block";
const sectionStyles = "bg-white/[0.02] border border-white/10 rounded-sm p-5 space-y-4";
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-400/30">
              <ScissorsIcon className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-white">
                {initial?.id ? "EDIT_REGISTRY" : "NEW_ENTRY"}
              </h3>
              <p className="text-[10px] font-mono text-white/50 uppercase">Surgical Procedure</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="p-6 space-y-5">
          <div className={sectionStyles}>
            <div>
              <label className={labelStyles}>Procedure Name</label>
              <input
                className={inputStyles}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="PROCEDURE_NAME"
              />
            </div>
            <div>
              <label className={labelStyles}>Medical Facility</label>
              <input
                className={inputStyles}
                value={form.hospital}
                onChange={(e) => handleChange("hospital", e.target.value)}
                placeholder="HOSPITAL_OR_CLINIC"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Date</label>
                <input
                  type="date"
                  style={{colorScheme: 'dark'}}
                  className={inputStyles}
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div>
                <label className={labelStyles}>Type</label>
                <select
                  className={inputStyles}
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
          <div className={sectionStyles}>
            <div>
              <label className={labelStyles}>Description</label>
              <textarea
                className={`${inputStyles} min-h-[80px] resize-none`}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="PROCEDURE_DETAILS"
              />
            </div>
          </div>
          <div className={`${sectionStyles} border-t border-white/20 pt-5`}>
            <label className={labelStyles}>Clinical Notes</label>
            <textarea 
              className={`${inputStyles} min-h-[100px] resize-none bg-black/60`} 
              value={form.notes} 
              onChange={(e) => handleChange("notes", e.target.value)} 
              placeholder="OBSERVATIONS" 
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/40">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white bg-blue-500/20 border border-white/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                {initial?.id ? "UPDATE" : "CREATE"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}