import PageHeader from "../../components/Layout/PageHeader";
import ChargeOrderList from "../../components/Payments/ChargeOrderList";

export default function Payments() {
  return (
    <div className="payments-panel">
      <PageHeader
        title="Centro de Pagos"
        subtitle="Gestión de órdenes de cobro y pagos"
      />

      <section className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Órdenes de Pago</h3>
        <ChargeOrderList />
      </section>
    </div>
  );
}
