import { useState } from "react";
import { Diagnosis, Prescription } from "../../types/consultation";
import PrescriptionBadge from "./PrescriptionBadge";
import { useUpdatePrescription } from "../../hooks/consultations/useUpdatePrescription";
import { useDeletePrescription } from "../../hooks/consultations/useDeletePrescription";

// 🔹 Opciones institucionales
const frequencyOptions = [
  { value: "once_daily", label: "Una vez al día" },
  { value: "bid", label: "2 veces al día (BID)" },
  { value: "tid", label: "3 veces al día (TID)" },
  { value: "qid", label: "4 veces al día (QID)" },
  { value: "q4h", label: "Cada 4 horas" },
  { value: "q6h", label: "Cada 6 horas" },
  { value: "q8h", label: "Cada 8 horas" },
  { value: "q12h", label: "Cada 12 horas" },
  { value: "q24h", label: "Cada 24 horas" },
  { value: "qod", label: "Día por medio" },
  { value: "stat", label: "Una sola vez / Inmediato" },
  { value: "prn", label: "Según necesidad" },
  { value: "hs", label: "Al acostarse" },
  { value: "ac", label: "Antes de las comidas" },
  { value: "pc", label: "Después de las comidas" },
  { value: "achs", label: "Antes de comidas y al acostarse" },
];

const routeOptions = [
  { value: "oral", label: "Oral" },
  { value: "iv", label: "Intravenosa (IV)" },
  { value: "im", label: "Intramuscular (IM)" },
  { value: "sc", label: "Subcutánea (SC)" },
  { value: "sublingual", label: "Sublingual" },
  { value: "inhalation", label: "Inhalación" },
  { value: "rectal", label: "Rectal" },
  { value: "topical", label: "Tópica" },
  { value: "other", label: "Otro" },
];

const unitOptions = [
  { value: "mg", label: "mg" },
  { value: "ml", label: "ml" },
  { value: "g", label: "g" },
  { value: "tablet", label: "Tableta" },
  { value: "capsule", label: "Cápsula" },
  { value: "drop", label: "Gotas" },
  { value: "puff", label: "Inhalación" },
  { value: "unit", label: "Unidad" },
  { value: "patch", label: "Parche" },
];

interface PrescriptionPanelProps {
  diagnoses: Diagnosis[];
  onAdd: (data: {
    diagnosis: number;
    medication: string;
    dosage?: string;
    duration?: string;
    frequency?: string;
    route?: string;
    unit?: string;
  }) => void;
}

export default function PrescriptionPanel({ diagnoses, onAdd }: PrescriptionPanelProps) {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState("once_daily");
  const [route, setRoute] = useState("oral");
  const [unit, setUnit] = useState("mg");

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
    setFrequency("once_daily");
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

        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="select">
          {frequencyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select value={route} onChange={(e) => setRoute(e.target.value)} className="select">
          {routeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="select">
          {unitOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button type="submit" className="btn-primary self-start">
          + Agregar prescripción
        </button>
      </form>
    </div>
  );
}
