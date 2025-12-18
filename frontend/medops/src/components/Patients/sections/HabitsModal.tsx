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
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <input
              className="w-full px-3 py-2 border rounded-md"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
