// src/components/Consultation/MedicalReferralsPanel.tsx
import { useState } from "react";
import {
  useMedicalReferrals,
  useCreateMedicalReferral,
  useUpdateMedicalReferral,
  useDeleteMedicalReferral,
} from "../../hooks/consultations/useMedicalReferrals";
import { useSpecialties } from "../../hooks/consultations/useSpecialties";
import type { Specialty, MedicalReferral } from "../../types/consultation";
import SpecialtyComboboxElegante from "./SpecialtyComboboxElegante";

export interface MedicalReferralsPanelProps {
  appointmentId: number;
  readOnly?: boolean;
}

export default function MedicalReferralsPanel({ appointmentId, readOnly = false }: MedicalReferralsPanelProps) {
  const { data, isLoading } = useMedicalReferrals(appointmentId);
  const referrals = Array.isArray(data) ? data : []; // ✅ blindaje

  const { mutate: createReferral } = useCreateMedicalReferral();
  const { mutate: updateReferral } = useUpdateMedicalReferral();
  const { mutate: deleteReferral } = useDeleteMedicalReferral();

  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<Specialty[]>([]);
  const { data: specialties = [], isLoading: loadingSpecialties } = useSpecialties("");

  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"issued" | "accepted" | "rejected">("issued");

  const [editingReferral, setEditingReferral] = useState<MedicalReferral | null>(null);

  const handleAdd = () => {
    if (!referredTo || readOnly) return;
    createReferral({
      appointment: appointmentId,
      referred_to: referredTo,
      reason,
      specialty_ids: selectedSpecialties.map((s) => s.id),
      urgency,
      status,
    });
    setReferredTo("");
    setReason("");
    setSelectedSpecialties([]);
    setUrgency("routine");
    setStatus("issued");
  };

  const handleUpdate = () => {
    if (!editingReferral || readOnly) return;
    updateReferral({
      id: editingReferral.id,
      appointment: appointmentId,
      referred_to: editingReferral.referred_to,
      reason: editingReferral.reason,
      specialty_ids: editingReferral.specialties?.map((s) => s.id) || [],
      urgency: editingReferral.urgency,
      status: editingReferral.status,
    });
    setEditingReferral(null);
  };

    return (
    <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Referencias Médicas</h3>

      {isLoading && <p className="text-sm text-gray-600 dark:text-gray-400">Cargando referencias...</p>}

      <ul className="mb-4">
        {referrals.length === 0 && (
          <li className="text-sm text-gray-600 dark:text-gray-400">Sin referencias registradas</li>
        )}
        {referrals.map((r: MedicalReferral) => (
          <li key={r.id} className="flex flex-col border-b border-gray-200 dark:border-gray-700 py-2">
            <div className="flex justify-between items-center">
              <div>
                <strong>{r.referred_to}</strong> — {r.reason || "Sin motivo"}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  ({r.specialties?.map((s) => s.name).join(", ") || "Sin especialidad"} / {r.urgency} / {r.status})
                </span>
              </div>
              {!readOnly && (
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 
                               dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setEditingReferral(r)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    onClick={() => deleteReferral({ id: r.id, appointment: appointmentId })}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            {!readOnly && editingReferral?.id === r.id && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="text"
                  value={editingReferral.referred_to}
                  onChange={(e) => setEditingReferral({ ...editingReferral, referred_to: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <textarea
                  value={editingReferral.reason || ""}
                  onChange={(e) => setEditingReferral({ ...editingReferral, reason: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <SpecialtyComboboxElegante
                  value={editingReferral.specialties || []}
                  onChange={(newValue) => setEditingReferral({ ...editingReferral, specialties: newValue })}
                  options={specialties}
                />
                <select
                  value={editingReferral.urgency}
                  onChange={(e) => setEditingReferral({ ...editingReferral, urgency: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="routine">Rutina</option>
                  <option value="urgent">Urgente</option>
                  <option value="stat">Inmediato (STAT)</option>
                </select>
                <select
                  value={editingReferral.status}
                  onChange={(e) => setEditingReferral({ ...editingReferral, status: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="issued">Emitida</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                </select>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    onClick={handleUpdate}
                  >
                    Guardar cambios
                  </button>
                  <button
                    className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 
                               dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setEditingReferral(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Especialista o servicio destino"
            value={referredTo}
            onChange={(e) => setReferredTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <textarea
            placeholder="Motivo clínico de la referencia"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <SpecialtyComboboxElegante
            value={selectedSpecialties}
            onChange={setSelectedSpecialties}
            options={specialties}
          />
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="routine">Rutina</option>
            <option value="urgent">Urgente</option>
            <option value="stat">Inmediato (STAT)</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="issued">Emitida</option>
            <option value="accepted">Aceptada</option>
            <option value="rejected">Rechazada</option>
          </select>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors self-start"
          >
            + Agregar referencia
          </button>
        </div>
      )}
    </div>
  );
}
