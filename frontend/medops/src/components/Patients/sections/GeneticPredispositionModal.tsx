// src/components/Patients/sections/GeneticPredispositionModal.tsx
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    predisposition: number; // id del catálogo
    notes?: string;
  }) => void;
  catalog: { id: number; name: string }[]; // catálogo institucional
  initial?: {
    predisposition?: number;
    notes?: string;
  };
}

export default function GeneticPredispositionModal({
  open,
  onClose,
  onSave,
  catalog,
  initial,
}: Props) {
  const [form, setForm] = useState({
    predisposition: initial?.predisposition ?? 0,
    notes: initial?.notes ?? "",
  });

  if (!open) return null;

  const setField = (field: keyof typeof form, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.predisposition) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black/40">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
            {initial ? "Editar predisposición genética" : "Nueva predisposición genética"}
          </Dialog.Title>

          <div className="space-y-4 text-sm">
            {/* Selección de predisposición */}
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Predisposición
              </label>
              <select
                value={form.predisposition}
                onChange={(e) => setField("predisposition", Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 
                           text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              >
                <option value={0}>— Seleccionar —</option>
                {catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Notas
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 
                           text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm"
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
