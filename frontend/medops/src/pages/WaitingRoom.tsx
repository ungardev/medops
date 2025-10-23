import { useEffect, useState } from "react";
import { getWaitingRoom, updateWaitingRoomStatus, createWaitingRoomEntry } from "../api/waitingRoom";
import { searchPatients } from "../api/patients";
import { WaitingRoomEntry, PatientStatus } from "../types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function WaitingRoom() {
  const [entries, setEntries] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de historial y notas
  const [selectedPatient, setSelectedPatient] = useState<WaitingRoomEntry | null>(null);
  const [notes, setNotes] = useState<string>("");

  // Modal de ingreso (walk-in o pre-registro)
  const [showIngreso, setShowIngreso] = useState(false);
  const [query, setQuery] = useState(""); // búsqueda
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedPatientSearch, setSelectedPatientSearch] = useState<any | null>(null);

  useEffect(() => {
    getWaitingRoom()
      .then(data => setEntries(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, newStatus: PatientStatus) => {
    try {
      const updated = await updateWaitingRoomStatus(id, newStatus);
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Buscar pacientes con debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoadingSearch(true);
    const timeout = setTimeout(() => {
      searchPatients(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoadingSearch(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Separar grupos
  const confirmed = entries.filter(
    e => e.status === "waiting" || e.status === "in_consultation"
  );
  const scheduled = entries.filter(e => e.status === "scheduled");

  return (
    <div>
      <h2>Sala de Espera</h2>

      {/* Botón de ingreso */}
      <div style={{ marginBottom: "16px", textAlign: "right" }}>
        <button
          style={{
            background: "#22c55e",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "6px",
          }}
          onClick={() => setShowIngreso(true)}
        >
          ➕ Registrar llegada
        </button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* Grupo A: Confirmados */}
      <h3>🟢 Pacientes en sala de espera</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr style={{ background: "#e2e8f0" }}>
            <th>Paciente</th>
            <th>Estado</th>
            <th>Tiempo de espera</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {confirmed.map(e => (
            <tr key={e.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
              <td>{e.patient.name}</td>
              <td>{e.status}</td>
              <td>
                {e.arrival_time
                  ? formatDistanceToNow(new Date(e.arrival_time), {
                      addSuffix: false,
                      locale: es,
                    })
                  : "—"}
              </td>
              <td>
                <button onClick={() => setSelectedPatient(e)}>Ver historial</button>
                {e.status === "waiting" && (
                  <button onClick={() => handleStatusChange(e.id, "in_consultation")}>
                    Pasar a consulta
                  </button>
                )}
                {e.status === "in_consultation" && (
                  <button onClick={() => handleStatusChange(e.id, "completed")}>
                    Finalizar
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange(e.id, "canceled")}
                  style={{ color: "red" }}
                >
                  Cancelar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal ingreso */}
      {showIngreso && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "500px",
            }}
          >
            <h3>Registrar llegada</h3>
            <p>🔍 Buscar paciente existente</p>
            <input
              type="text"
              placeholder="Nombre o ID del paciente"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setSelectedPatientSearch(null);
              }}
              style={{ width: "100%", padding: "8px", marginBottom: "12px" }}
            />
            {loadingSearch && <p>Buscando...</p>}
            <ul style={{ maxHeight: "200px", overflowY: "auto", marginTop: "8px" }}>
              {results.map(p => (
                <li
                  key={p.id}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #e2e8f0",
                    background: selectedPatientSearch?.id === p.id ? "#e2e8f0" : "transparent",
                  }}
                  onClick={() => setSelectedPatientSearch(p)}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {p.full_name || p.name}
                  </div>
                  <div style={{ fontSize: "0.9em", color: "#475569" }}>
                    ID: {p.id} • {p.gender || "—"} •{" "}
                    {p.birthdate ? new Date(p.birthdate).toLocaleDateString() : "Sin fecha"}
                  </div>
                  {p.contact_info && (
                    <div style={{ fontSize: "0.85em", color: "#64748b" }}>
                      📞 {p.contact_info}
                    </div>
                  )}
                </li>
              ))}
              {results.length === 0 && !loadingSearch && query.length >= 2 && (
                <li style={{ padding: "8px", color: "#64748b" }}>
                  No se encontraron pacientes
                </li>
              )}
            </ul>

            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button
                onClick={() => {
                  if (selectedPatientSearch) {
                    createWaitingRoomEntry({
                      patient: selectedPatientSearch.id,
                      status: "waiting",
                    })
                      .then(newEntry => {
                        setEntries(prev => [...prev, newEntry]);
                        setShowIngreso(false);
                        setQuery("");
                        setResults([]);
                        setSelectedPatientSearch(null);
                      })
                      .catch(err => setError(err.message));
                  }
                }}
                style={{
                  marginRight: "8px",
                  background: "#22c55e",
                  color: "#fff",
                  padding: "6px 12px",
                }}
              >
                Registrar
              </button>
              <button onClick={() => setShowIngreso(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
