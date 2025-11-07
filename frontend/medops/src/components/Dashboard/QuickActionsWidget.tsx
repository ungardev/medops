// src/components/Dashboard/QuickActionsWidget.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AppointmentForm from "@/components/Appointments/AppointmentForm";
import NewPatientModal from "@/components/Patients/NewPatientModal";

export function QuickActionsWidget() {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  return (
    <section className="card">
      <h3>Acciones rápidas</h3>
      <div className="actions">
        {/* Registrar cita → abre modal */}
        <button
          className="btn btn-primary"
          onClick={() => setShowAppointmentForm(true)}
        >
          Registrar cita
        </button>

        {/* Registrar paciente → abre modal */}
        <button
          className="btn btn-outline"
          onClick={() => setShowNewPatientModal(true)}
        >
          Registrar paciente
        </button>

        {/* Ir a pagos → vista de pagos */}
        <Link to="/payments" className="btn btn-outline">
          Ir a Pagos
        </Link>

        {/* Ver reportes → aún no creado */}
        <Link to="/reports" className="btn btn-outline">
          Ver reportes
        </Link>
      </div>

      {/* Modal de cita */}
      {showAppointmentForm && (
        <AppointmentForm
          onSubmit={(data) => {
            console.log("Cita creada:", data);
            setShowAppointmentForm(false);
          }}
          onClose={() => setShowAppointmentForm(false)}
        />
      )}

      {/* Modal de paciente */}
      <NewPatientModal
        open={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onCreated={() => {
          console.log("Paciente creado");
          setShowNewPatientModal(false);
        }}
      />
    </section>
  );
}
