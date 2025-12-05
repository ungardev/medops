import React, { useState } from "react";
import moment from "moment";
import { Appointment } from "../../types/appointments";
import { useAppointment } from "hooks/appointments";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentDetail({ appointment, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "payments">("info");

  const { data: detail, isLoading, isError, error } = useAppointment(appointment.id);
  const appt = detail ?? appointment;

  const co = appt?.charge_order ?? null;
  const payments = Array.isArray(co?.payments) ? co.payments : [];

  // 🔹 Calcular total pagado
  const totalPagado = payments.reduce(
    (acc: number, p: any) => acc + Number(p.amount ?? p.total ?? 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3 sm:px-0">
      <div className="max-w-md sm:max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100">Detalle de Cita</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
              onClick={() => {
                if (window.confirm("¿Desea editar esta cita?")) {
                  onEdit(appt);
                }
              }}
            >
              Editar
            </button>
            <button
              type="button"
              className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
              onClick={onClose}
            >
              ✖
            </button>
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">Cargando detalle...</p>}
        {isError && (
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
            Error: {(error as Error)?.message ?? "No se pudo cargar el detalle"}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          {["info", "payments"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444]"
                  : "border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveTab(tab as "info" | "payments")}
            >
              {tab === "info" ? "Info" : "Pagos"}
            </button>
          ))}
        </div>

        {/* Contenido dinámico */}
        {activeTab === "info" && (
          <section className="space-y-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-300">
            <h3 className="font-semibold mb-2">Información básica</h3>
            <p><strong>Paciente:</strong> {appt.patient?.full_name}</p>
            <p><strong>Fecha:</strong> {moment(appt.appointment_date).format("DD/MM/YYYY")}</p>
            <p><strong>Tipo:</strong> {appt.appointment_type}</p>
            <p><strong>Estado:</strong> {appt.status}</p>
            <p><strong>Monto esperado:</strong> {appt.expected_amount}</p>
            <p><strong>Total pagado:</strong> {totalPagado.toFixed(2)}</p> {/* 🔹 Nuevo campo */}
          </section>
        )}

        {activeTab === "payments" && (
          <section className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-300">
            <h3 className="font-semibold mb-2">Pagos</h3>
            {payments.length > 0 ? (
              <ul className="list-disc pl-4 sm:pl-5 space-y-2">
                {payments.map((p: any) => (
                  <li key={p.id}>
                    <span className="font-medium">{Number(p.amount ?? p.total ?? 0).toFixed(2)}</span>{" "}
                    - {p.method ?? p.payment_method ?? "Pago"}{" "}
                    {p.status && <span className="italic">({p.status})</span>}
                    {p.reference_number && <span className="ml-1">Ref: {p.reference_number}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay pagos registrados.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
