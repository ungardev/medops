import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import axios from "axios";

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
  patient_name?: string; // ✅ nuevo campo
}

interface Order {
  id: number;
  total: number;
  balance_due: number;
  status: string;
  patient_name?: string; // ✅ nuevo campo
}

interface SearchResponse {
  patients: Patient[];
  appointments: Appointment[];
  orders: Order[];
}

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [results, setResults] = useState<SearchResponse>({
    patients: [],
    appointments: [],
    orders: [],
  });
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

    axios
      .get("/search/", { params: { query: query.trim() } })
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
        setError("No se pudo consultar el buscador institucional.");
        setLoading(false);
      });
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  return (
    <div className="px-3 py-4 sm:p-6">
      <h1 className="text-lg sm:text-xl font-bold text-[#0d2c53] dark:text-white mb-4 sm:mb-6">
        Resultados de búsqueda
      </h1>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar pacientes, citas u órdenes..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                     bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-[#0d2c53] text-white hover:bg-[#0b2444] transition text-sm"
        >
          Buscar
        </button>
      </form>

      {!query.trim() ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Escriba un término en el buscador institucional para comenzar.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Puede buscar pacientes, citas u órdenes/pagos.
          </p>
        </div>
      ) : loading ? (
        <p className="text-gray-500 dark:text-gray-400">
          Buscando “{query}”...
        </p>
      ) : error ? (
        <p className="text-red-600 dark:text-red-400">
          {error}. Intente nuevamente.
        </p>
      ) : results.patients.length > 0 ||
        results.appointments.length > 0 ||
        results.orders.length > 0 ? (
        <div className="space-y-6 sm:space-y-8">
          {/* Pacientes */}
          {results.patients.length > 0 && (
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white mb-2 sm:mb-3">
                Pacientes
              </h2>
              <ul className="space-y-2">
                {results.patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/patients/${p.id}`}
                      className="block p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <p className="font-medium text-[#0d2c53] dark:text-white">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cédula: {p.national_id}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Citas */}
          {results.appointments.length > 0 && (
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white mb-2 sm:mb-3">
                Citas
              </h2>
              <ul className="space-y-2">
                {results.appointments.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/appointments`}
                      className="block p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <p className="font-medium text-[#0d2c53] dark:text-white">
                        Fecha: {c.appointment_date}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Estado: {c.status} — Paciente: {c.patient_name || "—"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Órdenes / Pagos */}
          {results.orders.length > 0 && (
            <section>
              <h2 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white mb-2 sm:mb-3">
                Órdenes / Pagos
              </h2>
              <ul className="space-y-2">
                {results.orders.map((o) => (
                  <li key={o.id}>
                    <Link
                      to={`/charge-orders/${o.id}`}
                      className="block p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <p className="font-medium text-[#0d2c53] dark:text-white">
                        Orden #{o.id} — Paciente: {o.patient_name || "—"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monto: ${o.total} — Estado: {o.status}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron resultados para “{query}”.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Refina tu búsqueda o intenta con otros términos.
          </p>
        </div>
      )}
    </div>
  );
}
