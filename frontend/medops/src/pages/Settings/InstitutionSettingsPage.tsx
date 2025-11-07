// src/pages/Settings/InstitutionSettingsPage.tsx
import React from "react";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";

const InstitutionSettingsPage: React.FC = () => {
  const {
    settings,
    setSettings,
    preview,
    updateSettings,
    handleLogoChange,
  } = useInstitutionSettings();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleLogoChange(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    await updateSettings(settings);
    alert("Configuración actualizada");
  };

  return (
    <div className="settings-page">
      <h2>Configuración Institucional</h2>

      <div className="form-group">
        <label>Nombre</label>
        <input
          name="name"
          value={settings.name}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Dirección</label>
        <input
          name="address"
          value={settings.address}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Teléfono</label>
        <input
          name="phone"
          value={settings.phone}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>RIF / Tax ID</label>
        <input
          name="tax_id"
          value={settings.tax_id}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Logo</label>
        <input type="file" accept="image/*" onChange={handleLogoInput} />
        {preview && (
          <div className="logo-preview">
            <img src={preview} alt="Logo preview" width={120} />
          </div>
        )}
      </div>

      <button onClick={handleSubmit}>Guardar Configuración</button>
    </div>
  );
};

export default InstitutionSettingsPage;
