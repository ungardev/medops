// src/components/Patients/sections/HabitsSection.tsx
import React, { useState } from "react";
import { useHabits } from "../../../hooks/patients/useHabits";
import HabitsModal from "./HabitsModal";
import {
  Habit,
  HabitForm,
  HabitImpact,
} from "../../../types/patients";

interface Props {
  items: Habit[];
  patientId: number;
  onRefresh?: () => void;
}

const impactColors: Record<HabitImpact, string> = {
  alto: "bg-red-100 border-red-300 text-red-800",
  medio: "bg-yellow-100 border-yellow-300 text-yellow-800",
  bajo: "bg-green-100 border-green-300 text-green-800",
};

export default function HabitsSection({ items, patientId, onRefresh }: Props) {
  const { query, create, update, remove } = useHabits(patientId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Habit | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isSaving = create.isPending || update.isPending || remove.isPending;

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Habit) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = (data: HabitForm) => {
    setLocalError(null);

    if (editingItem) {
      // Actualización: combinamos el item existente con los datos del formulario
      update.mutate(
        { ...editingItem, ...data },
        {
          onSuccess: () => {
            query.refetch();
            onRefresh?.();
            setModalOpen(false);
          },
          onError: () =>
            setLocalError("No se pudo actualizar el hábito. Intenta nuevamente."),
        }
      );
    } else {
      // Creación: enviamos el formulario junto con el patientId
      create.mutate(
        { ...data, patient: patientId },
        {
          onSuccess: () => {
            query.refetch();
            onRefresh?.();
            setModalOpen(false);
          },
          onError: () =>
            setLocalError("No se pudo registrar el hábito. Intenta nuevamente."),
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    setLocalError(null);

    remove.mutate(id, {
      onSuccess: () => {
        query.refetch();
        onRefresh?.();
      },
      onError: () =>
        setLocalError("No se pudo eliminar el hábito. Intenta nuevamente."),
    });
  };

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
          Hábitos
        </h3>

        <button
          className="px-3 py-1.5 bg-[#0d2c53] text-white rounded-md text-sm disabled:opacity-60"
          onClick={handleCreate}
          disabled={isSaving}
        >
          Añadir
        </button>
      </div>

      {/* Error institucional */}
      {localError && (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400">
          {localError}
        </div>
      )}

      {/* Loading */}
      {query.isLoading ? (
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
          <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-300">
          No hay hábitos registrados.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`p-3 border rounded-md ${
                item.impact
                  ? impactColors[item.impact]
                  : "bg-gray-50 dark:bg-gray-700"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-[#0d2c53] dark:text-white">
                    {item.type}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Frecuencia: {item.frequency}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {item.notes}
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

      <HabitsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={
          editingItem
            ? {
                type: editingItem.type,
                frequency: editingItem.frequency,
                impact: editingItem.impact ?? "",
                notes: editingItem.notes ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}
