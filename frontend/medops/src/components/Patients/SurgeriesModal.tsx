// src/components/Patients/SurgeriesModal.tsx
import React, { useState, useEffect } from "react";
import EliteModal from "../Common/EliteModal";
import { Surgery } from "../../types/patients";
import { 
  ScissorsIcon, 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { X } from "lucide-react";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: Surgery;
  patientId: number;
}
interface Form {
  id?: number;                    // ✅ FIX AGREGADO - ID opcional para edición
  name: string;
  hospital: string;
  date: string;
  type: string;
  description: string;
  notes: string;
  status: string;
}
const SURGERY_TYPES = [
  { value: "quirúrgico", label: "Quirúrgico" },
  { value: "diagnóstico", label: "Diagnóstico" },
  { value: "procedimiento", label: "Procedimiento" },
  { value: "cosmético", label: "Cosmético" },
];
const SURGERY_STATUS = [
  { value: "programada", label: "Programada" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "postergada", label: "Postergada" },
];
const inputStyles = "w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-white/30 transition-all";
const labelStyles = "text-[9px] font-black text-white/30 uppercase tracking-[0.1em] mb-2 block";
const sectionStyles = "bg-[#0a0a0a] border border-white/10 rounded-sm p-4 space-y-4";
export default function SurgeriesModal({ open, onClose, onSave, initial, patientId }: Props) {
  const [form, setForm] = useState<Form>({
    id: undefined,                  // ✅ FIX AGREGADO - Inicializar ID como undefined
    name: "",
    hospital: "",
    date: "",
    type: "quirúrgico",
    description: "",
    notes: "",
    status: "programada"
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  useEffect(() => {
    if (open && initial) {
      setForm({
        id: initial.id,             // ✅ FIX AGREGADO - Incluir ID del formulario al editar
        name: initial.name || "",
        hospital: initial.hospital || "",
        date: initial.date || "",
        type: initial.type || "quirúrgico",
        description: initial.description || "",
        notes: initial.notes || "",
        status: initial.status || "programada"
      });
      setEditingId(initial.id);
    } else if (open) {
      // Reset form for new surgery
      setForm({
        id: undefined,               // ✅ FIX AGREGADO - Reset ID a undefined para nueva cirugía
        name: "",
        hospital: "",
        date: "",
        type: "quirúrgico",
        description: "",
        notes: "",
        status: "programada"
      });
      setEditingId(null);
    }
  }, [open, initial]);
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      onClose();
    }
  };
  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);
  const handleChange = (field: keyof Form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleSubmit = () => {
    const payload = {
      ...form,
      patientId: patientId
    };
    if (editingId) {
      payload.id = editingId;       // ✅ ESTA LÍNEA AHORA FUNCIONA SIN ERRORES
    }
    onSave(payload);
    onClose();
  };
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title="SURGICAL_REGISTRY_PROTOCOL"
      subtitle={editingId ? "EDIT_EXISTING_PROCEDURE" : "INITIALIZE_NEW_SURGICAL_ENTRY"}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Surgery Information Section */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-4">
            <ScissorsIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">
              SURGICAL_PROCEDURE_DATA
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelStyles}>PROCEDURE_IDENTIFIER</label>
              <input
                className={inputStyles}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="PROCEDURE_CODE_OR_NAME"
              />
            </div>
            
            <div>
              <label className={labelStyles}>MEDICAL_FACILITY</label>
              <input
                className={inputStyles}
                value={form.hospital}
                onChange={(e) => handleChange("hospital", e.target.value)}
                placeholder="HOSPITAL_OR_CLINIC_NAME"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelStyles}>SURGERY_DATE</label>
              <input
                type="date"
                className={inputStyles}
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
            
            <div>
              <label className={labelStyles}>PROCEDURE_TYPE</label>
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
        {/* Description Section */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-4">
            <PencilSquareIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-400">
              SURGICAL_DESCRIPTION_PROTOCOL
            </h3>
          </div>
          
          <textarea
            className={`${inputStyles} min-h-[120px] resize-none`}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="DETAILED_PROCEDURE_DESCRIPTION_MEDICAL_NOTES"
          />
        </div>
        {/* Notes Section */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-4">
            <CalendarDaysIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">
              CLINICAL_NOTES_REGISTRY
            </h3>
          </div>
          
          <textarea
            className={`${inputStyles} min-h-[80px] resize-none bg-black/60`}
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="ADDITIONAL_CLINICAL_OBSERVATIONS_COMMENTS_PROCEDURE_NOTES"
          />
        </div>
        {/* Patient Information Display */}
        <div className={sectionStyles}>
          <div className="flex items-center gap-3 mb-4">
            <UserCircleIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-400">
              PATIENT_SUBJECT_IDENTIFIER
            </h3>
          </div>
          <div className="bg-black/60 border border-white/10 rounded-sm p-4">
            <p className="text-[10px] font-mono text-white/80">
              PATIENT
Continuación del archivo completo:
              PATIENT_ID: {patientId}
            </p>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
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
          {editingId ? "UPDATE_SURGICAL_REGISTRY" : "CREATE_SURGICAL_ENTRY"}
        </button>
      </div>
    </EliteModal>
  );
}