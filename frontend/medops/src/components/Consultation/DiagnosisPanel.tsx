import React, { useState, useEffect, useRef } from "react";
import { useIcdSearch } from "../../hooks/diagnosis/useIcdSearch";
import type { IcdResult } from "../../hooks/diagnosis/useIcdSearch";
import { useCreateDiagnosis } from "../../hooks/consultations/useCreateDiagnosis";
import { useUpdateDiagnosis } from "../../hooks/consultations/useUpdateDiagnosis";
import { useDeleteDiagnosis } from "../../hooks/consultations/useDeleteDiagnosis";
import DiagnosisBadge from "./DiagnosisBadge";
import { Diagnosis } from "../../types/consultation";

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

  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

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

  const handleEdit = (id: number, newDescription: string) => {
    updateDiagnosis({ id, description: newDescription });
  };

  const handleDelete = (id: number) => {
    deleteDiagnosis(id);
  };

  return (
    <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
      <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white mb-2">
        Diagnósticos
      </h3>

      <ul className="mb-4">
        {diagnoses.length === 0 && (
          <li className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sin diagnósticos</li>
        )}
        {diagnoses.map((d) => (
          <li key={d.id}>
            <DiagnosisBadge
              id={d.id}
              icd_code={String(d.icd_code)}
              title={typeof d.title === "string" ? d.title : d.name ?? "Sin título"}
              description={typeof d.description === "string" ? d.description : d.notes ?? ""}
              {...(!readOnly && {
                onEdit: handleEdit,
                onDelete: handleDelete,
              })}
            />
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Buscar diagnóstico ICD-11..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightIndex(-1);
            }}
            onKeyDown={(e) => {
              if (!results || results.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((prev) => (prev + 1) % results.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((prev) => (prev - 1 + results.length) % results.length);
              } else if (e.key === "Enter" && highlightIndex >= 0) {
                e.preventDefault();
                handleSelect(results[highlightIndex]);
              } else if (e.key === "Escape") {
                setHighlightIndex(-1);
              }
            }}
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />

          {isLoading && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Buscando...</p>}
          {!isLoading && query.length >= 1 && results.length === 0 && (
            <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">Sin resultados para "{query}"</p>
          )}

          {results.length > 0 && (
            <ul className="border rounded p-2 max-h-40 overflow-y-auto text-xs sm:text-sm">
              {results.map((r, idx) => (
                <li
                  key={r.icd_code}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  className={`cursor-pointer p-1 ${
                    idx === highlightIndex ? "bg-[#0d2c53] text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => handleSelect(r)}
                >
                  <strong>{r.icd_code}</strong> — {r.title}
                </li>
              ))}
            </ul>
          )}

          {selectedDiagnosis && (
            <div className="p-2 border rounded bg-gray-50 dark:bg-gray-700 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100">
              <strong>{selectedDiagnosis.icd_code}</strong> — {selectedDiagnosis.title}
            </div>
          )}

          {selectedDiagnosis && (
            <>
              <textarea
                placeholder="Notas clínicas para este diagnóstico"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                           bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              />
              <button
                onClick={handleSave}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors self-start"
              >
                Guardar diagnóstico
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosisPanel;
