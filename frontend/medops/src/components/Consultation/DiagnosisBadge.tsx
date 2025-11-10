// src/components/Consultation/DiagnosisBadge.tsx
import React, { useState } from "react";

export interface DiagnosisBadgeProps {
  id: number;
  icd_code: string;
  title: string;
  description?: string;
  onEdit?: (id: number, newDescription: string) => void;
  onDelete?: (id: number) => void;
}

export default function DiagnosisBadge({
  id,
  icd_code,
  title,
  description,
  onEdit,
  onDelete,
}: DiagnosisBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description || "");

  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editedDescription.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDescription(description || "");
    setIsEditing(false);
  };

  return (
    <div className="border rounded px-3 py-2 mb-2 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-blue-700">{icd_code}</span>{" "}
          <span className="text-sm text-gray-700">{title}</span>
        </div>
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
                if (confirm("¿Eliminar diagnóstico? Esta acción no se puede deshacer.")) {
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
        <div className="mt-2">
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="textarea"
            placeholder="Notas clínicas"
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
        description && (
          <p className="text-sm text-muted mt-1 whitespace-pre-line">
            {description}
          </p>
        )
      )}
    </div>
  );
}
