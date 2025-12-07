// src/pages/Payments/Payments.tsx
import { useState } from "react";
import PageHeader from "@/components/Layout/PageHeader";
import ChargeOrderList from "@/components/Payments/ChargeOrderList";
import RegisterPaymentModal from "@/components/Payments/RegisterPaymentModal";

export default function Payments() {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  const handleRegisterPayment = (orderId: number, appointmentId: number) => {
    setSelectedOrderId(orderId);
    setSelectedAppointmentId(appointmentId);
    setShowModal(true);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header institucional */}
      <PageHeader
        title="Centro de Pagos"
        subtitle="Gestión de órdenes de cobro y pagos"
      />

      {/* Órdenes de Pago */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
        <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-2 sm:mb-3">
          Órdenes de Pago
        </h3>
        <ChargeOrderList onRegisterPayment={handleRegisterPayment} />
      </section>

      {/* Modal de pago */}
      {showModal && selectedOrderId && (
        <RegisterPaymentModal
          appointmentId={selectedAppointmentId!}
          chargeOrderId={selectedOrderId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
