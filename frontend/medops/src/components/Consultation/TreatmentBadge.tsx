// src/components/Consultation/TreatmentBadge.tsx
import React, { useState } from "react";

export interface TreatmentBadgeProps {
  id: number;
  plan: string;
  start_date?: string | null;
  end_date?: string | null;
  onEdit?: (id: number, newPlan: string, start_date?: string | null, end_date?: string | null) => void;
  onDelete?: (id: number) => void;
}

export default function TreatmentBadge({
  id,
  plan,
  start_date,
  end_date,
  onEdit,
  onDelete,
}: TreatmentBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);
  const [editedStart, setEditedStart] = useState(start_date || "");
  const [editedEnd, setEditedEnd] = useState(end_date || "");

  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editedPlan.trim(), editedStart || null, editedEnd || null);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPlan(plan);
    setEditedStart(start_date || "");
    setEditedEnd(end_date || "");
    setIsEditing(false);
  };

  return (
    <div className="border rounded px-3 py-2 mb-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700 font-semibold">Tratamiento</span>
        <div className="flex gap-2">
          {onEdit && (
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setIsEditing(true)}>
              Editar
            </button>
          )}
          {onDelete && (
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={() => {
                if (confirm("¿Eliminar tratamiento? Esta acción no se puede deshacer.")) {
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
          <textarea
            value={editedPlan}
            onChange={(e) => setEditedPlan(e.target.value)}
            className="textarea"
            placeholder="Plan de tratamiento"
          />
          <input
            type="date"
            value={editedStart}
            onChange={(e) => setEditedStart(e.target.value)}
            className="input"
          />
          <input
            type="date"
            value={editedEnd}
            onChange={(e) => setEditedEnd(e.target.value)}
            className="input"
          />
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
          {plan}
          {start_date && <div>Inicio: {start_date}</div>}
          {end_date && <div>Fin: {end_date}</div>}
        </div>
      )}
    </div>
  );
}
