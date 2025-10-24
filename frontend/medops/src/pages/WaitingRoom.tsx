import { useEffect, useState } from "react";
import {
  getWaitingRoom,
  updateWaitingRoomStatus,
  createWaitingRoomEntry,
  promoteToEmergency,
  confirmWaitingRoomEntry,
  closeWaitingRoomDay,
} from "../api/waitingRoom";
import { searchPatients } from "../api/patients";
import { getPatientNotes, updatePatientNotes } from "../api/consultations";
import { WaitingRoomEntry, WaitingRoomStatus, WaitingRoomPriority } from "../types/waitingRoom";
import { ConsultationNote } from "../types/consultations";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { groupEntries } from "../utils/waitingroomUtils";
import { getAuditByPatient, AuditEvent } from "../api/audit";

// 🔹 Badge visual para estado
const renderStatusBadge = (status: WaitingRoomStatus) => {
  const styles: Record<WaitingRoomStatus, { bg: string; text: string }> = {
    waiting: { bg: "#facc15", text: "En espera" },
    in_consultation: { bg: "#3b82f6", text: "En consulta" },
    completed: { bg: "#22c55e", text: "Completado" },
    canceled: { bg: "#ef4444", text: "Cancelado" },
  };
  const { bg, text } = styles[status];
  return (
    <span style={{ background: bg, color: "#fff", padding: "2px 8px", borderRadius: "12px" }}>
      {text}
    </span>
  );
};

// 🔹 Badge visual para prioridad
const renderPriorityBadge = (priority: WaitingRoomPriority) => {
  const styles: Record<WaitingRoomPriority, { bg: string; text: string }> = {
    normal: { bg: "#0ea5e9", text: "Normal" },
    emergency: { bg: "#dc2626", text: "Emergencia" },
  };
  const { bg, text } = styles[priority];
  return (
    <span style={{ background: bg, color: "#fff", padding: "2px 8px", borderRadius: "12px", marginLeft: "6px" }}>
      {text}
    </span>
  );
};

