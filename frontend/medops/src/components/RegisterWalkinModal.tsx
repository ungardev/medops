import { useState } from "react";
import { searchPatients, createPatient } from "../api/patients";
import { registerWalkinEntry } from "../api/waitingRoom";
import { WaitingRoomEntry } from "../types/waitingRoom";
import { PatientInput, PatientRef, Patient } from "../types/patients";

interface RegisterWalkinModalProps {
  onClose: () => void;
  onSuccess: (entry: WaitingRoomEntry) => void;
}

export default function RegisterWalkinModal({ onClose, onSuccess }: RegisterWalkinModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);

  const [newPatient, setNewPatient] = useState<PatientInput>({
    first_name: "",
    last_name: "",
    national_id: "",
    contact_info: "",
  });

  const handleSearch = async () => {
    const res = await searchPatients(query); // devuelve PatientRef[]
    setResults(res);
  };

  const handleCreatePatient = async () => {
    const created: Patient = await createPatient(newPatient); // devuelve Patient completo
    // 👇 construimos un PatientRef válido
    const ref: PatientRef = {
      id: created.id,
      name: `${created.first_name} ${created.last_name}`,
      national_id: created.national_id || null,
    };
    setSelectedPatient(ref);
  };

  const handleConfirm = async () => {
    if (!selectedPatient) return;
    const entry = await registerWalkinEntry(selectedPatient.id);
    onSuccess(entry);
    onClose();
  };

  return (
    <div className="modal">
      <h3>Registrar llegada (Walk-in)</h3>

      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar paciente..."
        />
        <button onClick={handleSearch}>Buscar</button>
      </div>

      <ul>
        {results.map((p) => (
          <li
            key={p.id}
            onClick={() => setSelectedPatient(p)}
            style={{
              cursor: "pointer",
              fontWeight: selectedPatient?.id === p.id ? "bold" : "normal",
            }}
          >
            {p.name} {p.national_id ? `(${p.national_id})` : ""}
          </li>
        ))}
      </ul>

      <h4>O crear nuevo paciente</h4>
      <input
        placeholder="Nombre"
        value={newPatient.first_name}
        onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
      />
      <input
        placeholder="Apellido"
        value={newPatient.last_name}
        onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
      />
      <input
        placeholder="Documento"
        value={newPatient.national_id || ""}
        onChange={(e) => setNewPatient({ ...newPatient, national_id: e.target.value })}
      />
      <input
        placeholder="Contacto (teléfono/email)"
        value={newPatient.contact_info || ""}
        onChange={(e) => setNewPatient({ ...newPatient, contact_info: e.target.value })}
      />
      <button onClick={handleCreatePatient}>Crear paciente</button>

      <div style={{ marginTop: "12px" }}>
        <button onClick={handleConfirm} disabled={!selectedPatient}>
          Confirmar llegada
        </button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}
