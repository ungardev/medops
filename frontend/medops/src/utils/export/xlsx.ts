// src/utils/export/xlsx.ts
import * as XLSX from "xlsx";
import { Payment } from "types/payments";

export function exportPaymentsToXLSX(payments: Payment[]) {
  if (!payments.length) return;

  const data = payments.map((p) => ({
    ID: p.id,
    Cita: p.appointment ?? "",
    Paciente: p.patient?.name ?? "",   // ✅ corregido
    Monto: p.amount,
    Método: p.method,
    Estado: p.status,
    Referencia: p.reference_number ?? "",
    Banco: p.bank_name ?? "",
    "Recibido por": p.received_by ?? "",
    Fecha: p.received_at ? new Date(p.received_at).toLocaleString("es-VE") : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");

  XLSX.writeFile(workbook, "reporte_pagos.xlsx");
}
