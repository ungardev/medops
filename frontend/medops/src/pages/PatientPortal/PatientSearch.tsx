// src/pages/PatientPortal/PatientSearch.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { Search, User, Calendar, Building2 } from "lucide-react";
interface Doctor {
  id: number;
  full_name: string;
  specialty: string;
  institution_name: string;
  rating: number;
  review_count: number;
  available_today: boolean;
  next_available: string;
}
interface Service {
  id: number;
  name: string;
  description: string;
  institution_name: string;
  price_ves: string;
}
export default function PatientSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"doctors" | "services">("doctors");
  const [results, setResults] = useState<Doctor[] | Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const token = localStorage.getItem("patient_access_token");
      const endpoint = searchType === "doctors" 
        ? `/api/patient-search/doctors/?q=${encodeURIComponent(searchQuery)}`
        : `/api/patient-search/services/?q=${encodeURIComponent(searchQuery)}`;
      
      const res = await fetch(endpoint, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "BUSCAR", active: true }
        ]}
      />
      {/* Search Box */}
      <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
        <div className="flex flex-col gap-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSearchType("doctors")}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
                searchType === "doctors" 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              Doctores
            </button>
            <button
              onClick={() => setSearchType("services")}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
                searchType === "services" 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-white/40 hover:text-white"
              }`}
            >
              Servicios
            </button>
          </div>
          
          {/* Search input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={searchType === "doctors" ? "Buscar doctor, especialidad..." : "Buscar servicio..."}
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/90 disabled:opacity-50"
            >
              {isSearching ? "Buscando..." : "Buscar"}
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
                  <h3 className="text-sm font-bold uppercase">{doctor.full_name}</h3>
                  <p className="text-[10px] text-white/40 uppercase">{doctor.specialty}</p>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-white/30">
                    <Building2 className="w-3 h-3" />
                    <span>{doctor.institution_name}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-emerald-500">★ {doctor.rating}</span>
                  <span className="text-[9px] text-white/30">({doctor.review_count})</span>
                </div>
                <p className="text-[9px] text-white/40 mt-1">
                  {doctor.available_today ? (
                    <span className="text-emerald-500">Disponible hoy</span>
                  ) : (
                    <span>Próxima: {doctor.next_available}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
        {searchType === "services" && (results as Service[]).map((service) => (
          <div key={service.id} className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold uppercase">{service.name}</h3>
                <p className="text-[10px] text-white/40 mt-1">{service.description}</p>
                <div className="flex items-center gap-1 mt-1 text-[9px] text-white/30">
                  <Building2 className="w-3 h-3" />
                  <span>{service.institution_name}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-500">{service.price_ves}</p>
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
    </div>
  );
}