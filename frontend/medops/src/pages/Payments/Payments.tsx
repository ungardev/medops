import ChargeOrderList from "../../components/Payments/ChargeOrderList";

export default function PaymentsPage() {
  return (
    <div className="payments-panel">
      <h2>Centro de Pagos</h2>
      <ChargeOrderList />
    </div>
  );
}
