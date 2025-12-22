import React, { useState } from "react";
import { Dialog } from "@headlessui/react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    condition: string;
    relation: string;
    status: string;
    source?: string;
    notes?: string;
  }) => void;
  initial?: {
    condition?: string;
    relation?: string;
    status?: string;
    source?: string;
    notes?: string;
  };
}

export default function FamilyHistoryModal({
  open,
  onClose,
  onSave,
  initial,
}: Props) {
  const [form, setForm] = useState({
    condition: initial?.condition ?? "",
    relation: initial?.relation ?? "",
    status: initial?.status ?? "activo",
    source: initial?.source ?? "",
    notes: initial?.notes ?? "",
  });

  if (!open) return null;

  const setField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.condition.trim() || !form.relation.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black/40">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
            {initial ? "Editar antecedente familiar" : "Nuevo antecedente familiar"}
          </Dialog.Title>

          <div className="space-y-4 text-sm">
            {/* Condición */}
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Condición
              </label>
              <input
                type="text"
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 
                           text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              />
            </div>

            {/* Parentesco */}
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Parentesco
              </label>
              <select
                value={form.relation}
                onChange={(e) => setField("relation", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 
                           text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              >
                <option value="">—</option>
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="hermano">Hermano/a</option>
                <option value="hijo">Hijo/a</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 
                           text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              >
                <option value="activo">Activo</option>
                <option value="resuelto">Resuelto</option>
                <option value="sospecha">Sospecha</option>
                <option value="positivo">Positivo</option>
                <option value="negativo">Negativo</option>
              </select>
            </div>

            {/* Fuente */}
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">
                Fuente
              </label>
              <select
                value={form.source}
                onChange={(e) => setField("source", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 
                           text-[#0d2c53] dark:text-gray-100 border-gray-300 dark:border-gray-600 
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              >
                <option value="">—</option>
                <option value="historia_clinica">Historia clínica</option>
                <option value="verbal">Verbal</option>
                <option value="prueba_genetica">Prueba genética</option>
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
