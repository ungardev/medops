// src/pages/PatientPortal/PatientSearch.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { Search, User, Building2, Loader2, Filter, Clock, DollarSign, ArrowRight, Stethoscope } from "lucide-react";
import { patientClient, Doctor, ServiceSearchResult, DoctorService } from "@/api/patient/client";
import { ServicePurchaseFlow } from "@/components/Doctor/ServicePurchaseFlow";
export default function PatientSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"doctors" | "services">("doctors");
  const [results, setResults] = useState<Doctor[] | ServiceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para el modal de compra de servicios
  const [selectedService, setSelectedService] = useState<DoctorService | null>(null);
  // Placeholder para patientId (debería obtenerse del contexto de autenticación)
  const currentPatientId = 1;
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      if (searchType === "doctors") {
        const response = await patientClient.searchDoctors(searchQuery);
        setResults(response.data.results || []);
      } else {
        const response = await patientClient.searchServices(searchQuery);
        setResults(response.data.results || []);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Error al realizar la búsqueda");
    } finally {
      setIsSearching(false);
    }
  };
  // Búsqueda automática al escribir (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "BUSCAR", active: true }
        ]}
        stats={[
          { label: "RESULTADOS", value: results.length.toString(), color: "text-white" },
          { label: "TIPO", value: searchType === "doctors" ? "Doctores" : "Servicios", color: "text-blue-400" },
        ]}
      />
      
      {/* Search Box */}
      <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setSearchType("doctors"); setResults([]); }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
                searchType === "doctors" 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              Doctores
            </button>
            <button
              onClick={() => { setSearchType("services"); setResults([]); }}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
                searchType === "services" 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              Servicios
            </button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchType === "doctors" ? "Buscar doctor, especialidad..." : "Buscar servicio..."}
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
              {isSearching ? "..." : "Buscar"}
            </button>
          </div>
        </div>
      </div>
      {/* Results */}
      <div className="space-y-3">
        {/* SECCIÓN DOCTORES */}
        {searchType === "doctors" && (results as Doctor[]).map((doctor) => (
          <Link 
            key={doctor.id} 
            to={`/patient/doctor/${doctor.id}`}
            className="block bg-[#0a0a0b] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                {/* Avatar con color distintivo (Azul) */}
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold truncate">{doctor.full_name}</h3>
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
                <p className="text-[9px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">
                  {doctor.license}
                </p>
                <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                  Ver Perfil <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
        {/* SECCIÓN SERVICIOS */}
        {searchType === "services" && (results as ServiceSearchResult[]).map((service, index) => (
          <div 
            key={service.id + index} 
            className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors cursor-pointer"
            onClick={() => setSelectedService(service as any)} // Cast a DoctorService para el modal
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <span className="text-blue-400 text-[10px] font-black">
                    {service.name ? service.name.substring(0, 3).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold">{service.name}</p>
                  <p className="text-[10px] text-white/40 mt-1">
                    {service.doctor_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-white/30">
                    <Clock className="w-3 h-3" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-mono text-sm flex items-center justify-end gap-1">
                  <DollarSign className="w-3 h-3" />
                  {service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[9px] text-white/30 mt-1">
                  Usos: {service.times_used}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Mensajes de Estado */}
      {results.length === 0 && searchQuery && !isSearching && (
        <div className="text-center py-12 opacity-30">
          <p className="text-[11px] font-mono uppercase tracking-widest">No_Se_Encontraron_Resultados</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-[10px]">
          {error}
        </div>
      )}
      {/* Modal de Compra de Servicio */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="w-full max-w-md">
            <ServicePurchaseFlow
              service={selectedService}
              patientId={currentPatientId}
              onSuccess={() => {
                setSelectedService(null);
                // Opcional: Redirigir a órdenes de cobro o mostrar toast
              }}
              onCancel={() => setSelectedService(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}