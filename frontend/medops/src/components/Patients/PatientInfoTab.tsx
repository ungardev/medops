// src/components/Patients/PatientInfoTab.tsx
import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import { 
  UserCircleIcon, 
  ExclamationTriangleIcon, 
  ShieldCheckIcon,
  CpuChipIcon 
} from "@heroicons/react/24/outline";
import DemographicsSection from "./sections/DemographicsSection";
import AlertsSection from "./sections/AlertsSection";
import ClinicalProfileSection from "./sections/ClinicalProfileSection";
import { useVaccinations } from "../../hooks/patients/useVaccinations";
import CollapsibleSection from "../../components/Common/CollapsibleSection"; // NUEVO: Importar componente colapsable
interface PatientInfoTabProps {
  patientId: number;
  readOnly?: boolean;
}
export default function PatientInfoTab({ patientId, readOnly = false }: PatientInfoTabProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { vaccinations: vaccQuery, schedule } = useVaccinations(patientId);
  
  const refreshProfile = () => {
    setLoading(true);
    apiFetch(`patients/${patientId}/profile/`)
      .then((data) => setProfile(data))
      .catch((err) => {
        console.error("Error reloading clinical profile:", err);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  };
  
  useEffect(() => {
    refreshProfile();
  }, [patientId]);
  
  if (loading && !profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4 border-b border-[var(--palantir-border)] pb-4">
          <div className="w-12 h-12 bg-white/5 rounded-sm" />
          <div className="space-y-2">
            <div className="h-3 w-48 bg-white/5 rounded-sm" />
            <div className="h-2 w-32 bg-white/5 rounded-sm" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!loading && !profile) {
    return (
      <div className="py-8 border border-red-900/30 bg-red-950/5 flex flex-col items-center text-center rounded-sm">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-500 mb-4" />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500">
          DATA_FETCH_ERROR
        </h3>
        <p className="text-[9px] font-mono text-red-400/80">Unable to load profile data. The application is still functional.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-12">
      
      {/* SECCIÓN 1: DEMOGRÁFICOS - Ahora colapsable */}
      <CollapsibleSection
        title="Subject_Identity_Core"
        icon={<UserCircleIcon className="w-4 h-4" />}
        color="var(--palantir-active)"
        defaultExpanded={true}
      >
        <DemographicsSection 
          patient={profile} 
          onRefresh={refreshProfile} 
          readOnly={readOnly}
        />
      </CollapsibleSection>
      
      {/* SECCIÓN 2: ALERTAS - Ahora colapsable */}
      <CollapsibleSection
        title="Critical_Risk_Assessment"
        icon={<ShieldCheckIcon className="w-4 h-4" />}
        color="red-500"
        defaultExpanded={false}
      >
        <AlertsSection
          patient={profile}
          backgrounds={profile.clinical_background ?? []}
          allergies={profile.allergies ?? []}
          habits={profile.habits ?? []}
          surgeries={profile.surgeries ?? []}
          vaccinations={Array.isArray(vaccQuery.data) ? vaccQuery.data : []}
          vaccinationSchedule={Array.isArray(schedule.data) ? schedule.data : []}
          readOnly={readOnly}
        />
      </CollapsibleSection>
      
      {/* SECCIÓN 3: PERFIL CLÍNICO - Ahora colapsable */}
      <CollapsibleSection
        title="Historical_Clinical_Database"
        icon={<CpuChipIcon className="w-4 h-4" />}
        color="blue-400"
        defaultExpanded={false}
      >
        <ClinicalProfileSection
          backgrounds={profile.clinical_background ?? []}
          allergies={profile.allergies ?? []}
          habits={profile.habits ?? []}
          patientId={patientId}
          onRefresh={refreshProfile}
          readOnly={readOnly}
        />
      </CollapsibleSection>
      
      {/* FOOTER DE ESTADO (sin cambios) */}
      <div className="pt-6 border-t border-[var(--palantir-border)] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[8px] font-mono text-[var(--palantir-active)] uppercase">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Sync_Active
          </span>
          <span className="text-[8px] font-mono text-[var(--palantir-muted)]">
            LAST_UPDATE: {new Date().toLocaleString("es-VE")}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
            READ_ONLY_MODE
          </span>
          <div className={`w-2 h-2 rounded-full ${readOnly ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </div>
      </div>
    </div>
  );
}