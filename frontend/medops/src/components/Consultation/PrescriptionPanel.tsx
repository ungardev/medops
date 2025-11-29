// src/components/Consultation/PrescriptionPanel.tsx
import React, { useState } from "react";
import {
  Diagnosis,
  Prescription,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
  PrescriptionComponent,
} from "../../types/consultation";
import PrescriptionBadge from "./PrescriptionBadge";
import { useUpdatePrescription } from "../../hooks/consultations/useUpdatePrescription";
import { useDeletePrescription } from "../../hooks/consultations/useDeletePrescription";
import MedicationSelector from "./MedicationSelector";

interface Option {
  value: string;
  label: string;
}

const frequencyOptions: Option[] = [
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

const routeOptions: Option[] = [
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
export interface PrescriptionPanelProps {
  diagnoses: Diagnosis[];
  prescriptions?: Prescription[];
  readOnly?: boolean;
  onAdd?: (data: CreatePrescriptionInput) => void;
}

const PrescriptionPanel: React.FC<PrescriptionPanelProps> = ({
  diagnoses,
  prescriptions,
  readOnly,
  onAdd,
}) => {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [medicationCatalogId, setMedicationCatalogId] = useState<number | undefined>(undefined);
  const [medicationText, setMedicationText] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState<UpdatePrescriptionInput["frequency"]>("once_daily");
  const [route, setRoute] = useState<UpdatePrescriptionInput["route"]>("oral");
  const [components, setComponents] = useState<PrescriptionComponent[]>([]);

  const { mutate: updatePrescription } = useUpdatePrescription();
  const { mutate: deletePrescription } = useDeletePrescription();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!diagnosisId || (!medicationCatalogId && !medicationText)) {
      alert("Debes seleccionar un diagnóstico y un medicamento válido.");
      return;
    }

    const payload: CreatePrescriptionInput = {
      diagnosis: Number(diagnosisId),
      medication_catalog: medicationCatalogId || undefined,
      medication_text: medicationText?.trim() || undefined,
      duration: duration.trim() || undefined,
      frequency,
      route,
      components: components.map((c) => ({
        substance: c.substance.trim(),
        dosage: Number(c.dosage),
        unit: c.unit,
      })),
    };

    onAdd?.(payload);

    // reset
    setDiagnosisId("");
    setMedicationCatalogId(undefined);
    setMedicationText(undefined);
    setDuration("");
    setFrequency("once_daily");
    setRoute("oral");
    setComponents([]);
  };
    return (
    <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-2">Prescripciones</h3>

      {/* 🔹 Modo lectura */}
      {readOnly && (
        <>
          {diagnoses.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay diagnósticos registrados</p>
          )}
          {diagnoses.map((d) => (
            <div key={d.id} className="mb-3">
              <h4 className="font-semibold text-[#0d2c53] dark:text-gray-200">
                {d.icd_code} — {d.title || d.description || "Sin descripción"}
              </h4>
              <ul className="ml-4">
                {d.prescriptions && d.prescriptions.length > 0 ? (
                  d.prescriptions.map((p: Prescription) => (
                    <li key={p.id}>
                      <PrescriptionBadge
                        id={p.id}
                        medication={p.medication_catalog?.name || p.medication_text || "—"}
                        duration={p.duration ?? undefined}
                        frequency={p.frequency}
                        route={p.route}
                        components={p.components}
                      />
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-600 dark:text-gray-400">Sin prescripciones</li>
                )}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* 🔹 Modo edición */}
      {!readOnly && (
        <>
          {diagnoses.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay diagnósticos registrados</p>
          )}
                    {diagnoses.map((d) => (
            <div key={d.id} className="mb-3">
              <h4 className="font-semibold text-[#0d2c53] dark:text-gray-200">
                {d.icd_code} — {d.title || d.description || "Sin descripción"}
              </h4>
              <ul className="ml-4">
                {d.prescriptions && d.prescriptions.length > 0 ? (
                  d.prescriptions.map((p: Prescription) => (
                    <li key={p.id}>
                      <PrescriptionBadge
                        id={p.id}
                        medication={p.medication_catalog?.name || p.medication_text || "—"}
                        duration={p.duration ?? undefined}
                        frequency={p.frequency}
                        route={p.route}
                        components={p.components}
                        onEdit={(id, med, dur, freq, rt, comps) =>
                          updatePrescription({
                            id,
                            medication_text: med,
                            duration: (dur ?? undefined)?.trim() || undefined,
                            frequency: freq,
                            route: rt,
                            components: comps || [],
                          } as UpdatePrescriptionInput)
                        }
                        onDelete={(id) => deletePrescription(id)}
                      />
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-600 dark:text-gray-400">Sin prescripciones</li>
                )}
              </ul>
            </div>
          ))}

          {/* Formulario de nueva prescripción */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
            <select
              value={diagnosisId}
              onChange={(e) => setDiagnosisId(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
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

            {/* 🔹 Subform dinámico para componentes */}
            {components.map((comp, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Sustancia"
                  value={comp.substance}
                  onChange={(e) => {
                    const newComps = [...components];
                    newComps[index].substance = e.target.value;
                    setComponents(newComps);
                  }}
                  className="px-2 py-1 border rounded text-[#0d2c53] dark:text-gray-100"
                />
                <input
                  type="number"
                  placeholder="Dosis"
                  value={comp.dosage}
                  onChange={(e) => {
                    const newComps = [...components];
                    newComps[index].dosage = Number(e.target.value);
                    setComponents(newComps);
                  }}
                  className="px-2 py-1 border rounded text-[#0d2c53] dark:text-gray-100"
                />
                <select
                  value={comp.unit}
                  onChange={(e) => {
                    const newComps = [...components];
                    newComps[index].unit = e.target.value as PrescriptionComponent["unit"];
                    setComponents(newComps);
                  }}
                  className="px-2 py-1 border rounded text-[#0d2c53] dark:text-gray-100"
                >
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                  <option value="tablet">Tableta</option>
                  <option value="capsule">Cápsula</option>
                  <option value="drop">Gotas</option>
                  <option value="puff">Inhalación</option>
                  <option value="unit">Unidad</option>
                  <option value="patch">Parche</option>
                </select>
                <button
                  type="button"
                  onClick={() => setComponents(components.filter((_, i) => i !== index))}
                  className="text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setComponents([...components, { substance: "", dosage: 0, unit: "mg" }])
              }
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              + Agregar componente
            </button>

            <input
              type="text"
              placeholder="Duración (ej: 7 días)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />

            <select
              value={frequency}
              onChange={(e) =>
                setFrequency(e.target.value as UpdatePrescriptionInput["frequency"])
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            >
              {frequencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={route}
              onChange={(e) => setRoute(e.target.value as UpdatePrescriptionInput["route"])}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            >
              {routeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors self-start"
            >
              + Agregar prescripción
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default PrescriptionPanel;
