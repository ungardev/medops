import React, { useState, useEffect } from "react";
import { Patient, PatientInput } from "types/patients";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";

// Normaliza arrays pero preserva relaciones anidadas
function normalizeOptions(raw: any[]): any[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => ({
    ...x,
    id: Number(x.id),
    name: String(x.name),
  }));
}

async function fetchOptions(endpoint: string) {
  console.log("[CLIENT] Fetch →", endpoint);
  try {
    const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
    const data = await res.json();
    const arr = Array.isArray(data?.results) ? data.results : data;
    const normalized = normalizeOptions(arr);
    console.log("[CLIENT] Options:", normalized.length, normalized.slice(0, 3));
    return normalized;
  } catch (e) {
    console.error("[CLIENT] Error:", e);
    return [];
  }
}

interface AddressChainLocal {
  country: string;
  country_id: number | null;
  state: string;
  state_id: number | null;
  municipality: string;
  municipality_id: number | null;
  parish: string;
  parish_id: number | null;
  neighborhood: string;
  neighborhood_id: number | null;
}

const EMPTY_CHAIN: AddressChainLocal = {
  country: "", country_id: null,
  state: "", state_id: null,
  municipality: "", municipality_id: null,
  parish: "", parish_id: null,
  neighborhood: "", neighborhood_id: null,
};

interface DemographicsSectionProps {
  patient: Patient;
  onRefresh: () => void;
}

export default function DemographicsSection({ patient, onRefresh }: DemographicsSectionProps) {
  const [editing, setEditing] = useState(false);
  const chain: AddressChainLocal = (patient.address_chain as AddressChainLocal) ?? EMPTY_CHAIN;

  const [form, setForm] = useState<Partial<PatientInput>>({
    national_id: patient.national_id ?? undefined,
    first_name: patient.first_name ?? "",
    middle_name: patient.middle_name ?? undefined,
    last_name: patient.last_name ?? "",
    second_last_name: patient.second_last_name ?? undefined,
    birthdate: patient.birthdate ?? null,
    birth_place: patient.birth_place ?? undefined,
    birth_country: patient.birth_country ?? undefined,
    gender: patient.gender ?? undefined,
    email: patient.email ?? undefined,
    contact_info: patient.contact_info ?? undefined,
    address: patient.address ?? undefined,
    country_id: chain.country_id ?? undefined,
    state_id: chain.state_id ?? undefined,
    municipality_id: chain.municipality_id ?? undefined,
    parish_id: chain.parish_id ?? undefined,
    neighborhood_id: chain.neighborhood_id ?? undefined,
  });

  // ⚡ Campo libre solo en frontend
  const [neighborhoodName, setNeighborhoodName] = useState(chain.neighborhood ?? "");

  const updatePatient = useUpdatePatient(patient.id);

  const setField = (field: keyof PatientInput, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      let neighborhoodId = form.neighborhood_id;

      // Si el usuario escribió un barrio nuevo y no hay ID
      if (neighborhoodName && !neighborhoodId) {
        const res = await fetch("/api/neighborhoods/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: neighborhoodName,
            parish: form.parish_id, // ⚡ asociamos a la parroquia seleccionada
          }),
        });
        const data = await res.json();
        neighborhoodId = data.id;
      }

      updatePatient.mutate(
        { ...form, neighborhood_id: neighborhoodId } as PatientInput,
        {
          onSuccess: () => {
            setEditing(false);
            onRefresh();
          },
          onError: (err) => console.error("Error al actualizar:", err),
        }
      );
    } catch (err) {
      console.error("Error creando barrio:", err);
    }
  };

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [parishes, setParishes] = useState<any[]>([]);

  useEffect(() => { fetchOptions("/api/countries/").then(setCountries); }, []);

  useEffect(() => {
    console.log("[DEBUG] country_id:", form.country_id);
    if (form.country_id) {
      fetchOptions(`/api/states/?country=${form.country_id}`).then(setStates);
    } else setStates([]);
  }, [form.country_id]);

  useEffect(() => {
    console.log("[DEBUG] state_id:", form.state_id);
    if (form.state_id) {
      fetchOptions(`/api/municipalities/?state=${form.state_id}`).then(setMunicipalities);
    } else setMunicipalities([]);
  }, [form.state_id]);

  useEffect(() => {
    console.log("[DEBUG] municipality_id:", form.municipality_id);
    if (form.municipality_id) {
      fetchOptions(`/api/parishes/?municipality=${form.municipality_id}`).then(setParishes);
    } else setParishes([]);
  }, [form.municipality_id]);

    return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">Datos Personales</h3>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-[#0d2c53] text-white rounded-md text-sm">Guardar</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-md">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-md">Editar</button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Field label="Cédula" value={form.national_id ?? ""} editing={editing} onChange={(v) => setField("national_id", v)} />
        <Field label="Nombre" value={form.first_name ?? ""} editing={editing} onChange={(v) => setField("first_name", v)} />
        <Field label="Segundo nombre" value={form.middle_name ?? ""} editing={editing} onChange={(v) => setField("middle_name", v)} />
        <Field label="Apellido" value={form.last_name ?? ""} editing={editing} onChange={(v) => setField("last_name", v)} />
        <Field label="Segundo apellido" value={form.second_last_name ?? ""} editing={editing} onChange={(v) => setField("second_last_name", v)} />
        <Field label="Fecha de nacimiento" type="date" value={form.birthdate ?? ""} editing={editing} onChange={(v) => setField("birthdate", v)} />
        <Field label="Lugar de nacimiento" value={form.birth_place ?? ""} editing={editing} onChange={(v) => setField("birth_place", v)} />
        <Field label="País de nacimiento" value={form.birth_country ?? ""} editing={editing} onChange={(v) => setField("birth_country", v)} />
        <Field label="Email" value={form.email ?? ""} editing={editing} onChange={(v) => setField("email", v)} />
        <Field label="Teléfono" value={form.contact_info ?? ""} editing={editing} onChange={(v) => setField("contact_info", v)} />
        <Field label="Dirección" value={form.address ?? ""} editing={editing} multiline span={12} onChange={(v) => setField("address", v)} />

        {editing ? (
          <>
            <SelectField label="País" options={countries} value={form.country_id ?? ""} onChange={(v) => setField("country_id", Number(v))} />
            <SelectField label="Estado" options={states} value={form.state_id ?? ""} onChange={(v) => setField("state_id", Number(v))} />
            <SelectField label="Municipio" options={municipalities} value={form.municipality_id ?? ""} onChange={(v) => setField("municipality_id", Number(v))} />
            <SelectField label="Parroquia" options={parishes} value={form.parish_id ?? ""} onChange={(v) => setField("parish_id", Number(v))} />
            {/* Barrio como campo libre */}
            <div className="col-span-6">
              <label className="block text-xs font-medium text-[#0d2c53] dark:text-gray-300 mb-1">Barrio</label>
              <input
                type="text"
                value={neighborhoodName}
                onChange={(e) => setNeighborhoodName(e.target.value)}
                placeholder="Escriba o busque barrio..."
                className="w-full px-3 py-2 border rounded-md text-sm
                           bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                           border-gray-300 dark:border-gray-600
                           focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              />
            </div>
          </>
        ) : (
          <p className="col-span-12 text-sm text-[#0d2c53] dark:text-gray-100">
            Dirección: {chain.country}, {chain.state}, {chain.municipality}, {chain.parish}, {chain.neighborhood}
          </p>
        )}
      </div>
    </div>
  );
}

