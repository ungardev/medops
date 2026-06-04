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
    <div className="flex items-center justify-end gap-6 w-full px-4">
      {/* Datos del Paciente (Izquierda) - CLICKEABLES */}
      <Link to={`/patients/${patient.id}`} className="flex items-center gap-4 group hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500/20 transition-colors">
          <UserIcon className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-right">
          <div className="text-sm font-bold uppercase text-white leading-tight group-hover:text-emerald-400 transition-colors">
            {patient.full_name || "MISSING_IDENTITY"}
          </div>
          <div className="text-sm font-mono text-white/50">
            REF: {patient.id.toString().padStart(6, '0')}
          </div>
        </div>
      </Link>
      {/* Indicadores Rápidos (Derecha) - NO CLICKEABLES */}
      <div className="flex items-center gap-5 pl-5 border-l border-white/10">
        {/* Alerta Médica (Discreta) */}
        {patient.allergies && (
          <div className="flex items-center gap-2 text-amber-400" title="Biological Risk Alert">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">ALERT</span>
          </div>
        )}
        
        {/* Balance Financiero */}
        <div className="text-sm font-mono">
          <span className="text-white/40">BALANCE:</span>
          <span className={`font-bold ml-2 ${patient.balance_due && patient.balance_due > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {patient.balance_due && patient.balance_due > 0 
              ? `$${patient.balance_due.toFixed(2)}` 
              : '$0.00'}
          </span>
        </div>
      </div>
    </div>
  );
}