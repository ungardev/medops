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
    <div className="consultation-actions flex justify-end gap-4 mt-6 border-t pt-4">
      <button
        className="btn-secondary"
        onClick={handleCancel}
        disabled={isPending}
      >
        Cancelar consulta
      </button>
      <button
        className="btn-primary"
        onClick={handleComplete}
        disabled={isPending}
      >
        {isPending ? "Finalizando..." : "Finalizar consulta"}
      </button>
    </div>
  );
}
