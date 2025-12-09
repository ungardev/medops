// src/components/Consultation/ConsultationActions.tsx
import { useConsultationActions } from "../../hooks/consultations/useConsultationActions";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

interface ConsultationActionsProps {
  consultationId: number;
}

export default function ConsultationActions({ consultationId }: ConsultationActionsProps) {
  const { complete, cancel, isPending } = useConsultationActions();
  const navigate = useNavigate();

  const handleComplete = async () => {
    try {
      console.log("[ConsultationActions] Finalizando consulta ID:", consultationId);
      const result = await complete(consultationId);
      console.log("[ConsultationActions] Resultado PATCH:", result);
      toast.success("Consulta finalizada");
      // ⚔️ Ajuste: ruta consistente con main.tsx
      navigate("/waitingroom");
    } catch (error) {
      console.error("[ConsultationActions] Error finalizando consulta:", error);
      toast.error("Error al finalizar consulta");
    }
  };

  const handleCancel = async () => {
    try {
      console.log("[ConsultationActions] Cancelando consulta ID:", consultationId);
      const result = await cancel(consultationId);
      console.log("[ConsultationActions] Resultado PATCH:", result);
      toast.success("Consulta cancelada");
      // Opcional: navigate("/waitingroom");
    } catch (error) {
      console.error("[ConsultationActions] Error cancelando consulta:", error);
      toast.error("Error al cancelar consulta");
    }
  };

  return (
    <div className="flex justify-end gap-2 sm:gap-4 mt-4 sm:mt-6 border-t pt-3 sm:pt-4">
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 
                   hover:bg-gray-200 transition-colors text-xs sm:text-sm"
      >
        Cancelar consulta
      </button>
      <button
        onClick={handleComplete}
        disabled={isPending}
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] 
                   hover:bg-[#0b2444] transition-colors text-xs sm:text-sm"
      >
        {isPending ? "Finalizando..." : "Finalizar consulta"}
      </button>
    </div>
  );
}
