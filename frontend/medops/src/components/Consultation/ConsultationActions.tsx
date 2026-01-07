// src/components/Consultation/ConsultationActions.tsx
import { useConsultationActions } from "../../hooks/consultations/useConsultationActions";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  CheckBadgeIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

interface ConsultationActionsProps {
  consultationId: number;
}

export default function ConsultationActions({ consultationId }: ConsultationActionsProps) {
  const { complete, cancel, isPending } = useConsultationActions();
  const navigate = useNavigate();

  const handleComplete = async () => {
    try {
      await complete(consultationId);
      toast.success("CONSULTA_FINALIZADA_CON_ÉXITO");
      navigate("/waitingroom");
    } catch (error) {
      toast.error("ERROR_EN_PROTOCOLO_DE_FINALIZACIÓN");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("¿CONFIRMAR_ANULACIÓN_DE_CONSULTA? LOS_DATOS_NO_GUARDADOS_SE_PERDERÁN.")) return;
    try {
      await cancel(consultationId);
      toast.success("CONSULTA_ANULADA");
      navigate("/waitingroom");
    } catch (error) {
      toast.error("ERROR_AL_CANCELAR");
    }
  };

  return (
    <div className="sticky bottom-0 left-0 w-full bg-[#0a0a0a]/80 backdrop-blur-md border-t border-[var(--palantir-border)] p-4 mt-8 z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* LADO IZQUIERDO: STATUS Y SEGURIDAD */}
        <div className="flex items-center gap-4 order-2 sm:order-1">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-white/5 bg-white/5 rounded-sm">
            <ShieldCheckIcon className="w-4 h-4 text-[var(--palantir-active)] animate-pulse" />
            <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">
              Data_Integrity: Secured
            </span>
          </div>
          <div className="hidden md:block text-[9px] font-mono text-[var(--palantir-muted)] opacity-30 uppercase">
            ID: {consultationId.toString().padStart(6, '0')} // PROTOCOL_V3
          </div>
        </div>

        {/* LADO DERECHO: ACCIONES DE EJECUCIÓN */}
        <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-950/20 transition-all disabled:opacity-30"
          >
            <XMarkIcon className="w-4 h-4" />
            Abort_Session
          </button>

          <button
            onClick={handleComplete}
            disabled={isPending}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-[var(--palantir-active)] text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-all disabled:opacity-50"
          >
            {isPending ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <CheckBadgeIcon className="w-4 h-4" />
            )}
            {isPending ? "Syncing..." : "Commit_Consultation"}
          </button>
        </div>
      </div>
    </div>
  );
}
