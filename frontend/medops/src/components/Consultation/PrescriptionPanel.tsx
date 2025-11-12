import { useState } from "react";
import { Diagnosis, Prescription } from "../../types/consultation";
import PrescriptionBadge from "./PrescriptionBadge";
import { useUpdatePrescription } from "../../hooks/consultations/useUpdatePrescription";
import { useDeletePrescription } from "../../hooks/consultations/useDeletePrescription";

interface PrescriptionPanelProps {
  diagnoses: Diagnosis[];
  onAdd: (data: {
    diagnosis: number;
    medication: string;
    dosage?: string;
    duration?: string;
    frequency?: "daily" | "bid" | "tid" | "qid";
    route?: "oral" | "iv" | "im" | "sc";
    unit?: "mg" | "ml" | "g" | "tablet";
  }) => void;
}

export default function PrescriptionPanel({ diagnoses, onAdd }: PrescriptionPanelProps) {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "bid" | "tid" | "qid">("daily");
  const [route, setRoute] = useState<"oral" | "iv" | "im" | "sc">("oral");
  const [unit, setUnit] = useState<"mg" | "ml" | "g" | "tablet">("mg");

  const { mutate: updatePrescription } = useUpdatePrescription();
  const { mutate: deletePrescription } = useDeletePrescription();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || !medication.trim()) return;

    onAdd({
      diagnosis: Number(diagnosisId),
      medication: medication.trim(),
      dosage: dosage.trim() || undefined,
      duration: duration.trim() || undefined,
      frequency,
      route,
      unit,
    });

    // reset form
    setDiagnosisId("");
    setMedication("");
    setDosage("");
    setDuration("");
    setFrequency("daily");
    setRoute("oral");
    setUnit("mg");
  };

  return (
    <div className="prescription-panel card">
      <h3 className="text-lg font-bold mb-2">Prescripciones</h3>

      {diagnoses.length === 0 && <p className="text-muted">No hay diagnósticos registrados</p>}
      {diagnoses.map((d) => (
        <div key={d.id} className="mb-3">
          <h4 className="font-semibold">
            {d.icd_code} — {d.title || d.description || "Sin descripción"}
          </h4>
          <ul className="ml-4">
            {d.prescriptions && d.prescriptions.length > 0 ? (
              d.prescriptions.map((p: Prescription) => (
                <li key={p.id}>
                  <PrescriptionBadge
                    id={p.id}
                    medication={p.medication}
                    dosage={p.dosage}
                    duration={p.duration}
                    frequency={p.frequency}
                    route={p.route}
                    unit={p.unit}
                    onEdit={(id, med, dos, dur, freq, rt, un) =>
                      updatePrescription({
                        id,
                        medication: med,
                        dosage: dos,
                        duration: dur,
                        frequency: freq,
                        route: rt,
                        unit: un,
                      })
                    }
                    onDelete={(id) => deletePrescription(id)}
                  />
                </li>
              ))
            ) : (
              <li className="text-muted">Sin prescripciones</li>
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
          placeholder="Medicamento"
          value={medication}
          onChange={(e) => setMedication(e.target.value)}
          className="input"
          required
        />

        <input
          type="text"
          placeholder="Dosis (ej: 500)"
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

        <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="select">
          <option value="daily">Diaria</option>
          <option value="bid">2 veces al día (BID)</option>
          <option value="tid">3 veces al día (TID)</option>
          <option value="qid">4 veces al día (QID)</option>
        </select>

        <select value={route} onChange={(e) => setRoute(e.target.value as any)} className="select">
          <option value="oral">Oral</option>
          <option value="iv">Intravenosa (IV)</option>
          <option value="im">Intramuscular (IM)</option>
          <option value="sc">Subcutánea (SC)</option>
        </select>

        <select value={unit} onChange={(e) => setUnit(e.target.value as any)} className="select">
          <option value="mg">mg</option>
          <option value="ml">ml</option>
          <option value="g">g</option>
          <option value="tablet">Tableta</option>
        </select>

        <button type="submit" className="btn-primary self-start">
          + Agregar prescripción
        </button>
      </form>
    </div>
  );
}
