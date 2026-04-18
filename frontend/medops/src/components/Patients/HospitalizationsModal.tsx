// src/components/Patients/HospitalizationsModal.tsx
import React, { useState, useEffect } from "react";
import { Hospitalization } from "../../types/patients";
import { 
  Bed,
  Save,
  Loader2,
  X,
  Heart,
  CheckCircle,
  AlertTriangle,
  HashIcon,
  ClipboardListIcon,
  CheckCircleIcon,
  Plus,
} from "lucide-react";
import { patientClient } from "@/api/patient/client";
import { useSpecialties } from "@/hooks/consultations/useSpecialties";
import { useIcdSearch } from "@/hooks/diagnosis/useIcdSearch";
import type { IcdResult } from "@/hooks/diagnosis/useIcdSearch";
import type { DiagnosisType, DiagnosisStatus } from "@/types/consultation";
import DiagnosisBadge from "@/components/Consultation/DiagnosisBadge";
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
  attending_doctor: number | string | null;  // ID (number) o nombre manual (string)
  attending_doctor_name: string | null;      // Nombre para mostrar
  admission_diagnoses: { id: number; icd_code: string; title: string; type: string; status: string }[];
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

const TYPE_OPTIONS: { value: DiagnosisType; label: string }[] = [
  { value: "presumptive", label: "Presuntivo (Sospecha)" },
  { value: "definitive", label: "Definitivo (Confirmado)" },
  { value: "differential", label: "Diferencial (En estudio)" },
  { value: "provisional", label: "Provisional" },
];

