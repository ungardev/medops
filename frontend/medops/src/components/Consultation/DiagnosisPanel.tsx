// src/components/Consultation/DiagnosisPanel.tsx
import { useState } from "react";
import { Diagnosis } from "../../types/consultation";

interface DiagnosisPanelProps {
  diagnoses: Diagnosis[];
  onAdd: (data: { code: string; description?: string }) => void;
}

export default function DiagnosisPanel({ diagnoses, onAdd }: DiagnosisPanelProps) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    onAdd({ code, description });
    setCode("");
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
            <strong>{d.code}</strong> — {d.description || "Sin descripción"}
          </li>
        ))}
      </ul>

      {/* Formulario para agregar nuevo diagnóstico */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Código (ej: J00)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input"
        />
        <textarea
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea"
        />
        <button type="submit" className="btn-primary self-start">
          + Agregar diagnóstico
        </button>
      </form>
    </div>
  );
}
