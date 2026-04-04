// src/pages/Search/Search.tsx
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  CalendarDaysIcon, 
  CreditCardIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import axios from "axios";
import PageHeader from "@/components/Common/PageHeader";
interface Patient {
  id: number;
  full_name: string;
  national_id: string;
}
interface Appointment {
  id: number;
  appointment_date: string;
  status: string;
  patient_name?: string;
  patient?: { id: number };
  patient_id?: number;
}
interface Order {
  id: number;
  total: number;
  balance_due: number;
  status: string;
  patient_name?: string;
  patient?: { id: number };
  patient_id?: number;
  appointment?: number;
}
interface SearchResponse {
  patients: Patient[];
  appointments: Appointment[];
  orders: Order[];
}
export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResponse>({ patients: [], appointments: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";
  const [searchTerm, setSearchTerm] = useState(query);
  
  useEffect(() => {
    if (!query.trim()) {
      setResults({ patients: [], appointments: [], orders: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    axios.get("/search/", { params: { query: query.trim() } })
      .then((res) => {
        const data = res.data as SearchResponse;
        setResults({
          patients: data.patients ?? [],
          appointments: data.appointments ?? [],
          orders: data.orders ?? [],
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Error de conexión. No se pudo realizar la búsqueda.");
        setLoading(false);
      });
  }, [query]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };
  
  const totalResults = results.patients.length + results.appointments.length + results.orders.length;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Búsqueda", active: true }
        ]}
        stats={[
          { label: "Término", value: query || "—", color: "text-white/50" },
          { label: "Resultados", value: totalResults.toString(), color: "text-white/50" }
        ]}
      />
      
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente, cita u orden..."
            className="w-full bg-white/5 border border-white/15 rounded-lg py-3 pl-12 pr-24 text-[12px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-emerald-400/60 transition-colors" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium px-4 py-1.5 rounded-md hover:bg-emerald-500/25 transition-colors">
            Buscar
          </button>
        </form>
      </div>
      
      <div className="max-w-6xl mx-auto space-y-10">
        {!query.trim() ? (
          <EmptyState 
            icon={<MagnifyingGlassIcon className="w-12 h-12 text-white/10" />} 
            title="Esperando búsqueda" 
            description="Escribe un término para buscar pacientes, citas u órdenes." 
          />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            <span className="text-[11px] text-emerald-400/60">Buscando...</span>
          </div>
        ) : error ? (
          <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-lg flex items-center gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            <span className="text-xs text-red-400/80">{error}</span>
          </div>
        ) : totalResults > 0 ? (
          <div className="grid grid-cols-1 gap-12">
            
            {results.patients.length > 0 && (
              <section className="space-y-4">
                <SectionLabel icon={<UserIcon className="w-4 h-4" />} text="Pacientes" count={results.patients.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.patients.map((p) => (
                    <ResultCard key={p.id} to={`/patients/${p.id}`} title={p.full_name} subtitle={`Cédula: ${p.national_id}`} type="PACIENTE" />
                  ))}
                </div>
              </section>
            )}
            
            {results.appointments.length > 0 && (
              <section className="space-y-4">
                <SectionLabel icon={<CalendarDaysIcon className="w-4 h-4" />} text="Citas" count={results.appointments.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.appointments.map((c) => (
                    <ResultCard 
                      key={c.id} 
                      to={`/appointments?view=${c.id}`}
                      title={`Fecha: ${c.appointment_date}`}
                      subtitle={`Estado: ${c.status} // Paciente: ${c.patient_name || '---'}`}
                      type="CITA"
                    />
                  ))}
                </div>
              </section>
            )}
            
            {results.orders.length > 0 && (
              <section className="space-y-4">
                <SectionLabel icon={<CreditCardIcon className="w-4 h-4" />} text="Órdenes" count={results.orders.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.orders.map((o) => (
                    <ResultCard 
                      key={o.id}
                      to={o.patient?.id && o.appointment ? `/patients/${o.patient?.id}/consultations/${o.appointment}` : `/payments/${o.id}`}
                      title={`Orden #${o.id.toString().padStart(4, '0')}`}
                      subtitle={`Total: $${o.total} // Estado: ${o.status}`}
                      type="FINANZAS"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <EmptyState 
            icon={<ExclamationTriangleIcon className="w-12 h-12 text-white/10" />} 
            title="Sin resultados" 
            description={`No se encontraron registros para "${query}".`} 
          />
        )}
      </div>
    </div>
  );
}
function SectionLabel({ icon, text, count }: { icon: React.ReactNode, text: string, count: number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2">
      <div className="flex items-center gap-2 text-white/50">
        {icon}
        <span className="text-[11px] font-medium">{text}</span>
      </div>
      <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-md text-white/30">{count} resultados</span>
    </div>
  );
}
function ResultCard({ to, title, subtitle, type }: { to: string, title: string, subtitle: string, type: string }) {
  const colors: Record<string, string> = {
    PACIENTE: "border-blue-500/20 hover:border-blue-500/30",
    CITA: "border-emerald-500/20 hover:border-emerald-500/30",
    FINANZAS: "border-amber-500/20 hover:border-amber-500/30"
  };
  const borderColor = colors[type] || "border-white/10 hover:border-white/20";
  
  return (
    <Link to={to} className={`group block p-5 bg-white/5 border ${borderColor} rounded-lg transition-all hover:bg-white/10`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-white/80">{title}</p>
          <p className="text-[10px] text-white/30 leading-relaxed">{subtitle}</p>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
      </div>
      <div className="mt-3 flex gap-2">
        <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded-md text-white/30">{type}</span>
      </div>
    </Link>
  );
}
function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/10 rounded-lg">
      <div className="mb-6">{icon}</div>
      <h3 className="text-[13px] font-medium text-white/50">{title}</h3>
      <p className="text-[11px] text-white/30 mt-3 max-w-xs">{description}</p>
    </div>
  );
}