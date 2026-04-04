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
  const [showResults, setShowResults] = useState(false);
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
    setQuery("");
    setShowResults(false);
    setHighlightIndex(-1);
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
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <BeakerIcon className="w-5 h-5 text-red-400" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-white">
            Diagnósticos Activos
          </span>
          <span className="ml-auto text-[10px] text-white/50">
            {diagnoses.length} registrado{diagnoses.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid gap-3">
          {diagnoses.length === 0 ? (
            <div className="p-8 border border-dashed border-white/15 text-center opacity-50 rounded-lg">
              <span className="text-[11px] text-white/60">No hay diagnósticos registrados</span>
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
      {!readOnly && (
        <div className="pt-6 border-t border-white/15 space-y-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <MagnifyingGlassIcon className={`w-5 h-5 transition-colors ${isLoading ? 'animate-pulse text-emerald-400' : 'text-white/50'}`} />
            </div>
            <input
              type="text"
              placeholder="Buscar en CIE-11..."
              value={query}
              onChange={(e) => { 
                setQuery(e.target.value); 
                setShowResults(true);
                setHighlightIndex(-1); 
              }}
              onKeyDown={(e) => {
                if (!results?.length) return;
                if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIndex(p => (p + 1) % results.length); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIndex(p => (p - 1 + results.length) % results.length); }
                else if (e.key === "Enter" && highlightIndex >= 0) { e.preventDefault(); handleSelect(results[highlightIndex]); }
              }}
              onFocus={() => query.length > 0 && setShowResults(true)}
              className="w-full bg-white/5 border border-white/15 pl-12 pr-4 py-3 text-[12px] focus:border-emerald-500/50 outline-none transition-all rounded-lg placeholder:text-white/30"
            />
          </div>
          {showResults && results.length > 0 && (
            <div 
              className="border border-white/15 bg-[#0a0a0b] shadow-2xl max-h-64 overflow-y-auto rounded-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              {results.map((r, idx) => (
                <div
                  key={r.icd_code}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  className={`cursor-pointer p-3 border-b border-white/5 flex items-start gap-3 transition-colors ${
                    idx === highlightIndex ? "bg-emerald-500/15 border-l-4 border-l-emerald-500" : "hover:bg-white/5"
                  }`}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => handleSelect(r)}
                >
                  <span className="text-[11px] font-bold text-emerald-400 shrink-0">{r.icd_code}</span>
                  <span className="text-[11px] text-white/80 leading-tight">{r.title}</span>
                </div>
              ))}
            </div>
          )}
          {!showResults && selectedDiagnosis && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 rounded-lg">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <HashtagIcon className="w-5 h-5 text-emerald-400" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-400">
                    {selectedDiagnosis.icd_code}
                  </span>
                </div>
                <span className="text-[10px] text-white/60">
                  {selectedDiagnosis.title}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider flex items-center gap-1">
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    Tipo de Diagnóstico
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DiagnosisType)}
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
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DiagnosisStatus)}
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
              <div className="relative">
                <ChatBubbleBottomCenterTextIcon className="absolute left-4 top-3 w-5 h-5 text-white/40" />
                <textarea
                  placeholder="Especificaciones clínicas, justificación o notas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 pl-12 p-3 text-[12px] focus:border-emerald-500/50 outline-none min-h-[80px] rounded-lg placeholder:text-white/30"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={isCreating}
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
              >
                <PlusCircleIcon className="w-5 h-5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {isCreating ? "Registrando..." : "Confirmar Diagnóstico"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default DiagnosisPanel;