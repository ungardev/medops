// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect } from "react";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { InstitutionSettings, DoctorConfig } from "@/types/config";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";

type SpecialtyChoice = { id: number; code: string; name: string };

type DoctorForm = {
  id?: number;
  full_name?: string;
  colegiado_id?: string;
  specialties: string[];
  license?: string;
  email?: string;
  phone?: string;
  signature?: string | File;
};

export default function ConfigPage() {
  const { data: inst, updateInstitution, isLoading: instLoading, handleLogoChange } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading, handleSignatureChange } = useDoctorConfig();
  const { data: specialties, isLoading: loadingSpecs } = useSpecialtyChoices();

  const [instForm, setInstForm] = useState<Partial<InstitutionSettings>>(inst || {});
  const [docForm, setDocForm] = useState<DoctorForm>({
    id: doc?.id,
    full_name: doc?.full_name,
    colegiado_id: doc?.colegiado_id,
    specialties: [],
    license: doc?.license,
    email: doc?.email,
    phone: doc?.phone,
    signature: doc?.signature,
  });

  const [editingInstitution, setEditingInstitution] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);

  useEffect(() => {
    if (inst) setInstForm(inst);
  }, [inst]);

  useEffect(() => {
    if (doc) {
      const ids =
        Array.isArray((doc as any).specialty_ids)
          ? (doc as any).specialty_ids.map((id: number) => String(id))
          : Array.isArray((doc as any).specialties)
          ? (doc as any).specialties.map((s: any) => String(s.id))
          : [];
      setDocForm({
        id: doc.id,
        full_name: doc.full_name,
        colegiado_id: doc.colegiado_id,
        specialties: ids,
        license: doc.license,
        email: doc.email,
        phone: doc.phone,
        signature: doc.signature,
      });
    }
  }, [doc]);

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  const handleLogoChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoPreview(handleLogoChange(file));
      setInstForm({ ...instForm, logo: file });
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSignaturePreview(handleSignatureChange(file));
      setDocForm({ ...docForm, signature: file });
    }
  };

  const getSpecialtyNames = (ids?: string[]) => {
    if (!ids || !specialties) return [];
    return ids
      .map((id) => {
        const match = (specialties as SpecialtyChoice[]).find((s) => String(s.id) === String(id));
        return match?.name;
      })
      .filter(Boolean) as string[];
  };

    return (
    <main className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-[#0d2c53] dark:text-gray-100">Configuración</h2>

      {/* Configuración Institucional */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-3">Institución</h3>
        {instLoading && <p className="text-sm text-gray-600 dark:text-gray-400">Cargando configuración institucional...</p>}
        {instForm && (
          <>
            {!editingInstitution ? (
              <div className="space-y-2 text-sm text-[#0d2c53] dark:text-gray-300">
                <p><strong>Nombre:</strong> {instForm.name}</p>
                <p><strong>Dirección:</strong> {instForm.address}</p>
                <p><strong>Teléfono:</strong> {instForm.phone}</p>
                <p><strong>RIF/NIT:</strong> {instForm.tax_id}</p>
                <div className="mt-2">
                  {instForm.logo && typeof instForm.logo === "string" ? (
                    <img src={`http://127.0.0.1${instForm.logo}`} alt="Logo institucional" className="h-20 rounded border shadow-sm" />
                  ) : (
                    <span className="italic text-gray-500 dark:text-gray-400">Sin logo cargado</span>
                  )}
                </div>
                <button
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                             bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                             hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm mt-3"
                  onClick={() => setEditingInstitution(true)}
                >
                  Editar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateInstitution(instForm).then(() => setEditingInstitution(false));
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={instForm.name || ""}
                  onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                  placeholder="Nombre"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <input
                  type="text"
                  value={instForm.address || ""}
                  onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                  placeholder="Dirección"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <input
                  type="text"
                  value={instForm.phone || ""}
                  onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })}
                  placeholder="Teléfono"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <input
                  type="text"
                  value={instForm.tax_id || ""}
                  onChange={(e) => setInstForm({ ...instForm, tax_id: e.target.value })}
                  placeholder="RIF / NIT"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <input type="file" onChange={handleLogoChangeInput} className="w-full text-sm" />
                {logoPreview && <img src={logoPreview} alt="Logo preview" className="h-20 mt-2 rounded border shadow-sm" />}
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 rounded-md bg-[#0d2c53] text-white hover:bg-[#0b2444] transition text-sm">Guardar</button>
                  <button type="button" className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm" onClick={() => setEditingInstitution(false)}>Cancelar</button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

              {/* Configuración Médico Operador */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-3">Médico Operador</h3>
        {docLoading && <p className="text-sm text-gray-600 dark:text-gray-400">Cargando configuración del médico...</p>}
        {docForm && (
          <>
            {!editingDoctor ? (
              <div className="space-y-2 text-sm text-[#0d2c53] dark:text-gray-300">
                <p><strong>Nombre completo:</strong> {docForm.full_name}</p>
                <p><strong>Número de colegiado:</strong> {docForm.colegiado_id}</p>
                <p><strong>Especialidades:</strong> {getSpecialtyNames(docForm.specialties)?.join(", ") || "No especificadas"}</p>
                <p><strong>Licencia:</strong> {docForm.license}</p>
                <p><strong>Email:</strong> {docForm.email}</p>
                <p><strong>Teléfono:</strong> {docForm.phone}</p>
                <div className="mt-2">
                  {docForm.signature && typeof docForm.signature === "string" ? (
                    <img src={`http://127.0.0.1${docForm.signature}`} alt="Firma digital" className="h-20 rounded border shadow-sm" />
                  ) : (
                    <span className="italic text-gray-500 dark:text-gray-400">Sin firma cargada</span>
                  )}
                </div>
                <button
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                             bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                             hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm mt-3"
                  onClick={() => setEditingDoctor(true)}
                >
                  Editar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const payload: Partial<DoctorConfig> = {
                    id: docForm.id,
                    full_name: docForm.full_name,
                    colegiado_id: docForm.colegiado_id,
                    specialty_ids: (docForm.specialties || []).map((id: string) => Number(id)),
                    license: docForm.license,
                    email: docForm.email,
                    phone: docForm.phone,
                    signature: docForm.signature,
                  };
                  updateDoctor(payload).then(() => setEditingDoctor(false));
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  value={docForm.full_name || ""}
                  onChange={(e) => setDocForm({ ...docForm, full_name: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <input
                  type="text"
                  value={docForm.colegiado_id || ""}
                  onChange={(e) => setDocForm({ ...docForm, colegiado_id: e.target.value })}
                  placeholder="Número de colegiado"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <div>
                  <label className="block text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">Especialidades</label>
                  {loadingSpecs ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cargando especialidades...</p>
                  ) : Array.isArray(specialties) ? (
                    <select
                      multiple
                      value={docForm.specialties || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                        setDocForm({ ...docForm, specialties: selected });
                      }}
                      className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53] bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100"
                    >
                      {(specialties as SpecialtyChoice[]).map((spec) => (
                        <option key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No hay especialidades disponibles.</p>
                  )}
                </div>
                <input
                  type="text"
                  value={docForm.license || ""}
                  onChange={(e) => setDocForm({ ...docForm, license: e.target.value })}
                  placeholder="Licencia / Registro sanitario"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <input
                  type="email"
                  value={docForm.email || ""}
                  onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                  placeholder="Correo profesional"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <input
                  type="tel"
                  value={docForm.phone || ""}
                  onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
                  placeholder="Teléfono"
                  className="w-full px-3 py-2 border rounded-md text-sm focus:ring-[#0d2c53]"
                />
                <div>
                  <label className="block text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">Firma digital</label>
                  <input type="file" onChange={handleSignatureUpload} className="w-full text-sm" />
                  {signaturePreview && (
                    <img src={signaturePreview} alt="Firma preview" className="h-20 mt-2 rounded border shadow-sm" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 rounded-md bg-[#0d2c53] text-white hover:bg-[#0b2444] transition text-sm">Guardar</button>
                  <button type="button" className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm" onClick={() => setEditingDoctor(false)}>Cancelar</button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
