// src/components/Consultation/PrescriptionPanel.tsx
import { useState } from "react";
import { Diagnosis, Prescription } from "../../types/consultation";

interface PrescriptionPanelProps {
  diagnoses: Diagnosis[];
  onAdd: (data: { diagnosis: number; medication: string; dosage?: string; duration?: string }) => void;
}

export default function PrescriptionPanel({ diagnoses, onAdd }: PrescriptionPanelProps) {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || !medication.trim()) return;
    onAdd({ diagnosis: Number(diagnosisId), medication, dosage, duration });
    setDiagnosisId("");
    setMedication("");
    setDosage("");
    setDuration("");
  };

  return (
    <div className="prescription-panel card">
      <h3 className="text-lg font-bold mb-2">Prescripciones</h3>

      {/* Lista de diagnósticos con sus prescripciones */}
      {diagnoses.length === 0 && <p className="text-muted">No hay diagnósticos registrados</p>}
      {diagnoses.map((d) => (
        <div key={d.id} className="mb-3">
          <h4 className="font-semibold">
            {d.code} — {d.description || "Sin descripción"}
          </h4>
          <ul className="ml-4 list-disc">
            {d.prescriptions && d.prescriptions.length > 0 ? (
              d.prescriptions.map((p: Prescription) => (
                <li key={p.id}>
                  <strong>{p.medication}</strong>
                  {p.dosage && ` — ${p.dosage}`}
                  {p.duration && ` (${p.duration})`}
                </li>
              ))
            ) : (
              <li className="text-muted">Sin prescripciones</li>
            )}
          </ul>
        </div>
      ))}

      {/* Formulario para agregar nueva prescripción */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
        <select
          value={diagnosisId}
          onChange={(e) => setDiagnosisId(Number(e.target.value))}
          className="select"
        >
          <option value="">Seleccionar diagnóstico</option>
          {diagnoses.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} — {d.description}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Medicamento"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          className="input"
        />

        <input
          type="text"
          placeholder="Dosis (ej: 500mg cada 8h)"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          className="input"
        />

        <input
          type="text"
          placeholder="Duración (ej: 7 días)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="input"
        />

        <button type="submit" className="btn-primary self-start">
          + Agregar prescripción
        </button>
      </form>
    </div>
  );
}
