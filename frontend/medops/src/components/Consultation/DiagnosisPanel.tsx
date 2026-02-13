// src/components/Consultation/DiagnosisPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import { useIcdSearch } from "../../hooks/diagnosis/useIcdSearch";
import type { IcdResult } from "../../hooks/diagnosis/useIcdSearch";
import { useCreateDiagnosis } from "../../hooks/consultations/useCreateDiagnosis";
import { useUpdateDiagnosis } from "../../hooks/consultations/useUpdateDiagnosis";
import { useDeleteDiagnosis } from "../../hooks/consultations/useDeleteDiagnosis";
import DiagnosisBadge from "./DiagnosisBadge";
import { Diagnosis, DiagnosisType, DiagnosisStatus } from "../../types/consultation";
import { 
  MagnifyingGlassIcon, 
  BeakerIcon, 
  ChatBubbleBottomCenterTextIcon,
  PlusCircleIcon,
  HashtagIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
export interface DiagnosisPanelProps {
  diagnoses?: Diagnosis[];
  readOnly?: boolean;
  appointmentId: number;
}
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
const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ diagnoses = [], readOnly, appointmentId }) => {
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DiagnosisType>("presumptive");
  const [status, setStatus] = useState<DiagnosisStatus>("under_investigation");
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<IcdResult | null>(null);
  const { data: results = [], isLoading } = useIcdSearch(query);
  const { mutate: createDiagnosis, isPending: isCreating } = useCreateDiagnosis();
  const { mutate: updateDiagnosis } = useUpdateDiagnosis();
  const { mutate: deleteDiagnosis } = useDeleteDiagnosis();
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  useEffect(() => {
    itemRefs.current = [];
    setHighlightIndex(-1);
  }, [results]);
  useEffect(() => {
    if (highlightIndex >= 0) {
      const el = itemRefs.current[highlightIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);
  const handleSelect = (item: IcdResult) => {
    setSelectedDiagnosis(item);
    setDescription("");
    setType("presumptive");
    setStatus("under_investigation");
  };
  const handleSave = () => {
    if (!selectedDiagnosis) return;
    const payload = {
      appointment: appointmentId,
      icd_code: selectedDiagnosis.icd_code,
      title: selectedDiagnosis.title || "Sin título",
      description,
      type,
      status,
      ...(selectedDiagnosis.foundation_id ? { foundation_id: selectedDiagnosis.foundation_id } : {}),
    };
    createDiagnosis(payload);
    setSelectedDiagnosis(null);
    setDescription("");
    setType("presumptive");
    setStatus("under_investigation");
    setQuery("");
    setHighlightIndex(-1);
  };
  return (
    <div className="space-y-6">
      {/* 01. ACTIVE DIAGNOSES LIST */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <BeakerIcon className="w-5 h-5 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
            Clinical_Active_Diagnoses
          </span>
          <span className="ml-auto text-[9px] font-mono text-[var(--palantir-muted)]">
            {diagnoses.length} REGISTRADO{S(diagnoses.length)}
          </span>
        </div>
        
        <div className="grid gap-2">
          {diagnoses.length === 0 ? (
            <div className="p-8 border border-dashed border-[var(--palantir-border)] text-center opacity-40">
              <span className="text-[10px] font-mono uppercase">No_Data_Recorded</span>
            </div>
          ) : (
            diagnoses.map((d) => (
              <DiagnosisBadge
                key={d.id}
                id={d.id}
                icd_code={String(d.icd_code)}
                title={typeof d.title === "string" ? d.title : d.name ?? "Sin título"}
                description={typeof d.description === "string" ? d.description : d.notes ?? ""}
                type={d.type}
                status={d.status}
                {...(!readOnly && {
                  onEdit: (id, desc) => updateDiagnosis({ id, description: desc }),
                  onDelete: (id) => deleteDiagnosis(id),
                })}
              />
            ))
          )}
        </div>
      </div>
      {/* 02. ICD-11 SEARCH INTERFACE */}
      {!readOnly && (
        <div className="pt-6 border-t border-[var(--palantir-border)] space-y-4">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <MagnifyingGlassIcon className={`w-4 h-4 transition-colors ${isLoading ? 'animate-pulse text-[var(--palantir-active)]' : 'text-[var(--palantir-muted)]'}`} />
            </div>
            <input
              type="text"
              placeholder="BUSCAR EN ICD-11..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlightIndex(-1); }}
              onKeyDown={(e) => {
                if (!results?.length) return;
                if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIndex(p => (p + 1) % results.length); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIndex(p => (p - 1 + results.length) % results.length); }
                else if (e.key === "Enter" && highlightIndex >= 0) { e.preventDefault(); handleSelect(results[highlightIndex]); }
              }}
              className="w-full bg-black/40 border border-[var(--palantir-border)] pl-10 pr-4 py-3 text-[11px] font-mono uppercase tracking-wider focus:border-[var(--palantir-active)] outline-none transition-all"
            />
          </div>
          {/* SEARCH RESULTS DROPDOWN */}
          {results.length > 0 && (
            <div className="border border-[var(--palantir-border)] bg-[#0a0a0a] shadow-2xl max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--palantir-border)]">
              {results.map((r, idx) => (
                <div
                  key={r.icd_code}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  className={`cursor-pointer p-3 border-b border-white/5 flex items-start gap-3 transition-colors ${
                    idx === highlightIndex ? "bg-[var(--palantir-active)]/20 border-l-4 border-l-[var(--palantir-active)]" : "hover:bg-white/5"
                  }`}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => handleSelect(r)}
                >
                  <span className="text-[10px] font-black font-mono text-[var(--palantir-active)] shrink-0">{r.icd_code}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-[var(--palantir-text)] leading-tight">{r.title}</span>
                </div>
              ))}
            </div>
          )}
          {/* SELECTION WORK AREA */}
          {selectedDiagnosis && (
            <div className="bg-[var(--palantir-active)]/5 border border-[var(--palantir-active)]/30 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Header con código ICD */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--palantir-active)]/20">
                <div className="flex items-center gap-2">
                  <HashtagIcon className="w-4 h-4 text-[var(--palantir-active)]" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-[var(--palantir-active)]">
                    {selectedDiagnosis.icd_code}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[var(--palantir-muted)]">
                  {selectedDiagnosis.title}
                </span>
              </div>
              
              {/* Grid de configuración clínica */}
              <div className="grid grid-cols-2 gap-3">
                {/* TIPO DE DIAGNÓSTICO */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] tracking-wider flex items-center gap-1">
                    <ClipboardDocumentListIcon className="w-3 h-3" />
                    Type_Classification
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DiagnosisType)}
                    className="w-full bg-black/60 border border-[var(--palantir-border)] p-2 text-[10px] font-mono focus:border-[var(--palantir-active)] outline-none text-[var(--palantir-text)]"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* ESTADO DEL DIAGNÓSTICO */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] tracking-wider flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    Decree_Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DiagnosisStatus)}
                    className="w-full bg-black/60 border border-[var(--palantir-border)] p-2 text-[10px] font-mono focus:border-[var(--palantir-active)] outline-none text-[var(--palantir-text)]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* DESCRIPCIÓN / NOTAS */}
              <div className="relative">
                <ChatBubbleBottomCenterTextIcon className="absolute left-3 top-3 w-4 h-4 text-[var(--palantir-muted)]" />
                <textarea
                  placeholder="AGREGAR ESPECIFICACIONES CLÍNICAS, JUSTIFICACIÓN O NOTAS..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/60 border border-[var(--palantir-border)] pl-10 p-3 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none min-h-[80px]"
                />
              </div>
              {/* BOTÓN DE GUARDADO */}
              <button
                onClick={handleSave}
                disabled={isCreating}
                className="w-full bg-[var(--palantir-active)] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 flex items-center justify-center gap-2 transition-all"
              >
                <PlusCircleIcon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {isCreating ? "REGISTRANDO..." : "CONFIRMAR_DIAGNÓSTICO"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
function S(n: number): string {
  return n === 1 ? "" : "S";
}
export default DiagnosisPanel;