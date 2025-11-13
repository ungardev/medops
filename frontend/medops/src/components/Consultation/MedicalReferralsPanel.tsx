import { useState } from "react";
import {
  useMedicalReferrals,
  useCreateMedicalReferral,
  useUpdateMedicalReferral,
  useDeleteMedicalReferral,
} from "../../hooks/consultations/useMedicalReferrals";
import { useSpecialties } from "../../hooks/consultations/useSpecialties";
import { TextField, Autocomplete, Chip } from "@mui/material";
import type { Specialty, MedicalReferral } from "../../types/consultation";

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
  const [selectedSpecialties, setSelectedSpecialties] = useState<Specialty[]>([]);
  const [search, setSearch] = useState("");
  const { data: specialties = [], isLoading: loadingSpecialties } = useSpecialties(search);

  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"issued" | "accepted" | "rejected">("issued");

  const [editingReferral, setEditingReferral] = useState<MedicalReferral | null>(null);

  const handleAdd = () => {
    if (!referredTo) return;
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
    if (!editingReferral) return;
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

  const renderSpecialtyAutocomplete = (
    value: Specialty[],
    onChange: (newValue: Specialty[]) => void
  ) => (
    <Autocomplete
      multiple
      options={specialties ?? []}
      getOptionLabel={(option: Specialty) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      value={value}
      onChange={(_, newValue: Specialty[]) => onChange(newValue)}
      onInputChange={(_, value: string) => setSearch(value)}
      loading={loadingSpecialties}
      loadingText="Buscando especialidades..."
      noOptionsText={search.length < 1 ? "Escribe para buscar" : "Sin resultados"}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Especialidades médicas"
          placeholder="Buscar y seleccionar..."
          InputProps={{
            ...params.InputProps,
            style: { color: "#111" },
          }}
          InputLabelProps={{
            style: { color: "#333" },
          }}
        />
      )}
      renderTags={(value: Specialty[], getTagProps) =>
        value.map((option, index) => (
          <Chip label={`${option.name} (${option.code})`} {...getTagProps({ index })} key={option.id} />
        ))
      }
    />
  );

  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-2">Referencias Médicas</h3>

      {isLoading && <p>Cargando referencias...</p>}

      <ul className="mb-4">
        {referrals.length === 0 && <li className="text-muted">Sin referencias registradas</li>}
        {referrals.map((r: MedicalReferral) => (
          <li key={r.id} className="flex flex-col border-b py-2">
            <div className="flex justify-between items-center">
              <div>
                <strong>{r.referred_to}</strong> — {r.reason || "Sin motivo"}
                <span className="ml-2 text-sm text-muted">
                  ({r.specialties?.map((s) => s.name).join(", ") || "Sin especialidad"} / {r.urgency} / {r.status})
                </span>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary btn-sm" onClick={() => setEditingReferral(r)}>
                  Editar
                </button>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => deleteReferral({ id: r.id, appointment: appointmentId })}
                >
                  Eliminar
                </button>
              </div>
            </div>

            {editingReferral?.id === r.id && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="text"
                  value={editingReferral.referred_to}
                  onChange={(e) => setEditingReferral({ ...editingReferral, referred_to: e.target.value })}
                  className="input"
                />
                <textarea
                  value={editingReferral.reason || ""}
                  onChange={(e) => setEditingReferral({ ...editingReferral, reason: e.target.value })}
                  className="textarea"
                />
                {renderSpecialtyAutocomplete(
                  editingReferral.specialties || [],
                  (newValue) => setEditingReferral({ ...editingReferral, specialties: newValue })
                )}
                <select
                  value={editingReferral.urgency}
                  onChange={(e) => setEditingReferral({ ...editingReferral, urgency: e.target.value as any })}
                  className="select"
                >
                  <option value="routine">Rutina</option>
                  <option value="urgent">Urgente</option>
                  <option value="stat">Inmediato (STAT)</option>
                </select>
                <select
                  value={editingReferral.status}
                  onChange={(e) => setEditingReferral({ ...editingReferral, status: e.target.value as any })}
                  className="select"
                >
                  <option value="issued">Emitida</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                </select>
                <div className="flex gap-2">
                  <button className="btn-primary btn-sm" onClick={handleUpdate}>
                    Guardar cambios
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => setEditingReferral(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
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
        {renderSpecialtyAutocomplete(selectedSpecialties, setSelectedSpecialties)}
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
