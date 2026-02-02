// src/pages/Dashboard/index.tsx
import React, { useEffect } from "react";
import MetricsRow from "@/components/Dashboard/MetricsRow";
import TrendsChart from "@/components/Dashboard/TrendsChart";
import NotificationsFeed from "@/components/Dashboard/NotificationsFeed";
import AuditLog from "@/components/Dashboard/AuditLog";
import OperationalHub from "@/components/Dashboard/OperationalHub";
import PageHeader from "@/components/Common/PageHeader"; 
import { useAuthToken } from "@/hooks/useAuthToken";
import { queryClient } from "@/lib/reactQuery";
import { DashboardFiltersProvider } from "@/context/DashboardFiltersContext";
import { DashboardButtonGroup } from "@/components/Dashboard/DashboardButtonGroup";
// ✅ IMPORTACIONES CORRECTAS
import ActiveInstitutionCard from "@/components/Dashboard/ActiveInstitutionCard";
import { useActiveInstitution } from "@/hooks/dashboard/useActiveInstitution";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import type { InstitutionSettings } from "@/types/config";
export default function Dashboard() {
  const { token } = useAuthToken();
  
  // ✅ PASO 1: Obtener TODAS las instituciones del usuario
  const { 
    institutions, 
    activeInstitution, 
    setActiveInstitution,
    isLoading: isLoadingInstitutions,
    isSettingActive
  } = useInstitutions();
  
  // ✅ PASO 2: Solo usar dashboard si hay institución activa
  const { data: activeInstitutionData, isLoading: isLoadingDashboard } = useActiveInstitution();
  
  useEffect(() => {
    if (token) {
      queryClient.invalidateQueries({ queryKey: ["notifications", token] });
    }
  }, [token]);
  
  // ✅ ESTADO 1: Cargando instituciones
  if (isLoadingInstitutions) {
    return (
      <DashboardFiltersProvider>
        <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-6">
          <PageHeader 
            breadcrumbs={[{ label: "MEDOPS", active: true }]}
            actions={<DashboardButtonGroup />}
          />
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-white/5 rounded-lg"></div>
            <div className="h-24 bg-white/5 rounded-lg"></div>
          </div>
        </div>
      </DashboardFiltersProvider>
    );
  }
  
  // ✅ ESTADO 2: No hay instituciones configuradas
  if (!activeInstitution && institutions.length === 0) {
    return (
      <DashboardFiltersProvider>
        <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-6">
          <PageHeader 
            breadcrumbs={[{ label: "MEDOPS", active: true }]}
            actions={<DashboardButtonGroup />}
          />
          <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-lg text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No tienes instituciones configuradas</h3>
              <p className="text-white/60 mb-6">Configura tu primera institución para comenzar a usar MEDOPS</p>
              <button 
                onClick={() => window.location.href = "/settings/config"}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
              >
                Configurar Institución
              </button>
            </div>
          </div>
        </div>
      </DashboardFiltersProvider>
    );
  }
  
  // ✅ ESTADO 3: Hay instituciones pero ninguna está activa
  if (!activeInstitution && institutions.length > 0) {
    return (
      <DashboardFiltersProvider>
        <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-6">
          <PageHeader 
            breadcrumbs={[{ label: "MEDOPS", active: true }]}
            actions={<DashboardButtonGroup />}
          />
          <div className="bg-[#0A0A0A] border border-white/5 p-8 rounded-lg text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Selecciona una institución activa</h3>
              <p className="text-white/60 mb-6">Tienes {institutions.length} institución(es) disponible(s). Selecciona cuál quieres usar:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {institutions.map((institution: InstitutionSettings) => (
                  <div 
                    key={institution.id}
                    className="bg-black/30 border border-white/10 rounded-lg p-4 hover:border-emerald-500/30 transition-all cursor-pointer"
                    onClick={() => institution.id && setActiveInstitution(institution.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {institution.logo && typeof institution.logo === 'string' ? (
                        <img src={institution.logo} alt={institution.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
                          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="font-medium text-white text-sm">{institution.name}</h4>
                        <p className="text-xs text-white/50">{institution.tax_id}</p>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-medium rounded transition-colors">
                      Establecer como Activa
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-xs text-white/40">
                {isSettingActive && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
  
  // ✅ ESTADO 4: Todo listo - Dashboard completo con institución activa
  return (
    <DashboardFiltersProvider>
      <div className="max-w-[1600px] mx-auto px-4 py-2 space-y-6 animate-in fade-in duration-700">
        
        {/* PageHeader LIMPIO */}
        <PageHeader 
          breadcrumbs={[
            { label: "MEDOPS", active: true }
          ]}
          actions={<DashboardButtonGroup />}
        />
        
        {/* INSTITUCIÓN ACTIVA - Solo si hay institución activa */}
        <section className="animate-in slide-in-from-bottom-1 duration-700 delay-50">
          <ActiveInstitutionCard 
            institution={activeInstitutionData?.institution || activeInstitution || null}
            metrics={activeInstitutionData?.metrics}
            isLoading={isLoadingDashboard}
          />
        </section>
        
        {/* MÉTRICAS */}
        <section className="animate-in slide-in-from-bottom-2 duration-700 delay-150">
          <MetricsRow />
        </section>
        
        {/* TRIADA OPERACIONAL */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-3">
            <OperationalHub />
          </div>
          <div className="lg:col-span-6">
            <div className="h-full bg-white/[0.01] border border-white/5 rounded-sm p-1">
               <TrendsChart />
            </div>
          </div>
          <div className="lg:col-span-3">
            <NotificationsFeed />
          </div>
        </section>
        
        {/* LOG DE AUDITORÍA */}
        <section className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Auditoría_Operacional_Live</span>
          </div>
          <AuditLog />
        </section>
      </div>
    </DashboardFiltersProvider>
  );
}