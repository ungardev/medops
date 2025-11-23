import React, { useState } from "react";
import { FaUser, FaTimes } from "react-icons/fa";
import { usePatients } from "../../hooks/patients/usePatients";
import { usePatientsSearch } from "../../hooks/patients/usePatientsSearch";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/Layout/PageHeader";
import PatientsSearch from "../../components/Patients/PatientsSearch";
import NewPatientModal from "../../components/Patients/NewPatientModal";
import DeletePatientModal from "../../components/Patients/DeletePatientModal";

import EmptyState from "../../components/Common/EmptyState";
import { EmptyStateRegistry } from "../../components/Common/EmptyStateRegistry";

import { Patient } from "../../types/patients";

export default function Patients() {
  const [query, setQuery] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();

  // Paginado normal
  const { data: paged, isLoading: isLoadingPaged, error, refetch } = usePatients(currentPage, pageSize);

  // Búsqueda global (no bloquea UI)
  const { data: searchResults = [], isLoading: isSearching } = usePatientsSearch(query);

  // Lista a mostrar
  const list: Patient[] =
    query.trim().length >= 2 ? searchResults : Array.isArray(paged?.results) ? paged.results : [];

  const totalPages = Math.ceil((paged?.total ?? 0) / pageSize);

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

  // Solo bloquea si el paginado inicial aún no cargó
  if (isLoadingPaged && query.trim().length < 2)
    return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando pacientes...</p>;
  if (error) return <p className="text-sm text-red-600">Error cargando pacientes</p>;

  return (
    <div className="p-4">
      <PageHeader title="Pacientes" />

      {/* Buscador + Botón */}
      <div className="w-full flex items-start gap-3 mb-2">
        <div className="flex-1">
          <PatientsSearch
            placeholder="Buscar por nombre o folio..."
            onQueryChange={(q) => setQuery(q)}
          />
        </div>

        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          + Nuevo paciente
        </button>
      </div>

      {/* Indicadores no bloqueantes */}
      <div className="flex items-center gap-3 mb-4">
        {query.trim().length >= 2 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando resultados para “{query.trim()}”
          </p>
        )}
        {isSearching && (
          <span className="text-xs text-gray-500 dark:text-gray-400">Buscando…</span>
        )}
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
                    icon={React.createElement(
                      EmptyStateRegistry.pacientes.icon,
                      EmptyStateRegistry.pacientes.iconProps
                    )}
                    title={EmptyStateRegistry.pacientes.title}
                    message={
                      query.trim().length >= 2
                        ? "No se encontraron pacientes. Intenta ajustar la búsqueda o registrar un nuevo paciente."
                        : EmptyStateRegistry.pacientes.message
                    }
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

      {/* Paginación solo en modo listado */}
      {query.trim().length < 2 && (
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
      )}

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
