import React, { useState } from "react";
import { useVaccinations } from "../../../hooks/patients/useVaccinations";
import VaccinationModal from "./VaccinationModal";

interface Props {
  vaccinations: any[];
  patientId: number;
  onRefresh?: () => void; // 🔥 FIX INSTITUCIONAL
}

export default function VaccinationSection({ vaccinations, patientId, onRefresh }: Props) {
  const { vaccinations: vaccQuery, schedule, create, update, remove } =
    useVaccinations(patientId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isSaving =
    create.isPending || update.isPending || remove.isPending;

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = (data: any) => {
    setLocalError(null);

    if (editingItem) {
      update.mutate(
        { ...editingItem, ...data },
        {
          onSuccess: () => {
            vaccQuery.refetch();
            if (onRefresh) onRefresh();
            setModalOpen(false);
          },
          onError: () =>
            setLocalError("No se pudo actualizar la dosis. Intenta nuevamente."),
        }
      );
    } else {
      create.mutate(
        { ...data, patient: patientId },
        {
          onSuccess: () => {
            vaccQuery.refetch();
            if (onRefresh) onRefresh();
            setModalOpen(false);
          },
          onError: () =>
            setLocalError("No se pudo registrar la dosis. Intenta nuevamente."),
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    setLocalError(null);

    remove.mutate(id, {
      onSuccess: () => {
        vaccQuery.refetch();
        if (onRefresh) onRefresh();
      },
      onError: () =>
        setLocalError("No se pudo eliminar la dosis. Intenta nuevamente."),
    });
  };

  // --- Asegurar que applied y schema SIEMPRE sean arrays ---
  const applied: any[] = Array.isArray(vaccQuery.data) ? vaccQuery.data : [];
  const schema: any[] = Array.isArray(schedule.data) ? schedule.data : [];

  // --- Dosis faltantes ---
  const missing = schema.filter((dose: any) =>
    !applied.some(
      (v: any) =>
        v.vaccine?.id === dose.vaccine?.id &&
        v.dose_number === dose.dose_number
    )
  );

  return (
    <div className="relative p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">

      {/* Overlay institucional cuando se está guardando */}
      {isSaving && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 rounded-lg flex items-center justify-center z-10">
          <div className="px-4 py-2 bg-white dark:bg-gray-900 rounded-md shadow text-sm text-[#0d2c53] dark:text-gray-100">
            Guardando cambios...
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Vacunación
        </h3>

        <button
          className="px-3 py-1.5 bg-[#0d2c53] text-white rounded-md text-sm disabled:opacity-60"
          onClick={handleCreate}
          disabled={isSaving}
        >
          Registrar dosis
        </button>
      </div>

      {/* Error institucional */}
      {localError && (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400">
          {localError}
        </div>
      )}

      {/* Alertas */}
      {missing.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 rounded-md text-sm text-[#0d2c53] dark:text-yellow-200">
          <strong>Dosis faltantes:</strong>
          <ul className="list-disc ml-5 mt-1">
            {missing.map((m: any) => (
              <li key={`${m.vaccine.id}-${m.dose_number}`}>
                {m.vaccine.code} — dosis {m.dose_number} ({m.recommended_age_months} meses)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading */}
      {vaccQuery.isLoading ? (
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>
      ) : applied.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-300">
          No hay vacunas registradas.
        </p>
      ) : (
        <ul className="space-y-3">
          {applied.map((item: any) => (
            <li
              key={item.id}
              className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-[#0d2c53] dark:text-white">
                    {item.vaccine.code} — {item.vaccine.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Dosis {item.dose_number}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Fecha: {item.date_administered}
                  </p>
                  {item.center && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Centro: {item.center}
                    </p>
                  )}
                  {item.lot && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Lote: {item.lot}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className="text-blue-600 dark:text-blue-400 text-sm"
                    onClick={() => handleEdit(item)}
                    disabled={isSaving}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-600 dark:text-red-400 text-sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={isSaving}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <VaccinationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingItem}
        vaccines={schema.map((s: any) => s.vaccine)}
      />
    </div>
  );
}
