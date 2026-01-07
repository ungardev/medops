// src/components/WaitingRoom/RegisterWalkinModal.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
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
    reset,
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
          if (value && value.trim() !== "") payload[key] = value.trim();
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

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[var(--palantir-bg)]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div 
        className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] shadow-2xl w-full max-w-lg rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="px-4 py-3 border-b border-[var(--palantir-border)] bg-[var(--palantir-bg)]/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--palantir-active)] rounded-full shadow-[0_0_5px_var(--palantir-active)]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
              {mode === "search" ? "IDENTIFY_PATIENT_STREAM" : "INITIALIZE_NEW_RECORD"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--palantir-muted)] hover:text-white transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {mode === "search" && (
            <div className="space-y-4">
              {/* Input de Búsqueda Estilizado */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--palantir-muted)]" />
                <input
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm text-sm text-[var(--palantir-text)] placeholder:text-[var(--palantir-muted)]/50 focus:outline-none focus:border-[var(--palantir-active)]/50 transition-all font-mono"
                  placeholder="BUSCAR POR NOMBRE O IDENTIFICACIÓN..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedPatient(null); }}
                />
              </div>

              {/* Resultados de Búsqueda */}
              {results.length > 0 && !selectedPatient && (
                <div className="border border-[var(--palantir-border)] rounded-sm divide-y divide-[var(--palantir-border)]/50 max-h-48 overflow-y-auto bg-[var(--palantir-bg)]/20">
                  {results.map((p, index) => (
                    <div
                      key={p.id}
                      className={`px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors ${index === highlightedIndex ? "bg-[var(--palantir-active)]/20" : "hover:bg-[var(--palantir-active)]/5"}`}
                      onClick={() => { setSelectedPatient(p); setQuery(""); setResults([]); }}
                    >
                      <span className="text-xs font-bold uppercase tracking-tight text-[var(--palantir-text)]">{p.full_name}</span>
                      <span className="text-[10px] font-mono text-[var(--palantir-muted)]">{p.national_id || "NO_ID"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tarjeta de Paciente Seleccionado */}
              {selectedPatient && (
                <div className={`p-4 border rounded-sm transition-all ${alreadyInWaitingRoom ? "border-red-500/30 bg-red-500/5" : "border-[var(--palantir-active)]/30 bg-[var(--palantir-active)]/5"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest mb-1">Paciente Confirmado</p>
                      <h3 className="text-lg font-bold text-[var(--palantir-text)] leading-tight">{selectedPatient.full_name}</h3>
                      <p className="text-xs font-mono text-[var(--palantir-muted)] mt-1">{selectedPatient.national_id}</p>
                    </div>
                    {!alreadyInWaitingRoom && <CheckIcon className="w-5 h-5 text-[var(--palantir-active)]" />}
                  </div>

                  {alreadyInWaitingRoom ? (
                    <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-tighter text-center">
                      ⚠ Registro Activo en Sala de Espera
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-5">
                      <button onClick={() => onSubmit({} as FormValues)} className="flex-1 bg-[var(--palantir-active)] text-white text-[10px] font-black uppercase py-2 rounded-sm hover:opacity-90 transition-opacity tracking-widest">
                        PROCEDER_CON_REGISTRO
                      </button>
                      <button onClick={() => setSelectedPatient(null)} className="px-4 border border-[var(--palantir-border)] text-[var(--palantir-muted)] text-[10px] font-bold uppercase rounded-sm hover:bg-[var(--palantir-bg)] transition-colors">
                        CANCELAR
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setMode("create")}
                className="w-full py-3 border border-dashed border-[var(--palantir-border)] text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] hover:border-[var(--palantir-active)]/50 transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
              >
                <UserPlusIcon className="w-4 h-4" />
                Registrar Nuevo Sujeto
              </button>
            </div>
          )}

          {mode === "create" && (
            <form className="space-y-4 animate-in slide-in-from-right-4 duration-300" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase ml-1">Primer Nombre</label>
                  <input {...register("first_name", { required: true })} className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--palantir-active)]/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase ml-1">Segundo Nombre</label>
                  <input {...register("second_name")} className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--palantir-active)]/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase ml-1">Primer Apellido</label>
                  <input {...register("last_name", { required: true })} className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--palantir-active)]/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase ml-1">Segundo Apellido</label>
                  <input {...register("second_last_name")} className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--palantir-active)]/50" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase ml-1">Documento Nacional (ID)</label>
                <input {...register("national_id", { required: true })} className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[var(--palantir-active)]/50" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--palantir-border)]/30">
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[var(--palantir-active)] text-white text-[10px] font-black uppercase py-2.5 rounded-sm hover:opacity-90 disabled:opacity-50 tracking-widest transition-all">
                  {isSubmitting ? "SYNCING..." : "COMMIT_DATABASE_ENTRY"}
                </button>
                <button type="button" onClick={() => setMode("search")} className="px-4 text-[var(--palantir-muted)] text-[10px] font-bold uppercase hover:text-white transition-colors flex items-center gap-2">
                  <ArrowLeftIcon className="w-3 h-3" /> VOLVER
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default RegisterWalkinModal;
