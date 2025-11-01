import React, { useState } from "react";
import { Appointment } from "../../types/appointments";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentDetail({ appointment, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "notes" | "payments">("info");

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ width: "520px", maxHeight: "80vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex-between mb-16">
          <h2>Detalle de Cita</h2>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                if (window.confirm("¿Desea editar esta cita?")) {
                  onEdit(appointment);
                }
              }}
            >
              Editar
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              ✖
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="btn-row mb-16">
          <button
            type="button"
            className={`btn ${activeTab === "info" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("info")}
          >
            Info
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "notes" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("notes")}
          >
            Notas
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "payments" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("payments")}
          >
            Pagos
          </button>
        </div>

        <hr className="mb-16" />

        {/* Contenido dinámico */}
        {activeTab === "info" && (
          <section>
            <h3>Información básica</h3>
            <p>
              <strong>Paciente:</strong> {appointment.patient.full_name}
            </p>
            <p>
              <strong>Fecha:</strong> {appointment.appointment_date}
            </p>
            <p>
              <strong>Tipo:</strong> {appointment.appointment_type}
            </p>
            <p>
              <strong>Estado:</strong> {appointment.status}
            </p>
            <p>
              <strong>Monto esperado:</strong> {appointment.expected_amount}
            </p>
          </section>
        )}

        {activeTab === "notes" && (
          <section>
            <h3>Notas</h3>
            <p>{appointment.notes || "Sin notas registradas."}</p>
          </section>
        )}

        {activeTab === "payments" && (
          <section>
            <h3>Pagos</h3>
            {appointment.payments && appointment.payments.length > 0 ? (
              <ul>
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
