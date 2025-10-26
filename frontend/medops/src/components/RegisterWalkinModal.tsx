import { useEffect, useState } from "react";
import { searchPatients, createPatient } from "../api/patients";
import { registerWalkin } from "../api/waitingRoom";
import { PatientRef, PatientInput } from "../types/patients";

type Props = {
  onClose: () => void;
  onSuccess: (entry: any) => void;
};

export default function RegisterWalkinModal({ onClose, onSuccess }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  // 🔹 Toggle entre buscador y creación
  const [isCreating, setIsCreating] = useState(false);
  const [newPatient, setNewPatient] = useState<PatientInput>({
    first_name: "",
    last_name: "",
    gender: "Unknown",
    national_id: "",
    contact_info: "",
    email: "",
  });

  // 🔹 debounce
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (isCreating) return; // no buscar si estamos creando
    let active = true;
    async function run() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setSelectedPatientId(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchPatients(debouncedQuery);
        if (!active) return;
        setResults(data);
        if (/^\d+$/.test(debouncedQuery)) {
          const match = data.find((p) => String(p.id) === debouncedQuery);
          setSelectedPatientId(match ? match.id : null);
        } else {
          setSelectedPatientId(null);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [debouncedQuery, isCreating]);

  const handleRegister = async () => {
    if (!selectedPatientId) {
      setError("Selecciona un paciente de la lista o escribe su ID exacto.");
      return;
    }
    try {
      setLoading(true);
      const entry = await registerWalkin(selectedPatientId);
      onSuccess(entry);
      onClose();
    } catch (e: any) {
      setError(e.message || "Error registrando llegada");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndRegister = async () => {
    try {
      setLoading(true);
      const created = await createPatient(newPatient);
      const entry = await registerWalkin(created.id);
      onSuccess(entry);
      onClose();
    } catch (e: any) {
      setError(e.message || "Error creando paciente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: 16,
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        maxWidth: 560,
      }}
    >
      <h3>Registrar llegada (Walk-in)</h3>

      {!isCreating ? (
        <>
          <label style={{ display: "block", marginTop: 8, fontWeight: 600 }}>
            Buscar paciente por nombre o ID
          </label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            placeholder="Ej: María | 10233456"
            style={{
              width: "100%",
              padding: "8px 10px",
              marginTop: 6,
              border: "1px solid #cbd5e1",
              borderRadius: 6,
            }}
          />

          {!loading && !!results.length && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                marginTop: 8,
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              {results.map((p, idx) => {
                const active = idx === selectedIndex || p.id === selectedPatientId;
                return (
                  <li
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setQuery(`${p.full_name} (${p.id})`);
                    }}
                    style={{
                      padding: "8px 10px",
                      cursor: "pointer",
                      background: active ? "#eff6ff" : "#fff",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <strong>{p.full_name}</strong>
                    <span style={{ color: "#64748b", marginLeft: 8 }}>ID: {p.id}</span>
                    {p.national_id && (
                      <span style={{ color: "#94a3b8", marginLeft: 8 }}>
                        CI: {p.national_id}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handleRegister}
              style={{
                background: "#22c55e",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
              }}
              disabled={loading || !selectedPatientId}
            >
              Registrar llegada
            </button>
            <button
              onClick={() => setIsCreating(true)}
              style={{
                background: "#3b82f6",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              ➕ Nuevo paciente
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#ef4444",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          <label>Nombre</label>
          <input
            value={newPatient.first_name}
            onChange={(e) =>
              setNewPatient({ ...newPatient, first_name: e.target.value })
            }
            style={{ width: "100%", marginBottom: 8 }}
          />

          <label>Apellido</label>
          <input
            value={newPatient.last_name}
            onChange={(e) =>
              setNewPatient({ ...newPatient, last_name: e.target.value })
            }
            style={{ width: "100%", marginBottom: 8 }}
          />

          <label>Documento (Cédula / ID)</label>
          <input
            value={newPatient.national_id || ""}
            onChange={(e) =>
              setNewPatient({ ...newPatient, national_id: e.target.value })
            }
            style={{ width: "100%", marginBottom: 8 }}
          />

          <label>Teléfono</label>
          <input
            value={newPatient.contact_info || ""}
            onChange={(e) =>
              setNewPatient({ ...newPatient, contact_info: e.target.value })
            }
            style={{ width: "100%", marginBottom: 8 }}
          />

          <label>Email</label>
          <input
            type="email"
            value={newPatient.email || ""}
            onChange={(e) =>
              setNewPatient({ ...newPatient, email: e.target.value })
            }
            style={{ width: "100%", marginBottom: 8 }}
          />

          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handleCreateAndRegister}
              style={{
                background: "#22c55e",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
              }}
              disabled={
                loading ||
                !newPatient.first_name ||
                !newPatient.last_name ||
                !newPatient.national_id ||
                !newPatient.contact_info ||
                !newPatient.email
              }
            >
              Crear y registrar llegada
            </button>
            <button
              onClick={() => setIsCreating(false)}
              style={{
                background: "#ef4444",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 🔹 Hook de debounce reutilizable
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
