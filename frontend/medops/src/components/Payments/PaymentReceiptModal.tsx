import { useState } from "react";
import { Payment } from "../../types/payments";
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
      doc.addImage(logoBase64, "PNG", 160, 10, 30, 30); // x, y, width, height
    } catch (err) {
      console.warn("No se pudo cargar el logo:", err);
    }

    // --- Cabecera ---
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Centro Médico MedOps", 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Comprobante de Pago", 20, 30);

    // --- Línea separadora ---
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // --- Tabla de detalles ---
    autoTable(doc, {
      startY: 45,
      head: [["Campo", "Detalle"]],
      body: [
        ["Paciente", payment.patient.full_name],
        ["Monto", `$${Number(payment.amount).toFixed(2)}`],
        ["Método", payment.method],
        ["Estado", payment.status],
        ["Referencia", payment.reference_number || "—"],
        ["Banco", payment.bank_name || "—"],
        ["Recibido por", payment.received_by || "—"],
        [
          "Fecha",
          payment.received_at
            ? new Date(payment.received_at).toLocaleString()
            : payment.appointment_date,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: "center" },
      bodyStyles: { textColor: 50 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 11, cellPadding: 4 },
    });

    // --- Pie de página ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      "Este comprobante ha sido generado electrónicamente por MedOps.",
      20,
      pageHeight - 20
    );
    doc.text("© 2025 MedOps - Todos los derechos reservados", 20, pageHeight - 12);

    // --- Guardar archivo ---
    doc.save(`comprobante_pago_${payment.id}.pdf`);
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Comprobante de Pago</h3>

        <div className="flex flex-col gap-2">
          <div><strong>Paciente:</strong> {payment.patient.full_name}</div>
          <div><strong>Monto:</strong> ${Number(payment.amount).toFixed(2)}</div>
          <div><strong>Método:</strong> {payment.method}</div>
          <div><strong>Estado:</strong> {payment.status}</div>
          <div><strong>Referencia:</strong> {payment.reference_number || "—"}</div>
          <div><strong>Banco:</strong> {payment.bank_name || "—"}</div>
          <div><strong>Recibido por:</strong> {payment.received_by || "—"}</div>
          <div>
            <strong>Fecha:</strong>{" "}
            {payment.received_at
              ? new Date(payment.received_at).toLocaleString()
              : payment.appointment_date}
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button className="btn btn-outline" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDownloadPDF}
            disabled={loading}
          >
            {loading ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
