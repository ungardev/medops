import React from 'react';

export function QuickActionsWidget() {
  return (
    <section className="card">
      <h3>Acciones rápidas</h3>
      <div className="actions">
        <button className="btn btn-primary">Registrar cita</button>
        <button className="btn btn-outline">Registrar paciente</button>
        <button className="btn btn-outline">Registrar pago</button>
      </div>
    </section>
  );
}
