// src/components/Patients/PatientConsultationsTab.tsx
import { useNavigate } from "react-router-dom";
import { Patient } from "../../types/patients";
import { Appointment } from "../../types/appointments";
import { useConsultationsByPatient } from "../../hooks/patients/useConsultationsByPatient";
import { 
  EyeIcon, 
  ClockIcon, 
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
interface PatientConsultationsTabProps {
  patient: Patient;
  readOnly?: boolean;
}
export default function PatientConsultationsTab({ patient, readOnly = false }: PatientConsultationsTabProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useConsultationsByPatient(patient.id);
  
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center border border-dashed border-white/15 rounded-lg">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-[11px] text-white/40">Cargando consultas...</span>
      </div>
    );
  }
  
  if (error || !data || !Array.isArray(data.list) || typeof data.totalCount !== 'number') {
    return (
      <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-lg flex items-center gap-4">
        <ExclamationCircleIcon className="w-6 h-6 text-red-400" />
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-red-400">Error al cargar datos</span>
          <span className="text-[10px] text-red-400/60 mt-0.5">Verifica la conexión del sistema.</span>
        </div>
      </div>
    );
  }
  
  if (data.list.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-white/15 rounded-lg">
        <ClipboardDocumentCheckIcon className="w-10 h-10 text-white/20 mx-auto mb-4" />
        <p className="text-[11px] text-white/40">
          No se encontraron registros de consultas
        </p>
      </div>
    );
  }
  
  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completada') || s.includes('finished')) return 'border-emerald-500/25 text-emerald-400 bg-emerald-500/10';
    if (s.includes('pendiente') || s.includes('pending')) return 'border-amber-500/25 text-amber-400 bg-amber-500/10';
    return 'border-white/15 text-white/50 bg-white/5';
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h3 className="text-[12px] font-semibold text-white flex items-center gap-2">
            Historial de Consultas
          </h3>
          <p className="text-[10px] text-white/40 mt-0.5">
            {(data?.totalCount ?? 0)} registro{data?.totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-emerald-400/30 via-white/10 to-transparent hidden sm:block" />
        <div className="space-y-4">
          {data.list.map((c: Appointment) => (
            <div 
              key={c.id}
              className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 pl-0 sm:pl-10"
            >
              <div className="absolute left-[11px] top-[14px] w-2 h-2 rounded-full bg-black border-2 border-emerald-400 hidden sm:block z-10 group-hover:scale-150 transition-transform" />
              
              <div className="flex-1 w-full bg-white/5 border border-white/15 rounded-lg p-5 hover:border-white/25 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-white">
                        Consulta #{c.id.toString().padStart(4, '0')}
                      </span>
                      <span className={`text-[9px] px-2.5 py-1 border font-medium rounded-md uppercase ${getStatusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span>
                        {c.appointment_date 
                          ? new Date(c.appointment_date).toLocaleDateString("es-VE", { year: 'numeric', month: 'long', day: 'numeric' })
                          : "Fecha desconocida"
                        }
                      </span>
                    </div>
                  </div>
                  
                  {!readOnly && (
                    <button 
                      onClick={() => {
                        if (patient?.id) {
                          navigate(`/patients/${patient.id}/consultations/${c.id}`);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 text-[10px] text-white/60 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/25 transition-all group/btn rounded-lg"
                    >
                      Ver Detalle
                      <ArrowRightIcon className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}