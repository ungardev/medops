// src/components/Patients/PatientInfoTab.tsx
import React, { useState, useEffect } from "react";
import { PatientTabProps } from "./types";
import { useUpdatePatient } from "../../hooks/patients/useUpdatePatient";
import { PatientInput } from "types/patients";
import { useGeneticPredispositions } from "../../hooks/patients/useGeneticPredispositions";
import { apiFetch } from "../../api/client";
import ComboboxMultiElegante from "./ComboboxMultiElegante";

const normStr = (v: string | null | undefined): string => v ?? "";
const safeNumber = (v: string | number | null | undefined): number | undefined => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return Number.isNaN(v) ? undefined : v;
  const parsed = Number(v);
  return Number.isNaN(parsed) ? undefined : parsed;
};

type GenderUnion = "M" | "F" | "Unknown" | null | undefined;
type BloodUnion = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;

interface GeneticPredisposition {
  id: number;
  name: string;
  description?: string | null;
}

function spanClass(span: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12): string {
  switch (span) {
    case 1: return "col-span-1";
    case 2: return "col-span-2";
    case 3: return "col-span-3";
    case 4: return "col-span-4";
    case 6: return "col-span-6";
    case 8: return "col-span-8";
    case 9: return "col-span-9";
    case 12: return "col-span-12";
    default: return "col-span-12";
  }
}

interface FieldProps {
  label: string;
  value?: string | null;
  type?: "text" | "date" | "email" | "number";
  multiline?: boolean;
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12;
  editing: boolean;
  onChange?: (v: string) => void;
}

function Field({
  label,
  value,
  type = "text",
  multiline = false,
  span = 3,
  editing,
  onChange,
}: FieldProps) {
  const cls = spanClass(span);
  const display = value && value !== "" ? value : "—";

  return (
    <div className={cls}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea
            rows={4}
            value={normStr(value ?? "")}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        ) : (
          <input
            type={type}
            value={normStr(value ?? "")}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        )
      ) : (
        <p className="text-sm text-gray-800 dark:text-gray-100">{display}</p>
      )}
    </div>
  );
}

interface SelectFieldProps<T = string> {
  label: string;
  value?: T | null;
  options: Array<[T, string]>;
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 9 | 12;
  editing: boolean;
  onChange?: (v: T) => void;
}

