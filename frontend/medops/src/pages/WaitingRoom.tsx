import { useEffect, useState } from "react";
import { fetchWaitingRoom } from "../api/waitingRoom";

interface WaitingRoomEntry {
  id: number;
  name: string;
  created: string;
  updated: string;
}

export default function WaitingRoom() {
  const [entries, setEntries] = useState<WaitingRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitingRoom()
      .then(data => setEntries(data))
      .catch(err => setError(err.message))
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
            {e.name} — creado: {new Date(e.created).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
