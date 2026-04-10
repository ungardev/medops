// src/components/Patients/HospitalizationsModal.tsx
import React, { useState, useEffect } from "react";
import { Hospitalization } from "../../types/patients";
import { 
  Bed,
  Save,
  Loader2,
  X,
} from "lucide-react";
import { patientClient } from "@/api/patient/client";
import { useSpecialties } from "@/hooks/consultations/useSpecialties";
import { useIcdSearch } from "@/hooks/diagnosis/useIcdSearch";
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: Hospitalization;
  patientId: number;
}
interface Form {
  id?: number;
  hospital: string;
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
  // Medical Tracking Fields
  attending_doctor: number | null;
  admission_diagnosis: number | null;
  vital_signs: {
    weight: number | null;
    height: number | null;
    temperature: number | null;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    heart_rate: number | null;
    respiratory_rate: number | null;
    oxygen_saturation: number | null;
  };
  complications: string;
  // Discharge Fields
  discharge_type: string | null;
  discharge_summary: string | null;
  discharge_instructions: string | null;
  discharge_medications: string | null;
  actual_discharge_date: string | null;
  // For search inputs
  doctorSearchQuery: string;
  diagnosisSearchQuery: string;
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
    hospital: "",
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
        hospital: (initial as any).hospital || "",
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
        daily_notes: initial.daily_notes || "",
        // Medical Tracking Fields
        attending_doctor: initial.attending_doctor ?? null,
        admission_diagnosis: initial.admission_diagnosis ?? null,
        vital_signs: {
          weight: initial.vital_signs?.weight ?? null,
          height: initial.vital_signs?.height ?? null,
          temperature: initial.vital_signs?.temperature ?? null,
          bp_systolic: initial.vital_signs?.bp_systolic ?? null,
          bp_diastolic: initial.vital_signs?.bp_diastolic ?? null,
          heart_rate: initial.vital_signs?.heart_rate ?? null,
          respiratory_rate: initial.vital_signs?.respiratory_rate ?? null,
          oxygen_saturation: initial.vital_signs?.oxygen_saturation ?? null
        },
        complications: initial.complications || "",
        // Discharge Fields
        discharge_type: initial.discharge_type ?? null,
        discharge_summary: initial.discharge_summary ?? null,
        discharge_instructions: initial.discharge_instructions ?? null,
        discharge_medications: initial.discharge_medications ?? null,
        actual_discharge_date: initial.actual_discharge_date ?? null,
        // For search inputs
        doctorSearchQuery: "",
        diagnosisSearchQuery: ""
      });
    } else if (open) {
      setForm({
        id: undefined,
        hospital: "",
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
        daily_notes: "",
        // Medical Tracking Fields
        attending_doctor: null,
        admission_diagnosis: null,
        vital_signs: {
          weight: null,
          height: null,
          temperature: null,
          bp_systolic: null,
          bp_diastolic: null,
          heart_rate: null,
          respiratory_rate: null,
          oxygen_saturation: null
        },
        complications: "",
        // Discharge Fields
        discharge_type: null,
        discharge_summary: null,
        discharge_instructions: null,
        discharge_medications: null,
        actual_discharge_date: null,
        // For search inputs
        doctorSearchQuery: "",
        diagnosisSearchQuery: ""
      });
    }
  }, [open, initial]);
  
  // Search hooks
  const { data: specialties = [] } = useSpecialties("");
  const [diagnosisSearchQuery, setDiagnosisSearchQuery] = useState("");
  const { data: icdResults = [], isLoading: icdLoading } = useIcdSearch(diagnosisSearchQuery);
  const [doctorSearchResults, setDoctorSearchResults] = useState([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  
  // Search doctors
  useEffect(() => {
    if (doctorSearchQuery.trim().length >= 2) {
      patientClient.searchDoctors(doctorSearchQuery).then(response => {
        setDoctorSearchResults(response.data.results || []);
      });
    } else if (doctorSearchQuery.trim().length === 0) {
      setDoctorSearchResults([]);
    }
  }, [doctorSearchQuery]);
  
  // ICD-11 search effect (handled by hook automatically)
  
  const handleChange = (field: keyof Form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleDiagnosisSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiagnosisSearchQuery(e.target.value);
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
          {/* Centro médico */}
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Centro médico</label>
              <input
                className={inputClass}
                value={form.hospital}
                onChange={(e) => handleChange("hospital", e.target.value)}
                placeholder="Hospital o clínica"
              />
            </div>
          </div>
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
           
           {/* Equipo Médico */}
           <div className={sectionClass}>
             <div>
               <label className={labelClass}>Médico Responsable</label>
               <div className="relative">
                 <input
                   type="text"
                   className={inputClass}
                   value={doctorSearchQuery}
                   onChange={(e) => {
                     setDoctorSearchQuery(e.target.value);
                     // Update form with null when clearing search
                     if (e.target.value === '') {
                       handleChange("attending_doctor", null);
                     }
                   }}
                   placeholder="Buscar médico por nombre o especialidad..."
                 />
                 {doctorSearchQuery.length >= 2 && doctorSearchResults.length > 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white/10 border border-white/15 rounded-lg max-h-48 overflow-y-auto z-10">
                     {doctorSearchResults.map((doctor: any) => (
                       <div
                         key={doctor.id}
                         className="px-4 py-2 text-white/70 hover:bg-white/5 hover:text-white cursor-pointer border-b border-white/10 last:border-b-0"
                         onClick={() => {
                           handleChange("attending_doctor", doctor.id);
                           setDoctorSearchQuery(`${doctor.first_name} ${doctor.last_name || ''}`.trim());
                           setDoctorSearchResults([]);
                         }}
                       >
                         <div className="font-medium">{doctor.first_name} {doctor.last_name || ''}</div>
                         <div className="text-[10px] text-white/50">{doctor.specialty || 'Sin especialidad'}</div>
                       </div>
                     ))}
                     {doctorSearchResults.length === 0 && (
                       <div className="px-4 py-2 text-white/50 text-[10px]">
                         No se encontraron médicos
                       </div>
                     )}
                   </div>
                 )}
                 {doctorSearchQuery.length >= 2 && doctorSearchResults.length === 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white/10 border border-white/15 rounded-lg max-h-48 overflow-y-auto z-10">
                     <div className="px-4 py-2 text-white/50 text-[10px]">
                       Buscando médicos...
                     </div>
                   </div>
                 )}
               </div>
               {form.attending_doctor !== null && (
                 <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-lg">
                   <div className="flex items-center gap-2">
                     {/* We would need to fetch doctor details to display name, but for now show ID */}
                     <span className="text-white/70">Médico seleccionado (ID: {form.attending_doctor})</span>
                     <button
                       onClick={() => {
                         handleChange("attending_doctor", null);
                         setDoctorSearchQuery("");
                         setDoctorSearchResults([]);
                       }}
                       className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
           
           {/* Diagnóstico de Ingreso */}
           <div className={sectionClass}>
             <div>
               <label className={labelClass}>Diagnóstico de Ingreso</label>
               <div className="relative">
                 <input
                   type="text"
                   className={inputClass}
                   value={diagnosisSearchQuery}
                   onChange={handleDiagnosisSearchChange}
                   placeholder="Buscar diagnóstico por código o descripción (ICD-11)..."
                 />
                 {diagnosisSearchQuery.length >= 2 && icdResults.length > 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white/10 border border-white/15 rounded-lg max-h-48 overflow-y-auto z-10">
                     {icdResults.map((diagnosis: any) => (
                       <div
                         key={diagnosis.id}
                         className="px-4 py-2 text-white/70 hover:bg-white/5 hover:text-white cursor-pointer border-b border-white/10 last:border-b-0"
                         onClick={() => {
                           handleChange("admission_diagnosis", diagnosis.id);
                           setDiagnosisSearchQuery(`${diagnosis.code} - ${diagnosis.description}`);
                         }}
                       >
                         <div className="font-medium">{diagnosis.code}</div>
                         <div className="text-[10px] text-white/50">{diagnosis.description}</div>
                       </div>
                     ))}
                     {icdResults.length === 0 && (
                       <div className="px-4 py-2 text-white/50 text-[10px]">
                         No se encontraron diagnósticos
                       </div>
                     )}
                   </div>
                 )}
                 {diagnosisSearchQuery.length >= 2 && icdResults.length === 0 && icdLoading && (
                   <div className="absolute left-0 right-0 mt-1 bg-white/10 border border-white/15 rounded-lg max-h-48 overflow-y-auto z-10">
                     <div className="px-4 py-2 text-white/50 text-[10px]">
                       Buscando diagnósticos...
                     </div>
                   </div>
                 )}
                 {diagnosisSearchQuery.length >= 2 && icdResults.length === 0 && !icdLoading && (
                   <div className="absolute left-0 right-0 mt-1 bg-white/10 border border-white/15 rounded-lg max-h-48 overflow-y-auto z-10">
                     <div className="px-4 py-2 text-white/50 text-[10px]">
                       No se encontraron diagnósticos
                     </div>
                   </div>
                 )}
               </div>
               {form.admission_diagnosis !== null && (
                 <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-lg">
                   <div className="flex items-center gap-2">
                     <span className="text-white/70">Diagnóstico seleccionado (ID: {form.admission_diagnosis})</span>
                     <button
                       onClick={() => {
                         handleChange("admission_diagnosis", null);
                         setDiagnosisSearchQuery("");
                       }}
                       className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
                     ))}
                     {doctorSearchResults.length === 0 && (
                       <div className="px-4 py-2 text-white/50 text-[10px]">
                         No se encontraron médicos
                       </div>
                     )}
                   </div>
                 )}
                 {doctorSearchQuery.length >= 2 && doctorSearchResults.length === 0 && (
                   <div className="absolute left-0 right-0 mt-1 bg-white/10 border border-white/15 rounded-lg max-h-48 overflow-y-auto z-10">
                     <div className="px-4 py-2 text-white/50 text-[10px]">
                       Buscando médicos...
                     </div>
                   </div>
                 )}
               </div>
               {form.attending_doctor !== null && (
                 <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/15 rounded-lg">
                   <div className="flex items-center gap-2">
                     {/* We would need to fetch doctor details to display name, but for now show ID */}
                     <span className="text-white/70">Médico seleccionado (ID: {form.attending_doctor})</span>
                     <button
                       onClick={() => {
                         handleChange("attending_doctor", null);
                         setDoctorSearchQuery("");
                         setDoctorSearchResults([]);
                       }}
                       className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               )}
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