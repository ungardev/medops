// src/pages/Payments/Payments.tsx
import PageHeader from "../../components/Layout/PageHeader";
import ChargeOrderList from "../../components/Payments/ChargeOrderList";

export default function Payments() {
  return (
    <div className="p-6 space-y-6">
      {/* Header institucional */}
      <PageHeader
        title="Centro de Pagos"
        subtitle="Gestión de órdenes de cobro y pagos"
      />

      {/* Órdenes de Pago */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
          Órdenes de Pago
        </h3>
        <ChargeOrderList />
      </section>
    </div>
  );
}
