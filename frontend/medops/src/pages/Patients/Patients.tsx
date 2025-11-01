// src/pages/Patients/Patients.tsx
import { useState, useEffect, useRef } from "react";
import { FaUser, FaTimes } from "react-icons/fa";
import { usePatients } from "../../hooks/patients/usePatients";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/Layout/PageHeader";
import NewPatientModal from "../../components/Patients/NewPatientModal";
import DeletePatientModal from "../../components/Patients/DeletePatientModal";

import { Patient } from "../../types/patients"; // 👈 usamos el tipo global
import { differenceInYears, parseISO } from "date-fns";

// 🔹 Función auxiliar para calcular edad
function getAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  try {
    return differenceInYears(new Date(), parseISO(birthdate));
  } catch {
    return null;
  }
}

export default function Patients() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const navigate = useNavigate();
  const { data: patients, isLoading, error, refetch } = usePatients();

  const searchRef = useRef<HTMLDivElement>(null);

  // Búsqueda
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

  // 🔹 Cerrar resultados al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    }
  };

  const handleSelect = (patient: Patient) => {
    navigate(`/patients/${patient.id}`);
    setQuery("");
    setResults([]);
  };

  const viewPatient = (id: number) => {
    navigate(`/patients/${id}`);
  };

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
      {/* Encabezado unificado */}
      <PageHeader title="Pacientes" />

      {/* Buscador + Botón */}
      <div className="w-full flex items-start gap-3 mb-4">
        <div ref={searchRef} className="search-bar relative flex-1">
          <input
            type="text"
            className={`input w-full ${results.length > 0 ? "shadow-lg border-primary" : ""}`}
            placeholder="Buscar por nombre o folio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNavigation}
          />
          {results.length > 0 && (
            <ul className="card results-list absolute top-full left-0 w-full mt-1 z-20">
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

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Nuevo paciente
        </button>
      </div>

      {/* Tabla */}
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
              <td>{getAge(p.birthdate) ?? "-"}</td>
              <td>{p.gender ?? "-"}</td>
              <td>{p.contact_info ?? "-"}</td>
              <td className="flex gap-2">
                <button className="btn-ghost" onClick={() => viewPatient(p.id)}>
                  <FaUser />
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

      {/* Modales */}
      <NewPatientModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refetch}
      />

      <DeletePatientModal
        open={showDeleteModal}
        patientName={patientToDelete?.full_name ?? null}
        onConfirm={deletePatient}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
