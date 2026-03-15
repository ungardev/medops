// src/pages/PatientPortal/PatientSearch.tsx
import { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { Search, User, Building2, Loader2, Filter, Clock, DollarSign } from "lucide-react";
import { patientClient, Doctor, ServiceSearchResult } from "@/api/patient/client";
export default function PatientSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"doctors" | "services">("doctors");
  const [results, setResults] = useState<Doctor[] | ServiceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      if (searchType === "doctors") {
        const response = await patientClient.searchDoctors(searchQuery);
        setResults(response.data.results || []);
      } else {
        // ✅ FIX: Ahora searchServices retorna ServiceSearchResponse (ServiceSearchResult actualizado)
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
        {searchType === "doctors" && (results as Doctor[]).map((doctor) => (
          <div key={doctor.id} className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <User className="w-6 h-6 text-white/40" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{doctor.full_name}</h3>
                    {doctor.is_verified && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">✓</span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/40 uppercase mt-1">
                    {doctor.specialties?.map((s: any) => s.name).join(", ")}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-white/30">
                    <Building2 className="w-3 h-3" />
                    <span>{doctor.institutions?.map((i: any) => i.name).join(", ")}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/40 font-mono">{doctor.license}</p>
              </div>
            </div>
          </div>
        ))}
        {searchType === "services" && (results as ServiceSearchResult[]).map((service, index) => (
          <div key={service.id + index} className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors">
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
    </div>
  );
}