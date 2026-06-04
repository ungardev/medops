// src/pages/Doctor/DoctorDashboard.tsx
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { queryClient } from "@/lib/reactQuery";
import { DashboardFiltersProvider } from "@/context/DashboardFiltersContext";
import ActiveInstitutionCard from "@/components/Dashboard/ActiveInstitutionCard";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { getInstitutionLogoUrl } from "@/utils/institutionLogo";
import type { InstitutionSettings } from "@/types/config";
export default function DoctorDashboard() {
  const { tokens } = useAuth();
  const token = tokens.access;
  
  const { 
    institutions, 
    activeInstitution, 
    setActiveInstitution,
    isLoading: isLoadingInstitutions,
    isSettingActive
  } = useInstitutions();
  
  useEffect(() => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: ["notifications", token] });
    }
  }, [token]);
  
  if (isLoadingInstitutions) {
    return (
      <DashboardFiltersProvider>
        <div className="max-w-[1600px] mx-auto p-5 lg:p-6 space-y-6">
          <div className="animate-pulse space-y-5">
            <div className="h-36 bg-white/5 rounded-xl"></div>
            <div className="h-28 bg-white/5 rounded-xl"></div>
          </div>
        </div>
      </DashboardFiltersProvider>
    );
  }
  
  if (!activeInstitution && institutions.length === 0) {
    return (
      <DashboardFiltersProvider>
        <div className="max-w-[1600px] mx-auto p-5 lg:p-6 space-y-6">
          <div className="bg-white/5 border border-white/15 p-10 rounded-xl text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No tienes instituciones configuradas</h3>
              <p className="text-white/50 mb-8">Configura tu primera institución para comenzar a usar MEDOPZ</p>
              <button 
                onClick={() => window.location.href = "/settings/config"}
                className="px-8 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 font-medium rounded-xl transition-colors"
              >
                Configurar Institución
              </button>
            </div>
          </div>
        </div>
      </DashboardFiltersProvider>
    );
  }
  
  if (!activeInstitution && institutions.length > 0) {
    return (
      <DashboardFiltersProvider>
        <div className="max-w-[1600px] mx-auto p-5 lg:p-6 space-y-6">
          <div className="bg-white/5 border border-white/15 p-10 rounded-xl text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Selecciona una institución activa</h3>
              <p className="text-white/50 mb-8">Tienes {institutions.length} institución(es) disponible(s). Selecciona cuál quieres usar:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
                {institutions.map((institution: InstitutionSettings) => (
                  <div 
                    key={institution.id}
                    className="bg-white/5 border border-white/15 rounded-xl p-6 hover:border-white/25 transition-all cursor-pointer"
                    onClick={() => institution.id && setActiveInstitution(institution.id)}
                  >
                    <div className="flex items-center gap-4 mb-5">
                      {institution.logo ? (
                        <img src={getInstitutionLogoUrl(institution.logo)} alt={institution.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="font-medium text-white">{institution.name}</h4>
                        <p className="text-sm text-white/50">{institution.tax_id}</p>
                      </div>
                    </div>
                    <button className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg transition-colors border border-emerald-500/20">
                      Establecer como Activa
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-sm text-white/40">
                {isSettingActive && (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    Estableciendo institución activa...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardFiltersProvider>
    );
  }
  
  return (
    <DashboardFiltersProvider>
      <div className="max-w-[1600px] mx-auto p-5 lg:p-6 space-y-6">
        <section className="animate-in slide-in-from-bottom-1 duration-500">
          <ActiveInstitutionCard />
        </section>
      </div>
    </DashboardFiltersProvider>
  );
}