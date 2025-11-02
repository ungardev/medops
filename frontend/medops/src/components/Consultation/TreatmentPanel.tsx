// src/components/Consultation/TreatmentPanel.tsx
import { useState } from "react";
import { Diagnosis, Treatment } from "../../types/consultation";

interface TreatmentPanelProps {
  diagnoses: Diagnosis[];
  onAdd: (data: { diagnosis: number; plan: string; start_date?: string; end_date?: string }) => void;
}

export default function TreatmentPanel({ diagnoses, onAdd }: TreatmentPanelProps) {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [plan, setPlan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || !plan.trim()) return;
    onAdd({ diagnosis: Number(diagnosisId), plan, start_date: startDate, end_date: endDate });
    setDiagnosisId("");
    setPlan("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="treatment-panel card">
      <h3 className="text-lg font-bold mb-2">Tratamientos</h3>

      {/* Lista de diagnósticos con sus tratamientos */}
      {diagnoses.length === 0 && <p className="text-muted">No hay diagnósticos registrados</p>}
      {diagnoses.map((d) => (
        <div key={d.id} className="mb-3">
          <h4 className="font-semibold">
            {d.code} — {d.description || "Sin descripción"}
          </h4>
          <ul className="ml-4 list-disc">
            {d.treatments && d.treatments.length > 0 ? (
              d.treatments.map((t: Treatment) => (
                <li key={t.id}>
                  {t.plan}{" "}
                  {t.start_date && t.end_date
                    ? `(${t.start_date} → ${t.end_date})`
                    : ""}
                </li>
              ))
            ) : (
              <li className="text-muted">Sin tratamientos</li>
            )}
          </ul>
        </div>
      ))}

      {/* Formulario para agregar nuevo tratamiento */}
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
          placeholder="Plan de tratamiento"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="input"
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
        </div>

        <button type="submit" className="btn-primary self-start">
          + Agregar tratamiento
        </button>
      </form>
    </div>
  );
}
