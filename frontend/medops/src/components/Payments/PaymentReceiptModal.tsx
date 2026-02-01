// src/components/Payments/PaymentReceiptModal.tsx
import { useState } from "react";
import { Payment } from "../../types/payments";
import { formatCurrency } from "@/utils/format";
import EliteModal from "../Common/EliteModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
interface Props {
  payment: Payment;
  onClose: () => void;
}
// Utilidad para convertir imagen a Base64
async function getBase64FromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export default function PaymentReceiptModal({ payment, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const handleDownloadPDF = async () => {
    setLoading(true);
    const doc = new jsPDF();
    try {
      // Cargar logo desde /public/logo.png
      const logoBase64 = await getBase64FromUrl("/logo.png");
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30);
    } catch (err) {
      console.warn("No se pudo cargar el logo:", err);
    }
    // --- Cabecera ---
    doc.setFontSize(18);
    doc.setTextColor(13, 44, 83); // Azul zafiro institucional
    doc.text("Centro Médico MedOps", 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text("Comprobante de Pago", 20, 30);
    // --- Línea separadora ---
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);
    // --- Tabla de detalles ---
    autoTable(doc, {
      startY: 45,
      head: [["Campo", "Detalle"]],
      body: [
        ["Paciente", payment.patient?.full_name ?? "N/A"],
        ["Monto", formatCurrency(payment.amount, payment.currency)],
        ["Método", String(payment.method ?? "")],
        ["Estado", String(payment.status ?? "")],
        ["Referencia", payment.reference_number ?? "—"],
        ["Banco", payment.bank_name ?? "—"],
        ["Recibido por", payment.received_by ?? "—"],
        [
          "Fecha",
          payment.received_at
            ? new Date(payment.received_at).toLocaleString()
            : String(payment.appointment_date ?? ""),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [13, 44, 83], textColor: 255, halign: "center" }, // Azul zafiro
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 11, cellPadding: 4 },
    });
    // --- Pie de página ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      "Este comprobante ha sido generado electrónicamente por MedOps.",
      20,
      pageHeight - 20
    );
    doc.text("© 2025 MedOps - Todos los derechos reservados", 20, pageHeight - 12);
    doc.save(`comprobante_pago_${payment.id}.pdf`);
    setLoading(false);
  };
  return (
    <EliteModal 
      open={true} 
      onClose={onClose} 
      title="PAYMENT_RECEIPT_EXPORT"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header de información del paciente */}
        <div className="border-b border-white/10 pb-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">
            PATIENT_IDENTIFICATION
          </h4>
          <div className="flex flex-col gap-3 text-sm text-white/80">
            <div className="flex justify-between">
              <span className="text-white/40">SUBJECT:</span>
              <span className="font-mono">{payment.patient?.full_name ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">STATUS:</span>
              <span className="font-mono">{String(payment.status ?? "")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">TRANSACTION_ID:</span>
              <span className="font-mono">{payment.reference_number ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">INSTITUTION:</span>
              <span className="font-mono">{payment.institution?.name ?? "—"}</span>
            </div>
          </div>
        </div>
        
        {/* Tabla de detalles con estilo elite */}
        <div className="border border-white/10 rounded-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left font-black uppercase tracking-[0.2em] text-white/40">FIELD</th>
                <th className="px-4 py-3 text-left font-black uppercase tracking-[0.2em] text-white/40">VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/60 font-mono">TRANSACTION_AMOUNT</td>
                <td className="px-4 py-3 text-white font-mono font-bold">
                  {formatCurrency(payment.amount, payment.currency)}
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/60 font-mono">PAYMENT_METHOD</td>
                <td className="px-4 py-3 text-white font-mono">{String(payment.method ?? "")}</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/60 font-mono">BANK_ENTITY</td>
                <td className="px-4 py-3 text-white font-mono">{payment.bank_name ?? "—"}</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/60 font-mono">OPERATOR</td>
                <td className="px-4 py-3 text-white font-mono">{payment.received_by ?? "—"}</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/60 font-mono">RECEIPT_TIMESTAMP</td>
                <td className="px-4 py-3 text-white font-mono">
                  {payment.received_at 
                    ? new Date(payment.received_at).toLocaleString() 
                    : "N/A"
                  }
                </td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-white/60 font-mono">APPOINTMENT_DATE</td>
                <td className="px-4 py-3 text-white font-mono">
                  {payment.appointment_date 
                    ? new Date(payment.appointment_date).toLocaleString() 
                    : "N/A"
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Botones de acción elite */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            className="px-6 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
            onClick={onClose}
          >
            CLOSE_RECEIPT
          </button>
          <button
            className="flex-1 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] py-2.5 rounded-sm hover:bg-white/90 disabled:opacity-50 transition-all"
            onClick={handleDownloadPDF}
            disabled={loading}
          >
            {loading ? "GENERATING_PDF..." : "EXPORT_TO_PDF"}
          </button>
        </div>
      </div>
    </EliteModal>
  );
}