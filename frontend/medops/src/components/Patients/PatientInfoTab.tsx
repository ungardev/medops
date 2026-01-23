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
export default function PatientInfoTab({ patientId }: { patientId: number }) {
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
  
  // ✅ FIX: Separar estados de carga para evitar bloqueo
  if (loading && !profile) {
    // Skeleton simplificado sin padding extra
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
  
  // ✅ FIX: Estado de error separado del estado de carga
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
    /* ✨ CORRECCIÓN: 
       Eliminamos p-4, sm:p-6 y bg-black/20.
       Ahora el componente confía en el padding del contenedor padre (Tabs.tsx).
     */
    <div className="space-y-12">
      
      {/* SECCIÓN 1: DEMOGRÁFICOS - COMENTADA PARA DIAGNÓSTICO */}
      {/* 
      {(() => {
        try {
          console.log('🔍 Rendering DemographicsSection'); // 🔍 DIAGNOSTIC LOG
          return (
            <section className="relative">
              <div className="absolute -left-4 top-0 h-full w-0.5 bg-[var(--palantir-active)]/30 hidden lg:block" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-[var(--palantir-active)]/10 rounded-sm">
                  <UserCircleIcon className="w-4 h-4 text-[var(--palantir-active)]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
                  Subject_Identity_Core
                </span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--palantir-border)] to-transparent" />
              </div>
              
              <DemographicsSection patient={profile} onRefresh={refreshProfile} />
            </section>
          );
        } catch (error) {
          console.error('❌ Error in DemographicsSection:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return <div>Error in DemographicsSection: {errorMessage}</div>;
        }
      })()}
      */}
      
      {/* SECCIÓN 2: ALERTAS Y BIOMETRÍA */}
      {(() => {
        try {
          console.log('🔍 Rendering AlertsSection'); // 🔍 DIAGNOSTIC LOG
          return (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-red-500/10 rounded-sm">
                  <ShieldCheckIcon className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                  Critical_Risk_Assessment
                </span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-red-900/30 to-transparent" />
              </div>
              
              <AlertsSection
                patient={profile}
                backgrounds={profile.clinical_background ?? []}
                allergies={profile.allergies ?? []}
                habits={profile.habits ?? []}
                surgeries={profile.surgeries ?? []}
                vaccinations={Array.isArray(vaccQuery.data) ? vaccQuery.data : []}
                vaccinationSchedule={Array.isArray(schedule.data) ? schedule.data : []}
              />
            </section>
          );
        } catch (error) {
          console.error('❌ Error in AlertsSection:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return <div>Error in AlertsSection: {errorMessage}</div>;
        }
      })()}
      
      {/* SECCIÓN 3: PERFIL CLÍNICO */}
      {(() => {
        try {
          console.log('🔍 Rendering ClinicalProfileSection'); // 🔍 DIAGNOSTIC LOG
          return (
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-1.5 bg-blue-500/10 rounded-sm">
                  <CpuChipIcon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                  Historical_Clinical_Database
                </span>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-blue-900/30 to-transparent" />
              </div>
              
              <ClinicalProfileSection
                backgrounds={profile.clinical_background ?? []}
                allergies={profile.allergies ?? []}
                habits={profile.habits ?? []}
                patientId={patientId}
                onRefresh={refreshProfile}
              />
            </section>
          );
        } catch (error) {
          console.error('❌ Error in ClinicalProfileSection:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return <div>Error in ClinicalProfileSection: {errorMessage}</div>;
        }
      })()}
      
      {/* FOOTER DE ESTADO */}
      {(() => {
        try {
          console.log('🔍 Rendering Footer'); // 🔍 DIAGNOSTIC LOG
          return (
            <div className="pt-6 border-t border-[var(--palantir-border)] flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[8px] font-mono text-[var(--palantir-active)] uppercase">
                  <div className="w-1 h-1 bg-[var(--palantir-active)] rounded-full animate-pulse" />
                  Sync_Active
                </span>
                <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
                  ID: {patientId.toString().padStart(6, '0')}
                </span>
              </div>
              <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
                Last_Audit: {new Date().toLocaleTimeString()}
              </span>
            </div>
          );
        } catch (error) {
          console.error('❌ Error in Footer:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return <div>Error in Footer: {errorMessage}</div>;
        }
      })()}
    </div>
  );
}