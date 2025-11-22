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
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-3 py-2 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-blue-700 dark:text-blue-400">{icd_code}</span>{" "}
          <span className="text-sm text-gray-800 dark:text-gray-100">{title}</span>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
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
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Notas clínicas"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <div className="flex gap-2 mt-1">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              onClick={handleSave}
            >
              Guardar
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 
                         dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">
            {description}
          </p>
        )
      )}
    </div>
  );
}
