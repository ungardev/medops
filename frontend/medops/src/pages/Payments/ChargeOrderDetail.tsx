import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import PageHeader from "../../components/Layout/PageHeader";
import PaymentList from "../../components/Payments/PaymentList";
import RegisterPaymentModal from "../../components/Payments/RegisterPaymentModal";
import { useState } from "react";
import { ChargeOrder } from "../../types/payments";

interface Event {
  id: number;
  action: string;
  actor: string | null;
  timestamp: string;
  notes?: string | null | Record<string, any>;
}

export default function ChargeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  if (!id) {
    return <p className="text-danger">ID de orden inválido</p>;
  }

  const queryKey = ["charge-order", id] as const;

  const { data: order, isLoading, error } = useQuery<ChargeOrder>({
    queryKey,
    queryFn: async () => {
      const res = await axios.get(`http://127.0.0.1/api/charge-orders/${id}/`);
      return res.data as ChargeOrder;
    },
  });

  // 🔹 Query para eventos de auditoría
  const { data: events } = useQuery<Event[]>({
    queryKey: ["charge-order-events", id],
    queryFn: async () => {
      const res = await axios.get(`http://127.0.0.1/api/charge-orders/${id}/events/`);
      return res.data as Event[];
    },
  });

  // 🔹 Mutación para anular la orden
  const voidMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`http://127.0.0.1/api/charge-orders/${id}/mark_void/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-orders"] });
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["charge-order-events", id] });
    },
  });

  // 🔹 Handler para exportar (forzado a PDF) usando order.id real
  const handleExport = async () => {
    if (!order?.id) {
      alert("No se encontró el ID de la orden.");
      return;
    }

    try {
      const res = await axios.get<Blob>(
        `http://127.0.0.1/api/charge-orders/${order.id}/export/`,
        { responseType: "blob" }
      );

      const blob = res.data; // ya es un Blob
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `orden-${order.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando orden", err);
      alert("No se pudo exportar la orden. Verifica el endpoint en el backend.");
    }
  };

  if (isLoading) return <p className="text-muted">Cargando detalle de la orden...</p>;
  if (error || !order) return <p className="text-danger">Error cargando la orden</p>;

  const total = order.total_amount ?? order.total ?? 0;
  const paid = order.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const pending = Number(total) - paid;

  return (
    <div className="charge-order-detail">
      <PageHeader
        title={`Orden de Pago #${order.id}`}
        subtitle={order.patient_detail?.full_name ?? `Paciente #${order.patient}`}
      />

      {/* Resumen financiero */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Resumen</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><strong>Total:</strong> ${Number(total).toFixed(2)}</div>
          <div><strong>Pagado:</strong> ${paid.toFixed(2)}</div>
          <div><strong>Pendiente:</strong> ${pending.toFixed(2)}</div>
        </div>
      </section>

      {/* Items */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Cargos</h3>
        <table className="table w-full">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>{item.description}</td>
                <td>{item.qty}</td>
                <td>${Number(item.unit_price).toFixed(2)}</td>
                <td>${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pagos */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Historial de Pagos</h3>
        <PaymentList payments={order.payments || []} />
      </section>

      {/* Timeline de eventos */}
      {events && events.length > 0 && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Historial de Eventos</h3>
          <div className="relative border-l-2 border-gray-300 pl-4">
            {events
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((ev) => (
                <div key={ev.id} className="mb-4 relative">
                  <span
                    className={`absolute -left-3 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                      ev.action === "created"
                        ? "bg-blue-500"
                        : ev.action === "payment_registered"
                        ? "bg-green-500"
                        : ev.action === "voided"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                  >
                    ●
                  </span>
                  <div className="bg-gray-50 p-3 rounded border shadow-sm">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{ev.action.replace("_", " ")}</span>
                      <span className="text-sm text-muted">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Actor: {ev.actor ?? "—"}
                    </div>
                    {ev.notes && (
                      <div className="text-xs text-gray-500 italic mt-1">
                        {typeof ev.notes === "object"
                          ? JSON.stringify(ev.notes)
                          : ev.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Acciones */}
      <div className="mt-6 flex gap-3">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Registrar pago
        </button>
        <button className="btn btn-outline" onClick={handleExport}>
          Exportar
        </button>
        <button
          className="btn btn-danger"
          onClick={() => voidMutation.mutate()}
          disabled={voidMutation.isPending}
        >
          {voidMutation.isPending ? "Anulando..." : "Anular orden"}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>

      {/* Modal de pago */}
      {showModal && (
        <RegisterPaymentModal
          appointmentId={order.appointment}
          chargeOrderId={order.id}
          onClose={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ["charge-order-events", id] });
          }}
        />
      )}
    </div>
  );
}
