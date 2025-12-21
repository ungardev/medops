// src/components/Patients/VaccinationModal.tsx
import React, { useState } from "react";
import { PatientVaccination, PatientVaccinationPayload } from "../../hooks/patients/useVaccinations";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: PatientVaccinationPayload) => void;
  initial?: PatientVaccination | null;
  vaccines: { id: number; code: string; name: string; dose_number?: number }[];
  patientId: number;
}

export default function VaccinationModal({
  open,
  onClose,
  onSave,
  initial,
  vaccines,
  patientId,
}: Props) {
  const [form, setForm] = useState({
    vaccineId: initial?.vaccine_detail?.id ?? "",
    dose_number: initial?.dose_number ?? "",
    date_administered: initial?.date_administered ?? "",
    center: initial?.center ?? "",
    lot: initial?.lot ?? "",
    next_dose_date: initial?.next_dose_date ?? "",
  });

  if (!open) return null;

  const handleSave = () => {
    const payload: PatientVaccinationPayload = {
      patient: patientId,
      vaccine: Number(form.vaccineId),
      dose_number: Number(form.dose_number),
      date_administered: form.date_administered,
      center: form.center || undefined,
      lot: form.lot || undefined,
      next_dose_date: form.next_dose_date || undefined,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          {initial ? "Editar vacuna aplicada" : "Registrar vacuna aplicada"}
        </h3>

        <div className="space-y-4">
          {/* Vacuna */}
          <div>
            <label className="text-sm font-medium">Vacuna</label>
            <select
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              value={form.vaccineId}
              onChange={(e) => setForm({ ...form, vaccineId: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {vaccines.map((v, idx) => (
                <option key={`${v.id}-${idx}`} value={v.id}>
                  {v.code} — {v.name}
                  {v.dose_number ? ` (Dosis ${v.dose_number})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Número de dosis */}
          <div>
            <label className="text-sm font-medium">Número de dosis</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              value={form.dose_number}
              onChange={(e) =>
                setForm({ ...form, dose_number: Number(e.target.value) })
              }
            />
          </div>

          {/* Fecha aplicada */}
          <div>
            <label className="text-sm font-medium">Fecha aplicada</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              value={form.date_administered}
              onChange={(e) =>
                setForm({ ...form, date_administered: e.target.value })
              }
            />
          </div>

          {/* Centro */}
          <div>
            <label className="text-sm font-medium">Centro</label>
            <input
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              value={form.center}
              onChange={(e) => setForm({ ...form, center: e.target.value })}
            />
          </div>

          {/* Lote */}
          <div>
            <label className="text-sm font-medium">Lote</label>
            <input
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              value={form.lot}
              onChange={(e) => setForm({ ...form, lot: e.target.value })}
            />
          </div>

          {/* Próxima dosis */}
          <div>
            <label className="text-sm font-medium">Próxima dosis (opcional)</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white"
              value={form.next_dose_date}
              onChange={(e) =>
                setForm({ ...form, next_dose_date: e.target.value })
              }
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-[#0d2c53] text-white rounded-md hover:bg-[#0b2444]"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
