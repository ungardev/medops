import React, { useState, useEffect } from "react";
import { Patient, PatientInput } from "types/patients";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";

async function fetchOptions(endpoint: string, params?: Record<string, any>) {
  const query = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  const res = await fetch(endpoint + query);
  const data = await res.json();
  // ⚡ Blindaje: extraer results si existe, siempre devolver array
  const items = Array.isArray(data.results) ? data.results : data;
  return Array.isArray(items) ? items : [];
}

interface DemographicsSectionProps {
  patient: Patient;
  onRefresh: () => void;
}

export default function DemographicsSection({
  patient,
  onRefresh,
}: DemographicsSectionProps) {
  const [editing, setEditing] = useState(false);

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
    neighborhood_id: patient.neighborhood?.id ?? undefined, // ⚡ añadido
  });

  const updatePatient = useUpdatePatient(patient.id);

  const setField = <K extends keyof PatientInput>(
    field: K,
    value: PatientInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updatePatient.mutate(form as PatientInput, {
      onSuccess: () => {
        setEditing(false);
        onRefresh();
      },
      onError: (err) => console.error("Error al actualizar:", err),
    });
  };

  // --- Estados para selects jerárquicos ---
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [parishes, setParishes] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);

  useEffect(() => {
    fetchOptions("/api/countries/").then(setCountries);
  }, []);

  useEffect(() => {
    if (form.country_id) {
      fetchOptions("/api/states/", { country: form.country_id }).then(setStates);
    } else {
      setStates([]);
    }
  }, [form.country_id]);

  useEffect(() => {
    if (form.state_id) {
      fetchOptions("/api/municipalities/", { state: form.state_id }).then(setMunicipalities);
    } else {
      setMunicipalities([]);
    }
  }, [form.state_id]);

  useEffect(() => {
    if (form.municipality_id) {
      fetchOptions("/api/parishes/", { municipality: form.municipality_id }).then(setParishes);
    } else {
      setParishes([]);
    }
  }, [form.municipality_id]);

  useEffect(() => {
    if (form.parish_id) {
      fetchOptions("/api/neighborhoods/", { parish: form.parish_id }).then(setNeighborhoods);
    } else {
      setNeighborhoods([]);
    }
  }, [form.parish_id]);
    return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Datos Personales
        </h3>

        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0d2c53] text-white rounded-md text-sm"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-md"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm rounded-md"
          >
            Editar
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Field label="Cédula" value={form.national_id ?? ""} editing={editing} onChange={(v: string) => setField("national_id", v)} />
        <Field label="Nombre" value={form.first_name ?? ""} editing={editing} onChange={(v: string) => setField("first_name", v)} />
        <Field label="Segundo nombre" value={form.middle_name ?? ""} editing={editing} onChange={(v: string) => setField("middle_name", v)} />
        <Field label="Apellido" value={form.last_name ?? ""} editing={editing} onChange={(v: string) => setField("last_name", v)} />
        <Field label="Segundo apellido" value={form.second_last_name ?? ""} editing={editing} onChange={(v: string) => setField("second_last_name", v)} />
        <Field label="Fecha de nacimiento" type="date" value={form.birthdate ?? ""} editing={editing} onChange={(v: string) => setField("birthdate", v)} />
        <Field label="Lugar de nacimiento" value={form.birth_place ?? ""} editing={editing} onChange={(v: string) => setField("birth_place", v)} />
        <Field label="País de nacimiento" value={form.birth_country ?? ""} editing={editing} onChange={(v: string) => setField("birth_country", v)} />
        <Field label="Email" value={form.email ?? ""} editing={editing} onChange={(v: string) => setField("email", v)} />
        <Field label="Teléfono" value={form.contact_info ?? ""} editing={editing} onChange={(v: string) => setField("contact_info", v)} />
        <Field label="Dirección" value={form.address ?? ""} editing={editing} multiline span={12} onChange={(v: string) => setField("address", v)} />

        {/* --- Selects jerárquicos de Dirección --- */}
        {editing ? (
          <>
            <SelectField label="País" options={countries} value={form.country_id ?? ""} onChange={(v) => setField("country_id", Number(v))} />
            <SelectField label="Estado" options={states} value={form.state_id ?? ""} onChange={(v) => setField("state_id", Number(v))} />
            <SelectField label="Municipio" options={municipalities} value={form.municipality_id ?? ""} onChange={(v) => setField("municipality_id", Number(v))} />
            <SelectField label="Parroquia" options={parishes} value={form.parish_id ?? ""} onChange={(v) => setField("parish_id", Number(v))} />
            <SelectField label="Barrio" options={neighborhoods} value={form.neighborhood_id ?? ""} onChange={(v) => setField("neighborhood_id", Number(v))} />
          </>
        ) : (
          <p className="col-span-12 text-sm text-[#0d2c53] dark:text-gray-100">
            Dirección: {patient.address_chain?.country}, {patient.address_chain?.state}, {patient.address_chain?.municipality}, {patient.address_chain?.parish}, {patient.address_chain?.neighborhood}
          </p>
        )}
      </div>
    </div>
  );
}

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
    span === 12
      ? "col-span-12"
      : span === 6
      ? "col-span-6"
      : span === 4
      ? "col-span-4"
      : "col-span-3";

  return (
    <div className={colClass}>
      <label className="block text-xs font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
        {label}
      </label>

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
        <p className="text-sm text-[#0d2c53] dark:text-gray-100">
          {value !== "" ? value : "—"}
        </p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  options: any[];
  value: string | number;
  onChange: (value: string) => void;
}

function SelectField({ label, options, value, onChange }: SelectFieldProps) {
  const safeOptions = Array.isArray(options) ? options : [];
  return (
    <div className="col-span-6">
      <label className="block text-xs font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
        {label}
      </label>
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
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}
