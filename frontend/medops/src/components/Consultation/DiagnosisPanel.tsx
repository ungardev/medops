// src/components/Consultation/DiagnosisPanel.tsx
import { useState } from "react";
import { Diagnosis } from "../../types/consultation";
import { useIcdSearch } from "../../hooks/diagnosis/useIcdSearch";

// ✅ Importamos el tipo IcdResult desde el hook
import type { IcdResult } from "../../hooks/diagnosis/useIcdSearch";

interface DiagnosisPanelProps {
  diagnoses: Diagnosis[];
  onAdd: (data: {
    icd_code: string;
    title?: string;
    foundation_id?: string;
    description?: string;
  }) => void;
}

export default function DiagnosisPanel({ diagnoses, onAdd }: DiagnosisPanelProps) {
  const [query, setQuery] = useState("");
  const [description, setDescription] = useState("");

  // ✅ results siempre será un array (default [])
  const { data: results = [], isLoading } = useIcdSearch(query);

  const handleSelect = (item: IcdResult) => {
    onAdd({
      icd_code: item.icd_code,
      title: item.title,
      foundation_id: item.foundation_id,
      description,
    });
    setQuery("");
    setDescription("");
  };

  return (
    <div className="diagnosis-panel card">
      <h3 className="text-lg font-bold mb-2">Diagnósticos</h3>

      {/* Lista de diagnósticos existentes */}
      <ul className="mb-4">
        {diagnoses.length === 0 && <li className="text-muted">Sin diagnósticos</li>}
        {diagnoses.map((d) => (
          <li key={d.id} className="border-b py-1">
            <strong>{d.icd_code}</strong> — {d.title || "Sin descripción"}
          </li>
        ))}
      </ul>

      {/* Formulario para agregar nuevo diagnóstico */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Buscar diagnóstico ICD-11..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
        />
        {isLoading && <p>Buscando...</p>}
        {results.length > 0 && (
          <ul className="border rounded p-2 max-h-40 overflow-y-auto">
            {results.map((r) => (
              <li
                key={r.icd_code}
                className="cursor-pointer hover:bg-gray-100 p-1"
                onClick={() => handleSelect(r)}
              >
                <strong>{r.icd_code}</strong> — {r.title}
              </li>
            ))}
          </ul>
        )}

        <textarea
          placeholder="Notas adicionales"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea"
        />
      </div>
    </div>
  );
}
