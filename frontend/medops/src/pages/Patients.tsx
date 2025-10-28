// src/pages/Patients.tsx
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FaUser, FaEdit, FaTimes } from "react-icons/fa";
import { usePatients } from "../hooks/usePatients"; // 🔹 Hook que consulta /api/patients/

interface Patient {
  id: number;
  full_name: string;
  age: number | null;
  gender: string | null;
  contact_info: string | null;
}

export default function Patients() {
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // 🔹 Hook que trae TODOS los pacientes desde la API
  const { data: patients, isLoading, error } = usePatients();

  // Actualizar reloj cada minuto
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedNow = format(now, "EEEE, d 'de' MMMM 'de' yyyy – HH:mm", {
    locale: es,
  });

  // 🔹 Buscar pacientes en la lista cargada
  useEffect(() => {
    if (!patients) return;
    if (query.length < 2) {
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }
    const filtered = patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        String(p.id).includes(query)
    );
    setResults(filtered);
    setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [query, patients]);

  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    }
  };

  const handleSelect = (patient: Patient) => {
    alert(`Seleccionado: ${patient.full_name}`);
    setQuery("");
    setResults([]);
  };

  const viewPatient = (id: number) => alert(`Ver ficha de paciente ${id}`);
  const editPatient = (id: number) => alert(`Editar paciente ${id}`);
  const confirmDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };
  const deletePatient = () => {
    if (patientToDelete) {
      alert(`Paciente eliminado: ${patientToDelete.full_name}`);
    }
    setShowDeleteModal(false);
    setPatientToDelete(null);
  };

  if (isLoading) return <p>Cargando pacientes...</p>;
  if (error) return <p className="text-danger">Error cargando pacientes</p>;

  const list = patients ?? [];

  return (
    <div className="page">
      <div className="page-header flex-col items-start">
        <div className="w-full flex justify-between items-center mb-3">
          <div>
            <h2>Pacientes</h2>
            <p className="text-muted">{formattedNow}</p>
          </div>
          <button className="btn btn-primary">+ Nuevo paciente</button>
        </div>

        {/* Buscador inteligente */}
        <div className="search-bar w-full">
          <input
            type="text"
            className="input"
            placeholder="Buscar por nombre o folio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNavigation}
          />
          {results.length > 0 && (
            <ul className="card results-list">
              {results.map((p, index) => (
                <li
                  key={p.id}
                  className={index === highlightedIndex ? "highlighted" : ""}
                  onClick={() => handleSelect(p)}
                >
                  {p.full_name} — {p.id}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tabla de pacientes */}
      <table className="table mt-4">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Nombre completo</th>
            <th>Edad</th>
            <th>Género</th>
            <th>Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.full_name}</td>
              <td>{p.age ?? "-"}</td>
              <td>{p.gender ?? "-"}</td>
              <td>{p.contact_info ?? "-"}</td>
              <td className="flex gap-2">
                <button className="btn-ghost" onClick={() => viewPatient(p.id)}>
                  <FaUser />
                </button>
                <button className="btn-ghost" onClick={() => editPatient(p.id)}>
                  <FaEdit />
                </button>
                <button
                  className="btn-ghost text-danger"
                  onClick={() => confirmDeletePatient(p)}
                >
                  <FaTimes />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && patientToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar eliminación</h3>
            <p>
              ¿Desea eliminar al paciente{" "}
              <strong>{patientToDelete.full_name}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={deletePatient}>
                Sí, eliminar
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
