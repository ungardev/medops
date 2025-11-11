import { useState } from "react";
import { Diagnosis, Treatment } from "../../types/consultation";
import TreatmentBadge from "./TreatmentBadge";
import { useUpdateTreatment } from "../../hooks/consultations/useUpdateTreatment";
import { useDeleteTreatment } from "../../hooks/consultations/useDeleteTreatment";

interface TreatmentPanelProps {
  diagnoses: Diagnosis[];
  appointmentId: number; // 👈 añadido para enviar al backend
  onAdd: (data: {
    appointment: number;
    diagnosis: number;
    plan: string;
    start_date?: string;
    end_date?: string;
  }) => void;
}

export default function TreatmentPanel({ diagnoses, appointmentId, onAdd }: TreatmentPanelProps) {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [plan, setPlan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { mutate: updateTreatment } = useUpdateTreatment();
  const { mutate: deleteTreatment } = useDeleteTreatment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || !plan.trim()) return;

    // 👇 enviamos appointment + diagnosis + datos clínicos
    onAdd({
      appointment: appointmentId,
      diagnosis: Number(diagnosisId),
      plan: plan.trim(),
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });

    // reset form
    setDiagnosisId("");
    setPlan("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="treatment-panel card">
      <h3 className="text-lg font-bold mb-2">Tratamientos</h3>

      {diagnoses.length === 0 && <p className="text-muted">No hay diagnósticos registrados</p>}
      {diagnoses.map((d) => (
        <div key={d.id} className="mb-3">
          <h4 className="font-semibold">
            {d.icd_code} — {d.title || d.description || "Sin descripción"}
          </h4>
          <ul className="ml-4">
            {d.treatments && d.treatments.length > 0 ? (
              d.treatments.map((t: Treatment) => (
                <li key={t.id}>
                  <TreatmentBadge
                    id={t.id}
                    plan={t.plan}
                    start_date={t.start_date}
                    end_date={t.end_date}
                    onEdit={(id, newPlan, start, end) =>
                      updateTreatment({ id, plan: newPlan, start_date: start, end_date: end })
                    }
                    onDelete={(id) => deleteTreatment(id)}
                  />
                </li>
              ))
            ) : (
              <li className="text-muted">Sin tratamientos</li>
            )}
          </ul>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
        <select
          value={diagnosisId}
          onChange={(e) => setDiagnosisId(Number(e.target.value))}
          className="select"
          required
        >
          <option value="">Seleccionar diagnóstico</option>
          {diagnoses.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icd_code} — {d.title || d.description}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Plan de tratamiento"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="input"
          required
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
