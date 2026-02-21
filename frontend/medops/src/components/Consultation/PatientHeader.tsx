// src/components/Consultation/PatientHeader.tsx
import type { Patient } from "../../types/patients";
import { Link } from "react-router-dom";
import { 
  UserIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CakeIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";
interface PatientHeaderProps {
  patient: Patient & {
    balance_due?: number;
    age?: number | null;
  };
}
interface AddressChain {
  country: string; state: string; municipality: string;
  parish: string; neighborhood: string;
}
const extractPhone = (contact: any): string => {
  if (!contact) return "NO_DATA_LINK";
  try {
    const p = typeof contact === 'string' && contact.startsWith('{') ? JSON.parse(contact) : contact;
    return p.phone || p.tel || p.mobile || String(contact);
  } catch { return String(contact); }
};
const buildFullAddress = (patient: Patient): string => {
  const c = (patient.address_chain as AddressChain);
  return [c?.neighborhood, c?.parish, c?.state, c?.country]
    .filter(Boolean).join(", ") || "LOCATION_UNKNOWN";
};
export default function PatientHeader({ patient }: PatientHeaderProps) {
  const phone = extractPhone(patient.contact_info);
  const fullAddress = buildFullAddress(patient);
  return (
    <div className="relative overflow-hidden bg-black/40 border border-[var(--palantir-border)] p-4 group">
      <div className="absolute top-0 right-0 p-1 opacity-10 pointer-events-none">
        <IdentificationIcon className="w-24 h-24 -mr-8 -mt-8" />
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        
        {/* AVATAR / STATUS SECTION */}
        <div className="flex flex-row md:flex-col items-center gap-4 border-b md:border-b-0 md:border-r border-[var(--palantir-border)] pb-4 md:pb-0 md:pr-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--palantir-active)] flex items-center justify-center bg-[var(--palantir-active)]/10 shadow-[0_0_15px_rgba(30,136,229,0.2)]">
              <UserIcon className="w-8 h-8 text-[var(--palantir-active)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[var(--palantir-bg)] rounded-full animate-pulse" />
          </div>
          <div className="text-center md:text-left">
            <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">Subject_Status</span>
            <div className="text-[10px] font-black text-emerald-500 uppercase italic">Active_Session</div>
          </div>
        </div>
        {/* CORE INFO SECTION */}
        <div className="flex-1 space-y-4">
          {/* Nombre y Acceso Rápido */}
          <div className="flex items-center justify-between group-name">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--palantir-text)]">
                {patient.full_name || "MISSING_IDENTITY"}
              </h2>
              <span className="text-[10px] font-mono text-[var(--palantir-active)] border border-[var(--palantir-active)]/30 px-2">
                REF:{patient.id.toString().padStart(6, '0')}
              </span>
            </div>
            <Link
              to={`/patients/${patient.id}`}
              className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-colors"
            >
              Master_Profile <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </Link>
          </div>
          {/* Grid de Biometría Táctica */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest flex items-center gap-1">
                <CakeIcon className="w-3 h-3" /> Bio_Age
              </p>
              <p className="text-xs font-bold">{patient.age || "—"} Years</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest flex items-center gap-1">
                <IdentificationIcon className="w-3 h-3" /> Gender_ID
              </p>
              <p className="text-xs font-bold uppercase">{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest flex items-center gap-1">
                <PhoneIcon className="w-3 h-3" /> Comms_Link
              </p>
              <p className="text-xs font-bold font-mono tracking-tighter">{phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest flex items-center gap-1">
                <EnvelopeIcon className="w-3 h-3" /> Data_Relay
              </p>
              <p className="text-xs font-bold truncate max-w-[150px]">{patient.email || "N/A"}</p>
            </div>
          </div>
          {/* Dirección */}
          <div className="flex items-start gap-2 pt-2 border-t border-[var(--palantir-border)]/30">
            <MapPinIcon className="w-3 h-3 text-[var(--palantir-active)] mt-0.5" />
            <p className="text-[10px] font-mono text-[var(--palantir-muted)] leading-relaxed uppercase italic">
              Geographic_Coords: <span className="text-[var(--palantir-text)] not-italic">{fullAddress}</span>
            </p>
          </div>
        </div>
        {/* ALERTS & BALANCE SECTION */}
        <div className="md:w-64 space-y-3">
          {/* Alertas Médicas */}
          {patient.allergies && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-2">
              <div className="flex items-center gap-2 mb-1">
                <ExclamationTriangleIcon className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Biological_Risk</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {String(patient.allergies).split(",").map((a, i) => (
                  <span key={i} className="text-[8px] font-black bg-amber-500 text-black px-1 uppercase">
                    {a.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Balance Financiero */}
          <div className={`p-2 border `}>
            <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">Financial_Ledger</span>
            <p className={`text-sm font-black `}>
              {patient.balance_due && patient.balance_due > 0 ? `DEBIT: ${patient.balance_due.toFixed(2)}` : 'CREDIT_CLEAR'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}