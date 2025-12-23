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
  personalType?: string; // nuevo: para mapear el choice de PersonalHistory
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void; // ahora enviamos payload ya mapeado
  initial?: ClinicalBackgroundForm;
  type: BackgroundType;
}

const typeLabels: Record<BackgroundType, string> = {
  personal: "Antecedente personal",
  familiar: "Antecedente familiar",
  genetico: "Predisposición genética",
};

// Choices válidos para PersonalHistory.type
const personalHistoryChoices = [
  { value: "patologico", label: "Patológico" },
  { value: "no_patologico", label: "No patológico" },
  { value: "quirurgico", label: "Quirúrgico" },
  { value: "traumatico", label: "Traumático" },
  { value: "alergico", label: "Alérgico" },
  { value: "toxico", label: "Tóxico" },
  { value: "gineco_obstetrico", label: "Gineco-Obstétrico" },
];

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
    personalType: "patologico",
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
        personalType: initial?.personalType ?? "patologico",
      });
    }
  }, [open, initial, type]);

  if (!open) return null;

  const handleSave = () => {
    if (!form.condition.trim()) return;

    let payload: any = {};

    if (type === "personal") {
      payload.type = form.personalType; // choice válido
      payload.description = form.condition;
      if (form.notes) payload.notes = form.notes;
      payload.date = new Date().toISOString().slice(0, 10);
    } else if (type === "familiar") {
      payload.condition = form.condition;
      payload.relative = form.relation;
      if (form.notes) payload.notes = form.notes;
    } else if (type === "genetico") {
      payload.name = form.condition;
      payload.description = form.notes || "";
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          {initial ? `Editar ${typeLabels[type]}` : `Registrar ${typeLabels[type]}`}
        </h3>

        <div className="space-y-4">
          {/* Selector de tipo personal */}
          {type === "personal" && (
            <div>
              <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1 block">
                Tipo de antecedente
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm
                           bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                           border-gray-300 dark:border-gray-600
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
                value={form.personalType}
                onChange={(e) => setForm({ ...form, personalType: e.target.value })}
              >
                {personalHistoryChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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
      </div>
    </div>
  );
}