function SelectField<T = string>({
  label,
  value,
  options,
  span = 3,
  editing,
  onChange,
}: SelectFieldProps<T>) {
  const cls = spanClass(span);
  const displayLabel =
    options.find(([val]) => val === value)?.[1] ?? "—";

  return (
    <div className={cls}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {editing ? (
        <select
          value={(value as any) ?? ""}
          onChange={(e) => onChange?.((e.target.value as unknown) as T)}
          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">{label === "Género" || label === "Grupo sanguíneo" ? "—" : ""}</option>
          {options.map(([val, lab]) => (
            <option key={String(val)} value={String(val)}>
              {lab}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-gray-800 dark:text-gray-100">{displayLabel}</p>
      )}
    </div>
  );
}
export default function PatientInfoTab({ patient }: PatientTabProps) {
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<Partial<PatientInput>>({
    national_id: patient.national_id ?? "",
    first_name: patient.first_name ?? "",
    middle_name: patient.middle_name ?? "",
    last_name: patient.last_name ?? "",
    second_last_name: patient.second_last_name ?? "",
    birthdate: patient.birthdate ?? "",
    gender: patient.gender,
    email: patient.email ?? "",
    contact_info: patient.contact_info ?? "",
    address: patient.address ?? "",
    weight: safeNumber(patient.weight),
    height: safeNumber(patient.height),
    blood_type: patient.blood_type ?? undefined,
    allergies: patient.allergies ?? "",
    medical_history: patient.medical_history ?? "",
    genetic_predispositions: patient.genetic_predispositions?.map((p: any) => p.id) ?? [],
  });

  const { data: predisposiciones, isLoading, refetch } = useGeneticPredispositions();
  const updatePatient = useUpdatePatient(patient.id);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      genetic_predispositions: patient.genetic_predispositions?.map((p: any) => p.id) ?? [],
    }));
  }, [patient.genetic_predispositions]);

  const setField = <K extends keyof PatientInput>(field: K, value: PatientInput[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const payload: PatientInput = {
      ...form,
      gender: form.gender ?? undefined,
      blood_type: form.blood_type ?? undefined,
    } as PatientInput;

    updatePatient.mutate(payload, {
      onSuccess: () => setEditing(false),
      onError: (err) => console.error("Error al actualizar:", err),
    });
  };

  const handleCreatePredisposition = async (inputValue: string) => {
    const newPred = await apiFetch<GeneticPredisposition>("genetic-predispositions/", {
      method: "POST",
      body: JSON.stringify({ name: inputValue }),
    });
    await refetch();
    setField("genetic_predispositions", [
      ...(form.genetic_predispositions ?? []),
      newPred.id,
    ]);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Información del Paciente</h3>
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              onClick={handleSave}
            >
              Guardar
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                       hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => setEditing(true)}
          >
            Editar
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-x-6 gap-y-4">
        {/* Identificación */}
        <Field label="Cédula" span={3} value={form.national_id as string} editing={editing} onChange={(v) => setField("national_id", v)} />
        <Field label="Nombre" span={3} value={form.first_name as string} editing={editing} onChange={(v) => setField("first_name", v)} />
        <Field label="Segundo nombre" span={3} value={form.middle_name as string} editing={editing} onChange={(v) => setField("middle_name", v)} />
        <Field label="Apellido" span={3} value={form.last_name as string} editing={editing} onChange={(v) => setField("last_name", v)} />
        <Field label="Segundo apellido" span={3} value={form.second_last_name as string} editing={editing} onChange={(v) => setField("second_last_name", v)} />
        <Field label="Fecha de nacimiento" span={3} value={form.birthdate as string} type="date" editing={editing} onChange={(v) => setField("birthdate", v)} />
        <SelectField<GenderUnion>
          label="Género"
          span={3}
          value={form.gender as GenderUnion}
          editing={editing}
          onChange={(v) => setField("gender", v)}
          options={[["M", "Masculino"], ["F", "Femenino"], ["Unknown", "Desconocido"]]}
        />

        {/* Contacto */}
        <Field label="Email" span={6} value={form.email as string} editing={editing} onChange={(v) => setField("email", v)} />
        <Field label="Teléfono" span={6} value={form.contact_info as string} editing={editing} onChange={(v) => setField("contact_info", v)} />
        <Field label="Dirección" span={12} value={form.address as string} editing={editing} onChange={(v) => setField("address", v)} />

        {/* Clínico */}
        <Field
          label="Altura (m)"
          span={3}
          type="number"
          value={form.height !== undefined ? String(form.height) : ""}
          editing={editing}
          onChange={(v) => setField("height", v === "" ? undefined : safeNumber(v))}
        />
        <Field
          label="Peso (kg)"
          span={3}
          type="number"
          value={form.weight !== undefined ? String(form.weight) : ""}
          editing={editing}
          onChange={(v) => setField("weight", v === "" ? undefined : safeNumber(v))}
        />
        <SelectField<BloodUnion>
          label="Grupo sanguíneo"
          span={3}
          value={form.blood_type as BloodUnion}
          editing={editing}
          onChange={(v) => setField("blood_type", v)}
          options={["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bt => [bt as BloodUnion, bt])}
        />
        <Field label="Alergias" span={3} value={form.allergies as string} editing={editing} onChange={(v) => setField("allergies", v)} />
        <Field label="Historial médico" span={12} value={form.medical_history as string} editing={editing} onChange={(v) => setField("medical_history", v)} multiline />

        {/* Predisposiciones genéticas */}
        <div className="col-span-12">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Predisposiciones genéticas
          </label>
          {editing ? (
            isLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando opciones...</p>
            ) : (
              <ComboboxMultiElegante
                options={predisposiciones ?? []}
                value={form.genetic_predispositions ?? []}
                onChange={(ids) => setField("genetic_predispositions", ids)}
                onCreate={handleCreatePredisposition}
                placeholder="Escribe o selecciona predisposiciones..."
              />
            )
          ) : (
            <p className="text-sm text-gray-800 dark:text-gray-100">
              {patient.genetic_predispositions?.length
                ? patient.genetic_predispositions.map((p: any) => p.name).join(", ")
                : "—"}
            </p>
          )}
        </div>
      </div>

      {/* Metadatos */}
      <div className="mt-6 text-sm text-gray-700 dark:text-gray-300">
        <p><strong>Activo:</strong> {patient.active ? "Sí" : "No"}</p>
        <p><strong>Creado:</strong> {patient.created_at || "—"}</p>
        <p><strong>Actualizado:</strong> {patient.updated_at || "—"}</p>
      </div>
    </div>
  );
}
