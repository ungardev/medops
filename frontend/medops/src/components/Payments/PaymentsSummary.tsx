interface Props {
  totals?: {
    total: number;
    confirmed: number;
    pending: number;
    failed: number;
  };
}

export default function PaymentsSummary({ totals }: Props) {
  return (
    <div className="payments-summary">
      <div><strong>Total mostrado:</strong>${totals?.total.toFixed(2) ?? "0.00"}</div>
      <div><strong>Confirmados:</strong>${totals?.confirmed.toFixed(2) ?? "0.00"}</div>
      <div><strong>Pendientes:</strong>${totals?.pending.toFixed(2) ?? "0.00"}</div>
      <div><strong>Fallidos:</strong>${totals?.failed.toFixed(2) ?? "0.00"}</div>
    </div>
  );
}
