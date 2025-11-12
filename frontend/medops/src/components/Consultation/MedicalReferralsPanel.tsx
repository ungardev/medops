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
  const [specialty, setSpecialty] = useState("other");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"issued" | "accepted" | "rejected">("issued"); // 👈 corregido

  const handleAdd = () => {
    if (!referredTo) return;
    createReferral({
      appointment: appointmentId,
      referred_to: referredTo,
      reason,
      specialty,
      urgency,
      status,
    });
    setReferredTo("");
    setReason("");
    setSpecialty("other");
    setUrgency("routine");
    setStatus("issued"); // 👈 default correcto
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
              <span className="ml-2 text-sm text-muted">
                ({r.specialty} / {r.urgency} / {r.status})
              </span>
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

        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="select">
          <option value="other">Otro</option>
          <option value="cardiology">Cardiología</option>
          <option value="neurology">Neurología</option>
          <option value="orthopedics">Ortopedia</option>
          <option value="dermatology">Dermatología</option>
          <option value="gynecology">Ginecología</option>
          <option value="pediatrics">Pediatría</option>
        </select>

        <select value={urgency} onChange={(e) => setUrgency(e.target.value as any)} className="select">
          <option value="routine">Rutina</option>
          <option value="urgent">Urgente</option>
          <option value="stat">Inmediato (STAT)</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="select">
          <option value="issued">Emitida</option>
          <option value="accepted">Aceptada</option>
          <option value="rejected">Rechazada</option>
        </select>

        <button onClick={handleAdd} className="btn-primary self-start">
          + Agregar referencia
        </button>
      </div>
    </div>
  );
}
