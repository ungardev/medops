// src/pages/PatientPortal/PatientSearch.tsx
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { 
 MagnifyingGlassIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  ArrowRightIcon, 
  HeartIcon,
  XMarkIcon,
  Bars3Icon
} from "@heroicons/react/24/outline";
import { patientClient, Doctor, ServiceSearchResult, DoctorService } from "@/api/patient/client";
import { ServicePurchaseFlow } from "@/components/Doctor/ServicePurchaseFlow";
import { ServiceDetail } from "@/components/Common/ServiceDetail";
import PageHeader from "@/components/Common/PageHeader";

export default function PatientSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [doctorsResults, setDoctorsResults] = useState<Doctor[]>([]);
  const [servicesResults, setServicesResults] = useState<ServiceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedService, setSelectedService] = useState<DoctorService | null>(null);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  
  const currentPatientId = localStorage.getItem('patient_id') ? Number(localStorage.getItem('patient_id')) : null;
  
  const [filterType, setFilterType] = useState<"all" | "doctors" | "services">("all");
  
  useEffect(() => {
    const queryParam = searchParams.get("query");
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [searchParams]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setDoctorsResults([]);
      setServicesResults([]);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const [doctorsRes, servicesRes] = await Promise.all([
        filterType !== "services" ? patientClient.searchDoctors(searchQuery).catch(() => ({ data: { results: [] } })) : Promise.resolve({ data: { results: [] } }),
        filterType !== "doctors" ? patientClient.searchServices(searchQuery).catch(() => ({ data: { results: [] } })) : Promise.resolve({ data: { results: [] } })
      ]);
      setDoctorsResults(doctorsRes.data.results || []);
      setServicesResults(servicesRes.data.results || []);
    } catch (err) {
      console.error("Search error:", err);
      setError("Error al realizar la búsqueda");
    } finally {
      setIsSearching(false);
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);
  
  const filteredDoctors = useMemo(() => doctorsResults, [doctorsResults]);
  const filteredServices = useMemo(() => servicesResults, [servicesResults]);
  
  const handleSelectService = (service: ServiceSearchResult) => {
    const compatibleService: DoctorService = {
      ...service,
      doctor_name: service.doctor?.full_name || '',
      doctor: service.doctor?.id || 0,
      institution: service.institution || 0,
      category: service.category || 0,
      category_name: service.category_name || '',
      is_visible_global: true,
      requires_appointment: true,
      booking_lead_time: 24,
      cancellation_window: 24,
      description: service.description || '',
    };
    setSelectedService(compatibleService);
    setShowServiceDetail(true);
  };
  
  return (
    <div className="space-y-4">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Búsqueda", active: true }
        ]}
      />
      
      <div className="relative mb-5">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400/50" />
        <input
          type="text"
          placeholder="Buscar doctores, servicios o instituciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/10 border border-white/15 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white/90 placeholder:text-white/30 focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Horizontal Filter Chips */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filterType === "all" 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80'
          }`}
        >
          Todos ({filteredDoctors.length + filteredServices.length})
        </button>
        <button
          onClick={() => setFilterType("doctors")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filterType === "doctors" 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80'
          }`}
        >
          Doctores ({filteredDoctors.length})
        </button>
        <button
          onClick={() => setFilterType("services")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            filterType === "services" 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80'
          }`}
        >
          Servicios ({filteredServices.length})
        </button>
      </div>
        
        <div>
          {isSearching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-400/60 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {(filterType === "all" || filterType === "doctors") && filteredDoctors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/50 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <UserIcon className="w-4 h-4 text-emerald-400/60" /> Doctores Encontrados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDoctors.map((doctor) => (
                      <Link 
                        key={doctor.id} 
                        to={`/patient/doctor/${doctor.id}`}
                        className="group bg-white/10 border border-white/15 rounded-xl p-5 hover:bg-white/15 hover:border-emerald-500/30 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center shrink-0">
                              <UserIcon className="w-7 h-7 text-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="text-base font-semibold text-white/90 truncate group-hover:text-emerald-400 transition-colors">
                                  {doctor.full_name}
                                </h4>
                                {doctor.is_verified && (
                                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md text-xs font-medium shrink-0">
                                    VERIFICADO
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-blue-400/70 uppercase truncate mb-2 flex items-center gap-1.5">
                                <HeartIcon className="w-3.5 h-3.5" />
                                {doctor.specialties?.map((s: any) => s.name).join(", ")}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-white/40 truncate">
                                <BuildingOfficeIcon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {doctor.institutions?.map((i: any) => i.name).join(", ")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Ver <ArrowRightIcon className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {(filterType === "all" || filterType === "services") && filteredServices.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/50 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Bars3Icon className="w-4 h-4 text-emerald-400/60" /> Servicios Encontrados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredServices.map((service, index) => (
                      <div 
                        key={service.id + index} 
                        className="group bg-white/10 border border-white/15 rounded-xl p-5 hover:bg-white/15 hover:border-emerald-500/30 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer"
                        onClick={() => handleSelectService(service)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-medium">
                            {service.code || 'SRV'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-white/40">
                            <ClockIcon className="w-3.5 h-3.5" />
                            {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white/90 mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                          {service.name || 'Servicio sin nombre'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                          <UserIcon className="w-4 h-4 text-white/30" />
                          <span>Dr. {service.doctor?.full_name || 'Médico no especificado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                          <BuildingOfficeIcon className="w-4 h-4 text-white/30" />
                          <span>{service.institution_name || 'Institución no especificada'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <span className="text-xs text-white/30 font-mono">
                            {service.code}
                          </span>
                          <span className="text-emerald-400 font-bold text-base">
                            $ {service.price_usd ? service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(filteredDoctors.length === 0 && filteredServices.length === 0 && !isSearching) && (
                <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-dashed border-white/10 rounded-xl">
                  <div className="bg-white/5 p-5 rounded-full mb-4">
                    <MagnifyingGlassIcon className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-white/60 font-semibold text-lg mb-2">No se encontraron resultados</h3>
                  <p className="text-white/30 text-sm text-center max-w-sm mb-5">
                    Intenta con otros términos de búsqueda o revisa la ortografía.
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {showServiceDetail && selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <ServiceDetail
              service={selectedService}
              onClose={() => {
                setShowServiceDetail(false);
                setSelectedService(null);
              }}
              onBuy={() => {
                setShowServiceDetail(false);
              }}
            />
          </div>
        </div>
      )}
      {!showServiceDetail && selectedService && currentPatientId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ServicePurchaseFlow
              service={selectedService}
              patientId={currentPatientId}
              onSuccess={() => {
                setSelectedService(null);
              }}
              onCancel={() => setSelectedService(null)}
            />
          </div>
        </div>
      )}
      {!showServiceDetail && selectedService && !currentPatientId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1b] border border-white/20 rounded-xl p-8 text-center max-w-md">
            <p className="text-red-400 text-sm mb-4">Error: No se pudo identificar al paciente.</p>
            <p className="text-white/30 text-xs mb-4">Por favor, inicia sesión nuevamente.</p>
            <button
              onClick={() => setSelectedService(null)}
              className="px-4 py-2.5 bg-white/5 text-white/60 text-sm font-medium rounded-lg hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}