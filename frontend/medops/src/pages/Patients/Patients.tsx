// src/pages/Patients.tsx
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

  const { data: paged, isLoading: isLoadingPaged, error, refetch } = usePatients(currentPage, pageSize);
  const { data: searchResults = [], isLoading: isSearching } = usePatientsSearch(query);

  const list: Patient[] =
    query.trim().length > 0 ? searchResults : Array.isArray(paged?.results) ? paged.results : [];

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

  if (isLoadingPaged && query.trim().length === 0)
    return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando pacientes...</p>;
  if (error) return <p className="text-sm text-red-600">Error cargando pacientes</p>;

    return (
    <div className="p-3 sm:p-4">
      <PageHeader title="Pacientes" />

      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-start gap-2 sm:gap-3 mb-2">
        <div className="flex-1">
          <PatientsSearch
            placeholder="Buscar por nombre o folio..."
            onQueryChange={(q) => setQuery(q)}
          />
        </div>

        <button
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors text-xs sm:text-sm"
          onClick={() => setShowCreateModal(true)}
        >
          + Nuevo paciente
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        {query.trim().length > 0 && (
          <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
            Mostrando resultados para “{query.trim()}”
          </p>
        )}
        {isSearching && (
          <span className="text-xs text-[#0d2c53] dark:text-gray-400">Buscando…</span>
        )}
      </div>

      {/* 🔹 Vista responsive: tabla en desktop, tarjetas en mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Folio</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Nombre completo</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Edad</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Género</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Contacto</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Acciones</th>
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
                      query.trim().length > 0
                        ? "No se encontraron pacientes. Intenta ajustar la búsqueda o registrar un nuevo paciente."
                        : EmptyStateRegistry.pacientes.message
                    }
                  />
                </td>
              </tr>
            ) : (
              list.map((p: Patient) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-sm text-[#0d2c53] dark:text-gray-100">{p.id}</td>
                  <td className="px-4 py-2 text-sm text-[#0d2c53] dark:text-gray-100">{p.full_name}</td>
                  <td className="px-4 py-2 text-sm text-[#0d2c53] dark:text-gray-100">{p.age ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-[#0d2c53] dark:text-gray-100">{p.gender ?? "-"}</td>
                  <td className="px-4 py-2 text-sm text-[#0d2c53] dark:text-gray-100">{p.contact_info ?? "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-md hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700 text-[#0d2c53] dark:text-gray-200"
                        onClick={() => viewPatient(p.id)}
                      >
                        <FaUser />
                      </button>
                      <button
                        className="p-2 rounded-md hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
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
      {/* 🔹 Mobile cards */}
      <div className="sm:hidden space-y-3">
        {list.length === 0 ? (
          <EmptyState
            icon={React.createElement(
              EmptyStateRegistry.pacientes.icon,
              EmptyStateRegistry.pacientes.iconProps
            )}
            title={EmptyStateRegistry.pacientes.title}
            message={
              query.trim().length > 0
                ? "No se encontraron pacientes. Intenta ajustar la búsqueda o registrar un nuevo paciente."
                : EmptyStateRegistry.pacientes.message
            }
          />
        ) : (
          list.map((p: Patient) => (
            <div
              key={p.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-[#0d2c53] dark:text-gray-100">
                  {p.full_name}
                </span>
                <div className="flex gap-2">
                  <button
                    className="p-2 rounded-md hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700 text-[#0d2c53] dark:text-gray-200"
                    onClick={() => viewPatient(p.id)}
                  >
                    <FaUser />
                  </button>
                  <button
                    className="p-2 rounded-md hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                    onClick={() => confirmDeletePatient(p)}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              <div className="text-xs text-[#0d2c53] dark:text-gray-300 space-y-1">
                <div><strong>Folio:</strong> {p.id}</div>
                <div><strong>Edad:</strong> {p.age ?? "-"}</div>
                <div><strong>Género:</strong> {p.gender ?? "-"}</div>
                <div><strong>Contacto:</strong> {p.contact_info ?? "-"}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {query.trim().length === 0 && (
        <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
          <button
            className="px-2 sm:px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 text-xs sm:text-sm disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            ← Anterior
          </button>

          <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-300">
            Página {currentPage} de {Math.max(totalPages, 1)}
          </span>

          <button
            className="px-2 sm:px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 text-xs sm:text-sm disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))}
          >
            Siguiente →
          </button>
        </div>
      )}

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