const STATUS_OPTIONS: { value: DiagnosisStatus; label: string }[] = [
  { value: "under_investigation", label: "En Investigación" },
  { value: "awaiting_results", label: "Esperando Resultados" },
  { value: "confirmed", label: "Confirmado" },
  { value: "ruled_out", label: "Descartado" },
  { value: "chronic", label: "Crónico / Pre-existente" },
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
    daily_notes: "",
    // Medical Tracking Fields
    attending_doctor: null,
    attending_doctor_name: null,
    admission_diagnoses: [],
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
    discharge_type: null,
    discharge_summary: null,
    discharge_instructions: null,
    discharge_medications: null,
    actual_discharge_date: null,
    doctorSearchQuery: "",
    diagnosisSearchQuery: ""
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
        attending_doctor_name: (initial as any).attending_doctor_name ?? null,
        admission_diagnoses: (initial as any).admission_diagnoses || [],
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
        attending_doctor_name: null,
        admission_diagnoses: [],
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
  const [doctorSearchResults, setDoctorSearchResults] = useState<any[]>([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  
  // Diagnosis type/status selection
  const [selectedDiagnosisType, setSelectedDiagnosisType] = useState<DiagnosisType>("presumptive");
  const [selectedDiagnosisStatus, setSelectedDiagnosisStatus] = useState<DiagnosisStatus>("under_investigation");
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [selectedDiagnosisResult, setSelectedDiagnosisResult] = useState<IcdResult | null>(null);
  
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
  
  const handleVitalSignsChange = (field: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setForm((prev) => ({
      ...prev,
      vital_signs: {
        ...prev.vital_signs,
        [field]: numValue
      }
    }));
  };

  const calculateBMI = (): number | null => {
    if (!form.vital_signs.weight || !form.vital_signs.height) return null;
    const heightInMeters = form.vital_signs.height / 100;
    return form.vital_signs.weight / (heightInMeters * heightInMeters);
  };

  const handleChange = (field: keyof Form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  const selectDoctor = (doctor: any) => {
    const doctorName = doctor.full_name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
    const doctorId = doctor.id;
    handleChange("attending_doctor", doctorId);
    setForm(prev => ({ ...prev, attending_doctor_name: doctorName }));
    setDoctorSearchQuery(doctorName);
    setDoctorSearchResults([]);
  };
  
  const handleManualDoctorInput = (value: string) => {
    setDoctorSearchQuery(value);
    handleChange("attending_doctor", value);
    setForm(prev => ({ ...prev, attending_doctor_name: value }));
  };
  
  const clearDoctorSelection = () => {
    handleChange("attending_doctor", null);
    setDoctorSearchQuery("");
    setDoctorSearchResults([]);
    setForm(prev => ({ ...prev, attending_doctor_name: null }));
  };
  
  const handleDiagnosisSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiagnosisSearchQuery(e.target.value);
  };
  
  const selectDiagnosisResult = (diagnosis: IcdResult) => {
    setSelectedDiagnosisResult(diagnosis);
    setSelectedDiagnosisType("presumptive");
    setSelectedDiagnosisStatus("under_investigation");
    setDiagnosisSearchQuery("");
    setShowDiagnosisForm(true);
  };
  
  const confirmDiagnosis = () => {
    if (!selectedDiagnosisResult) return;
    const newDiagnosis = {
      id: selectedDiagnosisResult.id,
      icd_code: selectedDiagnosisResult.icd_code,
      title: selectedDiagnosisResult.title || "Sin título",
      type: selectedDiagnosisType,
      status: selectedDiagnosisStatus
    };
    setForm((prev) => ({
      ...prev,
      admission_diagnoses: [...prev.admission_diagnoses, newDiagnosis]
    }));
    setShowDiagnosisForm(false);
    setSelectedDiagnosisResult(null);
    setSelectedDiagnosisType("presumptive");
    setSelectedDiagnosisStatus("under_investigation");
  };
  
  const cancelDiagnosisSelection = () => {
    setShowDiagnosisForm(false);
    setSelectedDiagnosisResult(null);
    setSelectedDiagnosisType("presumptive");
    setSelectedDiagnosisStatus("under_investigation");
  };
  
  const removeDiagnosis = (diagnosisId: number) => {
    setForm((prev) => ({
      ...prev,
      admission_diagnoses: prev.admission_diagnoses.filter(d => d.id !== diagnosisId)
    }));
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1f1f1f] sticky top-0 rounded-t-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Bed className="h-4 w-4 text-emerald-400" />
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
                    onChange={(e) => handleManualDoctorInput(e.target.value)}
                    placeholder="Buscar médico por nombre o especialidad..."
                  />
                  {doctorSearchQuery.length >= 2 && doctorSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg max-h-96 overflow-y-auto z-10 shadow-xl">
                      {doctorSearchResults.slice(0, 5).map((doctor: any) => (
                        <div
                          key={doctor.id}
                          className="px-4 py-2.5 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer border-b border-white/10 last:border-b-0 transition-colors"
                          onClick={() => selectDoctor(doctor)}
                        >
                          <div className="font-medium">{doctor.full_name || 'Sin nombre'}</div>
                          <div className="text-[10px] text-white/50">
                            {doctor.specialties?.[0]?.name || doctor.specialty || 'Sin especialidad'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {doctorSearchQuery.length >= 2 && doctorSearchResults.length === 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg p-3 z-10 shadow-xl">
                      <span className="text-white/50 text-[11px]">
                        No se encontraron médicos. Escriba el nombre manualmente.
                      </span>
                    </div>
                  )}
                </div>
                {form.attending_doctor_name && (
                  <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-300 text-[11px]">{form.attending_doctor_name}</span>
                      <button
                        onClick={clearDoctorSelection}
                        className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
           
{/* Diagnósticos de Ingreso */}
            <div className={sectionClass}>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-[11px] font-medium text-yellow-400 uppercase">Diagnósticos de Ingreso (ICD-11)</span>
                </div>
                <span className="text-[9px] text-white/40">{form.admission_diagnoses.length} registrado{form.admission_diagnoses.length !== 1 ? 's' : ''}</span>
              </div>
              
              {/* Lista de diagnósticos */}
              {form.admission_diagnoses.length > 0 && (
                <div className="space-y-2 mb-4">
                  {form.admission_diagnoses.map((diag) => (
                    <DiagnosisBadge
                      key={diag.id}
                      id={diag.id}
                      icd_code={diag.icd_code}
                      title={diag.title}
                      type={diag.type as any}
                      status={diag.status as any}
                      onDelete={removeDiagnosis}
                    />
                  ))}
                </div>
              )}
              
              {/* Buscador - solo mostrar si no hay formulario activo */}
              {!showDiagnosisForm && (
                <div className="relative">
                  <input
                    type="text"
                    className={inputClass}
                    value={diagnosisSearchQuery}
                    onChange={handleDiagnosisSearchChange}
                    placeholder="Buscar diagnóstico por código o descripción (ICD-11)..."
                  />
                  {diagnosisSearchQuery.length >= 2 && icdResults.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg max-h-96 overflow-y-auto z-10 shadow-xl">
                      {icdResults.map((diagnosis: any) => (
                        <div 
                          key={diagnosis.id}
                          className="px-4 py-2.5 hover:bg-white/15 cursor-pointer border-b border-white/10 last:border-b-0 transition-colors flex items-start gap-3"
                          onClick={() => selectDiagnosisResult(diagnosis)}
                        >
                          <span className="text-[11px] font-bold text-emerald-400 shrink-0">{diagnosis.icd_code}</span>
                          <span className="text-[11px] text-white/80 leading-tight">{diagnosis.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {diagnosisSearchQuery.length >= 2 && icdResults.length === 0 && icdLoading && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg p-2 z-10 shadow-xl">
                      <span className="text-white/50 text-[10px] flex items-center gap-2">
                        <div className="w-3 h-3 border border-white/20 border-t-emerald-400 rounded-full animate-spin" />
                        Buscando diagnósticos...
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Formulario de tipo y estado del diagnóstico */}
              {showDiagnosisForm && selectedDiagnosisResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 rounded-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <HashIcon className="w-5 h-5 text-emerald-400" />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-400">
                        {selectedDiagnosisResult.icd_code}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/60">
                      {selectedDiagnosisResult.title}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-1">
                        <ClipboardListIcon className="w-4 h-4" />
                        Tipo de Diagnóstico
                      </label>
                      <select
                        value={selectedDiagnosisType}
                        onChange={(e) => setSelectedDiagnosisType(e.target.value as DiagnosisType)}
                        className="w-full bg-white/5 border border-white/15 p-2.5 text-[11px] focus:border-emerald-500/50 outline-none rounded-lg"
                      >
                        {TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        Estado
                      </label>
                      <select
                        value={selectedDiagnosisStatus}
                        onChange={(e) => setSelectedDiagnosisStatus(e.target.value as DiagnosisStatus)}
                        className="w-full bg-white/5 border border-white/15 p-2.5 text-[11px] focus:border-emerald-500/50 outline-none rounded-lg"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={confirmDiagnosis}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2.5 flex items-center justify-center gap-2 transition-all rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[11px] font-medium">Confirmar</span>
                    </button>
                    <button
                      onClick={cancelDiagnosisSelection}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/15 text-white/60 py-2.5 flex items-center justify-center gap-2 transition-all rounded-lg"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-[11px] font-medium">Cancelar</span>
                    </button>
                  </div>
                </div>
              )}
              
              {form.admission_diagnoses.length === 0 && !showDiagnosisForm && (
                <div className="mt-3 p-4 border border-dashed border-white/15 text-center rounded-lg">
                  <span className="text-[10px] text-white/40">No hay diagnósticos de ingreso registrados</span>
                </div>
              )}
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
           
           {/* Signos Vitales */}
           <div className={sectionClass}>
             <div className="flex items-center gap-2 mb-4">
               <Heart className="w-4 h-4 text-red-400" />
               <span className="text-[11px] font-medium text-red-400 uppercase">Signos Vitales</span>
             </div>
             <div className="grid grid-cols-3 gap-4">
               <div>
                 <label className={labelClass}>Peso (kg)</label>
                 <input
                   type="number"
                   step="0.1"
                   className={inputClass}
                   value={form.vital_signs.weight ?? ""}
                   onChange={(e) => handleVitalSignsChange("weight", e.target.value)}
                   placeholder="0.0"
                 />
               </div>
               <div>
                 <label className={labelClass}>Altura (cm)</label>
                 <input
                   type="number"
                   className={inputClass}
                   value={form.vital_signs.height ?? ""}
                   onChange={(e) => handleVitalSignsChange("height", e.target.value)}
                   placeholder="0"
                 />
               </div>
               <div>
                 <label className={labelClass}>Temperatura (°C)</label>
                 <input
                   type="number"
                   step="0.1"
                   className={inputClass}
                   value={form.vital_signs.temperature ?? ""}
                   onChange={(e) => handleVitalSignsChange("temperature", e.target.value)}
                   placeholder="36.5"
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4 mt-4">
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <label className={labelClass}>PA Sistólica</label>
                   <input
                     type="number"
                     className={inputClass}
                     value={form.vital_signs.bp_systolic ?? ""}
                     onChange={(e) => handleVitalSignsChange("bp_systolic", e.target.value)}
                     placeholder="120"
                   />
                 </div>
                 <div>
                   <label className={labelClass}>PA Diastólica</label>
                   <input
                     type="number"
                     className={inputClass}
                     value={form.vital_signs.bp_diastolic ?? ""}
                     onChange={(e) => handleVitalSignsChange("bp_diastolic", e.target.value)}
                     placeholder="80"
                   />
                 </div>
               </div>
               <div className="grid grid-cols-3 gap-2">
                 <div>
                   <label className={labelClass}>FC (bpm)</label>
                   <input
                     type="number"
                     className={inputClass}
                     value={form.vital_signs.heart_rate ?? ""}
                     onChange={(e) => handleVitalSignsChange("heart_rate", e.target.value)}
                     placeholder="72"
                   />
                 </div>
                 <div>
                   <label className={labelClass}>FR (/min)</label>
                   <input
                     type="number"
                     className={inputClass}
                     value={form.vital_signs.respiratory_rate ?? ""}
                     onChange={(e) => handleVitalSignsChange("respiratory_rate", e.target.value)}
                     placeholder="16"
                   />
                 </div>
                 <div>
                   <label className={labelClass}>Sat O2 (%)</label>
                   <input
                     type="number"
                     className={inputClass}
                     value={form.vital_signs.oxygen_saturation ?? ""}
                     onChange={(e) => handleVitalSignsChange("oxygen_saturation", e.target.value)}
                     placeholder="98"
                   />
                 </div>
               </div>
             </div>
             {calculateBMI() && (
               <div className="mt-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                 <span className="text-[10px] text-blue-400 uppercase">IMC: </span>
                 <span className="text-[12px] text-blue-300 font-mono">{calculateBMI()?.toFixed(1)}</span>
               </div>
             )}
           </div>
           
           {/* Complicaciones */}
           <div className={sectionClass}>
             <div>
               <label className={labelClass}>Complicaciones</label>
               <textarea
                 className={`${inputClass} min-h-[80px] resize-none`}
                 value={form.complications}
                 onChange={(e) => handleChange("complications", e.target.value)}
                 placeholder="Complicaciones durante la hospitalización..."
               />
             </div>
           </div>
           
           {/* Planificación del Alta */}
           <div className={sectionClass}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400 uppercase">Planificación del Alta</span>
              </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className={labelClass}>Tipo de alta</label>
                 <select
                   className={inputClass}
                   value={form.discharge_type ?? ""}
                   onChange={(e) => handleChange("discharge_type", e.target.value || null)}
                 >
                   <option value="">Seleccionar...</option>
                   <option value="home">Alta a domicilio</option>
                   <option value="transfer">Transferencia</option>
                   <option value="voluntary">Alta voluntaria</option>
                   <option value="medical">Alta médica</option>
                   <option value="death">Fallecimiento</option>
                 </select>
               </div>
               <div>
                 <label className={labelClass}>Fecha real de alta</label>
                 <input
                   type="date"
                   style={{colorScheme: 'dark'}}
                   className={inputClass}
                   value={form.actual_discharge_date ?? ""}
                   onChange={(e) => handleChange("actual_discharge_date", e.target.value || null)}
                 />
               </div>
             </div>
             <div className="mt-4">
               <label className={labelClass}>Resumen de alta</label>
               <textarea
                 className={`${inputClass} min-h-[80px] resize-none`}
                 value={form.discharge_summary ?? ""}
                 onChange={(e) => handleChange("discharge_summary", e.target.value || null)}
                 placeholder="Resumen del proceso de hospitalización..."
               />
             </div>
             <div className="mt-4">
               <label className={labelClass}>Instrucciones al alta</label>
               <textarea
                 className={`${inputClass} min-h-[60px] resize-none`}
                 value={form.discharge_instructions ?? ""}
                 onChange={(e) => handleChange("discharge_instructions", e.target.value || null)}
                 placeholder="Instrucciones para el paciente al alta..."
               />
             </div>
             <div className="mt-4">
               <label className={labelClass}>Medicamentos al alta</label>
               <textarea
                 className={`${inputClass} min-h-[60px] resize-none`}
                 value={form.discharge_medications ?? ""}
                 onChange={(e) => handleChange("discharge_medications", e.target.value || null)}
                 placeholder="Medicamentos prescritos al alta..."
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