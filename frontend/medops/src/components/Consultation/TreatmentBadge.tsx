import React, { useState } from "react";

export type TreatmentStatus =
  | "active"
  | "completed"
  | "cancelled"
  | "suspended";

export type TreatmentType =
  | "pharmacological"
  | "surgical"
  | "rehabilitation"
  | "lifestyle"
  | "therapeutic"
  | "other";

export interface TreatmentBadgeProps {
  id: number;
  plan: string;
  start_date?: string | null;
  end_date?: string | null;
  status: TreatmentStatus;
  treatment_type: TreatmentType;
  onEdit?: (
    id: number,
    newPlan: string,
    start_date?: string | null,
    end_date?: string | null,
    status?: TreatmentStatus,
    treatment_type?: TreatmentType
  ) => void;
  onDelete?: (id: number) => void;
}

export default function TreatmentBadge({
  id,
  plan,
  start_date,
  end_date,
  status,
  treatment_type,
  onEdit,
  onDelete,
}: TreatmentBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);
  const [editedStart, setEditedStart] = useState(start_date || "");
  const [editedEnd, setEditedEnd] = useState(end_date || "");
  const [editedStatus, setEditedStatus] = useState<TreatmentStatus>(status);
  const [editedType, setEditedType] = useState<TreatmentType>(treatment_type);

  const handleSave = () => {
    if (onEdit) {
      onEdit(
        id,
        editedPlan.trim(),
        editedStart || null,
        editedEnd || null,
        editedStatus,
        editedType
      );
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPlan(plan);
    setEditedStart(start_date || "");
    setEditedEnd(end_date || "");
    setEditedStatus(status);
    setEditedType(treatment_type);
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-3 py-2 mb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Tratamiento</span>
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
            placeholder="Plan de tratamiento"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="date"
            value={editedStart}
            onChange={(e) => setEditedStart(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="date"
            value={editedEnd}
            onChange={(e) => setEditedEnd(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <select
            value={editedStatus}
            onChange={(e) => setEditedStatus(e.target.value as TreatmentStatus)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
            <option value="suspended">Suspendido</option>
          </select>

          <select
            value={editedType}
            onChange={(e) => setEditedType(e.target.value as TreatmentType)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="pharmacological">Farmacológico</option>
            <option value="surgical">Quirúrgico</option>
            <option value="rehabilitation">Rehabilitación</option>
            <option value="lifestyle">Cambio de estilo de vida</option>
            <option value="therapeutic">Terapéutico</option>
            <option value="other">Otro</option>
          </select>

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
        <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {plan}
          {start_date && <div>Inicio: {start_date}</div>}
          {end_date && <div>Fin: {end_date}</div>}
          <div>Estado: {status}</div>
          <div>Tipo: {treatment_type}</div>
        </div>
      )}
    </div>
  );
}
