// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect } from "react";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { InstitutionSettings, DoctorConfig } from "@/types/config";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";
import SpecialtyComboboxElegante from "@/components/Consultation/SpecialtyComboboxElegante";
import type { Specialty } from "@/types/consultation";

type DoctorForm = {
  id?: number;
  full_name: string;
  colegiado_id: string;
  specialties: Specialty[];
  license: string;
  email: string;
  phone: string;
  signature?: string | File | null;
};

export default function ConfigPage() {
  const {
    data: inst,
    updateInstitution,
    isLoading: instLoading,
    handleLogoChange,
  } = useInstitutionSettings();

  const {
    data: doc,
    updateDoctor,
    isLoading: docLoading,
    handleSignatureChange,
  } = useDoctorConfig();

  const { data: specialties = [] } = useSpecialtyChoices();

  const [instForm, setInstForm] = useState<Partial<InstitutionSettings>>(
    inst || {}
  );

  const [docForm, setDocForm] = useState<DoctorForm>({
    id: undefined,
    full_name: "",
    colegiado_id: "",
    specialties: [],
    license: "",
    email: "",
    phone: "",
    signature: null,
  });

  const [editingInstitution, setEditingInstitution] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [initializedDoctor, setInitializedDoctor] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  useEffect(() => {
    if (inst) setInstForm(inst);
  }, [inst]);

  useEffect(() => {
    if (!doc || specialties.length === 0) return;
    if (initializedDoctor) return;

    const ids = Array.isArray((doc as any).specialty_ids)
      ? (doc as any).specialty_ids.map((id: number) => Number(id))
      : [];

    const matched = specialties.filter((s) => ids.includes(s.id));
    const deduped = matched.filter(
      (s, i, self) => self.findIndex((x) => x.id === s.id) === i
    );

    setDocForm({
      id: doc.id,
      full_name: doc.full_name || "",
      colegiado_id: doc.colegiado_id || "",
      specialties: deduped,
      license: doc.license || "",
      email: doc.email || "",
      phone: doc.phone || "",
      signature: doc.signature || null,
    });

    setInitializedDoctor(true);
  }, [doc, specialties, initializedDoctor]);

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

  const getSpecialtyNames = (list?: Specialty[]) =>
    list?.map((s) => s.name) || [];

  return (
    <main className="px-3 py-4 sm:p-6 space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-semibold text-[#0d2c53] dark:text-gray-100">
        Configuración
      </h2>

      {/* Institución */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-3">
          Institución
        </h3>

        {instLoading && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cargando configuración institucional...
          </p>
        )}

        {instForm && (
          <>
            {!editingInstitution ? (
              <div className="space-y-2 text-sm text-[#0d2c53] dark:text-gray-300">
                <p>
                  <strong>Nombre:</strong> {instForm.name}
                </p>
                <p>
                  <strong>Dirección:</strong> {instForm.address}
                </p>
                <p>
                  <strong>Teléfono:</strong> {instForm.phone}
                </p>
                <p>
                  <strong>RIF/NIT:</strong> {instForm.tax_id}
                </p>

                <div className="mt-2">
                  {instForm.logo ? (
                    <img
                      src="/logo-medops-light.svg"
                      className="h-20 rounded border shadow-sm"
                    />
                  ) : (
                    <span className="italic text-gray-500 dark:text-gray-400">
                      Sin logo cargado
                    </span>
                  )}
                </div>

                <button
                  className="btn-secondary mt-3"
                  onClick={() => setEditingInstitution(true)}
                >
                  Editar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateInstitution(instForm).then(() =>
                    setEditingInstitution(false)
                  );
                }}
                className="space-y-4 text-sm text-[#0d2c53] dark:text-gray-200"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    className="input"
                    placeholder="Nombre"
                    value={instForm.name || ""}
                    onChange={(e) =>
                      setInstForm({ ...instForm, name: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    placeholder="Dirección"
                    value={instForm.address || ""}
                    onChange={(e) =>
                      setInstForm({ ...instForm, address: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    placeholder="Teléfono"
                    value={instForm.phone || ""}
                    onChange={(e) =>
                      setInstForm({ ...instForm, phone: e.target.value })
                    }
                  />
                  <input
                    className="input"
                    placeholder="RIF / NIT"
                    value={instForm.tax_id || ""}
                    onChange={(e) =>
                      setInstForm({ ...instForm, tax_id: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Logo institucional
                  </label>
                  <input
                    type="file"
                    onChange={handleLogoChangeInput}
                    className="w-full text-sm"
                  />
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      className="h-20 mt-2 rounded border shadow-sm"
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="submit" className="btn-primary">
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingInstitution(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      {/* Médico Operador */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-3">
          Médico Operador
        </h3>

        {docLoading && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cargando configuración del médico...
          </p>
        )}

        {docForm && !editingDoctor && (
          <div className="space-y-2 text-sm text-[#0d2c53] dark:text-gray-300">
            <p>
              <strong>Nombre completo:</strong> {docForm.full_name}
            </p>
            <p>
              <strong>Número de colegiado:</strong> {docForm.colegiado_id}
            </p>
            <p>
              <strong>Especialidades:</strong>{" "}
              {getSpecialtyNames(docForm.specialties).join(", ") ||
                "No especificadas"}
            </p>
            <p>
              <strong>Licencia:</strong> {docForm.license}
            </p>
            <p>
              <strong>Email:</strong> {docForm.email}
            </p>
            <p>
              <strong>Teléfono:</strong> {docForm.phone}
            </p>

            <div className="mt-2">
              {docForm.signature ? (
                <img
                  src="/logo-icon-light.svg"
                  className="h-20 rounded border shadow-sm"
                />
              ) : (
                <span className="italic text-gray-500 dark:text-gray-400">
                  Sin firma cargada
                </span>
              )}
            </div>

            <button
              className="btn-secondary mt-3"
              onClick={() => setEditingDoctor(true)}
            >
              Editar
            </button>
          </div>
        )}

        {editingDoctor && (
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const dedupedSpecialties = docForm.specialties.filter(
                (s, i, self) => self.findIndex((x) => x.id === s.id) === i
              );

              const payload: Partial<DoctorConfig> = {
                id: docForm.id,
                full_name: docForm.full_name ?? "",
                colegiado_id: docForm.colegiado_id ?? "",
                specialty_ids: Array.from(
                  new Set(dedupedSpecialties.map((s) => s.id))
                ),
                license: docForm.license ?? "",
                email: docForm.email ?? "",
                phone: docForm.phone ?? "",
                signature: docForm.signature,
              };

              updateDoctor(payload).then(() => setEditingDoctor(false));
            }}
            className="space-y-4 text-sm text-[#0d2c53] dark:text-gray-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                className="input"
                placeholder="Nombre completo"
                value={docForm.full_name}
                onChange={(e) =>
                  setDocForm({ ...docForm, full_name: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Número de colegiado"
                value={docForm.colegiado_id}
                onChange={(e) =>
                  setDocForm({ ...docForm, colegiado_id: e.target.value })
                }
              />

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Especialidades
                </label>

                <SpecialtyComboboxElegante
                  value={docForm.specialties}
                  onChange={(next) =>
                    setDocForm({
                      ...docForm,
                      specialties: next,
                    })
                  }
                  options={specialties}
                />
              </div>

              <input
                className="input"
                placeholder="Licencia"
                value={docForm.license}
                onChange={(e) =>
                  setDocForm({ ...docForm, license: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Correo profesional"
                value={docForm.email}
                onChange={(e) =>
                  setDocForm({ ...docForm, email: e.target.value })
                }
              />
              <input
                className="input"
                placeholder="Teléfono"
                value={docForm.phone}
                onChange={(e) =>
                  setDocForm({ ...docForm, phone: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Firma digital
              </label>
              <input
                type="file"
                onChange={handleSignatureUpload}
                className="w-full text-sm"
              />
              {signaturePreview && (
                <img
                  src={signaturePreview}
                  className="h-20 mt-2 rounded border shadow-sm"
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className="btn-primary">
                Guardar
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingDoctor(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
