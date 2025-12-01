// src/components/Consultation/ConsultationActions.tsx
import { useConsultationActions } from "../../hooks/consultations/useConsultationActions";

interface ConsultationActionsProps {
  consultationId: number;
}

export default function ConsultationActions({ consultationId }: ConsultationActionsProps) {
  const { complete, cancel, isPending } = useConsultationActions();

  const handleComplete = () => {
    complete(consultationId);
    // 🔹 Recarga la página tras breve delay para desmontar la vista
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleCancel = () => {
    cancel(consultationId);
    // 🔹 También puedes recargar si quieres desmontar al cancelar
    // setTimeout(() => window.location.reload(), 500);
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
