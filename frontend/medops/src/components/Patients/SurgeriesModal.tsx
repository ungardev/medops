// src/components/Patients/SurgeriesModal.tsx
import React, { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: any;
}

export default function SurgeriesModal({
  open,
  onClose,
  onSave,
  initial,
}: Props) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    hospital: initial?.hospital ?? "",
    date: initial?.date ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "programada", // 👈 nuevo campo
    doctor: initial?.doctor ?? "",           // 👈 nuevo campo
  });

  if (!open) return null;

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          {initial ? "Editar cirugía / procedimiento" : "Registrar cirugía / procedimiento"}
        </h3>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Nombre del procedimiento
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Hospital */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Hospital / Centro
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.hospital}
              onChange={(e) => setForm({ ...form, hospital: e.target.value })}
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Fecha
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Estado
            </label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="programada">Programada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Doctor responsable */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Doctor responsable
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Descripción / Notas
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm
                       hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 bg-[#0d2c53] text-white rounded-md text-sm hover:bg-[#0b2444]"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
