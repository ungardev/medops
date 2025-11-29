import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import axios from "axios"; // 👈 usamos axios con baseURL y token ya configurados en main.tsx

interface Patient {
  id: string;
  name: string;
  document: string;
}

interface Appointment {
  id: string;
  date: string;
  status: string;
}

interface Order {
  id: string;
  amount: number;
  status: string;
}

interface SearchResponse {
  patients: Patient[];
  appointments: Appointment[];
  orders: Order[];
}

export default function SearchPage() {
  const location = useLocation();
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extraer query de la URL
  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 🔹 Llamada real al backend institucional usando axios
    axios
      .get("/search/", { params: { query: query.trim() } }) // 👈 axios ya tiene baseURL=/api y Authorization configurado
      .then((res) => {
        setResults(res.data as SearchResponse);
        setLoading(false);
      })
      .catch((err) => {
        setError("No se pudo consultar el buscador institucional.");
        setLoading(false);
      });
  }, [query]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-[#0d2c53] dark:text-white mb-6">
        Resultados de búsqueda
      </h1>

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
      ) : results &&
        (results.patients.length > 0 ||
          results.appointments.length > 0 ||
          results.orders.length > 0) ? (
        <div className="space-y-8">
          {/* Pacientes */}
          {results.patients.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-3">
                Pacientes
              </h2>
              <ul className="space-y-2">
                {results.patients.map((p) => (
                  <li
                    key={p.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <p className="font-medium text-[#0d2c53] dark:text-white">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Documento: {p.document}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Citas */}
          {results.appointments.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-3">
                Citas
              </h2>
              <ul className="space-y-2">
                {results.appointments.map((c) => (
                  <li
                    key={c.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <p className="font-medium text-[#0d2c53] dark:text-white">
                      Fecha: {c.date}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Estado: {c.status}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Órdenes / Pagos */}
          {results.orders.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-3">
                Órdenes / Pagos
              </h2>
              <ul className="space-y-2">
                {results.orders.map((o) => (
                  <li
                    key={o.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-sm"
                  >
                    <p className="font-medium text-[#0d2c53] dark:text-white">
                      Orden #{o.id}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monto: ${o.amount} — Estado: {o.status}
                    </p>
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
