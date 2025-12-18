import React, { useState } from "react";
import { useVaccinations } from "../../../hooks/patients/useVaccinations";
import VaccinationModal from "./VaccinationModal";

interface Props {
  vaccinations: any[];
  patientId: number;
}

export default function VaccinationSection({ vaccinations, patientId }: Props) {
  const { vaccinations: vaccQuery, schedule, create, update, remove } =
    useVaccinations(patientId);

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
        { onSuccess: () => vaccQuery.refetch() }
      );
    } else {
      create.mutate(
        { ...data, patient: patientId },
        { onSuccess: () => vaccQuery.refetch() }
      );
    }
    setModalOpen(false);
  };

  const handleDelete = (id: number) => {
    remove.mutate(id, { onSuccess: () => vaccQuery.refetch() });
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
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Vacunación
        </h3>

        <button
          className="px-3 py-1.5 bg-[#0d2c53] text-white rounded-md text-sm"
          onClick={handleCreate}
        >
          Registrar dosis
        </button>
      </div>

      {/* Alertas */}
      {missing.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-sm">
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

      {/* Lista de vacunas aplicadas */}
      {applied.length === 0 ? (
        <p className="text-sm text-gray-500">No hay vacunas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {applied.map((item: any) => (
            <li
              key={item.id}
              className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">
                    {item.vaccine.code} — {item.vaccine.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Dosis {item.dose_number}
                  </p>
                  <p className="text-xs text-gray-500">
                    Fecha: {item.date_administered}
                  </p>
                  {item.center && (
                    <p className="text-xs text-gray-500">Centro: {item.center}</p>
                  )}
                  {item.lot && (
                    <p className="text-xs text-gray-500">Lote: {item.lot}</p>
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
