// src/components/Consultation/DiagnosisPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import { useIcdSearch } from "../../hooks/diagnosis/useIcdSearch";
import type { IcdResult } from "../../hooks/diagnosis/useIcdSearch";
import { useCreateDiagnosis } from "../../hooks/consultations/useCreateDiagnosis";
import { useUpdateDiagnosis } from "../../hooks/consultations/useUpdateDiagnosis";
import { useDeleteDiagnosis } from "../../hooks/consultations/useDeleteDiagnosis";
import DiagnosisBadge from "./DiagnosisBadge";
import { Diagnosis } from "../../types/consultation";
import { 
  MagnifyingGlassIcon, 
  BeakerIcon, 
  ChatBubbleBottomCenterTextIcon,
  PlusCircleIcon,
  HashtagIcon
} from "@heroicons/react/24/outline";

export interface DiagnosisPanelProps {
  diagnoses?: Diagnosis[];
  readOnly?: boolean;
  appointmentId: number;
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ diagnoses = [], readOnly, appointmentId }) => {
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<IcdResult | null>(null);

  const { data: results = [], isLoading } = useIcdSearch(query);
  const { mutate: createDiagnosis } = useCreateDiagnosis();
  const { mutate: updateDiagnosis } = useUpdateDiagnosis();
  const { mutate: deleteDiagnosis } = useDeleteDiagnosis();

  // Cambiado de HTMLLIElement a HTMLDivElement para coincidir con el renderizado
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
  };

  const handleSave = () => {
    if (!selectedDiagnosis) return;
    const payload = {
      appointment: appointmentId,
      icd_code: selectedDiagnosis.icd_code,
      title: selectedDiagnosis.title || "Sin título",
      description,
      ...(selectedDiagnosis.foundation_id ? { foundation_id: selectedDiagnosis.foundation_id } : {}),
    };
    createDiagnosis(payload);
    setSelectedDiagnosis(null);
    setDescription("");
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
              placeholder="SEARCH_ICD11_DATABASE..."
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
              <div className="flex items-center gap-2 text-[var(--palantir-active)]">
                <HashtagIcon className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">Selected_Entity: {selectedDiagnosis.icd_code}</span>
              </div>
              
              <div className="relative">
                <ChatBubbleBottomCenterTextIcon className="absolute left-3 top-3 w-4 h-4 text-[var(--palantir-muted)]" />
                <textarea
                  placeholder="ADD_CLINICAL_SPECIFICATIONS..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/60 border border-[var(--palantir-border)] pl-10 p-3 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none min-h-[80px]"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-[var(--palantir-active)] hover:bg-blue-600 text-white py-3 flex items-center justify-center gap-2 transition-all"
              >
                <PlusCircleIcon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Commit_Diagnosis_To_Record</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosisPanel;
