// src/components/Patients/InvitePatientModal.tsx
import { useState } from 'react';
import { X, Copy, Check, UserPlus, Send } from 'lucide-react';
import { apiFetch } from '../../api/client';
interface InvitePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  onSuccess?: () => void;
}
interface InviteResponse {
  invite_link?: string;
  error?: string;
}
export default function InvitePatientModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess
}: InvitePatientModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;
  const handleInvite = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<InviteResponse>(
        `patients/${patientId}/invite/`,
        { method: 'POST' }
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
    navigator.clipboard.writeText(window.location.origin + inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#1a1a1b] border border-white/15 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[12px] font-semibold text-white">Invitar al Portal</h3>
            <p className="text-[10px] text-white/40 mt-0.5">{patientName}</p>
          </div>
        </div>
        <p className="text-[11px] text-white/50 mb-5 leading-relaxed">
          Generar invitación para que <span className="text-white/70 font-medium">{patientName}</span> acceda al Portal del Paciente MEDOPZ.
        </p>
        {!inviteLink ? (
          <button
            onClick={handleInvite}
            disabled={isLoading}
            className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 py-3 rounded-lg text-[11px] font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>Generando invitación...</>
            ) : (
              <>
                <Send size={16} />
                Generar Enlace
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-emerald-400 text-[11px] font-medium">
                ✓ Invitación creada exitosamente
              </p>
              <p className="text-[10px] text-white/40 mt-1">
                Comparte este enlace con el paciente
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={window.location.origin + inviteLink}
                readOnly
                className="flex-1 px-3 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[11px] text-white/60 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg text-white/60 hover:text-white transition-all"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-white/30">
              El paciente deberá pagar $5 USD para activar su cuenta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}