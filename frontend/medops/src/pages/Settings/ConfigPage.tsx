// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";

import { InstitutionCard } from "@/components/Settings/InstitutionCard";
import { InstitutionFormModal } from "@/components/Settings/InstitutionFormModal";
import SpecialtyComboboxElegante from "@/components/Consultation/SpecialtyComboboxElegante";

import type { Specialty } from "@/types/consultation"; 
import { 
  FingerPrintIcon,
  ShieldCheckIcon,
  KeyIcon,
  CommandLineIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

export default function ConfigPage() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // ✅ CORRECCIÓN: Usamos 'updateInstitution' que es el nombre real en tu hook
  const { data: inst, updateInstitution, isLoading: instLoading } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading } = useDoctorConfig();
  const { data: specialties = [] } = useSpecialtyChoices();

  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const [docForm, setDocForm] = useState<any>({
    full_name: "", gender: "M", colegiado_id: "", specialties: [], license: "", email: "", phone: "", signature: null,
  });

  useEffect(() => {
    if (!doc || specialties.length === 0 || initialized) return;
    const ids = Array.isArray(doc.specialty_ids) ? doc.specialty_ids.map(Number) : [];
    const matched = specialties.filter((s) => ids.includes(s.id));
    
    setDocForm({
      ...doc,
      specialties: matched,
    });
    
    if (doc.signature) setSignaturePreview(String(doc.signature));
    setInitialized(true);
  }, [doc, specialties, initialized]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSignaturePreview(URL.createObjectURL(file));
      setDocForm({ ...docForm, signature: file });
    }
  };

  const memoizedLogoUrl = useMemo(() => {
    if (!inst?.logo) return null;
    if (inst.logo instanceof File) return URL.createObjectURL(inst.logo);
    return String(inst.logo); // Tu hook ya normaliza la URL con API_BASE
  }, [inst?.logo]);

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-10 bg-black min-h-screen">
      <PageHeader
        breadcrumbs={[{ label: "MEDOPZ", path: "/" }, { label: "CONFIGURATION", active: true }]}
        stats={[
          { label: "CORE_STATUS", value: inst?.is_active ? "OPERATIONAL" : "OFFLINE", color: inst?.is_active ? "text-emerald-500" : "text-red-500" },
          { label: "AUDIT_ENGINE", value: "SHA-256_ACTIVE", color: "text-blue-400" }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 ml-1 border-l-2 border-white/10 px-2">Organization_Identity</h3>
          
          {instLoading ? (
            <div className="h-48 bg-white/5 animate-pulse" />
          ) : (
            <InstitutionCard 
              name={inst?.name || "UNNAMED_ENTITY"}
              taxId={inst?.tax_id || ""}
              logoUrl={memoizedLogoUrl}
              address={inst?.address || "STREET_DATA_MISSING"}
              // ✅ CORRECCIÓN: Aseguramos string para evitar el error de neighborhoodName
              neighborhoodName={typeof inst?.neighborhood === 'object' ? (inst.neighborhood as any)?.name || "N/A" : "N/A"}
              isActive={inst?.is_active ?? false}
              onEdit={() => setIsInstModalOpen(true)}
            />
          )}

          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
             <CpuChipIcon className="w-4 h-4 text-emerald-500/40" />
             <p className="text-[9px] font-mono text-emerald-500/60 uppercase">
               Los cambios institucionales afectan la integridad legal de los reportes generados.
             </p>
          </div>
        </section>

        {/* --- Sección Doctor (Simplificada para brevedad) --- */}
        <section className="space-y-4">
           {/* ... (Mismo formulario de doctor del mensaje anterior) ... */}
           {/* Asegúrate de usar updateDoctor(payload) al final */}
        </section>
      </div>

      <InstitutionFormModal 
        open={isInstModalOpen} 
        onClose={() => setIsInstModalOpen(false)} 
        initialData={inst}
        onSave={async (formData) => {
          // ✅ Usamos 'updateInstitution' que viene del hook
          await updateInstitution(formData as any);
          setIsInstModalOpen(false);
        }}
      />
    </div>
  );
}

function hashlib_mock(str: string) {
    return Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(16).toUpperCase().padEnd(32, '0');
}
