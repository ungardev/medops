import React, { useState } from "react";

export interface PrescriptionBadgeProps {
  id: number;
  medication: string;
  dosage?: string | null;
  duration?: string | null;
  frequency?: "daily" | "bid" | "tid" | "qid";
  route?: "oral" | "iv" | "im" | "sc";
  unit?: "mg" | "ml" | "g" | "tablet";
  onEdit?: (
    id: number,
    medication: string,
    dosage?: string | null,
    duration?: string | null,
    frequency?: "daily" | "bid" | "tid" | "qid",
    route?: "oral" | "iv" | "im" | "sc",
    unit?: "mg" | "ml" | "g" | "tablet"
  ) => void;
  onDelete?: (id: number) => void;
}

export default function PrescriptionBadge({
  id,
  medication,
  dosage,
  duration,
  frequency = "daily",
  route = "oral",
  unit = "mg",
  onEdit,
  onDelete,
}: PrescriptionBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMedication, setEditedMedication] = useState(medication);
  const [editedDosage, setEditedDosage] = useState(dosage || "");
  const [editedDuration, setEditedDuration] = useState(duration || "");
  const [editedFrequency, setEditedFrequency] = useState(frequency);
  const [editedRoute, setEditedRoute] = useState(route);
  const [editedUnit, setEditedUnit] = useState(unit);

  const handleSave = () => {
    if (onEdit) {
      onEdit(
        id,
        editedMedication.trim(),
        editedDosage || null,
        editedDuration || null,
        editedFrequency,
        editedRoute,
        editedUnit
      );
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMedication(medication);
    setEditedDosage(dosage || "");
    setEditedDuration(duration || "");
    setEditedFrequency(frequency);
    setEditedRoute(route);
    setEditedUnit(unit);
    setIsEditing(false);
  };

  return (
    <div className="border rounded px-3 py-2 mb-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 font-semibold">Prescripción</span>
        <div className="flex gap-2">
          {onEdit && (
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={() => {
                if (confirm("¿Eliminar prescripción? Esta acción no se puede deshacer.")) {
                  onDelete(id);
                }
              }}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            value={editedMedication}
            onChange={(e) => setEditedMedication(e.target.value)}
            className="input"
            placeholder="Medicamento"
          />
          <input
            type="text"
            value={editedDosage}
            onChange={(e) => setEditedDosage(e.target.value)}
            className="input"
            placeholder="Dosis"
          />
          <input
            type="text"
            value={editedDuration}
            onChange={(e) => setEditedDuration(e.target.value)}
            className="input"
            placeholder="Duración"
          />

          <select
            value={editedFrequency}
            onChange={(e) => setEditedFrequency(e.target.value as any)}
            className="select"
          >
            <option value="daily">Diaria</option>
            <option value="bid">2 veces al día (BID)</option>
            <option value="tid">3 veces al día (TID)</option>
            <option value="qid">4 veces al día (QID)</option>
          </select>

          <select
            value={editedRoute}
            onChange={(e) => setEditedRoute(e.target.value as any)}
            className="select"
          >
            <option value="oral">Oral</option>
            <option value="iv">Intravenosa (IV)</option>
            <option value="im">Intramuscular (IM)</option>
            <option value="sc">Subcutánea (SC)</option>
          </select>

          <select
            value={editedUnit}
            onChange={(e) => setEditedUnit(e.target.value as any)}
            className="select"
          >
            <option value="mg">mg</option>
            <option value="ml">ml</option>
            <option value="g">g</option>
            <option value="tablet">Tableta</option>
          </select>

          <div className="flex gap-2 mt-1">
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Guardar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-sm text-muted whitespace-pre-line">
          {medication}
          {dosage && <div>Dosis: {dosage} {unit}</div>}
          {duration && <div>Duración: {duration}</div>}
          <div>Frecuencia: {frequency}</div>
          <div>Vía: {route}</div>
        </div>
      )}
    </div>
  );
}
