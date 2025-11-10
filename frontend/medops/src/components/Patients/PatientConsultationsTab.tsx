// src/components/Patients/PatientConsultationsTab.tsx
import React from "react";
import { PatientTabProps } from "./types";
import { useCompletedAppointments } from "../../hooks/patients/useCompletedAppointments";
import { Appointment } from "../../types/appointments";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";

export default function PatientConsultationsTab({ patient }: PatientTabProps) {
  const { data: consultations, isLoading, error } = useCompletedAppointments(patient.id);
  const generateReport = useGenerateMedicalReport();

  const isEmpty = !isLoading && !error && (consultations?.length ?? 0) === 0;

  if (isLoading) return <p>Cargando consultas...</p>;
  if (error) return <p className="text-danger">Error: {(error as Error).message}</p>;
  if (isEmpty) return <p>No tiene consultas registradas</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>Notas</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {consultations?.map((c: Appointment) => (
          <tr key={c.id}>
            <td>
              {c.appointment_date
                ? new Date(c.appointment_date).toLocaleDateString("es-VE")
                : "—"}
            </td>
            <td>{c.appointment_type ?? "—"}</td>
            <td>{c.status ?? "—"}</td>
            <td>{c.notes || "—"}</td>
            <td>
              <button
                className="btn btn-primary btn-sm"
                disabled={generateReport.isPending}
                onClick={() => generateReport.mutate(c.id)}
              >
                {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
              </button>

              {/* Mostrar enlace directo al PDF recién generado */}
              {generateReport.data?.file_url && generateReport.data.appointment === c.id && (
                <a
                  href={generateReport.data.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm ml-2"
                >
                  Ver Informe
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
