// src/pages/Patients.tsx
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FaUser, FaEdit, FaTimes } from "react-icons/fa"; // 🔹 iconos

interface Patient {
  id: number;
  folio: string;
  full_name: string;
  age: number;
  gender: string;
  phone: string;
  national_id?: string;
}

export default function Patients() {
  const [now, setNow] = useState(new Date());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Simulación de pacientes (ejemplo)
  const [patients] = useState<Patient[]>([
    { id: 3, folio: "234243", full_name: "Verónica Alejandra Gómez Sánchez", age: 29, gender: "F", phone: "555-8785" },
    { id: 2, folio: "123456", full_name: "Luis Alejandro Castillo Michal", age: 45, gender: "M", phone: "555-9876" },
    { id: 1, folio: "897654", full_name: "Bobby Clark Terex", age: 32, gender: "M", phone: "555-1234" },
  ]);

  // 🔹 Orden descendente por id
  const sortedPatients = [...patients].sort((a, b) => b.id - a.id);

  // Actualizar reloj cada minuto
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formattedNow = format(now, "EEEE, d 'de' MMMM 'de' yyyy – HH:mm", {
    locale: es,
  });

  // Buscar pacientes
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }
    const filtered = sortedPatients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        p.folio.includes(query) ||
        (p.national_id && p.national_id.includes(query))
    );
    setResults(filtered);
    setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [query, sortedPatients]);

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
            placeholder="Buscar por nombre, cédula o folio..."
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
                  {p.full_name} {p.national_id ? `— ${p.national_id}` : ""}
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
          {sortedPatients.map((p) => (
            <tr key={p.id}>
              <td>{p.folio}</td>
              <td>{p.full_name}</td>
              <td>{p.age}</td>
              <td>{p.gender}</td>
              <td>{p.phone}</td>
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
