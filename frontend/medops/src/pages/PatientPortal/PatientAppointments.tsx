// src/pages/PatientPortal/PatientAppointments.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { Appointment, AppointmentStatus } from "@/types/appointments";
import { usePatientAppointments } from "@/hooks/patients/usePatientAppointments";
import CalendarGrid from "@/components/Appointments/CalendarGrid";
import PageHeader from "@/components/Common/PageHeader";
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "PENDIENTE", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  arrived: { label: "LLEGÓ", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  in_consultation: { label: "EN CONSULTA", bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  completed: { label: "COMPLETADA", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  canceled: { label: "CANCELADA", bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
};
function normalizeStatus(status?: string | null): string {
  const s = (status ?? "").toLowerCase().trim();
  if (s === "completed" || s === "completada" || s === "completado") return "completed";
  if (s === "pending" || s === "pendiente") return "pending";
  if (s === "arrived" || s === "llegó") return "arrived";
  if (s === "in_consultation" || s === "en consulta") return "in_consultation";
  if (s === "canceled" || s === "cancelada") return "canceled";
  return "pending";
}
function getDoctorDisplay(doctorName: string | null | undefined): string {
  if (doctorName) {
    return doctorName.startsWith("Dr.") || doctorName.startsWith("Dra.") 
      ? doctorName 
      : `Dr. ${doctorName}`;
  }
  return "Por asignar";
}
export default function PatientAppointments() {
  const navigate = useNavigate();
  const storedPatientId = localStorage.getItem("patient_id");
  
  useEffect(() => {
    if (!storedPatientId) {
      navigate("/patient/login");
    }
  }, [navigate, storedPatientId]);
  
  if (!storedPatientId) return null;
  
  const patientId = Number(storedPatientId);
  const { data, isLoading } = usePatientAppointments(patientId);
  const appointments = data?.list ?? [];
  const pendingAppointments = data?.pending ?? [];
  const completedAppointments = data?.completed ?? [];
  
  const todayStr = moment().format("YYYY-MM-DD");
  const appointmentsToday = appointments.filter(a => 
    a.appointment_date.startsWith(todayStr)
  ).length;
  
  const nextAppointment = pendingAppointments
    .filter(a => new Date(a.appointment_date) >= new Date())
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0];
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500">Syncing_Appointments...</p>
      </div>
    </div>
  );
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* HEADER */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "MIS CITAS", active: true }
        ]}
        stats={[
          { 
            label: "Total_Registry", 
            value: appointments.length,
            color: "text-blue-400"
          },
          { 
            label: "Pending", 
            value: pendingAppointments.length,
            color: pendingAppointments.length > 0 ? "text-amber-500" : "text-white/40"
          },
          { 
            label: "Completed", 
            value: completedAppointments.length,
            color: "text-emerald-500"
          },
          { 
            label: "Today", 
            value: appointmentsToday,
            color: appointmentsToday > 0 ? "text-purple-400" : "text-white/30"
          }
        ]}
        actions={
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 shadow-inner">
            <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
          </div>
        }
      />
      {/* PRÓXIMA CITA DESTACADA */}
      {nextAppointment && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-blue-500/20 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-blue-400 uppercase tracking-wider">Próxima Cita</p>
                <p className="text-lg font-black text-white uppercase">
                  {moment(nextAppointment.appointment_date).format("DD MMMM YYYY")}
                </p>
                <p className="text-[10px] text-white/60">
                  {nextAppointment.appointment_type === "specialized" ? "Especializada" : "General"} • {getDoctorDisplay(nextAppointment.doctor_name)}
                </p>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-[8px] font-mono text-white/30 uppercase">Estado</p>
              <span className={`inline-flex items-center gap-2 px-3 py-1 border text-[10px] font-bold uppercase ${STATUS_CONFIG.pending.bg} ${STATUS_CONFIG.pending.text} border-current/20`}>
                <div className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG.pending.dot}`} />
                {STATUS_CONFIG.pending.label}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* GRID: CALENDARIO + LISTA */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: CALENDARIO */}
        <div className="xl:col-span-5 space-y-6">
          <section className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md p-4 rounded-sm shadow-inner">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
              <CalendarDaysIcon className="w-4 h-4 text-white/40" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Calendario</h2>
            </div>
            <CalendarGrid
              appointments={appointments}
              onSelectDate={() => {}}
              onSelectAppointment={() => {}}
            />
          </section>
        </div>
        {/* COLUMNA DERECHA: LISTA DE CITAS */}
        <div className="xl:col-span-7 space-y-4">
          <div className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md p-4 space-y-4 rounded-sm">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-4 h-4 text-white/40" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
                Historial de Citas
              </h2>
            </div>
          </div>
          <div className="border border-white/10 bg-[#0a0a0b]/40 overflow-hidden min-h-[450px] rounded-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10">
                    <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Fecha</th>
                    <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Tipo</th>
                    <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Doctor</th>
                    <th className="px-4 py-3 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest animate-pulse">
                          No se encontraron citas
                        </p>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((a) => {
                      const status = normalizeStatus(a.status) as AppointmentStatus;
                      const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                      return (
                        <tr 
                          key={a.id} 
                          className="group hover:bg-white/5 transition-colors duration-150"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-[11px] font-mono text-white/80">
                              <CalendarDaysIcon className="w-3.5 h-3.5 text-white/40" />
                              {moment(a.appointment_date).format("DD/MM/YYYY")}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[10px] font-mono text-white/40 uppercase">
                            {a.appointment_type === "specialized" ? "Especializada" : "General"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-3.5 h-3.5 text-white/40" />
                              <span className="text-[11px] font-bold text-white/80">
                                {getDoctorDisplay(a.doctor_name)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center gap-2 px-2 py-1 border ${config.bg} border-current/20`}>
                              <div className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                              <span className={`text-[9px] font-black tracking-tighter ${config.text}`}>
                                {config.label}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}