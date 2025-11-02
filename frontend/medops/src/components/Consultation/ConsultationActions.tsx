// src/components/Consultation/ConsultationActions.tsx
import { useConsultationActions } from "../../hooks/consultations/useConsultationActions";

interface ConsultationActionsProps {
  consultationId: number;
}

export default function ConsultationActions({ consultationId }: ConsultationActionsProps) {
  const { complete, cancel, isPending } = useConsultationActions();

  return (
    <div className="consultation-actions flex justify-end gap-4 mt-6 border-t pt-4">
      <button
        className="btn-secondary"
        onClick={() => cancel(consultationId)}
        disabled={isPending}
      >
        Cancelar consulta
      </button>
      <button
        className="btn-primary"
        onClick={() => complete(consultationId)}
        disabled={isPending}
      >
        Finalizar consulta
      </button>
    </div>
  );
}
