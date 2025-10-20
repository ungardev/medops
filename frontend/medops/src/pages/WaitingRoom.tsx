import { useEffect, useState } from "react";
import { fetchWaitingRoom } from "../api/waitingRoom";

interface WaitingRoomEntry {
  id: number;
  patient: number;
  created_at: string;
  updated_at: string;
}

export default function WaitingRoom() {
  const [entries, setEntries] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔎 Montando WaitingRoom, lanzando fetch...");
    fetchWaitingRoom()
      .then(data => {
        console.log("✅ Datos recibidos:", data);
        setEntries(data);
      })
      .catch(err => {
        console.error("❌ Error en fetch:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando sala de espera...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Sala de Espera</h2>
      <ul>
        {entries.map(e => (
          <li key={e.id}>
            Paciente #{e.patient} — creado:{" "}
            {new Date(e.created_at).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
