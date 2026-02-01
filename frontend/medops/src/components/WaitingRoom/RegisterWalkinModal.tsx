// src/components/WaitingRoom/RegisterWalkinModal.tsx
import React, { useEffect, useState } from "react";
import EliteModal from "../Common/EliteModal";
import { useForm } from "react-hook-form";
import { createPatient, searchPatients } from "../../api/patients";
import { Patient, PatientRef } from "../../types/patients";
import type { WaitingRoomEntry } from "../../types/waitingRoom";
import { XMarkIcon, UserPlusIcon, MagnifyingGlassIcon, ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
interface Props {
  onClose: () => void;
  onSuccess: (patientId: number) => void;
  existingEntries: WaitingRoomEntry[];
}
interface FormValues {
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  national_id?: string;
  phone?: string;
  email?: string;
}
const RegisterWalkinModal: React.FC<Props> = ({ onClose, onSuccess, existingEntries }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 1) {
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }
      try {
        const response = await searchPatients(query);
        const safeResults: PatientRef[] = Array.isArray(response?.results) ? response.results : [];
        setResults(safeResults);
        setHighlightedIndex(safeResults.length > 0 ? 0 : -1);
      } catch (e) {
        setResults([]);
      }
    };
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);
  const onSubmit = async (values: FormValues) => {
    try {
      let patientId: number;
      if (selectedPatient) {
        patientId = selectedPatient.id;
      } else {
        const payload: any = {};
        Object.entries(values).forEach(([key, value]) => {
          if (value && value.trim() !== "") payload[key] = (value as string).trim();
        });
        const patient: Patient = await createPatient(payload);
        patientId = patient.id;
      }
      onSuccess(patientId);
      onClose();
    } catch (e: any) {
      alert(e.message || "Error en el registro");
    }
  };
  const alreadyInWaitingRoom = selectedPatient
    ? existingEntries.some((e) => e.patient.id === selectedPatient.id && !["completed", "canceled"].includes(e.status))
    : false;
  const inputStyles = "w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20";
  const labelStyles = "text-[9px] font-black text-white/30 uppercase tracking-[0.1em] mb-1 block";
  return (
    <EliteModal
      open={true}
      onClose={onClose}
      title={mode === "search" ? "PATIENT_IDENTIFICATION_PROTOCOL" : "PATIENT_REGISTRATION_SYSTEM"}
      subtitle={mode === "search" ? "SEARCH_EXISTING_DATABASE" : "INITIALIZE_NEW_MEDICAL_RECORD"}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {mode === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                autoFocus
                className={`${inputStyles} pl-12`}
                placeholder="PATIENT_SEARCH_PROTOCOL... (NOMBRE_O_IDENTIFICACION)"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedPatient(null); }}
              />
            </div>
            {results.length > 0 && !selectedPatient && (
              <div className="border border-white/10 rounded-sm divide-y divide-white/5 max-h-48 overflow-y-auto bg-black">
                {results.map((p, index) => (
                  <div
                    key={p.id}
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${index === highlightedIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                    onClick={() => { setSelectedPatient(p); setQuery(""); setResults([]); }}
                  >
                    <span className="text-xs font-bold uppercase tracking-tight text-white">{p.full_name}</span>
                    <span className="text-[10px] font-mono text-white/40">{p.national_id || "NO_ID"}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className={`p-5 border rounded-sm transition-all ${alreadyInWaitingRoom ? "border-red-500/30 bg-red-500/5" : "border-white/20 bg-white/5"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">SUBJECT_IDENTIFIED</p>
                    <h3 className="text-lg font-black text-white leading-tight italic uppercase tracking-tighter">{selectedPatient.full_name}</h3>
                    <p className="text-xs font-mono text-white/50 mt-1">{selectedPatient.national_id}</p>
                  </div>
                  {!alreadyInWaitingRoom && <CheckIcon className="w-6 h-6 text-white" />}
                </div>
                {alreadyInWaitingRoom ? (
                  <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                    ⚠ ACTIVE_REGISTRY_DETECTED_IN_SYSTEM
                  </div>
                ) : (
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => onSubmit({} as FormValues)} 
                      className="flex-1 bg-white text-black text-[10px] font-black uppercase py-2.5 rounded-sm hover:bg-white/90 transition-all tracking-[0.2em] font-mono"
                    >
                      PROCEED_WITH_REGISTRATION
                    </button>
                    <button 
                      onClick={() => setSelectedPatient(null)} 
                      className="px-4 border border-white/10 text-white/60 text-[10px] font-bold uppercase rounded-sm hover:bg-white/5 transition-colors font-mono"
                    >
                      ABORT_SELECTION
                    </button>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={() => setMode("create")}
              className="w-full py-4 border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <UserPlusIcon className="w-4 h-4" />
              INITIALIZE_NEW_SUBJECT_REGISTRY
            </button>
          </div>
        )}
        {mode === "create" && (
          <form className="space-y-4 animate-in slide-in-from-right-4 duration-300" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyles}>PRIMARY_NAME_FIELD</label>
                <input {...register("first_name", { required: true })} className={`${inputStyles} uppercase`} />
              </div>
              <div className="space-y-1">
                <label className={labelStyles}>SECONDARY_NAME_FIELD</label>
                <input {...register("second_name")} className={`${inputStyles} uppercase`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyles}>PRIMARY_SURNAME_FIELD</label>
                <input {...register("last_name", { required: true })} className={`${inputStyles} uppercase`} />
              </div>
              <div className="space-y-1">
                <label className={labelStyles}>SECONDARY_SURNAME_FIELD</label>
                <input {...register("second_last_name")} className={`${inputStyles} uppercase`} />
              </div>
            </div>
            <div className="space-y-1 pb-4">
              <label className={labelStyles}>NATIONAL_IDENTITY_DOCUMENT</label>
              <input 
                {...register("national_id", { required: true })} 
                className={`${inputStyles} font-mono placeholder:text-white/10`} 
                placeholder="DOCUMENT_ID_FORMAT: V-00000000" 
              />
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-white text-black text-[11px] font-black uppercase py-3 rounded-sm hover:bg-white/90 disabled:opacity-50 tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] font-mono"
              >
                {isSubmitting ? "SYNCHRONIZING_DATABASE..." : "COMMIT_MEDICAL_REGISTRY"}
              </button>
              <button 
                type="button" 
                onClick={() => setMode("search")} 
                className="w-full py-2 text-white/40 text-[9px] font-black uppercase hover:text-white transition-colors flex items-center justify-center gap-2 tracking-widest font-mono"
              >
                <ArrowLeftIcon className="w-3 h-3" /> RETURN_TO_SEARCH_PROTOCOL
              </button>
            </div>
          </form>
        )}
      </div>
    </EliteModal>
  );
};
export default RegisterWalkinModal;