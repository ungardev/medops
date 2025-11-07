import React, { useState, useEffect } from "react";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { InstitutionSettings, DoctorConfig } from "@/types/config";

export default function ConfigPage() {
  const { data: inst, updateInstitution, isLoading: instLoading, handleLogoChange } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading, handleSignatureChange } = useDoctorConfig();

  // Estado local para formularios (Partial para evitar errores de tipado)
  const [instForm, setInstForm] = useState<Partial<InstitutionSettings>>(inst || {});
  const [docForm, setDocForm] = useState<Partial<DoctorConfig>>(doc || {});

  // Estados de edición
  const [editingInstitution, setEditingInstitution] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);

  // Sincronizar estado local cuando cambian los datos del backend
  useEffect(() => {
    if (inst) setInstForm(inst);
  }, [inst]);

  useEffect(() => {
    if (doc) setDocForm(doc);
  }, [doc]);

  // Previews de logo y firma
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  const handleLogoChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoPreview(handleLogoChange(file));
      setInstForm({ ...instForm, logo: file }); // guardar el File en el form
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSignaturePreview(handleSignatureChange(file));
      setDocForm({ ...docForm, signature: file }); // guardar el File en el form
    }
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
                {instForm.logo && typeof instForm.logo === "string" && (
                  <div className="logo-preview">
                    <img src={instForm.logo} alt="Logo institucional" />
                  </div>
                )}
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
                <p><strong>Especialidad:</strong> {docForm.specialty}</p>
                <p><strong>Licencia:</strong> {docForm.license}</p>
                <p><strong>Email:</strong> {docForm.email}</p>
                <p><strong>Teléfono:</strong> {docForm.phone}</p>
                {docForm.signature && typeof docForm.signature === "string" && (
                  <div className="signature-preview">
                    <img src={docForm.signature} alt="Firma digital" />
                  </div>
                )}
                <button className="btn btn-outline" onClick={() => setEditingDoctor(true)}>
                  Editar
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateDoctor(docForm).then(() => setEditingDoctor(false));
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
                  <label>Especialidad</label>
                  <input
                    type="text"
                    value={docForm.specialty || ""}
                    onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
                  />
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