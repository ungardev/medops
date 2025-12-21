// src/components/Patients/sections/ClinicalBackgroundModal.tsx
import React, { useState, useEffect } from "react";

type BackgroundType = "personal" | "familiar" | "genetico";

interface ClinicalBackgroundForm {
  type: BackgroundType;
  condition: string;
  relation?: "padre" | "madre" | "hermano" | "hijo";
  status: "activo" | "resuelto" | "sospecha" | "positivo" | "negativo";
  source?: "historia_clinica" | "prueba_genetica" | "verbal";
  notes?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: ClinicalBackgroundForm) => void;
  initial?: ClinicalBackgroundForm;
  type: BackgroundType;
}

const typeLabels: Record<BackgroundType, string> = {
  personal: "Antecedente personal",
  familiar: "Antecedente familiar",
  genetico: "Predisposición genética",
};

export default function ClinicalBackgroundModal({
  open,
  onClose,
  onSave,
  initial,
  type,
}: Props) {
  const [form, setForm] = useState<ClinicalBackgroundForm>({
    type,
    condition: "",
    relation: undefined,
    status: "activo",
    source: undefined,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        type,
        condition: initial?.condition ?? "",
        relation: initial?.relation,
        status: initial?.status ?? "activo",
        source: initial?.source,
        notes: initial?.notes ?? "",
      });
    }
  }, [open, initial, type]);

  if (!open) return null;

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          {initial ? `Editar ${typeLabels[type]}` : `Registrar ${typeLabels[type]}`}
        </h3>

        <div className="space-y-4">
          {/* Condición */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Condición
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
            />
          </div>

          {/* Relación (solo familiares) */}
          {type === "familiar" && (
            <div>
              <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
                Relación
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm
                           bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                           border-gray-300 dark:border-gray-600
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
                value={form.relation ?? ""}
                onChange={(e) =>
                  setForm({ ...form, relation: e.target.value as ClinicalBackgroundForm["relation"] })
                }
              >
                <option value="">Seleccione...</option>
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="hermano">Hermano</option>
                <option value="hijo">Hijo</option>
              </select>
            </div>
          )}

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
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ClinicalBackgroundForm["status"] })
              }
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
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Fuente
            </label>
            <select
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              value={form.source ?? ""}
              onChange={(e) =>
                setForm({ ...form, source: e.target.value as ClinicalBackgroundForm["source"] })
              }
            >
              <option value="">Seleccione...</option>
              <option value="historia_clinica">Historia clínica</option>
              <option value="prueba_genetica">Prueba genética</option>
              <option value="verbal">Verbal</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
              Notas
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-md text-sm
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                         border-gray-300 dark:border-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
