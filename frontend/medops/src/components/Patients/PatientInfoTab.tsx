// src/components/Patients/PatientInfoTab.tsx
import React, { useState, useEffect } from "react";
import { PatientTabProps } from "./types";
import { useUpdatePatient } from "../../hooks/patients/useUpdatePatient";
import { PatientInput } from "types/patients";
import { useGeneticPredispositions } from "../../hooks/patients/useGeneticPredispositions";
import CreatableSelect from "react-select/creatable";
import { apiFetch } from "../../api/client";

// Helpers
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

    console.log("Payload enviado:", payload);

    updatePatient.mutate(payload, {
      onSuccess: () => setEditing(false),
      onError: (err) => console.error("Error al actualizar:", err),
    });
  };

  // Crear predisposición nueva en backend
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
    <div>
      {/* Header */}
      <div className="flex-between mb-16">
        <h3 className="title-20">Información del Paciente</h3>
        {editing ? (
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={handleSave}>Guardar</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        ) : (
          <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>Editar</button>
        )}
      </div>

      {/* Campos */}
      <div className="grid-2col gap-16">
        {editing ? (
          <>
            <div className="field"><label>Cédula</label>
              <input className="input" value={normStr(form.national_id as string)} onChange={(e) => setField("national_id", e.target.value)} />
            </div>
            <div className="field"><label>Nombre</label>
              <input className="input" value={normStr(form.first_name as string)} onChange={(e) => setField("first_name", e.target.value)} />
            </div>
            <div className="field"><label>Segundo nombre</label>
              <input className="input" value={normStr(form.middle_name as string)} onChange={(e) => setField("middle_name", e.target.value)} />
            </div>
            <div className="field"><label>Apellido</label>
              <input className="input" value={normStr(form.last_name as string)} onChange={(e) => setField("last_name", e.target.value)} />
            </div>
            <div className="field"><label>Segundo apellido</label>
              <input className="input" value={normStr(form.second_last_name as string)} onChange={(e) => setField("second_last_name", e.target.value)} />
            </div>
            <div className="field"><label>Fecha de nacimiento</label>
              <input className="input" type="date" value={normStr(form.birthdate as string)} onChange={(e) => setField("birthdate", e.target.value)} />
            </div>
            <div className="field"><label>Género</label>
              <select className="select" value={form.gender ?? ""} onChange={(e) => setField("gender", e.target.value as GenderUnion)}>
                <option value="">—</option><option value="M">Masculino</option><option value="F">Femenino</option><option value="Unknown">Desconocido</option>
              </select>
            </div>
            <div className="field"><label>Email</label>
              <input className="input" type="email" value={normStr(form.email as string)} onChange={(e) => setField("email", e.target.value)} />
            </div>
            <div className="field"><label>Teléfono / Contacto</label>
              <input className="input" value={normStr(form.contact_info as string)} onChange={(e) => setField("contact_info", e.target.value)} />
            </div>
            <div className="field"><label>Dirección</label>
              <input className="input" value={normStr(form.address as string)} onChange={(e) => setField("address", e.target.value)} />
            </div>
            <div className="field"><label>Altura (cm)</label>
              <input className="input" type="number" step="0.01" value={form.height !== undefined ? String(form.height) : ""} onChange={(e) => setField("height", e.target.value === "" ? undefined : safeNumber(e.target.value))} />
            </div>
            <div className="field"><label>Peso (kg)</label>
              <input className="input" type="number" step="0.01" value={form.weight !== undefined ? String(form.weight) : ""} onChange={(e) => setField("weight", e.target.value === "" ? undefined : safeNumber(e.target.value))} />
            </div>
            <div className="field"><label>Grupo sanguíneo</label>
              <select className="select" value={form.blood_type ?? ""} onChange={(e) => setField("blood_type", e.target.value as BloodUnion)}>
                <option value="">—</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="field field--full"><label>Alergias</label>
              <input className="input" value={normStr(form.allergies as string)} onChange={(e) => setField("allergies", e.target.value)} />
            </div>
            <div className="field field--full"><label>Historial médico</label>
              <textarea className="textarea" rows={4} value={normStr(form.medical_history as string)} onChange={(e) => setField("medical_history", e.target.value)} />
            </div>
            <div className="field field--full"><label>Predisposiciones genéticas</label>
              {isLoading ? (
                <p>Cargando opciones...</p>
              ) : (
                <CreatableSelect
                  classNamePrefix="react-select"   // 👈 añadido
                  isMulti
                  options={predisposiciones?.map(p => ({ value: p.id, label: p.name })) ?? []}
                  value={form.genetic_predispositions?.map(id => {
                    const found = predisposiciones?.find(p => p.id === id);
                    return found ? { value: found.id, label: found.name } : null;
                  }).filter(Boolean)}
                  onChange={(selected) => {
                    const ids = (selected ?? [])
                      .filter((opt): opt is { value: number; label: string } => opt !== null)
                      .map(opt => opt.value);
                    setField("genetic_predispositions", ids);
                  }}
                  onCreateOption={handleCreatePredisposition}
                  placeholder="Escribe o selecciona predisposiciones..."
                />
              )}
            </div>
          </>
                ) : (
          <>
            <div className="field">
              <label>Cédula</label>
              <p>{patient.national_id || "—"}</p>
            </div>

            <div className="field field--full">
              <label>Nombre</label>
              <p>
                {patient.first_name} {patient.middle_name || ""}{" "}
                {patient.last_name} {patient.second_last_name || ""}
              </p>
            </div>

            <div className="field">
              <label>Fecha de nacimiento</label>
              <p>{patient.birthdate || "—"}</p>
            </div>

            <div className="field">
              <label>Género</label>
              <p>{patient.gender || "—"}</p>
            </div>

            <div className="field">
              <label>Email</label>
              <p>{patient.email || "—"}</p>
            </div>

            <div className="field">
              <label>Teléfono / Contacto</label>
              <p>{patient.contact_info || "—"}</p>
            </div>

            <div className="field field--full">
              <label>Dirección</label>
              <p>{patient.address || "—"}</p>
            </div>

            <div className="field">
              <label>Altura</label>
              <p>{patient.height ? `${patient.height} cm` : "—"}</p>
            </div>

            <div className="field">
              <label>Peso</label>
              <p>{patient.weight ? `${patient.weight} kg` : "—"}</p>
            </div>

            <div className="field">
              <label>Grupo sanguíneo</label>
              <p>{patient.blood_type || "—"}</p>
            </div>

            <div className="field field--full">
              <label>Alergias</label>
              <p>{patient.allergies || "—"}</p>
            </div>

            <div className="field field--full">
              <label>Historial médico</label>
              <p>{patient.medical_history || "—"}</p>
            </div>

            <div className="field field--full">
              <label>Predisposiciones genéticas</label>
              <p>
                {patient.genetic_predispositions?.length
                  ? patient.genetic_predispositions.map((p: any) => p.name).join(", ")
                  : "—"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Metadatos */}
      <div className="mt-16">
        <p>
          <strong>Activo:</strong> {patient.active ? "Sí" : "No"}
        </p>
        <p>
          <strong>Creado:</strong> {patient.created_at || "—"}
        </p>
        <p>
          <strong>Actualizado:</strong> {patient.updated_at || "—"}
        </p>
      </div>
    </div>
  );
}