// ⚡ Componentes auxiliares

interface FieldProps {
  label: string;
  value: string;
  type?: "text" | "date" | "email" | "number";
  multiline?: boolean;
  span?: 3 | 4 | 6 | 12;
  editing: boolean;
  onChange: (value: string) => void;
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
  const colClass =
    span === 12 ? "col-span-12" :
    span === 6 ? "col-span-6" :
    span === 4 ? "col-span-4" :
    "col-span-3";

  return (
    <div className={colClass}>
      <label className="block text-xs font-medium text-[#0d2c53] dark:text-gray-300 mb-1">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       border-gray-300 dark:border-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       border-gray-300 dark:border-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        )
      ) : (
        <p className="text-sm text-[#0d2c53] dark:text-gray-100">{value !== "" ? value : "—"}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  options: { id: number; name: string }[];
  value: string | number;
  onChange: (value: string) => void;
}

function SelectField({ label, options, value, onChange }: SelectFieldProps) {
  const safeOptions = Array.isArray(options) ? options : [];
  return (
    <div className="col-span-6">
      <label className="block text-xs font-medium text-[#0d2c53] dark:text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md text-sm
                   bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                   border-gray-300 dark:border-gray-600
                   focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
      >
        <option value="">Seleccione...</option>
        {safeOptions.map((opt) => (
          <option key={`${label}-${opt.id}`} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
      {/* Subtexto eliminado */}
    </div>
  );
}
