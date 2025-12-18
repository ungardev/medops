import React, { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: any;
  vaccines: any[];
}

export default function VaccinationModal({
  open,
  onClose,
  onSave,
  initial,
  vaccines,
}: Props) {
  const [form, setForm] = useState({
    vaccine: initial?.vaccine?.id ?? "",
    dose_number: initial?.dose_number ?? "",
    date_administered: initial?.date_administered ?? "",
    center: initial?.center ?? "",
    lot: initial?.lot ?? "",
  });

  if (!open) return null;

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          {initial ? "Editar vacuna aplicada" : "Registrar vacuna aplicada"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Vacuna</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={form.vaccine}
              onChange={(e) => setForm({ ...form, vaccine: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {vaccines.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.code} — {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Número de dosis</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              value={form.dose_number}
              onChange={(e) =>
                setForm({ ...form, dose_number: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Fecha aplicada</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
              value={form.date_administered}
              onChange={(e) =>
                setForm({ ...form, date_administered: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Centro</label>
            <input
              className="w-full px-3 py-2 border rounded-md"
              value={form.center}
              onChange={(e) => setForm({ ...form, center: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Lote</label>
            <input
              className="w-full px-3 py-2 border rounded-md"
              value={form.lot}
              onChange={(e) => setForm({ ...form, lot: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-[#0d2c53] text-white rounded-md"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
