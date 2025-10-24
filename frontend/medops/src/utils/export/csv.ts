// src/utils/export/csv.ts
import { Payment } from "types/payments";

export function exportPaymentsToCSV(payments: Payment[]) {
  if (!payments.length) return;

  const headers = [
    "ID",
    "Cita",
    "Paciente",
    "Monto",
    "Método",
    "Estado",
    "Referencia",
    "Banco",
    "Recibido por",
    "Fecha",
  ];

  const rows = payments.map((p) => [
    p.id,
    p.appointment ?? "",
    p.patient?.name ?? "",   // ✅ corregido
    p.amount,
    p.method,
    p.status,
    p.reference_number ?? "",
    p.bank_name ?? "",
    p.received_by ?? "",
    p.received_at ? new Date(p.received_at).toLocaleString("es-VE") : "",
  ]);

  const csvContent =
    [headers, ...rows].map((row) => row.map(String).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "reporte_pagos.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
