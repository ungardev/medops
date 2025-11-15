import React, { useState, useEffect } from "react";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { InstitutionSettings, DoctorConfig } from "@/types/config";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";

type SpecialtyChoice = { id: number; code: string; name: string };

// Estado local explícito para el formulario del médico (incluye specialties como string[])
type DoctorForm = {
  id?: number;
  full_name?: string;
  colegiado_id?: string;
  specialties: string[];         // solo para UI del <select multiple>
  license?: string;
  email?: string;
  phone?: string;
  signature?: string | File;     // string (URL) o File al subir
};

export default function ConfigPage() {
  const { data: inst, updateInstitution, isLoading: instLoading, handleLogoChange } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading, handleSignatureChange } = useDoctorConfig();
  const { data: specialties, isLoading: loadingSpecs } = useSpecialtyChoices();

  // Estado local para formularios
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

  // Estados de edición
  const [editingInstitution, setEditingInstitution] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);

  // Sincronizar estado local cuando cambian los datos del backend (Institución)
  useEffect(() => {
    if (inst) setInstForm(inst);
  }, [inst]);

  // Sincronizar estado local cuando cambian los datos del backend (Doctor)
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

  // Previews de logo y firma
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

  // Utilidad: obtener nombres de especialidades desde IDs
  const getSpecialtyNames = (ids?: string[]) => {
    if (!ids || !Array.isArray(ids)) return [];
    if (!specialties || !Array.isArray(specialties)) return [];
    return ids
      .map((id) => {
        const match = (specialties as SpecialtyChoice[]).find((s) => String(s.id) === String(id));
        return match?.name;
      })
      .filter(Boolean) as string[];
  };

    return (
    <main className="config-page">
      <h2>Configuración</h2>

      {/* Configuración Institucional */}
      <section className="config-section">
        <h3>Institución</h3>
        {instLoading && <p>Cargando configuración institucional...</p>}
        {instForm && (
          <>
            {!editingInstitution ? (
              <div className="config-view">
                <p><strong>Nombre:</strong> {instForm.name}</p>
                <p><strong>Dirección:</strong> {instForm.address}</p>
                <p><strong>Teléfono:</strong> {instForm.phone}</p>
                <p><strong>RIF/NIT:</strong> {instForm.tax_id}</p>
                <div className="logo-preview">
                  {instForm.logo && typeof instForm.logo === "string" && instForm.logo.trim() !== "" ? (
                    <img src={`http://127.0.0.1${instForm.logo}`} alt="Logo institucional" />
                  ) : (
                    <span className="placeholder">Sin logo cargado</span>
                  )}
                </div>
                <button className="btn btn-outline" onClick={() => setEditingInstitution(true)}>
                  Editar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateInstitution(instForm).then(() => setEditingInstitution(false));
                }}
                className="config-form"
              >
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    value={instForm.name || ""}
                    onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={instForm.address || ""}
                    onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={instForm.phone || ""}
                    onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>RIF / NIT</label>
                  <input
                    type="text"
                    value={instForm.tax_id || ""}
                    onChange={(e) => setInstForm({ ...instForm, tax_id: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Logo</label>
                  <input type="file" onChange={handleLogoChangeInput} />
                  {logoPreview && (
                    <div className="logo-preview">
                      <img src={logoPreview} alt="Logo preview" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Guardar</button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingInstitution(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      {/* Configuración Médico Operador */}
      <section className="config-section">
        <h3>Médico Operador</h3>
        {docLoading && <p>Cargando configuración del médico...</p>}
        {docForm && (
          <>
            {!editingDoctor ? (
              <div className="config-view">
                <p><strong>Nombre completo:</strong> {docForm.full_name}</p>
                <p><strong>Número de colegiado:</strong> {docForm.colegiado_id}</p>
                <p><strong>Especialidades:</strong> {getSpecialtyNames(docForm.specialties)?.join(", ") || "No especificadas"}</p>
                <p><strong>Licencia:</strong> {docForm.license}</p>
                <p><strong>Email:</strong> {docForm.email}</p>
                <p><strong>Teléfono:</strong> {docForm.phone}</p>
                <div className="signature-preview">
                  {docForm.signature && typeof docForm.signature === "string" && docForm.signature.trim() !== "" ? (
                    <img src={`http://127.0.0.1${docForm.signature}`} alt="Firma digital" />
                  ) : (
                    <span className="placeholder">Sin firma cargada</span>
                  )}
                </div>
                <button className="btn btn-outline" onClick={() => setEditingDoctor(true)}>
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
                className="config-form"
              >
                <div className="form-group">
                  <label>Nombre completo</label>
                  <input
                    type="text"
                    value={docForm.full_name || ""}
                    onChange={(e) => setDocForm({ ...docForm, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Número de colegiado</label>
                  <input
                    type="text"
                    value={docForm.colegiado_id || ""}
                    onChange={(e) => setDocForm({ ...docForm, colegiado_id: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Especialidades</label>
                  {loadingSpecs ? (
                    <p>Cargando especialidades...</p>
                  ) : Array.isArray(specialties) ? (
                    <select
                      multiple
                      value={docForm.specialties || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                        setDocForm({ ...docForm, specialties: selected });
                      }}
                      className="select"
                    >
                      {(specialties as SpecialtyChoice[]).map((spec) => (
                        <option key={spec.id} value={String(spec.id)}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>No hay especialidades disponibles.</p>
                  )}
                </div>
                <div className="form-group">
                  <label>Licencia / Registro sanitario</label>
                  <input
                    type="text"
                    value={docForm.license || ""}
                    onChange={(e) => setDocForm({ ...docForm, license: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Correo profesional</label>
                  <input
                    type="email"
                    value={docForm.email || ""}
                    onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={docForm.phone || ""}
                    onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Firma digital</label>
                  <input type="file" onChange={handleSignatureUpload} />
                  {signaturePreview && (
                    <div className="signature-preview">
                      <img src={signaturePreview} alt="Firma preview" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Guardar</button>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingDoctor(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
