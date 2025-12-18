import React, { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: any;
}

export default function HabitsModal({
  open,
  onClose,
  onSave,
  initial,
}: Props) {
  const [form, setForm] = useState({
    type: initial?.type ?? "",
    description: initial?.description ?? "",
  });

  if (!open) return null;

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          {initial ? "Editar hábito" : "Registrar hábito"}
        </h3>

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Tipo
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Descripción
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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 rounded-md text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 bg-[#0d2c53] text-white rounded-md text-sm"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
