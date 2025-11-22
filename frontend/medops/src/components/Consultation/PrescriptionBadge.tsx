import React, { useState } from "react";

// 🔹 Tipos auxiliares para evitar errores de TS
type Frequency =
  | "once_daily" | "bid" | "tid" | "qid"
  | "q4h" | "q6h" | "q8h" | "q12h" | "q24h"
  | "qod" | "stat" | "prn" | "hs"
  | "ac" | "pc" | "achs";

type Route =
  | "oral" | "iv" | "im" | "sc"
  | "topical" | "sublingual" | "inhalation"
  | "rectal" | "other";

type Unit =
  | "mg" | "ml" | "g"
  | "tablet" | "capsule" | "drop"
  | "puff" | "unit" | "patch";

export interface PrescriptionBadgeProps {
  id: number;
  medication: string;
  dosage?: string | null;
  duration?: string | null;
  frequency?: Frequency;
  route?: Route;
  unit?: Unit;
  onEdit?: (
    id: number,
    medication: string,
    dosage?: string | null,
    duration?: string | null,
    frequency?: Frequency,
    route?: Route,
    unit?: Unit
  ) => void;
  onDelete?: (id: number) => void;
}

export default function PrescriptionBadge({
  id,
  medication,
  dosage,
  duration,
  frequency = "once_daily",
  route = "oral",
  unit = "mg",
  onEdit,
  onDelete,
}: PrescriptionBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMedication, setEditedMedication] = useState(medication);
  const [editedDosage, setEditedDosage] = useState(dosage || "");
  const [editedDuration, setEditedDuration] = useState(duration || "");
  const [editedFrequency, setEditedFrequency] = useState<Frequency>(frequency);
  const [editedRoute, setEditedRoute] = useState<Route>(route);
  const [editedUnit, setEditedUnit] = useState<Unit>(unit);

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
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-3 py-2 mb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Prescripción</span>
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
            placeholder="Medicamento"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            value={editedDosage}
            onChange={(e) => setEditedDosage(e.target.value)}
            placeholder="Dosis"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            value={editedDuration}
            onChange={(e) => setEditedDuration(e.target.value)}
            placeholder="Duración"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <select
            value={editedFrequency}
            onChange={(e) => setEditedFrequency(e.target.value as Frequency)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="once_daily">Una vez al día</option>
            <option value="bid">2 veces al día (BID)</option>
            <option value="tid">3 veces al día (TID)</option>
            <option value="qid">4 veces al día (QID)</option>
            <option value="q4h">Cada 4 horas</option>
            <option value="q6h">Cada 6 horas</option>
            <option value="q8h">Cada 8 horas</option>
            <option value="q12h">Cada 12 horas</option>
            <option value="q24h">Cada 24 horas</option>
            <option value="qod">Día por medio</option>
            <option value="stat">Una sola vez / Inmediato</option>
            <option value="prn">Según necesidad</option>
            <option value="hs">Al acostarse</option>
            <option value="ac">Antes de las comidas</option>
            <option value="pc">Después de las comidas</option>
            <option value="achs">Antes de comidas y al acostarse</option>
          </select>

          <select
            value={editedRoute}
            onChange={(e) => setEditedRoute(e.target.value as Route)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="oral">Oral</option>
            <option value="iv">Intravenosa (IV)</option>
            <option value="im">Intramuscular (IM)</option>
            <option value="sc">Subcutánea (SC)</option>
            <option value="topical">Tópica</option>
            <option value="sublingual">Sublingual</option>
            <option value="inhalation">Inhalación</option>
            <option value="rectal">Rectal</option>
            <option value="other">Otro</option>
          </select>

          <select
            value={editedUnit}
            onChange={(e) => setEditedUnit(e.target.value as Unit)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="mg">mg</option>
            <option value="ml">ml</option>
            <option value="g">g</option>
            <option value="tablet">Tableta</option>
            <option value="capsule">Cápsula</option>
            <option value="drop">Gotas</option>
            <option value="puff">Inhalación</option>
            <option value="unit">Unidad</option>
            <option value="patch">Parche</option>
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
