// src/pages/PatientPortal/PatientSearch.tsx
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Search, User, Building2, Loader2, Filter, Clock, DollarSign, ArrowRight, 
  Stethoscope, XIcon, ListIcon
} from "lucide-react";
import { patientClient, Doctor, ServiceSearchResult, DoctorService } from "@/api/patient/client";
import { ServicePurchaseFlow } from "@/components/Doctor/ServicePurchaseFlow";
export default function PatientSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [doctorsResults, setDoctorsResults] = useState<Doctor[]>([]);
  const [servicesResults, setServicesResults] = useState<ServiceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modal de compra de servicios
  const [selectedService, setSelectedService] = useState<DoctorService | ServiceSearchResult | null>(null);
  const currentPatientId = localStorage.getItem('patient_id') ? Number(localStorage.getItem('patient_id')) : 1;
  // Filtrado por tipo (Doctores/Servicios/All)
  const [filterType, setFilterType] = useState<"all" | "doctors" | "services">("all");
  // Búsqueda unificada
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setDoctorsResults([]);
      setServicesResults([]);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Búsqueda paralela
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
  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);
  // Resultados filtrados visualmente
  const filteredDoctors = useMemo(() => doctorsResults, [doctorsResults]);
  const filteredServices = useMemo(() => servicesResults, [servicesResults]);
  // Mapeo de ServiceSearchResult a DoctorService para el modal
  const handleSelectService = (service: ServiceSearchResult) => {
    const compatibleService: DoctorService = {
      ...service,
      doctor: service.doctor || 0,
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
  };
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* Barra de Búsqueda Principal (Estilo PatientServices) */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
        <input
          type="text"
          placeholder="Buscar por servicio, doctor o institución..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-sm py-4 pl-12 pr-12 text-sm text-white placeholder-white/50 focus:border-emerald-500/50 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      {/* Filtros y Resultados */}
      <div className="flex gap-6">
        {/* Sidebar de Filtros */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <div className="bg-black/30 border border-white/20 rounded-sm p-3 sticky top-4">
            <p className="text-[11px] font-black text-white/80 uppercase tracking-widest mb-3">
              FILTROS
            </p>
            <div className="space-y-1">
              <button
                onClick={() => setFilterType("all")}
                className={`w-full text-left px-3 py-2 rounded-sm text-[11px] transition-colors flex justify-between items-center ${
                  filterType === "all" 
                    ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="font-medium">Todos los resultados</span>
                <span className="text-[10px] text-white/60">{filteredDoctors.length + filteredServices.length}</span>
              </button>
              
              <button
                onClick={() => setFilterType("doctors")}
                className={`w-full text-left px-3 py-2 rounded-sm text-[11px] transition-colors flex justify-between items-center ${
                  filterType === "doctors" 
                    ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="font-medium">Doctores</span>
                <span className="text-[10px] text-white/60">{filteredDoctors.length}</span>
              </button>
              <button
                onClick={() => setFilterType("services")}
                className={`w-full text-left px-3 py-2 rounded-sm text-[11px] transition-colors flex justify-between items-center ${
                  filterType === "services" 
                    ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="font-medium">Servicios</span>
                <span className="text-[10px] text-white/60">{filteredServices.length}</span>
              </button>
            </div>
          </div>
        </div>
        {/* Grid de Resultados */}
        <div className="flex-1">
          {isSearching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Sección Doctores */}
              {(filterType === "all" || filterType === "doctors") && filteredDoctors.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-black text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Doctores Encontrados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDoctors.map((doctor) => (
                      <Link 
                        key={doctor.id} 
                        to={`/patient/doctor/${doctor.id}`}
                        className="group bg-black/40 border border-white/20 rounded-sm p-4 hover:bg-black/50 hover:border-white/30 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                              <User className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold truncate text-white group-hover:text-emerald-400 transition-colors">
                                  {doctor.full_name}
                                </h4>
                                {doctor.is_verified && (
                                  <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                    VERIFICADO
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-blue-300/80 uppercase truncate mb-1 flex items-center gap-1">
                                <Stethoscope className="w-3 h-3" />
                                {doctor.specialties?.map((s: any) => s.name).join(", ")}
                              </p>
                              <div className="flex items-center gap-1 text-[9px] text-white/40 truncate">
                                <Building2 className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {doctor.institutions?.map((i: any) => i.name).join(", ")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                              Ver Perfil <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {/* Sección Servicios */}
              {(filterType === "all" || filterType === "services") && filteredServices.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-black text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ListIcon className="w-4 h-4" /> Servicios Encontrados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredServices.map((service, index) => (
                      <div 
                        key={service.id + index} 
                        className="group bg-black/40 border border-white/20 rounded-sm p-4 hover:bg-black/50 hover:border-white/30 transition-all cursor-pointer"
                        onClick={() => handleSelectService(service)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                            {service.code || 'SRV'}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-white/70">
                            <Clock className="w-3.5 h-3.5" />
                            {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
                          </span>
                        </div>
                        <h4 className="text-[14px] font-black text-white uppercase tracking-tight mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                          {service.name || 'Servicio sin nombre'}
                        </h4>
                        <div className="flex items-center gap-2 text-[12px] text-white/80 mb-2">
                          <User className="w-4 h-4" />
                          <span>Dr. {service.doctor_name || 'Médico no especificado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-white/70 mb-3">
                          <Building2 className="w-4 h-4" />
                          <span>{service.institution_name || 'Institución no especificada'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <span className="text-[9px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                            {service.code}
                          </span>
                          <span className="text-emerald-400 font-bold text-sm">
                            $ {service.price_usd ? service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Estado Vacío */}
              {(filteredDoctors.length === 0 && filteredServices.length === 0 && !isSearching) && (
                <div className="flex flex-col items-center justify-center py-16 bg-black/30 border border-dashed border-white/20 rounded-sm">
                  <div className="bg-white/10 p-4 rounded-full mb-4">
                    <Search className="w-6 h-6 text-white/50" />
                  </div>
                  <h3 className="text-white font-medium text-lg mb-1">No se encontraron resultados</h3>
                  <p className="text-white/70 text-base text-center max-w-xs mb-4">
                    Intenta con otros términos de búsqueda o revisa la ortografía.
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-500/20 transition-colors"
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Modal de Compra de Servicio */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
    </div>
  );
}