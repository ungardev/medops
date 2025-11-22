// src/components/Consultation/TreatmentPanel.tsx
import React, { useState } from "react";
import { Diagnosis, Treatment } from "../../types/consultation";
import TreatmentBadge, {
  TreatmentStatus,
  TreatmentType,
} from "./TreatmentBadge";
import { useUpdateTreatment } from "../../hooks/consultations/useUpdateTreatment";
import { useDeleteTreatment } from "../../hooks/consultations/useDeleteTreatment";

export interface TreatmentPanelProps {
  diagnoses: Diagnosis[];
  appointmentId?: number;
  treatments?: Treatment[];
  readOnly?: boolean;
  onAdd?: (data: {
    appointment: number;
    diagnosis: number;
    plan: string;
    start_date?: string;
    end_date?: string;
    status: "active" | "completed" | "cancelled";
    treatment_type:
      | "pharmacological"
      | "surgical"
      | "rehabilitation"
      | "lifestyle"
      | "other";
  }) => void;
}

function normalizeStatus(
  status: TreatmentStatus | undefined
): "active" | "completed" | "cancelled" | undefined {
  if (!status) return undefined;
  return status === "suspended" ? "cancelled" : status;
}

function normalizeType(
  type: TreatmentType | undefined
): "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other" | undefined {
  if (!type) return undefined;
  if (type === "therapeutic") return "rehabilitation";
  return type;
}

const TreatmentPanel: React.FC<TreatmentPanelProps> = ({
  diagnoses,
  appointmentId,
  treatments,
  readOnly,
  onAdd,
}) => {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [plan, setPlan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "cancelled">("active");
  const [treatmentType, setTreatmentType] = useState<
    "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other"
  >("pharmacological");

  const { mutate: updateTreatment } = useUpdateTreatment();
  const { mutate: deleteTreatment } = useDeleteTreatment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || !plan.trim() || !appointmentId || !onAdd) return;

    onAdd({
      appointment: appointmentId,
      diagnosis: Number(diagnosisId),
      plan: plan.trim(),
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status,
      treatment_type: treatmentType,
    });

    setDiagnosisId("");
    setPlan("");
    setStartDate("");
    setEndDate("");
    setStatus("active");
    setTreatmentType("pharmacological");
  };
    return (
    <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Tratamientos
      </h3>

      {/* Modo lectura */}
      {readOnly && (
        <>
          {diagnoses.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay diagnósticos registrados</p>
          )}
          {diagnoses.map((d) => (
            <div key={d.id} className="mb-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
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
                        status={t.status as TreatmentStatus}
                        treatment_type={t.treatment_type as TreatmentType}
                      />
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-600 dark:text-gray-400">Sin tratamientos</li>
                )}
              </ul>
            </div>
          ))}
        </>
      )}

      {/* Modo edición */}
      {!readOnly && (
        <>
          {diagnoses.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">No hay diagnósticos registrados</p>
          )}
          {diagnoses.map((d) => (
            <div key={d.id} className="mb-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
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
                        status={t.status as TreatmentStatus}
                        treatment_type={t.treatment_type as TreatmentType}
                        onEdit={(id, newPlan, start, end, newStatus, newType) =>
                          updateTreatment({
                            id,
                            plan: newPlan,
                            start_date: start ?? undefined,
                            end_date: end ?? undefined,
                            status: normalizeStatus(newStatus),
                            treatment_type: normalizeType(newType),
                          })
                        }
                        onDelete={(id) => deleteTreatment(id)}
                      />
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-gray-600 dark:text-gray-400">Sin tratamientos</li>
                )}
              </ul>
            </div>
          ))}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
            <select
              value={diagnosisId}
              onChange={(e) => setDiagnosisId(Number(e.target.value))}
              required
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              required
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>

            <select
              value={treatmentType}
              onChange={(e) => setTreatmentType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value="pharmacological">Farmacológico</option>
              <option value="surgical">Quirúrgico</option>
              <option value="rehabilitation">Rehabilitación</option>
              <option value="lifestyle">Cambio de estilo de vida</option>
              <option value="other">Otro</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors self-start"
            >
              + Agregar tratamiento
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default TreatmentPanel;
