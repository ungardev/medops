// src/components/Consultation/DiagnosisPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import { useIcdSearch } from "../../hooks/diagnosis/useIcdSearch";
import type { IcdResult } from "../../hooks/diagnosis/useIcdSearch";
import { useCreateDiagnosis } from "../../hooks/consultations/useCreateDiagnosis";
import { useUpdateDiagnosis } from "../../hooks/consultations/useUpdateDiagnosis";
import { useDeleteDiagnosis } from "../../hooks/consultations/useDeleteDiagnosis";
import DiagnosisBadge from "./DiagnosisBadge";
import { Diagnosis } from "../../types/consultation";

// 🔹 Exportamos la interfaz para que pueda ser usada en index.ts
export interface DiagnosisPanelProps {
  diagnoses?: Diagnosis[];   // lista de diagnósticos (lectura y escritura)
  readOnly?: boolean;        // flag para modo lectura
  appointmentId: number;     // 👈 ID de la consulta asociado
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
      appointment: appointmentId,   // 👈 usamos el prop explícito
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
    <div className="diagnosis-panel card">
      <h3 className="text-lg font-bold mb-2">Diagnósticos</h3>

      <ul className="mb-4">
        {diagnoses.length === 0 && (
          <li className="text-muted">Sin diagnósticos</li>
        )}
        {diagnoses.map((d) => (
          <li key={d.id}>
            <DiagnosisBadge
              id={d.id}
              icd_code={d.icd_code}
              title={d.title || "Sin título"}
              description={d.description}
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
            className="input"
          />

          {isLoading && <p className="text-sm text-muted">Buscando...</p>}
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <p className="text-sm text-warning">Sin resultados para "{query}"</p>
          )}

          {results.length > 0 && (
            <ul className="border rounded p-2 max-h-40 overflow-y-auto">
              {results.map((r, idx) => (
                <li
                  key={r.icd_code}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  className={`cursor-pointer p-1 ${
                    idx === highlightIndex ? "bg-blue-100" : "hover:bg-gray-100"
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
            <div className="p-2 border rounded bg-gray-50">
              <strong>{selectedDiagnosis.icd_code}</strong> — {selectedDiagnosis.title}
            </div>
          )}

          {selectedDiagnosis && (
            <>
              <textarea
                placeholder="Notas clínicas para este diagnóstico"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea"
              />
              <button onClick={handleSave} className="btn btn-primary">
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
