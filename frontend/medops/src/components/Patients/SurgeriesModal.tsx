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
  Heart,
  Plus,
  Trash2,
  HashIcon,
  ClipboardListIcon,
  CheckCircleIcon,
} from "lucide-react";
import { patientClient } from "@/api/patient/client";
import { useIcdSearch } from "@/hooks/diagnosis/useIcdSearch";
import type { IcdResult } from "@/hooks/diagnosis/useIcdSearch";
import type { DiagnosisType, DiagnosisStatus } from "@/types/consultation";
import DiagnosisBadge from "@/components/Consultation/DiagnosisBadge";
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
  scheduled_time: string;
  surgery_type: string;
  status: string;
  risk_level: string;
  asa_classification: string;
  procedure_description: string;
  complications: string;
  post_op_instructions: string;
  surgeon: number | string | null;  // ID (number) o nombre manual (string)
  surgeon_name: string | null;       // Nombre para mostrar
  anesthesiologist: number | string | null;
  anesthesiologist_name: string | null;
  surgical_assistants: number | string | null;
  surgical_assistants_name: string | null;
  diagnoses: { id: number; icd_code: string; title: string; type: string; status: string }[];
  surgical_technique: string;
  findings: string;
  estimated_blood_loss: number | null;
  specimens: string;
  follow_up_date: string;
  doctorSearchQuery: string;
  diagnosisSearchQuery: string;
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
export default function SurgeriesModal({ open, onClose, onSave, initial, patientId }: Props) {
  const [form, setForm] = useState<Form>({
    id: undefined,
    name: "",
    hospital: "",
    scheduled_date: "",
    scheduled_time: "",
    surgery_type: "elective",
    status: "scheduled",
    risk_level: "moderate",
    asa_classification: "",
    procedure_description: "",
    complications: "",
    post_op_instructions: "",
    surgeon: null,
    surgeon_name: null,
    anesthesiologist: null,
    anesthesiologist_name: null,
    surgical_assistants: null,
    surgical_assistants_name: null,
    diagnoses: [],
    surgical_technique: "",
    findings: "",
    estimated_blood_loss: null,
    specimens: "",
    follow_up_date: "",
    doctorSearchQuery: "",
    diagnosisSearchQuery: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [diagnosisSearchQuery, setDiagnosisSearchQuery] = useState("");
  const { data: icdResults = [], isLoading: icdLoading } = useIcdSearch(diagnosisSearchQuery);
  const [doctorSearchResults, setDoctorSearchResults] = useState<any[]>([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  
  // Separate states for each doctor role
  const [anesthesiologistSearchQuery, setAnesthesiologistSearchQuery] = useState("");
  const [anesthesiologistSearchResults, setAnesthesiologistSearchResults] = useState<any[]>([]);
  const [surgicalAssistantsSearchQuery, setSurgicalAssistantsSearchQuery] = useState("");
  const [surgicalAssistantsSearchResults, setSurgicalAssistantsSearchResults] = useState<any[]>([]);
  
  // Diagnosis type/status selection
  const [selectedDiagnosisType, setSelectedDiagnosisType] = useState<DiagnosisType>("presumptive");
  const [selectedDiagnosisStatus, setSelectedDiagnosisStatus] = useState<DiagnosisStatus>("under_investigation");
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [selectedDiagnosisResult, setSelectedDiagnosisResult] = useState<IcdResult | null>(null);

  useEffect(() => {
    if (doctorSearchQuery.trim().length >= 2) {
      patientClient.searchDoctors(doctorSearchQuery).then(response => {
        setDoctorSearchResults(response.data.results || []);
      });
    } else if (doctorSearchQuery.trim().length === 0) {
      setDoctorSearchResults([]);
    }
  }, [doctorSearchQuery]);
  
  // Anesthesiologist search
  useEffect(() => {
    if (anesthesiologistSearchQuery.trim().length >= 2) {
      patientClient.searchDoctors(anesthesiologistSearchQuery).then(response => {
        setAnesthesiologistSearchResults(response.data.results || []);
      });
    } else if (anesthesiologistSearchQuery.trim().length === 0) {
      setAnesthesiologistSearchResults([]);
    }
  }, [anesthesiologistSearchQuery]);
  
  // Surgical assistants search
  useEffect(() => {
    if (surgicalAssistantsSearchQuery.trim().length >= 2) {
      patientClient.searchDoctors(surgicalAssistantsSearchQuery).then(response => {
        setSurgicalAssistantsSearchResults(response.data.results || []);
      });
    } else if (surgicalAssistantsSearchQuery.trim().length === 0) {
      setSurgicalAssistantsSearchResults([]);
    }
  }, [surgicalAssistantsSearchQuery]);
  
  useEffect(() => {
    if (open && initial) {
      setForm({
        id: initial.id,
        name: initial.name || "",
        hospital: initial.hospital || "",
        scheduled_date: initial.scheduled_date || "",
        scheduled_time: (initial as any).scheduled_time || "",
        surgery_type: initial.surgery_type || "elective",
        status: initial.status || "scheduled",
        risk_level: initial.risk_level || "moderate",
        asa_classification: initial.asa_classification || "",
        procedure_description: initial.procedure_description || "",
        complications: initial.complications || "",
        post_op_instructions: initial.post_op_instructions || "",
        surgeon: (initial as any).surgeon ?? null,
        surgeon_name: (initial as any).surgeon_name ?? null,
        anesthesiologist: (initial as any).anesthesiologist ?? null,
        anesthesiologist_name: (initial as any).anesthesiologist_name ?? null,
        surgical_assistants: (initial as any).surgical_assistants ?? null,
        surgical_assistants_name: (initial as any).surgical_assistants_name ?? null,
        diagnoses: (initial as any).diagnoses || [],
        surgical_technique: (initial as any).surgical_technique || "",
        findings: (initial as any).findings || "",
        estimated_blood_loss: (initial as any).estimated_blood_loss ?? null,
        specimens: (initial as any).specimens || "",
        follow_up_date: (initial as any).follow_up_date || "",
        doctorSearchQuery: "",
        diagnosisSearchQuery: ""
      });
    } else if (open) {
      setForm({
        id: undefined,
        name: "",
        hospital: "",
        scheduled_date: "",
        scheduled_time: "",
        surgery_type: "elective",
        status: "scheduled",
        risk_level: "moderate",
        asa_classification: "",
        procedure_description: "",
        complications: "",
        post_op_instructions: "",
        surgeon: null,
        surgeon_name: null,
        anesthesiologist: null,
        anesthesiologist_name: null,
        surgical_assistants: null,
        surgical_assistants_name: null,
        diagnoses: [],
        surgical_technique: "",
        findings: "",
        estimated_blood_loss: null,
        specimens: "",
        follow_up_date: "",
        doctorSearchQuery: "",
        diagnosisSearchQuery: ""
      });
    }
}, [open, initial]);
  
const handleDoctorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoctorSearchQuery(e.target.value);
  };
  
  const selectDoctor = (doctor: any, role: "surgeon" | "anesthesiologist" | "surgical_assistants") => {
    const doctorName = doctor.full_name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
    const doctorId = doctor.id;
    handleChange(role, doctorId);
    
    if (role === "surgeon") {
      setForm(prev => ({ ...prev, surgeon_name: doctorName }));
      setDoctorSearchQuery(doctorName);
    } else if (role === "anesthesiologist") {
      setForm(prev => ({ ...prev, anesthesiologist_name: doctorName }));
      setAnesthesiologistSearchQuery(doctorName);
    } else if (role === "surgical_assistants") {
      setForm(prev => ({ ...prev, surgical_assistants_name: doctorName }));
      setSurgicalAssistantsSearchQuery(doctorName);
    }
    setDoctorSearchResults([]);
  };
  
  const handleManualDoctorInput = (value: string, role: "surgeon" | "anesthesiologist" | "surgical_assistants") => {
    if (role === "surgeon") {
      setDoctorSearchQuery(value);
      handleChange("surgeon", value);
      setForm(prev => ({ ...prev, surgeon_name: value }));
    } else if (role === "anesthesiologist") {
      setAnesthesiologistSearchQuery(value);
      handleChange("anesthesiologist", value);
      setForm(prev => ({ ...prev, anesthesiologist_name: value }));
    } else if (role === "surgical_assistants") {
      setSurgicalAssistantsSearchQuery(value);
      handleChange("surgical_assistants", value);
      setForm(prev => ({ ...prev, surgical_assistants_name: value }));
    }
  };
  
  const clearDoctorSelection = (role: "surgeon" | "anesthesiologist" | "surgical_assistants") => {
    handleChange(role, null);
    if (role === "surgeon") {
      setDoctorSearchQuery("");
      setDoctorSearchResults([]);
      setForm(prev => ({ ...prev, surgeon_name: null }));
    } else if (role === "anesthesiologist") {
      setAnesthesiologistSearchQuery("");
      setAnesthesiologistSearchResults([]);
      setForm(prev => ({ ...prev, anesthesiologist_name: null }));
    } else if (role === "surgical_assistants") {
      setSurgicalAssistantsSearchQuery("");
      setSurgicalAssistantsSearchResults([]);
      setForm(prev => ({ ...prev, surgical_assistants_name: null }));
    }
  };
  
  const handleDiagnosisSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiagnosisSearchQuery(e.target.value);
  };
  
  const handleAnesthesiologistSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnesthesiologistSearchQuery(e.target.value);
  };
  
  const handleSurgicalAssistantsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurgicalAssistantsSearchQuery(e.target.value);
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
      diagnoses: [...prev.diagnoses, newDiagnosis]
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
      diagnoses: prev.diagnoses.filter(d => d.id !== diagnosisId)
    }));
  };
  
  const clearDiagnosisSelection = () => {
    setForm((prev) => ({
      ...prev,
      diagnoses: []
    }));
  };

  const handleChange = (field: keyof Form, value: any) => {
    if (field === "estimated_blood_loss") {
      setForm((prev) => ({ ...prev, [field]: value === "" ? null : parseFloat(value) }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
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
              <ScissorsIcon className="h-4 w-4 text-emerald-400" />
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
                <label className={labelClass}>Hora programada</label>
                <input
                  type="time"
                  style={{colorScheme: 'dark'}}
                  className={inputClass}
                  value={form.scheduled_time}
                  onChange={(e) => handleChange("scheduled_time", e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Equipo Quirúrgico */}
          <div className={sectionClass}>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-[11px] font-medium text-red-400 uppercase">Equipo Quirúrgico</span>
            </div>
            
            {/* Cirujano */}
            <div className="mb-4">
              <label className={labelClass}>Cirujano</label>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  value={doctorSearchQuery}
                  onChange={(e) => handleManualDoctorInput(e.target.value, "surgeon")}
                  placeholder="Buscar cirujano..."
                />
                {doctorSearchQuery.length >= 2 && doctorSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg max-h-96 overflow-y-auto z-10 shadow-xl">
                    {doctorSearchResults.slice(0, 5).map((doctor: any) => (
                      <div
                        key={doctor.id}
                        className="px-4 py-2.5 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer border-b border-white/10 last:border-b-0 transition-colors"
                        onClick={() => selectDoctor(doctor, "surgeon")}
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
                      No se encontraron doctores. Escriba el nombre manualmente.
                    </span>
                  </div>
                )}
              </div>
              {form.surgeon_name && (
                <div className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-emerald-300 text-[11px]">{form.surgeon_name}</span>
                  <button
                    onClick={() => clearDoctorSelection("surgeon")}
                    className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Anestesiólogo */}
            <div className="mb-4">
              <label className={labelClass}>Anestesiólogo</label>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  value={anesthesiologistSearchQuery}
                  onChange={(e) => handleManualDoctorInput(e.target.value, "anesthesiologist")}
                  placeholder="Buscar anestesia..."
                />
                {anesthesiologistSearchQuery.length >= 2 && anesthesiologistSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg max-h-96 overflow-y-auto z-10 shadow-xl">
                    {anesthesiologistSearchResults.slice(0, 5).map((doctor: any) => (
                      <div
                        key={doctor.id}
                        className="px-4 py-2.5 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer border-b border-white/10 last:border-b-0 transition-colors"
                        onClick={() => selectDoctor(doctor, "anesthesiologist")}
                      >
                        <div className="font-medium">{doctor.full_name || 'Sin nombre'}</div>
                        <div className="text-[10px] text-white/50">
                          {doctor.specialties?.[0]?.name || doctor.specialty || 'Sin especialidad'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {anesthesiologistSearchQuery.length >= 2 && anesthesiologistSearchResults.length === 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg p-3 z-10 shadow-xl">
                    <span className="text-white/50 text-[11px]">
                      No se encontraron doctores. Escriba el nombre manualmente.
                    </span>
                  </div>
                )}
              </div>
              {form.anesthesiologist_name && (
                <div className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-red-300 text-[11px]">{form.anesthesiologist_name}</span>
                  <button
                    onClick={() => clearDoctorSelection("anesthesiologist")}
                    className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Asistentes Quirúrgicos */}
            <div>
              <label className={labelClass}>Asistentes Quirúrgicos</label>
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  value={surgicalAssistantsSearchQuery}
                  onChange={(e) => handleManualDoctorInput(e.target.value, "surgical_assistants")}
                  placeholder="Buscar asistentes..."
                />
                {surgicalAssistantsSearchQuery.length >= 2 && surgicalAssistantsSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg max-h-96 overflow-y-auto z-10 shadow-xl">
                    {surgicalAssistantsSearchResults.slice(0, 5).map((doctor: any) => (
                      <div
                        key={doctor.id}
                        className="px-4 py-2.5 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer border-b border-white/10 last:border-b-0 transition-colors"
                        onClick={() => selectDoctor(doctor, "surgical_assistants")}
                      >
                        <div className="font-medium">{doctor.full_name || 'Sin nombre'}</div>
                        <div className="text-[10px] text-white/50">
                          {doctor.specialties?.[0]?.name || doctor.specialty || 'Sin especialidad'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {surgicalAssistantsSearchQuery.length >= 2 && surgicalAssistantsSearchResults.length === 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-lg p-3 z-10 shadow-xl">
                    <span className="text-white/50 text-[11px]">
                      No se encontraron doctores. Escriba el nombre manualmente.
                    </span>
                  </div>
                )}
              </div>
              {form.surgical_assistants_name && (
                <div className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <span className="text-blue-300 text-[11px]">{form.surgical_assistants_name}</span>
                  <button
                    onClick={() => clearDoctorSelection("surgical_assistants")}
                    className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
{/* Diagnósticos */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-[11px] font-medium text-yellow-400 uppercase">Diagnósticos (ICD-11)</span>
              </div>
              <span className="text-[9px] text-white/40">{form.diagnoses.length} registrado{form.diagnoses.length !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Lista de diagnósticos */}
            {form.diagnoses.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.diagnoses.map((diag) => (
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
            
            {/* Buscador de diagnósticos - solo mostrar si no hay diagnóstico seleccionado */}
            {!showDiagnosisForm && (
              <div className="relative">
                <input
                  type="text"
                  className={inputClass}
                  value={diagnosisSearchQuery}
                  onChange={handleDiagnosisSearchChange}
                  placeholder="Buscar diagnóstico por código o descripción..."
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
            
            {form.diagnoses.length === 0 && !showDiagnosisForm && (
              <div className="mt-3 p-4 border border-dashed border-white/15 text-center rounded-lg">
                <span className="text-[10px] text-white/40">No hay diagnósticos registrados</span>
              </div>
            )}
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
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>Técnica quirúrgica</label>
                <input
                  className={inputClass}
                  value={form.surgical_technique}
                  onChange={(e) => handleChange("surgical_technique", e.target.value)}
                  placeholder="Técnica utilizada..."
                />
              </div>
              <div>
                <label className={labelClass}>Pérdida sanguínea (ml)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.estimated_blood_loss ?? ""}
                  onChange={(e) => handleChange("estimated_blood_loss", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Hallazgos</label>
              <textarea
                className={`${inputClass} min-h-[60px] resize-none`}
                value={form.findings}
                onChange={(e) => handleChange("findings", e.target.value)}
                placeholder="Hallazgos durante la cirugía..."
              />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Especímenes</label>
              <textarea
                className={`${inputClass} min-h-[50px] resize-none`}
                value={form.specimens}
                onChange={(e) => handleChange("specimens", e.target.value)}
                placeholder="Especímenes enviados a病理..."
              />
            </div>
          </div>
          
          {/* Seguimiento */}
          <div className={sectionClass}>
            <div>
              <label className={labelClass}>Fecha de seguimiento</label>
              <input
                type="date"
                style={{colorScheme: 'dark'}}
                className={inputClass}
                value={form.follow_up_date}
                onChange={(e) => handleChange("follow_up_date", e.target.value)}
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