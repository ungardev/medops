// src/pages/Payments/ChargeOrderDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import PageHeader from "../../components/Layout/PageHeader";
import PaymentList from "../../components/Payments/PaymentList";
import RegisterPaymentModal from "../../components/Payments/RegisterPaymentModal";
import { useState } from "react";
import { ChargeOrder } from "../../types/payments";
import { useInvalidateChargeOrders } from "../../hooks/payments/useInvalidateChargeOrders";

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
  const [showModal, setShowModal] = useState(false);
  const invalidateChargeOrders = useInvalidateChargeOrders();

  if (!id) {
    return <p className="text-sm text-red-600 dark:text-red-400">ID de orden inválido</p>;
  }

  const queryKey = ["charge-order", id] as const;

  const { data: order, isLoading, error } = useQuery<ChargeOrder>({
    queryKey,
    queryFn: async () => {
      const res = await axios.get(`http://127.0.0.1/api/charge-orders/${id}/`);
      return res.data as ChargeOrder;
    },
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ["charge-order-events", id],
    queryFn: async () => {
      const res = await axios.get(`http://127.0.0.1/api/charge-orders/${id}/events/`);
      return res.data as Event[];
    },
  });

  const voidMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`http://127.0.0.1/api/charge-orders/${id}/mark_void/`);
    },
    onSuccess: () => {
      invalidateChargeOrders(id);
    },
  });

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
      const blob = res.data;
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

  if (isLoading) return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando detalle de la orden...</p>;
  if (error || !order) return <p className="text-sm text-red-600 dark:text-red-400">Error cargando la orden</p>;

  const total = order.total_amount ?? order.total ?? 0;
  const paid = order.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const pending = Number(total) - paid;

    return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Orden de Pago #${order.id}`}
        subtitle={order.patient_detail?.full_name ?? `Paciente #${order.patient}`}
      />

      {/* Resumen financiero */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Resumen</h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div><strong>Total:</strong> ${Number(total).toFixed(2)}</div>
          <div><strong>Pagado:</strong> ${paid.toFixed(2)}</div>
          <div><strong>Pendiente:</strong> ${pending.toFixed(2)}</div>
        </div>
      </section>

      {/* Items */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Cargos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-800 dark:text-gray-100">
            <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 border-b">Código</th>
                <th className="px-3 py-2 border-b">Descripción</th>
                <th className="px-3 py-2 border-b">Cant.</th>
                <th className="px-3 py-2 border-b">Precio</th>
                <th className="px-3 py-2 border-b">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2">{item.code}</td>
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2">{item.qty}</td>
                  <td className="px-3 py-2">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-3 py-2">${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagos */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Historial de Pagos</h3>
        <PaymentList payments={order.payments || []} />
      </section>

      {/* Timeline de eventos */}
      {events && events.length > 0 && (
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Historial de Eventos</h3>
          <div className="relative border-l-2 border-gray-300 dark:border-gray-700 pl-4">
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
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{ev.action.replace("_", " ")}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
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
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
          onClick={() => setShowModal(true)}
        >
          Registrar pago
        </button>
        <button
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
          onClick={handleExport}
        >
          Exportar
        </button>
        <button
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition text-sm"
          onClick={() => voidMutation.mutate()}
          disabled={voidMutation.isPending}
        >
          {voidMutation.isPending ? "Anulando..." : "Anular orden"}
        </button>
        <button
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
          onClick={() => navigate(-1)}
        >
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
            invalidateChargeOrders(order.id);
          }}
        />
      )}
    </div>
  );
}
