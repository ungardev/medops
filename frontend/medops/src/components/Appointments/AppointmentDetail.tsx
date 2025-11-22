import React, { useState } from "react";
import { Appointment } from "../../types/appointments";
import { useUpdateAppointmentNotes } from "hooks/appointments";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentDetail({ appointment, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "notes" | "payments">("info");
  const [notesDraft, setNotesDraft] = useState<string>(appointment.notes || "");
  const notesMutation = useUpdateAppointmentNotes();

  const handleSaveNotes = () => {
    if (!window.confirm("¿Desea guardar las notas de esta cita?")) return;
    notesMutation.mutate({ id: appointment.id, notes: notesDraft });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Detalle de Cita</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
              onClick={() => {
                if (window.confirm("¿Desea editar esta cita?")) {
                  onEdit(appointment);
                }
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
              onClick={onClose}
            >
              ✖
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["info", "notes", "payments"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveTab(tab as "info" | "notes" | "payments")}
            >
              {tab === "info" ? "Info" : tab === "notes" ? "Notas" : "Pagos"}
            </button>
          ))}
        </div>

        {/* Contenido dinámico */}
        {activeTab === "info" && (
          <section className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <h3 className="font-semibold mb-2">Información básica</h3>
            <p><strong>Paciente:</strong> {appointment.patient.full_name}</p>
            <p><strong>Fecha:</strong> {appointment.appointment_date}</p>
            <p><strong>Tipo:</strong> {appointment.appointment_type}</p>
            <p><strong>Estado:</strong> {appointment.status}</p>
            <p><strong>Monto esperado:</strong> {appointment.expected_amount}</p>
          </section>
        )}

        {activeTab === "notes" && (
          <section>
            <h3 className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-300">Notas</h3>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
            />
            <div className="flex justify-between">
              <button
                type="button"
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                           bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                onClick={() => setNotesDraft(appointment.notes || "")}
              >
                Revertir
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
                onClick={handleSaveNotes}
                disabled={notesMutation.isPending}
              >
                Guardar notas
              </button>
            </div>
            {notesMutation.isError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">Error al guardar notas.</p>
            )}
            {notesMutation.isSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">Notas actualizadas correctamente.</p>
            )}
          </section>
        )}

        {activeTab === "payments" && (
          <section className="text-sm text-gray-700 dark:text-gray-300">
            <h3 className="font-semibold mb-2">Pagos</h3>
            {appointment.payments && appointment.payments.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {appointment.payments.map((p) => (
                  <li key={p.id}>
                    {p.amount} - {p.method} ({p.status})
                    {p.reference_number && ` Ref: ${p.reference_number}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay pagos registrados.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
