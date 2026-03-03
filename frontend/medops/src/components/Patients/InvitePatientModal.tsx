// src/components/Patients/InvitePatientModal.tsx
import { useState } from 'react';
import { X, Copy, Check, UserPlus, Send } from 'lucide-react';
interface InvitePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  onSuccess?: () => void;
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
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/patients/${patientId}/invite/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setInviteLink(data.invite_link);
        onSuccess?.();
      } else {
        alert(data.error || 'Error al crear invitación');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#11141a] border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase">Invitar al Portal</h3>
            <p className="text-xs text-slate-400">MEDOPZ Patient</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          Generar invitación para <span className="text-white font-bold">{patientName}</span> 
          {' '}al Portal del Paciente MEDOPZ.
        </p>
        {!inviteLink ? (
          <button
            onClick={handleInvite}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
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
              <p className="text-emerald-400 text-sm font-bold uppercase">
                ✓ Invitación creada
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Comparte este enlace con el paciente
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={window.location.origin + inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-black/40 border border-slate-700 rounded text-xs text-slate-300"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              El paciente deberá pagar $5 USD para activar su cuenta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}