import { useEffect, useState } from "react";
import { searchPatients, createPatient } from "../api/patients";
import { registerArrival } from "../api/waitingRoom";
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
    middle_name: "",
    last_name: "",
    second_last_name: "",
    gender: null,       // 👈 null en vez de "Unknown"
    birthdate: null,    // 👈 añadimos birthdate opcional
    national_id: "",
    contact_info: "",
    email: "",
  });

  // 🔹 debounce
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (isCreating) return;
    let active = true;
    async function run() {
      if (!debouncedQuery.trim()) {
        setResults([]);
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
      const entry = await registerArrival(selectedPatientId);
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
      const payload: PatientInput = {
        first_name: newPatient.first_name.trim(),
        middle_name: newPatient.middle_name?.trim() || undefined,
        last_name: newPatient.last_name.trim(),
        second_last_name: newPatient.second_last_name?.trim() || undefined,
        national_id: newPatient.national_id?.trim() || undefined,
        contact_info: newPatient.contact_info?.trim() || undefined,
        email: newPatient.email?.trim() || undefined,
        gender: newPatient.gender || null,       // 👈 null si no hay género
        birthdate: newPatient.birthdate || null, // 👈 null si no hay fecha
      };
      const created = await createPatient(payload);
      const entry = await registerArrival(created.id);
      onSuccess(entry);
      onClose();
    } catch (e: any) {
      setError(e.message || "Error creando paciente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxWidth: 560 }}>
      <h3>Registrar llegada</h3>

      {!isCreating ? (
        <>
          <label style={{ display: "block", marginTop: 8, fontWeight: 600 }}>Buscar paciente por nombre o ID</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            placeholder="Ej: María | 10233456"
            style={{ width: "100%", padding: "8px 10px", marginTop: 6, border: "1px solid #cbd5e1", borderRadius: 6 }}
          />

          {!loading && !!results.length && (
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8, border: "1px solid #e2e8f0", borderRadius: 6, maxHeight: 200, overflowY: "auto" }}>
              {results.map((p, idx) => {
                const active = idx === selectedIndex || p.id === selectedPatientId;
                return (
                  <li
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setQuery(`${p.full_name}`);
                    }}
                    style={{ padding: "8px 10px", cursor: "pointer", background: active ? "#eff6ff" : "#fff", borderBottom: "1px solid #f1f5f9" }}
                  >
                    <strong>{p.full_name}</strong>
                    <span style={{ color: "#64748b", marginLeft: 8 }}>ID: {p.id}</span>
                    {p.national_id && <span style={{ color: "#94a3b8", marginLeft: 8 }}>CI: {p.national_id}</span>}
                  </li>
                );
              })}
            </ul>
          )}

          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={handleRegister} style={{ background: "#22c55e", color: "#fff", padding: "8px 12px", borderRadius: 6 }} disabled={loading || !selectedPatientId}>
              Registrar llegada
            </button>
            <button onClick={() => setIsCreating(true)} style={{ background: "#3b82f6", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
              ➕ Nuevo paciente
            </button>
            <button onClick={onClose} style={{ background: "#ef4444", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Formulario de creación */}
          <label>Nombre</label>
          <input value={newPatient.first_name} onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
          <label>Segundo nombre (opcional)</label>
          <input value={newPatient.middle_name || ""} onChange={(e) => setNewPatient({ ...newPatient, middle_name: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
          <label>Apellido</label>
          <input value={newPatient.last_name} onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
          <label>Segundo apellido (opcional)</label>
          <input value={newPatient.second_last_name || ""} onChange={(e) => setNewPatient({ ...newPatient, second_last_name: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
          <label>Documento (Cédula / ID)</label>
          <input value={newPatient.national_id || ""} onChange={(e) => setNewPatient({ ...newPatient, national_id: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
          <label>Teléfono</label>
          <input value={newPatient.contact_info || ""} onChange={(e) => setNewPatient({ ...newPatient, contact_info: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
          <label>Email</label>
          <input type="email" value={newPatient.email || ""} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
          <label>Fecha de nacimiento (opcional)</label>
          <input type="date" value={newPatient.birthdate || ""} onChange={(e) => setNewPatient({ ...newPatient, birthdate: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />

          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handleCreateAndRegister}
              style={{ background: "#22c55e", color: "#fff", padding: "8px 12px", borderRadius: 6 }}
              disabled={loading || !newPatient.first_name || !newPatient.last_name || !newPatient.national_id || !newPatient.contact_info || !newPatient.email}
            >
              Crear y registrar llegada
            </button>
            <button onClick={() => setIsCreating(false)} style={{ background: "#ef4444", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>
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
