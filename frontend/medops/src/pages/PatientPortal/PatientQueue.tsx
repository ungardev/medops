// src/pages/PatientPortal/PatientQueue.tsx
import { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { 
  ClockIcon, 
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
interface QueueEntry {
  id: number;
  status: "waiting" | "in_consultation" | "completed";
  appointment_date: string;
  institution_name: string;
  doctor_name: string;
  specialty: string;
  arrival_time?: string;
}
export default function PatientQueue() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadQueue();
  }, []);
  const loadQueue = async () => {
    try {
      const token = localStorage.getItem("patient_access_token");
      const res = await fetch("/api/patient-queue/", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error("Error loading queue:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const renderStatusBadge = (status: string) => {
    const base = "inline-flex items-center justify-center px-2 py-0.5 text-[8px] rounded-sm font-black uppercase tracking-wider border whitespace-nowrap";
    
    switch (status) {
      case "waiting":
        return <span className={`${base} bg-amber-500/20 text-amber-400 border-amber-500/40`}>EN_ESPERA</span>;
      case "in_consultation":
        return <span className={`${base} bg-white/20 text-white border-white/40 animate-pulse`}>EN_CONSULTA</span>;
      case "completed":
        return <span className={`${base} bg-emerald-500/20 text-emerald-400 border-emerald-500/40`}>ATENDIDO</span>;
      default:
        return <span className={`${base} bg-white/5 text-white/40 border-white/10`}>{status.toUpperCase()}</span>;
    }
  };
  const renderWaitTime = (entry: QueueEntry) => {
    if (entry.status === "completed") {
      return (
        <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-500/60 uppercase">
          <CheckCircleIcon className="w-3 h-3" />
          <span>Sesión_Finalizada</span>
        </div>
      );
    }
    
    if (!entry.arrival_time) return <span className="text-white/30">--</span>;
    
    const minutes = Math.floor((Date.now() - new Date(entry.arrival_time).getTime()) / 60000);
    return (
      <div className="flex items-center gap-1 font-mono text-[10px] text-amber-500/70">
        <ClockIcon className="w-3 h-3" />
        <span>{minutes < 60 ? `${minutes}m` : `${Math.floor(minutes/60)}h ${minutes%60}m`}</span>
      </div>
    );
  };
  const waitingCount = entries.filter(e => e.status === "waiting").length;
  const inConsultationCount = entries.filter(e => e.status === "in_consultation").length;
  const completedCount = entries.filter(e => e.status === "completed").length;
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "MI TURNO", active: true }
        ]}
        stats={[
          { label: "En Espera", value: waitingCount, color: "text-amber-500" },
          { label: "En Consulta", value: inConsultationCount, color: "text-white" },
          { label: "Atendidos", value: completedCount, color: "text-emerald-500" }
        ]}
      />
      <div className="bg-[#0a0a0b] border border-white/10 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Estado_en_Tiempo_Real
          </h3>
        </div>
        {entries.length === 0 ? (
          <div className="p-20 text-center opacity-30">
            <p className="text-[11px] font-mono uppercase tracking-widest">No_Tienes_Citas_Programadas</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {entries.map((entry, index) => (
              <div 
                key={entry.id}
                className="flex justify-between items-center px-4 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <span className="font-mono text-xs font-bold text-white/30">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black uppercase">{entry.specialty}</span>
                      {renderStatusBadge(entry.status)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/40">
                      <BuildingOfficeIcon className="w-3 h-3 text-blue-500/50" />
                      <span>{entry.institution_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/40">
                      <UserIcon className="w-3 h-3 text-emerald-500/50" />
                      <span>{entry.doctor_name}</span>
                    </div>
                    {renderWaitTime(entry)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}