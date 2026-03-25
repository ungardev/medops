// src/pages/Doctor/ManageServicesPage.tsx
import React, { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useAppointmentsPending } from "@/hooks/appointments/useAppointmentsPending";
import { useUpdateAppointmentStatus } from "@/hooks/appointments/useUpdateAppointmentStatus";
import SimpleCalendar from "@/components/Common/SimpleCalendar";
import { Loader2, CheckCircleIcon, XCircleIcon, CalendarIcon, UserIcon } from "lucide-react";
export default function ManageServicesPage() {
  // 1. Obtener citas pendientes
  const { data: appointments, isLoading, error } = useAppointmentsPending();
  
  // 2. Hook para actualizar estado
  const updateStatus = useUpdateAppointmentStatus();
  
  // 3. Estado para modal
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [confirmDate, setConfirmDate] = useState<Date | null>(null);
  const [confirmTime, setConfirmTime] = useState<string>("");
  // 4. Manejar confirmación
  const handleConfirm = async () => {
    if (!selectedAppointment || !confirmDate) return;
    
    try {
      // Formatear fecha a YYYY-MM-DD
      const dateStr = confirmDate.toISOString().split('T')[0];
      
      await updateStatus.mutateAsync({
        id: selectedAppointment.id,
        status: "arrived",
        appointment_date: dateStr,
        // Asumiendo que la API acepta estos campos
      });
      
      // Cerrar modal y limpiar
      setSelectedAppointment(null);
      setConfirmDate(null);
      setConfirmTime("");
    } catch (err) {
      console.error("Error al confirmar cita:", err);
    }
  };
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Portal Doctor", path: "/doctor" },
          { label: "Gestionar Servicios", active: true }
        ]}
      />
      {/* Tabla de Solicitudes Pendientes */}
      <div className="bg-black/30 border border-white/10 rounded-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-white font-bold">Solicitudes Pendientes</h3>
          <span className="text-xs text-white/50">
            {appointments?.length || 0} solicitudes
          </span>
        </div>
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-white/80">
              <thead className="text-xs text-white/50 uppercase bg-black/20">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Fecha Tentativa</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {appointments?.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-xs">{apt.id}</td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-white/30" />
                      {apt.patient?.full_name || "Paciente"}
                    </td>
                    <td className="px-4 py-3">Consulta Médica</td>
                    <td className="px-4 py-3">{apt.appointment_date}</td>
                    <td className="px-4 py-3 text-emerald-400">${apt.expected_amount}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => setSelectedAppointment(apt)}
                        className="px-3 py-1 bg-emerald-600/20 text-emerald-400 text-xs font-bold uppercase hover:bg-emerald-600/30 rounded"
                      >
                        Confirmar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal de Confirmación */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg rounded-sm shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-bold">Confirmar Servicio #{selectedAppointment.id}</h3>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="text-white/50 hover:text-white"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            {/* Contenido */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50 text-xs">Paciente</p>
                  <p className="text-white font-medium">{selectedAppointment.patient?.full_name}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Monto</p>
                  <p className="text-emerald-400 font-medium">${selectedAppointment.expected_amount}</p>
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-2">Seleccionar Fecha Definitiva</p>
                <div className="bg-black/20 p-2 rounded border border-white/10">
                  <SimpleCalendar
                    selectedDate={confirmDate}
                    onDateSelect={setConfirmDate}
                    serviceSchedules={[]} // Opcional: Podrías pasar horarios específicos aquí
                  />
                </div>
              </div>
              {/* Opcional: Selector de hora si es necesario */}
              <div>
                 <p className="text-white/50 text-xs mb-2">Hora (Opcional)</p>
                 <input 
                   type="time" 
                   value={confirmTime}
                   onChange={(e) => setConfirmTime(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 p-2 text-white rounded"
                 />
              </div>
            </div>
            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-white/10 bg-black/20">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 py-2 bg-white/10 text-white text-xs font-bold uppercase hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!confirmDate || updateStatus.isPending}
                className="flex-1 py-2 bg-emerald-500 text-black text-xs font-bold uppercase hover:bg-emerald-400 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {updateStatus.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4" />
                )}
                Confirmar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}