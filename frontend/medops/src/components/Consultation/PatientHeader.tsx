// src/components/Consultation/PatientHeader.tsx
import type { Patient } from "../../types/patients";
import { 
  UserIcon, 
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
interface PatientHeaderProps {
  patient: Patient & {
    balance_due?: number;
    age?: number | null;
  };
}
export default function PatientHeader({ patient }: PatientHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-6 w-full">
      {/* Datos del Paciente (Izquierda) */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--palantir-active)]/10 flex items-center justify-center border border-[var(--palantir-active)]/30">
          <UserIcon className="w-4 h-4 text-[var(--palantir-active)]" />
        </div>
        <div className="text-right">
          <div className="text-sm font-bold uppercase text-white truncate max-w-[150px] leading-tight">
            {patient.full_name || "MISSING_IDENTITY"}
          </div>
          <div className="text-[8px] font-mono text-white/50">
            REF: {patient.id.toString().padStart(6, '0')}
          </div>
        </div>
      </div>
      {/* Indicadores Rápidos (Derecha) */}
      <div className="flex items-center gap-4 pl-4 border-l border-white/10">
        {/* Alerta Médica (Discreta) */}
        {patient.allergies && (
          <div className="flex items-center gap-1 text-amber-400" title="Biological Risk Alert">
            <ExclamationTriangleIcon className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase">ALERT</span>
          </div>
        )}
        
        {/* Balance Financiero */}
        <div className="text-[9px] font-mono">
          <span className="text-white/40">BALANCE:</span>
          <span className={`font-bold ml-1 ${patient.balance_due && patient.balance_due > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {patient.balance_due && patient.balance_due > 0 
              ? `$${patient.balance_due.toFixed(2)}` 
              : '$0.00'}
          </span>
        </div>
      </div>
    </div>
  );
}