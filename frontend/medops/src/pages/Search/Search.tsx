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
  first_name: string;
  last_name: string;
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
        setError("NETWORK_PROTOCOL_ERROR: Search_Endpoint_Unreachable");
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
    <div className="p-4 sm:p-8 space-y-8 bg-[var(--palantir-bg)] min-h-screen">
      <PageHeader 
        breadcrumbs={[
          { label: "SYSTEM", path: "/" },
          { label: "CROSS_REFERENCE", path: "/operations" },
          { label: "SEARCH", active: true }
        ]}
        stats={[
          { label: "QUERY_TERM", value: query || "NULL", color: "text-[var(--palantir-active)]" },
          { label: "MATCHES_FOUND", value: totalResults.toString().padStart(3, '0'), color: "text-white" }
        ]}
      />

      {/* 🔍 BARRA DE BÚSQUEDA TÉCNICA */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Query: Patient_Name, ID, or Order_Number..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-sm py-4 pl-12 pr-4 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--palantir-active)]/50 focus:bg-white/[0.05] transition-all"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[var(--palantir-active)] transition-colors" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--palantir-active)] text-black text-[10px] font-black px-4 py-1.5 uppercase tracking-tighter hover:bg-white transition-colors">
            Execute_Query
          </button>
        </form>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        {!query.trim() ? (
          <EmptyState icon={<MagnifyingGlassIcon className="w-12 h-12 text-white/5" />} title="IDLE_MODE" description="System is waiting for a query parameter to begin cross-reference." />
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-[var(--palantir-active)]/30 border-t-[var(--palantir-active)] rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-[var(--palantir-active)] uppercase tracking-[0.3em] animate-pulse">Scanning_Database...</span>
          </div>
        ) : error ? (
          <div className="p-6 border border-red-500/20 bg-red-500/5 flex items-center gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            <span className="text-xs font-mono text-red-500">{error}</span>
          </div>
        ) : totalResults > 0 ? (
          <div className="grid grid-cols-1 gap-12">
            
            {/* 👥 CATEGORÍA: PACIENTES */}
            {results.patients.length > 0 && (
              <section className="space-y-4">
                <SectionLabel icon={<UserIcon className="w-4 h-4" />} text="Target_Patients" count={results.patients.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.patients.map((p) => (
                    <ResultCard key={p.id} to={`/patients/${p.id}`} title={`${p.first_name} ${p.last_name}`} subtitle={`National_ID: ${p.national_id}`} type="PATIENT" />
                  ))}
                </div>
              </section>
            )}

            {/* 📅 CATEGORÍA: CITAS */}
            {results.appointments.length > 0 && (
              <section className="space-y-4">
                <SectionLabel icon={<CalendarDaysIcon className="w-4 h-4" />} text="Consultation_Records" count={results.appointments.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.appointments.map((c) => (
                    <ResultCard 
                      key={c.id} 
                      to={c.patient?.id || c.patient_id ? `/patients/${c.patient?.id || c.patient_id}/consultations/${c.id}` : "/appointments"}
                      title={`Date: ${c.appointment_date}`}
                      subtitle={`Status: ${c.status} // Patient: ${c.patient_name || '---'}`}
                      type="APPOINTMENT"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 💳 CATEGORÍA: ÓRDENES */}
            {results.orders.length > 0 && (
              <section className="space-y-4">
                <SectionLabel icon={<CreditCardIcon className="w-4 h-4" />} text="Financial_Objects" count={results.orders.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.orders.map((o) => (
                    <ResultCard 
                      key={o.id}
                      to={o.patient?.id && o.appointment ? `/patients/${o.patient?.id}/consultations/${o.appointment}` : `/charge-orders/${o.id}`}
                      title={`Order_ID: #${o.id.toString().padStart(4, '0')}`}
                      subtitle={`Total: $${o.total} // Status: ${o.status}`}
                      type="FINANCE"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <EmptyState icon={<ExclamationTriangleIcon className="w-12 h-12 text-white/5" />} title="ZERO_MATCHES" description={`No records found matching the query "${query}".`} />
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES INTERNOS ---

function SectionLabel({ icon, text, count }: { icon: React.ReactNode, text: string, count: number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <div className="flex items-center gap-2 text-[var(--palantir-muted)]">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{text}</span>
      </div>
      <span className="text-[9px] font-mono bg-white/5 px-2 py-0.5 rounded-full text-white/40">{count} matches</span>
    </div>
  );
}

function ResultCard({ to, title, subtitle, type }: { to: string, title: string, subtitle: string, type: string }) {
  const colors: Record<string, string> = {
    PATIENT: "border-blue-500/20 hover:border-blue-500/50",
    APPOINTMENT: "border-emerald-500/20 hover:border-emerald-500/50",
    FINANCE: "border-amber-500/20 hover:border-amber-500/50"
  };

  const borderColor = colors[type] || "border-white/10 hover:border-white/30";

  return (
    <Link to={to} className={`group block p-4 bg-white/[0.02] border ${borderColor} rounded-sm transition-all hover:bg-white/[0.04]`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-white uppercase tracking-tight">{title}</p>
          <p className="text-[9px] font-mono text-[var(--palantir-muted)] leading-relaxed">{subtitle}</p>
        </div>
        <ChevronRightIcon className="w-4 h-4 text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      <div className="mt-3 flex gap-2">
        <span className="text-[7px] font-mono px-1.5 py-0.5 bg-white/5 text-white/30 uppercase tracking-widest">Type: {type}</span>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{title}</h3>
      <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase mt-2 max-w-xs">{description}</p>
    </div>
  );
}
