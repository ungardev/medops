// src/pages/Patients/Patients.tsx
import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaTimes } from "react-icons/fa";
import { usePatients } from "../../hooks/patients/usePatients";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/Layout/PageHeader";
import NewPatientModal from "../../components/Patients/NewPatientModal";
import DeletePatientModal from "../../components/Patients/DeletePatientModal";

import EmptyState from "../../components/Common/EmptyState";
import { EmptyStateRegistry } from "../../components/Common/EmptyStateRegistry";

import { Patient } from "../../types/patients";

export default function Patients() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();
  const { data: patients, isLoading, error, refetch } = usePatients(currentPage, pageSize);

  const searchRef = useRef<HTMLDivElement>(null);

  // Buscador blindado
  useEffect(() => {
    if (!patients || !Array.isArray(patients.results)) {
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const q = trimmed.toLowerCase();
    const filtered = patients.results.filter((p: Patient) => {
      const name = (p.full_name ?? "").toLowerCase();
      const idStr = String(p.id ?? "");
      return name.includes(q) || idStr.includes(q);
    });

    setResults(filtered);
    setHighlightedIndex(filtered.length > 0 ? 0 : -1);
  }, [query, patients]);

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

  const viewPatient = (id: number) => navigate(`/patients/${id}`);

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

  if (isLoading) return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando pacientes...</p>;
  if (error) return <p className="text-sm text-red-600">Error cargando pacientes</p>;

  const list: Patient[] = Array.isArray(patients?.results) ? patients!.results : [];
  const totalPages = Math.ceil((patients?.total ?? 0) / pageSize);

  return (
    <div className="p-4">
      <PageHeader title="Pacientes" />

      {/* Buscador + Botón */}
      <div className="w-full flex items-start gap-3 mb-4">
        <div ref={searchRef} className="relative flex-1">
          <input
            type="text"
            className={`px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                        bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                        focus:outline-none focus:ring-2 focus:ring-blue-600 w-full 
                        ${results.length > 0 ? "shadow-lg border-blue-600" : ""}`}
            placeholder="Buscar por nombre o folio..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNavigation}
          />
          {results.length > 0 && (
            <ul className="absolute top-full left-0 w-full mt-1 z-20 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg">
              {results.map((p: Patient, index) => (
                <li
                  key={p.id}
                  className={`px-3 py-2 text-sm cursor-pointer 
                              ${index === highlightedIndex ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"}`}
                  onClick={() => handleSelect(p)}
                >
                  {p.full_name} — {p.id}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          + Nuevo paciente
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Folio</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Nombre completo</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Edad</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Género</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Contacto</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6">
                  <EmptyState
                    icon={React.createElement(EmptyStateRegistry.pacientes.icon, EmptyStateRegistry.pacientes.iconProps)}
                    title={EmptyStateRegistry.pacientes.title}
                    message={EmptyStateRegistry.pacientes.message}
                  />
                </td>
              </tr>
            ) : (
              list.map((p: Patient) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">{p.id}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">{p.full_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">{p.age ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">{p.gender ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">{p.contact_info ?? "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        onClick={() => viewPatient(p.id)}
                      >
                        <FaUser />
                      </button>
                      <button
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                        onClick={() => confirmDeletePatient(p)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
        <button
          className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-sm disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          ← Anterior
        </button>

        <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
          Página {currentPage} de {Math.max(totalPages, 1)}
        </span>

        <button
          className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-sm disabled:opacity-50"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))}
        >
          Siguiente →
        </button>
      </div>

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
