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
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-2 sm:px-3 py-1.5 sm:py-2 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold text-[#0d2c53] dark:text-white text-xs sm:text-sm">{icd_code}</span>{" "}
          <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-100">{title}</span>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              className="text-xs sm:text-sm text-[#0d2c53] dark:text-blue-400 hover:underline"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              className="text-xs sm:text-sm text-red-600 dark:text-red-400 hover:underline"
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
            className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
          <div className="flex gap-2 mt-1">
            <button
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
              onClick={handleSave}
            >
              Guardar
            </button>
            <button
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 
                         dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        description && (
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">
            {description}
          </p>
        )
      )}
    </div>
  );
}
