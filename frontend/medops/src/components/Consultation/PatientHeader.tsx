// src/components/Consultation/PatientHeader.tsx
import type { Patient } from "../../types/patients";
import { Link } from "react-router-dom";
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
    <div className="flex items-center justify-start gap-6 w-full px-4"> {/* Changed justify-end to justify-start */}
      {/* Datos del Paciente (Izquierda) - CLICKEABLES */}
      <Link to={`/patients/${patient.id}`} className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-[var(--palantir-active)]/10 flex items-center justify-center border border-[var(--palantir-active)]/30 group-hover:bg-[var(--palantir-active)]/20 transition-colors">
          <UserIcon className="w-4 h-4 text-[var(--palantir-active)]" />
        </div>
        <div className="text-left"> {/* Changed text-right to text-left */}
          <div className="text-sm font-bold uppercase text-white leading-tight group-hover:text-[var(--palantir-active)] transition-colors">
            {patient.full_name || "MISSING_IDENTITY"}
          </div>
          <div className="text-[8px] font-mono text-white/50">
            REF: {patient.id.toString().padStart(6, '0')}
          </div>
        </div>
      </Link>
      {/* Indicadores Rápidos (Derecha) - NO CLICKEABLES */}
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