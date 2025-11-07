import React, { useState, useEffect } from "react";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";

export default function ConfigPage() {
  const { data: inst, updateInstitution, isLoading: instLoading } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading, handleSignatureChange } = useDoctorConfig();

  // Estado local para formularios
  const [instForm, setInstForm] = useState(inst);
  const [docForm, setDocForm] = useState(doc);

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLogoPreview(URL.createObjectURL(e.target.files[0]));
      // En producción: enviar como multipart/form-data
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSignaturePreview(handleSignatureChange(e.target.files[0]));
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateInstitution(instForm);
            }}
            className="config-form"
          >
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="name"
                value={instForm.name || ""}
                onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                name="address"
                value={instForm.address || ""}
                onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="text"
                name="phone"
                value={instForm.phone || ""}
                onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>RIF / NIT</label>
              <input
                type="text"
                name="tax_id"
                value={instForm.tax_id || ""}
                onChange={(e) => setInstForm({ ...instForm, tax_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Logo</label>
              <input type="file" onChange={handleLogoChange} />
              {logoPreview && (
                <div className="logo-preview">
                  <img src={logoPreview} alt="Logo preview" />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary">Guardar</button>
          </form>
        )}
      </section>

      {/* Configuración Médico Operador */}
      <section className="config-section">
        <h3>Médico Operador</h3>
        {docLoading && <p>Cargando configuración del médico...</p>}
        {docForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateDoctor(docForm);
            }}
            className="config-form"
          >
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                name="fullName"
                value={docForm.fullName || ""}
                onChange={(e) => setDocForm({ ...docForm, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Número de colegiado</label>
              <input
                type="text"
                name="colegiadoId"
                value={docForm.colegiadoId || ""}
                onChange={(e) => setDocForm({ ...docForm, colegiadoId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Especialidad</label>
              <input
                type="text"
                name="specialty"
                value={docForm.specialty || ""}
                onChange={(e) => setDocForm({ ...docForm, specialty: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Licencia / Registro sanitario</label>
              <input
                type="text"
                name="license"
                value={docForm.license || ""}
                onChange={(e) => setDocForm({ ...docForm, license: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Correo profesional</label>
              <input
                type="email"
                name="email"
                value={docForm.email || ""}
                onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="phone"
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

            <button type="submit" className="btn btn-primary">Guardar</button>
          </form>
        )}
      </section>
    </main>
  );
}
