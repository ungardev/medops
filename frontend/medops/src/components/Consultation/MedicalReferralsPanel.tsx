// src/components/Consultation/MedicalReferralsPanel.tsx
import { useState } from "react";
import {
  useMedicalReferrals,
  useCreateMedicalReferral,
  useUpdateMedicalReferral,
  useDeleteMedicalReferral,
} from "../../hooks/consultations/useMedicalReferrals";

interface MedicalReferralsPanelProps {
  appointmentId: number;
}

export default function MedicalReferralsPanel({ appointmentId }: MedicalReferralsPanelProps) {
  const { data: referrals = [], isLoading } = useMedicalReferrals(appointmentId);
  const { mutate: createReferral } = useCreateMedicalReferral();
  const { mutate: updateReferral } = useUpdateMedicalReferral();
  const { mutate: deleteReferral } = useDeleteMedicalReferral();

  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");

  const handleAdd = () => {
    if (!referredTo) return;
    createReferral({ appointment: appointmentId, referred_to: referredTo, reason });
    setReferredTo("");
    setReason("");
  };

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-2">Referencias Médicas</h3>

      {isLoading && <p>Cargando referencias...</p>}

      <ul className="mb-4">
        {referrals.length === 0 && <li className="text-muted">Sin referencias registradas</li>}
        {referrals.map((r: any) => (
          <li key={r.id} className="flex justify-between items-center border-b py-1">
            <div>
              <strong>{r.referred_to}</strong> — {r.reason || "Sin motivo"}
              <span className="ml-2 text-sm text-muted">({r.status})</span>
            </div>
            <button
              className="btn-danger btn-sm"
              onClick={() => deleteReferral({ id: r.id, appointment: appointmentId })}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Especialista o servicio destino"
          value={referredTo}
          onChange={(e) => setReferredTo(e.target.value)}
          className="input"
        />

        <textarea
          placeholder="Motivo clínico de la referencia"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="textarea"
        />

        <button onClick={handleAdd} className="btn-primary self-start">
          + Agregar referencia
        </button>
      </div>
    </div>
  );
}
