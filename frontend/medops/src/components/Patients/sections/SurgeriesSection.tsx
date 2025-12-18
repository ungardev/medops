import React, { useState } from "react";
import { useSurgeries } from "../../../hooks/patients/useSurgeries";
import SurgeriesModal from "./SurgeriesModal";

interface Props {
  items: any[];
  patientId: number;
  onRefresh?: () => void; // 🔥 FIX INSTITUCIONAL
}

export default function SurgeriesSection({ items, patientId, onRefresh }: Props) {
  const { query, create, update, remove } = useSurgeries(patientId);

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
            query.refetch();
            if (onRefresh) onRefresh();
            setModalOpen(false);
          },
          onError: () =>
            setLocalError("No se pudo actualizar la cirugía. Intenta nuevamente."),
        }
      );
    } else {
      create.mutate(
        { ...data, patient: patientId },
        {
          onSuccess: () => {
            query.refetch();
            if (onRefresh) onRefresh();
            setModalOpen(false);
          },
          onError: () =>
            setLocalError("No se pudo registrar la cirugía. Intenta nuevamente."),
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    setLocalError(null);

    remove.mutate(id, {
      onSuccess: () => {
        query.refetch();
        if (onRefresh) onRefresh();
      },
      onError: () =>
        setLocalError("No se pudo eliminar la cirugía. Intenta nuevamente."),
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
          Cirugías
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
          No hay cirugías registradas.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-[#0d2c53] dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.hospital}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                  {item.date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.date}
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

      <SurgeriesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingItem}
      />
    </div>
  );
}
