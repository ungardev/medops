// src/utils/export/pdf.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Payment } from "types/payments";

export function exportPaymentsToPDF(payments: Payment[]) {
  if (!payments.length) return;

  const doc = new jsPDF();

  doc.text("Reporte de Pagos", 14, 20);

  const rows = payments.map((p) => [
    p.id,
    p.appointment ?? "",
    p.patient_name ?? "",
    p.amount,
    p.method,
    p.status,
    p.reference_number ?? "",
    p.bank_name ?? "",
    p.received_by ?? "",
    p.received_at ? new Date(p.received_at).toLocaleString("es-VE") : "",
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
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
      ],
    ],
    body: rows,
  });

  doc.save("reporte_pagos.pdf");
}
