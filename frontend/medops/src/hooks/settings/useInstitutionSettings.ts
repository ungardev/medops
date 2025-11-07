// src/hooks/settings/useInstitutionSettings.ts
import { useState, useEffect } from "react";
import axios from "axios";

export interface InstitutionSettings {
  name: string;
  address: string;
  phone: string;
  tax_id: string;
  logo: string;
}

export function useInstitutionSettings() {
  const [settings, setSettings] = useState<InstitutionSettings>({
    name: "",
    address: "",
    phone: "",
    tax_id: "",
    logo: "",
  });
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    axios.get<InstitutionSettings>("/api/config/institution/").then((res) => {
      setSettings(res.data);
      setPreview(res.data.logo);
    });
  }, []);

  const updateSettings = async (newSettings: InstitutionSettings) => {
    const res = await axios.put<InstitutionSettings>(
      "/api/config/institution/",
      newSettings
    );
    setSettings(res.data);
    setPreview(res.data.logo);
  };

  const handleLogoChange = (file: File) => {
    setPreview(URL.createObjectURL(file));
    // En producción: enviar como multipart/form-data
  };

  return {
    settings,
    setSettings,
    preview,
    setPreview,
    updateSettings,
    handleLogoChange,
  };
}
