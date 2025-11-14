import { useState } from "react";
import { Diagnosis, Prescription, CreatePrescriptionInput, UpdatePrescriptionInput } from "../../types/consultation";
import PrescriptionBadge from "./PrescriptionBadge";
import { useUpdatePrescription } from "../../hooks/consultations/useUpdatePrescription";
import { useDeletePrescription } from "../../hooks/consultations/useDeletePrescription";
import MedicationSelector from "./MedicationSelector";

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
  onAdd: (data: CreatePrescriptionInput) => void;
}

export default function PrescriptionPanel({ diagnoses, onAdd }: PrescriptionPanelProps) {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [medicationCatalogId, setMedicationCatalogId] = useState<number | undefined>(undefined);
  const [medicationText, setMedicationText] = useState<string | undefined>(undefined);
  const [dosage, setDosage] = useState("");
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState<UpdatePrescriptionInput["frequency"]>("once_daily");
  const [route, setRoute] = useState<UpdatePrescriptionInput["route"]>("oral");
  const [unit, setUnit] = useState<UpdatePrescriptionInput["unit"]>("mg");

  const { mutate: updatePrescription } = useUpdatePrescription();
  const { mutate: deletePrescription } = useDeletePrescription();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || (!medicationCatalogId && !medicationText)) return;

    onAdd({
      diagnosis: Number(diagnosisId),
      medication_catalog: medicationCatalogId,
      medication_text: medicationText?.trim() || undefined,
      dosage: dosage.trim() || undefined,
      duration: duration.trim() || undefined,
      frequency,
      route,
      unit,
    });

    // reset form
    setDiagnosisId("");
    setMedicationCatalogId(undefined);
    setMedicationText(undefined);
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
                    medication={p.medication_catalog?.name || p.medication_text || "—"}
                    dosage={p.dosage ?? undefined}
                    duration={p.duration ?? undefined}
                    frequency={p.frequency}
                    route={p.route}
                    unit={p.unit}
                    onEdit={(id, med, dos, dur, freq, rt, un) =>
                      updatePrescription({
                        id,
                        medication_text: med,
                        dosage: dos ?? undefined,
                        duration: dur ?? undefined,
                        frequency: freq,
                        route: rt,
                        unit: un,
                      } as UpdatePrescriptionInput)
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

        <MedicationSelector
          valueCatalogId={medicationCatalogId}
          valueText={medicationText}
          onChange={({ catalogId, text }) => {
            setMedicationCatalogId(catalogId);
            setMedicationText(text);
          }}
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

        <select value={frequency} onChange={(e) => setFrequency(e.target.value as UpdatePrescriptionInput["frequency"])} className="select">
          {frequencyOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select value={route} onChange={(e) => setRoute(e.target.value as UpdatePrescriptionInput["route"])} className="select">
          {routeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select value={unit} onChange={(e) => setUnit(e.target.value as UpdatePrescriptionInput["unit"])} className="select">
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
