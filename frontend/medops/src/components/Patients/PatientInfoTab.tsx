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
import CollapsibleSection from "../../components/Common/CollapsibleSection";
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
        console.error("Error al recargar perfil clínico:", err);
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
        <div className="flex items-center gap-4 border-b border-white/15 pb-4">
          <div className="w-12 h-12 bg-white/5 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-48 bg-white/5 rounded" />
            <div className="h-2 w-32 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!loading && !profile) {
    return (
      <div className="py-8 border border-red-500/20 bg-red-500/5 flex flex-col items-center text-center rounded-lg">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mb-4" />
        <h3 className="text-[11px] font-semibold text-red-400">
          Error al cargar datos
        </h3>
        <p className="text-[10px] text-red-400/70 mt-1">No se pudo cargar el perfil del paciente. La aplicación sigue funcionando.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      
      <CollapsibleSection
        title="Información Personal"
        icon={<UserCircleIcon className="w-5 h-5" />}
        color="emerald-400"
        defaultExpanded={true}
      >
        <DemographicsSection 
          patient={profile} 
          onRefresh={refreshProfile} 
          readOnly={readOnly}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title="Alertas y Riesgos"
        icon={<ShieldCheckIcon className="w-5 h-5" />}
        color="red-400"
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
      
      <CollapsibleSection
        title="Historial Clínico"
        icon={<CpuChipIcon className="w-5 h-5" />}
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
      
      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[9px] text-emerald-400">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Sincronizado
          </span>
          <span className="text-[9px] text-white/40">
            Última actualización: {new Date().toLocaleString("es-VE")}
          </span>
        </div>
        
        {readOnly && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/40">Solo lectura</span>
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
        )}
      </div>
    </div>
  );
}