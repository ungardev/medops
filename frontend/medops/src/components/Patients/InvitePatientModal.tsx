// src/components/Patients/InvitePatientModal.tsx
import { useState } from 'react';
import { X, Copy, Check, UserPlus, Send, UserIcon } from 'lucide-react';
import { apiFetch } from '../../api/client';
import { getPatientPortalUrl } from '../../lib/subdomain';
interface InvitePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  isMinor?: boolean;
  onSuccess?: () => void;
}
interface InviteResponse {
  invite_link?: string;
  invitation?: {
    id: number;
    is_invitation_for_minor: boolean;
    invited_representative_name?: string;
    invited_representative_email?: string;
  };
  error?: string;
}
interface FormValues {
  is_for_minor: boolean;
  representative_name?: string;
  representative_email?: string;
  representative_relationship?: string;
}
const RELATIONSHIP_OPTIONS = [
  { value: "father", label: "Padre" },
  { value: "mother", label: "Madre" },
  { value: "legal_guardian", label: "Tutor Legal" },
  { value: "grandfather", label: "Abuelo" },
  { value: "grandmother", label: "Abuela" },
  { value: "other", label: "Otro" },
];
export default function InvitePatientModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  isMinor = false,
  onSuccess
}: InvitePatientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isForMinor, setIsForMinor] = useState(isMinor);
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeEmail, setRepresentativeEmail] = useState('');
  const [representativeRelationship, setRepresentativeRelationship] = useState('');
  if (!isOpen) return null;
  const handleInvite = async () => {
    setIsLoading(true);
    try {
      const payload: FormValues = {
        is_for_minor: isForMinor,
        ...(isForMinor && {
          representative_name: representativeName,
          representative_email: representativeEmail,
          representative_relationship: representativeRelationship,
        }),
      };
      const data = await apiFetch<InviteResponse>(
        `patients/${patientId}/invite/`,
        { 
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      
      if (data.invite_link) {
        setInviteLink(data.invite_link);
        onSuccess?.();
      } else if (data.error) {
        alert(data.error || 'Error al crear invitación');
      }
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(getPatientPortalUrl(inviteLink!));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleClose = () => {
    setInviteLink(null);
    setIsForMinor(isMinor);
    setRepresentativeName('');
    setRepresentativeEmail('');
    setRepresentativeRelationship('');
    onClose();
  };
  const inputClass = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelStyles = "text-xs font-medium text-white/60 uppercase tracking-wider mb-2 block";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-[#1a1a1b] border border-white/15 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Invitar al Portal</h3>
            <p className="text-sm text-white/40 mt-0.5">{patientName}</p>
          </div>
        </div>
        
        {!inviteLink ? (
          <>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">
              Generar invitación para que <span className="text-white/70 font-medium">{patientName}</span> acceda al Portal del Paciente MEDOPZ.
</p>

            <div className="mb-5 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/15 border border-amber-500/25 rounded-lg">
                    <UserIcon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/70">¿Invitar como menor?</h4>
                    <p className="text-xs text-white/40 mt-0.5">La invitación será para el representante</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isForMinor}
                    onChange={(e) => setIsForMinor(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/30 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500/50 peer-checked:after:bg-emerald-400"></div>
                </label>
              </div>
            </div>

            {isForMinor && (
              <div className="mb-5 p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wider">Datos del Representante</h4>
                <div>
                  <label className={labelStyles}>Nombre del Representante *</label>
                  <input 
                    type="text"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className={inputClass} 
                    placeholder="Nombre completo del representante" 
                  />
                </div>
                <div>
                  <label className={labelStyles}>Correo Electrónico</label>
                  <input 
                    type="email"
                    value={representativeEmail}
                    onChange={(e) => setRepresentativeEmail(e.target.value)}
                    className={inputClass} 
                    placeholder="correo@ejemplo.com" 
                  />
                </div>
                <div>
                  <label className={labelStyles}>Parentesco *</label>
                  <select 
                    value={representativeRelationship}
                    onChange={(e) => setRepresentativeRelationship(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar parentesco</option>
                    {RELATIONSHIP_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <button
              onClick={handleInvite}
              disabled={isLoading || (isForMinor && (!representativeName || !representativeRelationship))}
              className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>Generando invitación...</>
              ) : (
                <>
                  <Send size={18} />
                  Generar Enlace
                </>
              )}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm font-medium text-emerald-400">
                ✓ Invitación creada exitosamente
              </p>
              {isForMinor && representativeName && (
                <p className="text-xs text-white/40 mt-1">
                  Enviada para: {representativeName}
                </p>
              )}
              <p className="text-xs text-white/40 mt-1">
                Comparte este enlace con el {isForMinor ? 'representante' : 'paciente'}
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={getPatientPortalUrl(inviteLink!)}
                readOnly
                className="flex-1 px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm text-white/60 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-white/60 hover:text-white transition-all"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}