// 🔹 Renderizador de metadata
const renderMetadata = (metadata: Record<string, any>) => {
  if (!metadata) return null;

  if (metadata.old_status && metadata.new_status) {
    return (
      <div>
        <strong>Cambio de estado:</strong>{" "}
        <span style={{ color: "#ef4444" }}>{metadata.old_status}</span> →{" "}
        <span style={{ color: "#22c55e" }}>{metadata.new_status}</span>
      </div>
    );
  }

  if (metadata.canceled_count !== undefined) {
    return (
      <div>
        <strong>Pacientes cancelados:</strong> {metadata.canceled_count}
      </div>
    );
  }

  return (
    <pre style={{ fontSize: "0.8em", color: "#64748b" }}>
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
};

export default function WaitingRoom() {
  const [entries, setEntries] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de historial y notas
  const [selectedPatient, setSelectedPatient] = useState<WaitingRoomEntry | null>(null);
  const [patientNotes, setPatientNotes] = useState<ConsultationNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState<string>("");

  // Modal de ingreso
  const [showIngreso, setShowIngreso] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedPatientSearch, setSelectedPatientSearch] = useState<any | null>(null);

  // Modal de auditoría
  const [showAudit, setShowAudit] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    getWaitingRoom()
      .then(data => setEntries(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: number, newStatus: WaitingRoomStatus) => {
    try {
      const updated = await updateWaitingRoomStatus(id, newStatus);
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePromoteToEmergency = async (id: number) => {
    try {
      const updated = await promoteToEmergency(id);
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirmWalkin = async (id: number) => {
    try {
      const updated = await confirmWaitingRoomEntry(id);
      setEntries(prev => prev.map(e => (e.id === id ? updated : e)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseDay = async () => {
    try {
      await closeWaitingRoomDay();
      setEntries(prev =>
        prev.map(e =>
          e.status === "waiting" ? { ...e, status: "canceled" } : e
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

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

  const grouped = groupEntries(entries);

  return (
    <div>
      <h2>Sala de Espera</h2>

      <div style={{ marginBottom: "16px", textAlign: "right" }}>
        <button
          style={{ background: "#22c55e", color: "#fff", padding: "8px 16px", borderRadius: "6px", marginRight: "8px" }}
          onClick={() => setShowIngreso(true)}
        >
          ➕ Registrar llegada
        </button>
        <button
          style={{ background: "#ef4444", color: "#fff", padding: "8px 16px", borderRadius: "6px" }}
          onClick={handleCloseDay}
        >
          🛑 Cerrar jornada
        </button>
      </div>

      {Object.entries(grouped).map(([groupName, patients]) => (
        <div key={groupName} style={{ marginBottom: "2rem" }}>
          <h3>{groupName}</h3>
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
              {patients.map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid #cbd5e1" }}>
                  <td>{e.patient.name}</td>
                  <td>
                    {renderStatusBadge(e.status)}
                    {renderPriorityBadge(e.priority)}
                  </td>
                  <td>
                    {e.arrival_time
                      ? formatDistanceToNow(new Date(e.arrival_time), { addSuffix: false, locale: es })
                      : "—"}
                  </td>
                  <td>
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
                    {e.priority !== "emergency" && (
                      <button
                        onClick={() => handlePromoteToEmergency(e.id)}
                        style={{ background: "#facc15", marginLeft: "6px" }}
                      >
                        🚨 Emergencia
                      </button>
                    )}
                    {e.priority === "normal" && (   // ✅ corregido
                      <button
                        onClick={() => handleConfirmWalkin(e.id)}
                        style={{
                          background: "#10b981", color: "#fff",
                          marginLeft: "6px", padding: "4px 8px", borderRadius: "4px"
                        }}
                      >
                        Confirmar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Modal ingreso */}
      {showIngreso && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff", padding: "20px",
              borderRadius: "8px", width: "500px",
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

      {/* Modal historial/notas */}
      {selectedPatient && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff", padding: "20px",
              borderRadius: "8px", width: "600px",
              maxHeight: "80vh", overflowY: "auto",
            }}
          >
            <h3>📝 Historial de {selectedPatient.patient.name}</h3>

            {loadingNotes && <p>Cargando notas...</p>}
            {!loadingNotes && patientNotes.length === 0 && (
              <p style={{ color: "#64748b" }}>No hay notas registradas</p>
            )}

            <ul style={{ marginTop: "12px", marginBottom: "16px" }}>
              {patientNotes.map(n => (
                <li key={n.id} style={{ borderBottom: "1px solid #e2e8f0", padding: "8px 0" }}>
                  <div style={{ fontSize: "0.9em", color: "#475569" }}>
                    {new Date(n.created_at).toLocaleString()} {n.author && <>• {n.author}</>}
                  </div>
                  <div>{n.content}</div>
                </li>
              ))}
            </ul>

            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Escribe una nueva nota..."
              style={{ width: "100%", minHeight: "100px", marginBottom: "12px", padding: "8px" }}
            />

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => {
                  if (newNote.trim() && selectedPatient) {
                    updatePatientNotes(selectedPatient.patient.id, newNote)
                      .then(note => {
                        setPatientNotes(prev => [...prev, note]);
                        setNewNote("");
                      })
                      .catch(err => setError(err.message));
                  }
                }}
                style={{ marginRight: "8px", background: "#3b82f6", color: "#fff", padding: "6px 12px" }}
              >
                Guardar nota
              </button>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientNotes([]);
                  setNewNote("");
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal auditoría */}
      {showAudit && selectedPatient && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff", padding: "20px",
              borderRadius: "8px", width: "600px",
              maxHeight: "80vh", overflowY: "auto",
            }}
          >
            <h3>📜 Auditoría de {selectedPatient.patient.name}</h3>

            {loadingAudit && <p>Cargando auditoría...</p>}
            {!loadingAudit && auditEvents.length === 0 && (
              <p style={{ color: "#64748b" }}>No hay eventos registrados</p>
            )}

            <ul style={{ marginTop: "12px" }}>
              {auditEvents.map(ev => (
                <li key={ev.id} style={{ borderBottom: "1px solid #e2e8f0", padding: "8px 0" }}>
                  <div style={{ fontSize: "0.9em", color: "#475569" }}>
                    {new Date(ev.timestamp).toLocaleString()} • {ev.action} • {ev.actor}
                  </div>
                  {ev.metadata && renderMetadata(ev.metadata)}
                </li>
              ))}
            </ul>

            <div style={{ textAlign: "right", marginTop: "12px" }}>
              <button
                onClick={() => {
                  setShowAudit(false);
                  setAuditEvents([]);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
