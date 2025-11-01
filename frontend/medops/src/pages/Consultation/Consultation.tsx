import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getCurrentConsultation,
  updateAppointmentNotes,
  updateAppointmentStatus,
} from "../../api/consultation";
import { Appointment, Diagnosis, Treatment, Prescription } from "../../types";

import PageHeader from "../../components/Layout/PageHeader";

export default function Consultation() {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  // 🔹 Traer la cita en curso (gracias a apiFetchOptional ya devuelve null en 404/204)
  const {
    data: consultation,
    isLoading,
    isError,
  } = useQuery<Appointment | null>({
    queryKey: ["consultation", "current"],
    queryFn: getCurrentConsultation,
    retry: false,
  });

  const updateNotesMutation = useMutation({
    mutationFn: (data: { id: number; notes: string }) =>
      updateAppointmentNotes(data.id, data.notes),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      updateAppointmentStatus(data.id, data.status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] }),
  });

  // --- Renderizado según estado ---
  if (isLoading) return <p>Cargando consulta...</p>;
  if (isError) return <p>Error al cargar la consulta.</p>;
  if (!consultation) return <p>No hay consulta activa en este momento.</p>;

  return (
    <div>
      <PageHeader title="Consulta Médica" />

      <div className="flex gap-6">
        {/* Columna izquierda */}
        <div className="flex-1 flex-col gap-4">
          {/* Datos del paciente */}
          <div className="card">
            <h3 className="font-semibold mb-2">Paciente</h3>
            <p><strong>{consultation.patient.full_name}</strong></p>
            <p>CI: {consultation.patient.national_id || "—"}</p>
            <p>
              Estado cita:{" "}
              <span className="badge badge-warning">{consultation.status}</span>
            </p>
          </div>

          {/* Notas de evolución */}
          <div className="card">
            <h3 className="font-semibold mb-2">Notas de evolución</h3>
            <textarea
              className="textarea"
              value={notes || consultation.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              className="btn btn-primary mt-2"
              onClick={() =>
                updateNotesMutation.mutate({ id: consultation.id, notes })
              }
            >
              Guardar notas
            </button>
          </div>

          {/* Diagnósticos */}
          <div className="card">
            <h3 className="font-semibold mb-2">Diagnósticos</h3>
            {consultation.diagnoses?.map((d: Diagnosis) => (
              <div key={d.id} className="mb-3">
                <p>
                  <strong>{d.code}</strong> — {d.description}
                </p>
                <ul className="ml-4 list-disc">
                  {d.treatments.map((t: Treatment) => (
                    <li key={t.id}>Tratamiento: {t.plan}</li>
                  ))}
                  {d.prescriptions.map((p: Prescription) => (
                    <li key={p.id}>
                      Rx: {p.medication} — {p.dosage} ({p.duration})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button className="btn btn-outline">Agregar diagnóstico</button>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="flex-1 flex-col gap-4">
          {/* Documentos clínicos */}
          <div className="card">
            <h3 className="font-semibold mb-2">Documentos clínicos</h3>
            {/* Aquí lista de documentos */}
            <button className="btn btn-outline">Subir documento</button>
          </div>

          {/* Pagos */}
          <div className="card">
            <h3 className="font-semibold mb-2">Pagos</h3>
            <p>Monto esperado: {consultation.expected_amount}</p>
            {/* Aquí tabla de micropagos */}
            <button className="btn btn-success">Agregar pago</button>
          </div>

          {/* Auditoría */}
          <div className="card">
            <h3 className="font-semibold mb-2">Auditoría</h3>
            {/* Aquí timeline de eventos */}
          </div>
        </div>
      </div>

      {/* Acciones globales */}
      <div className="mt-4 flex gap-2">
        <button
          className="btn btn-success"
          onClick={() =>
            updateStatusMutation.mutate({
              id: consultation.id,
              status: "completed",
            })
          }
        >
          Finalizar consulta
        </button>
        <button
          className="btn btn-danger"
          onClick={() =>
            updateStatusMutation.mutate({
              id: consultation.id,
              status: "canceled",
            })
          }
        >
          Cancelar consulta
        </button>
      </div>
    </div>
  );
}
