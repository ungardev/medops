// src/components/Patients/sections/ClinicalBackgroundModal.tsx
import React, { useState, useEffect } from "react";

type BackgroundType = "personal" | "family" | "genetic" | "allergy" | "habit";

interface ClinicalBackgroundForm {
  type: BackgroundType;
  condition?: string;
  relation?: string; // usado en el formulario
  relative?: string; // ✅ agregado para compatibilidad con datos entrantes del backend
  status?: "active" | "resolved" | "suspected" | "positive" | "negative";
  source?: string;
  notes?: string;
  personalType?: string;
  name?: string;
  severity?: string;
  description?: string;
  date?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: ClinicalBackgroundForm;
  type: BackgroundType;
}

const typeLabels: Record<BackgroundType, string> = {
  personal: "Antecedente personal",
  family: "Antecedente familiar",
  genetic: "Predisposición genética",
  allergy: "Alergia",
  habit: "Hábito",
};

const personalHistoryChoices = [
  { value: "patologico", label: "Patológico" },
  { value: "no_patologico", label: "No patológico" },
  { value: "quirurgico", label: "Quirúrgico" },
  { value: "traumatico", label: "Traumático" },
  { value: "alergico", label: "Alérgico" },
  { value: "toxico", label: "Tóxico" },
  { value: "gineco_obstetrico", label: "Gineco-obstétrico" },
];

const habitTypes = [
  { value: "tabaco", label: "Tabaco" },
  { value: "alcohol", label: "Alcohol" },
  { value: "actividad_fisica", label: "Actividad física" },
  { value: "dieta", label: "Dieta" },
  { value: "sueno", label: "Sueño" },
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
    relation: "",
    status: "active",
    source: "",
    notes: "",
    personalType: "patologico",
    name: "",
    severity: "",
    description: "",
    date: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        type,
        condition: initial?.condition ?? "",
        // ✅ acepta tanto relation (frontend) como relative (backend) sin romper TS
        relation: initial?.relation ?? initial?.relative ?? "",
        status: initial?.status ?? "active",
        source: initial?.source ?? "",
        notes: initial?.notes ?? "",
        personalType: initial?.personalType ?? "patologico",
        name: initial?.name ?? "",
        severity: initial?.severity ?? "",
        description: initial?.description ?? "",
        date: initial?.date ?? "",
      });
    }
  }, [open, initial, type]);

  if (!open) return null;

  const setField = (field: keyof ClinicalBackgroundForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    let payload: any = {};

    if (type === "personal") {
      payload.type = form.personalType;
      payload.description = form.condition;
      payload.date = form.date || new Date().toISOString().slice(0, 10);
      if (form.notes) payload.notes = form.notes;
    } else if (type === "family") {
      payload.condition = form.condition;
      payload.relative = form.relation; // ✅ clave correcta para el backend
      if (form.notes) payload.notes = form.notes;
    } else if (type === "genetic") {
      payload.name = form.condition;
      payload.description = form.notes || "";
    } else if (type === "allergy") {
      payload.name = form.name;
      payload.severity = form.severity;
      payload.source = form.source;
      if (form.notes) payload.notes = form.notes;
    } else if (type === "habit") {
      payload.type = form.condition;
      payload.description = form.description;
    }

    onSave(payload);
  };
    return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-6 border-b pb-2">
          {initial ? `Editar ${typeLabels[type]}` : `Registrar ${typeLabels[type]}`}
        </h3>

        <div className="space-y-4">
          {type === "personal" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de antecedente</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.personalType}
                  onChange={(e) => setField("personalType", e.target.value)}
                >
                  {personalHistoryChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>{choice.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Condición</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </>
          )}

          {type === "family" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Condición</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Relación</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.relation}
                  onChange={(e) => setField("relation", e.target.value)}
                  placeholder="Padre, Madre, Abuelo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </>
          )}

          {type === "genetic" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </>
          )}

          {type === "allergy" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Severidad</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.severity}
                  onChange={(e) => setField("severity", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuente</label>
                <input
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.source}
                  onChange={(e) => setField("source", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </>
          )}

          {type === "habit" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de hábito</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                >
                  {habitTypes.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 border-t pt-4">
          <button
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-[#0d2c53] hover:bg-[#0b2342] text-white rounded-md text-sm"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
