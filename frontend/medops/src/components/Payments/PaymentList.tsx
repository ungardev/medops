import React, { useState } from "react";
import { Payment, PaymentStatus } from "../../types/payments";
import { FaPen, FaTrash, FaCheckCircle, FaEllipsisV } from "react-icons/fa";

interface Props {
  payments: Payment[];
  onDelete?: (id: number) => void;
  onChangeStatus?: (id: number, status: PaymentStatus) => void;
  onEditInline?: (id: number, data: Partial<Payment>) => void;
  onRequestWaive?: (id: number) => void;
}

// 🔹 Formatear monto
function formatAmount(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return amount;
  return num.toFixed(2);
}

// 🔹 Formatear fecha
function formatReceivedAt(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

export default function PaymentList({
  payments,
  onDelete,
  onChangeStatus,
  onEditInline,
  onRequestWaive,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<Payment>>({});
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  if (!payments || payments.length === 0) {
    return <p className="text-muted">No hay pagos registrados.</p>;
  }

  const startEdit = (p: Payment) => {
    setEditingId(p.id);
    setDraft({
      reference_number: p.reference_number ?? "",
      bank_name: p.bank_name ?? "",
      status: p.status,
    });
  };

  const saveEdit = (id: number) => {
    if (onEditInline) onEditInline(id, draft);
    setEditingId(null);
    setDraft({});
  };

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Cita</th>
          <th>Fecha registro</th>
          <th>Monto</th>
          <th>Método</th>
          <th>Estado</th>
          <th>Referencia</th>
          <th>Banco</th>
          <th>Recibido por</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => (
          <tr key={p.id}>
            <td>{p.patient?.full_name ?? "Paciente"} — {p.appointment_date}</td>
            <td>{formatReceivedAt(p.received_at)}</td>
            <td>{formatAmount(p.amount)}</td>
            <td>
              {p.method === "cash" && "Efectivo"}
              {p.method === "card" && "Tarjeta"}
              {p.method === "transfer" && "Transferencia"}
            </td>
            <td>
              {editingId === p.id ? (
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as PaymentStatus })
                  }
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="canceled">Cancelado</option>
                  <option value="waived">Exonerado</option>
                </select>
              ) : (
                <>
                  {p.status === "pending" && <span className="text-warning">Pendiente</span>}
                  {p.status === "paid" && <span className="text-success">Pagado</span>}
                  {p.status === "canceled" && <span className="text-danger">Cancelado</span>}
                  {p.status === "waived" && <span className="text-muted">Exonerado</span>}
                </>
              )}
            </td>
            <td>
              {editingId === p.id ? (
                <input
                  value={draft.reference_number ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, reference_number: e.target.value })
                  }
                />
              ) : (
                p.reference_number || "-"
              )}
            </td>
            <td>
              {editingId === p.id ? (
                <input
                  value={draft.bank_name ?? ""}
                  onChange={(e) => setDraft({ ...draft, bank_name: e.target.value })}
                />
              ) : (
                p.bank_name || "-"
              )}
            </td>
            <td>{p.received_by || "-"}</td>
            <td className="relative">
              {editingId === p.id ? (
                <>
                  <button
                    className="btn btn-success btn-icon"
                    onClick={() => saveEdit(p.id)}
                    title="Guardar"
                  >
                    ✅
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => setEditingId(null)}
                    title="Cancelar"
                  >
                    ✖
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-ghost"
                    onClick={() =>
                      setMenuOpenId(menuOpenId === p.id ? null : p.id)
                    }
                    title="Más acciones"
                  >
                    <FaEllipsisV />
                  </button>

                  {menuOpenId === p.id && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border rounded shadow z-10">
                      {onEditInline && (
                        <button
                          className="menu-item w-full text-left px-3 py-1 hover:bg-gray-100"
                          onClick={() => {
                            startEdit(p);
                            setMenuOpenId(null);
                          }}
                        >
                          <FaPen /> Editar inline
                        </button>
                      )}
                      {onChangeStatus && p.status !== "paid" && (
                        <button
                          className="menu-item w-full text-left px-3 py-1 hover:bg-gray-100"
                          onClick={() => {
                            onChangeStatus(p.id, "paid");
                            setMenuOpenId(null);
                          }}
                        >
                          <FaCheckCircle /> Marcar pagado
                        </button>
                      )}
                      {onRequestWaive && p.status !== "waived" && (
                        <button
                          className="menu-item w-full text-left px-3 py-1 text-yellow-600 hover:bg-gray-100"
                          onClick={() => {
                            onRequestWaive(p.id);
                            setMenuOpenId(null);
                          }}
                        >
                          ⚠ Exonerar
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="menu-item w-full text-left px-3 py-1 text-red-600 hover:bg-gray-100"
                          onClick={() => {
                            onDelete(p.id);
                            setMenuOpenId(null);
                          }}
                        >
                          <FaTrash /> Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
