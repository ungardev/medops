import React, { useState } from "react";
import { Payment, PaymentInput } from "../../types/payments";
import { PatientRef } from "../../types/patients";

// 🔹 Tipo extendido con financial_status
interface Appointment {
  id: number;
  appointment_date: string;         // YYYY-MM-DD
  expected_amount: string | number; // total esperado de la consulta
  patient: PatientRef;              // { id, full_name }
  financial_status: "pending" | "paid"; // 👈 nuevo campo
}

interface Props {
  open: boolean;
  onClose: () => void;
  appointments: Appointment[]; // citas con saldo pendiente
  paymentsByAppointment: Record<number, Payment[]>; // micropagos agrupados
  onAddPayment: (appointmentId: number, data: PaymentInput) => void;
}

export default function PendingPaymentsModal({
  open,
  onClose,
  appointments,
  paymentsByAppointment,
  onAddPayment,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<PaymentInput>>({});

  if (!open) return null;

  // Ordenar citas descendente por fecha (appointment_date)
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(b.appointment_date).getTime() -
      new Date(a.appointment_date).getTime()
  );

  const selected = selectedId
    ? sortedAppointments.find((a) => a.id === selectedId)
    : null;

  const payments = selected ? paymentsByAppointment[selected.id] || [] : [];

  const handleSubmit = () => {
    if (!selected) return;
    if (!form.amount || !form.method) return;

    onAddPayment(selected.id, {
      appointment: selected.id,
      amount: form.amount,
      method: form.method,
      reference_number: form.reference_number,
      bank_name: form.bank_name,
    });

    setForm({});
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <h2 className="text-lg font-bold mb-4">Citas con pagos pendientes</h2>

        {/* Selector de cita */}
        <select
          className="input w-full mb-4"
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          <option value="">Seleccione una cita</option>
          {sortedAppointments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.patient.full_name} — {a.appointment_date} — Estado:{" "}
              {a.financial_status === "paid" ? "Pagada" : "Pendiente"} — Esperado:{" "}
              {expectedAmountToText(a.expected_amount)}
            </option>
          ))}
        </select>

        {selected && (
          <>
            {/* Resumen financiero */}
            <div className="mb-4 p-3 border rounded bg-gray-50">
              <p>
                <strong>Paciente:</strong> {selected.patient.full_name}
              </p>
              <p>
                <strong>Fecha:</strong> {selected.appointment_date}
              </p>
              <p>
                <strong>Esperado:</strong>{" "}
                {expectedAmountToText(selected.expected_amount)}
              </p>
              <p>
                <strong>Estado financiero:</strong>{" "}
                <span
                  className={
                    selected.financial_status === "paid"
                      ? "text-green-600 font-semibold"
                      : "text-yellow-600 font-semibold"
                  }
                >
                  {selected.financial_status === "paid" ? "Pagada" : "Pendiente"}
                </span>
              </p>
            </div>

            {/* Lista de micropagos */}
            <table className="table mb-4">
              <thead>
                <tr>
                  <th>Fecha registro</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Referencia</th>
                  <th>Banco</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.received_at
                        ? new Date(p.received_at).toLocaleString()
                        : "-"}
                    </td>
                    <td>{p.amount}</td>
                    <td>
                      {p.method === "cash" && "Efectivo"}
                      {p.method === "card" && "Tarjeta"}
                      {p.method === "transfer" && "Transferencia"}
                    </td>
                    <td>
                      {p.status === "pending" && "Pendiente"}
                      {p.status === "paid" && "Pagado"}
                      {p.status === "canceled" && "Cancelado"}
                      {p.status === "waived" && "Exonerado"}
                    </td>
                    <td>{p.reference_number || "-"}</td>
                    <td>{p.bank_name || "-"}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500">
                      No hay pagos registrados aún
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Formulario para agregar micropago */}
            <div className="border-t pt-3">
              <h3 className="font-semibold mb-2">Agregar pago</h3>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="Monto"
                  className="input"
                  value={form.amount ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
                <select
                  className="input"
                  value={form.method ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      method: e.target.value as PaymentInput["method"],
                    })
                  }
                >
                  <option value="">Método</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                </select>
                <input
                  type="text"
                  placeholder="Referencia"
                  className="input"
                  value={form.reference_number ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, reference_number: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Banco"
                  className="input"
                  value={form.bank_name ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, bank_name: e.target.value })
                  }
                />
                <button className="btn btn-success" onClick={handleSubmit}>
                  Agregar pago
                </button>
              </div>
            </div>
          </>
        )}

        <div className="modal-actions mt-4">
          <button className="btn btn-outline" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// Utilidad para mostrar expected_amount cualquiera sea su tipo
function expectedAmountToText(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n.toFixed(2) : String(v);
}
