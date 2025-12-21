import React, { useState } from "react";
import { Dialog } from "@headlessui/react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    severity?: string;
    source?: string;
    notes?: string;
  }) => void;
}

export default function AllergyModal({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: "",
    severity: "",
    source: "",
    notes: "",
  });

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0">
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-30">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
            Registrar alergia
          </Dialog.Title>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Sustancia o alergeno
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Gravedad
              </label>
              <select
                value={form.severity}
                onChange={(e) => setField("severity", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              >
                <option value="">—</option>
                <option value="leve">Leve</option>
                <option value="moderada">Moderada</option>
                <option value="grave">Grave</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Fuente
              </label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
                placeholder="Historia clínica, verbal, prueba..."
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              />
            </div>

            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Notas
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#0d2c53] text-white rounded-md text-sm"
            >
              Guardar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
