import React, { useState } from "react";
import { useFamilyHistory } from "../../../hooks/patients/useFamilyHistory";
import FamilyHistoryModal from "./FamilyHistoryModal";

interface Props {
  items: any[];
  patientId: number;
}

export default function FamilyHistorySection({ items, patientId }: Props) {
  const { query, create, update, remove } = useFamilyHistory(patientId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = (data: any) => {
    if (editingItem) {
      update.mutate(
        { ...editingItem, ...data },
        { onSuccess: () => query.refetch() }
      );
    } else {
      create.mutate(
        { ...data, patient: patientId },
        { onSuccess: () => query.refetch() }
      );
    }
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    remove.mutate(id, { onSuccess: () => query.refetch() });
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Antecedentes familiares
        </h3>

        <button
          className="px-3 py-1.5 bg-[#0d2c53] text-white rounded-md text-sm"
          onClick={handleCreate}
        >
          Añadir
        </button>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No hay antecedentes familiares registrados.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{item.condition}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.relative}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                  {item.date && (
                    <p className="text-xs text-gray-500">{item.date}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className="text-blue-600 text-sm"
                    onClick={() => handleEdit(item)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-600 text-sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FamilyHistoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingItem}
      />
    </div>
  );
}
