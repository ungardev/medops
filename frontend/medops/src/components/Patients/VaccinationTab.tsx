// src/components/Patients/VaccinationTab.tsx
import React, { useState } from "react";
import {
  useVaccinations,
  PatientVaccination,
  VaccinationSchedule,
  PatientVaccinationPayload,
} from "../../hooks/patients/useVaccinations";
import VaccinationModal from "./VaccinationModal";
import VaccinationMatrixUniversal from "./VaccinationMatrixUniversal";

interface Props {
  patientId: number;
  onRefresh?: () => void;
}

export default function VaccinationTab({ patientId, onRefresh }: Props) {
  const { vaccinations: vaccQuery, schedule, create, update, remove } =
    useVaccinations(patientId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PatientVaccination | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isSaving = create.isPending || update.isPending || remove.isPending;

  const handleSave = (data: PatientVaccinationPayload) => {
    setLocalError(null);

    if (editingItem?.id && editingItem.id > 0) {
      update.mutate(
        { ...data, id: editingItem.id },
        {
          onSuccess: () => {
            vaccQuery.refetch();
            onRefresh?.();
            setModalOpen(false);
          },
          onError: () =>
            setLocalError("No se pudo actualizar la dosis. Intenta nuevamente."),
        }
      );
    } else {
      create.mutate(data, {
        onSuccess: () => {
          vaccQuery.refetch();
          onRefresh?.();
          setModalOpen(false);
        },
        onError: () =>
          setLocalError("No se pudo registrar la dosis. Intenta nuevamente."),
      });
    }
  };

  const schema: VaccinationSchedule[] = Array.isArray(schedule.data?.results)
    ? schedule.data.results
    : [];

  const applied: PatientVaccination[] = Array.isArray(vaccQuery.data)
    ? vaccQuery.data
    : [];

  return (
    <div className="relative p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      {isSaving && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 rounded-lg flex items-center justify-center z-10">
          <div className="px-4 py-2 bg-white dark:bg-gray-900 rounded-md shadow text-sm text-[#0d2c53] dark:text-gray-100">
            Guardando cambios...
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#0d2c53] dark:text-white">
          Vacunación — Esquema Universal SVPP
        </h2>
      </div>

      {localError && (
        <div className="mb-3 text-xs text-red-600 dark:text-red-400">
          {localError}
        </div>
      )}

      <VaccinationMatrixUniversal
        schedule={schema}
        vaccinations={applied}
        onRegisterDose={(dose: VaccinationSchedule) => {
          const vaccineFull = {
            id: dose.vaccine_detail.id,
            code: dose.vaccine_detail.code,
            name: dose.vaccine_detail.name,
            country: dose.vaccine_detail.country,
            description: dose.vaccine_detail.description ?? undefined,
          };

          setEditingItem({
            id: -1,
            patient: patientId,
            vaccine: dose.vaccine,
            vaccine_detail: vaccineFull,
            dose_number: dose.dose_number,
            date_administered: "",
            center: "",
            lot: "",
            next_dose_date: undefined,
          });
          setModalOpen(true);
        }}
      />

      <VaccinationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingItem}
        vaccines={schema.map((s) => ({
          id: s.vaccine_detail.id,
          code: s.vaccine_detail.code,
          name: s.vaccine_detail.name,
        }))}
        patientId={patientId}
      />

      {/* Leyenda institucional */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-[#0d2c53] dark:text-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-700 border border-gray-400 rounded-sm" />
          <span>Dosis recomendada por el esquema SVPP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-200 dark:bg-orange-600 border border-gray-400 rounded-sm" />
          <span>Dosis ya aplicada y registrada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-400 rounded-sm" />
          <span>No requerida en este grupo de edad</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        © 2025 MedOps — Schedule based on SVPP
      </div>
    </div>
  );
}
