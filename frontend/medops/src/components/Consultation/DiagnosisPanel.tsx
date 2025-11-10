// src/components/Consultation/DiagnosisPanel.tsx
import { useState, useEffect, useRef } from "react";
import { useIcdSearch } from "../../hooks/diagnosis/useIcdSearch";
import type { IcdResult } from "../../hooks/diagnosis/useIcdSearch";
import { useCreateDiagnosis } from "../../hooks/consultations/useCreateDiagnosis";
import { useUpdateDiagnosis } from "../../hooks/consultations/useUpdateDiagnosis";
import { useDeleteDiagnosis } from "../../hooks/consultations/useDeleteDiagnosis";
import { useCurrentConsultation } from "../../hooks/consultations/useCurrentConsultation";
import DiagnosisBadge from "./DiagnosisBadge";

export default function DiagnosisPanel() {
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<IcdResult | null>(null);

  const { data: results = [], isLoading } = useIcdSearch(query);
  const { data: appointment } = useCurrentConsultation();
  const { mutate: createDiagnosis } = useCreateDiagnosis();
  const { mutate: updateDiagnosis } = useUpdateDiagnosis();
  const { mutate: deleteDiagnosis } = useDeleteDiagnosis();

  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    itemRefs.current = [];
    setHighlightIndex(-1);
  }, [results]);

  const handleSelect = (item: IcdResult) => {
    setSelectedDiagnosis(item);
    setDescription("");
  };

  const handleSave = () => {
    if (!appointment || !selectedDiagnosis) return;

    const payload = {
      appointment: appointment.id,
      icd_code: selectedDiagnosis.icd_code,
      title: selectedDiagnosis.title || "Sin título",
      description,
      ...(selectedDiagnosis.foundation_id ? { foundation_id: selectedDiagnosis.foundation_id } : {}),
    };

    console.log("Guardando diagnóstico:", payload);
    createDiagnosis(payload);

    setSelectedDiagnosis(null);
    setDescription("");
    setQuery("");
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  const handleEdit = (id: number, newDescription: string) => {
    console.log("Editar diagnóstico:", id, newDescription);
    updateDiagnosis({ id, description: newDescription });
  };

  const handleDelete = (id: number) => {
    console.log("Eliminar diagnóstico:", id);
    deleteDiagnosis(id);
  };

  useEffect(() => {
    if (highlightIndex >= 0) {
      const el = itemRefs.current[highlightIndex];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  return (
    <div className="diagnosis-panel card">
      <h3 className="text-lg font-bold mb-2">Diagnósticos</h3>

      <ul className="mb-4">
        {(!appointment || appointment.diagnoses.length === 0) && (
          <li className="text-muted">Sin diagnósticos</li>
        )}
        {appointment?.diagnoses.map((d) => (
          <li key={d.id}>
            <DiagnosisBadge
              id={d.id}
              icd_code={d.icd_code}
              title={d.title || "Sin título"}
              description={d.description}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Buscar diagnóstico ICD-11..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightIndex(-1);
          }}
          onKeyDown={handleKeyDown}
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
    </div>
  );
}
