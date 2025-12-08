// src/pages/Patients.tsx
import React, { useState } from "react";
import { FaUser, FaTimes } from "react-icons/fa";
import { usePatients } from "../../hooks/patients/usePatients";
import { usePatientsSearch } from "../../hooks/patients/usePatientsSearch";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/Layout/PageHeader";
import PatientsSearch from "../../components/Patients/PatientsSearch";
import NewPatientModal from "../../components/Patients/NewPatientModal";

import EmptyState from "../../components/Common/EmptyState";
import { EmptyStateRegistry } from "../../components/Common/EmptyStateRegistry";

import { Patient } from "../../types/patients";
import { useDeletePatient } from "../../hooks/patients/useDeletePatient";
import { useQueryClient } from "@tanstack/react-query";
import Pagination from "../../components/Common/Pagination";

export default function Patients() {
  const [query, setQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: deletePatient, isPending } = useDeletePatient();

  const { data: paged, isLoading: isLoadingPaged, error, refetch } = usePatients(currentPage, pageSize);
  const { data: searchResults = [], isLoading: isSearching } = usePatientsSearch(query);

  const list: Patient[] =
    query.trim().length > 0 ? searchResults : Array.isArray(paged?.results) ? paged.results : [];

  const totalPages = Math.ceil((paged?.total ?? 0) / pageSize);

  const viewPatient = (id: number) => navigate(`/patients/${id}`);

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
          <span className="text-xs sm:text-[#0d2c53] dark:text-gray-400">Buscando…</span>
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Folio</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Nombre completo</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Edad</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Género</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Contacto</th>
              <th className="px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-[#0d2c53] dark:text-gray-200">Acciones</th>
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
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100">{p.id}</td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100 truncate">{p.full_name}</td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100">{p.age ?? "-"}</td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100">{p.gender ?? "-"}</td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100 truncate">{p.contact_info ?? "-"}</td>
                  <td className="px-3 sm:px-4 py-1.5 sm:py-2">
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-md hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700 text-[#0d2c53] dark:text-gray-200"
                        onClick={() => viewPatient(p.id)}
                      >
                        <FaUser />
                      </button>
                      <button
                        className="p-2 rounded-md hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                        onClick={() => {
                          if (window.confirm(`⚠️ Estás a punto de eliminar al paciente ${p.full_name}. Esta acción es irreversible.`)) {
                            console.log("[ACTION] confirmado eliminar paciente", p.id);
                            deletePatient(p.id, {
                              onSuccess: () => {
                                console.log("[HOOK] éxito al eliminar", p.id);
                                queryClient.invalidateQueries({ queryKey: ["patients"], exact: false });
                              },
                              onError: (e: any) => {
                                console.error("[HOOK] error eliminando paciente:", e);
                                alert(e?.message || "Error eliminando paciente");
                              },
                            });
                          } else {
                            console.log("[ACTION] cancelado eliminar paciente", p.id);
                          }
                        }}
                        disabled={isPending}
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

      {/* ✅ Paginado alineado a la derecha */}
      {query.trim().length === 0 && (paged?.total ?? 0) > 0 && (
        <div className="flex justify-end mt-4">
          <Pagination
            currentPage={currentPage}
            totalItems={paged?.total ?? 0}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <NewPatientModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refetch}
      />
    </div>
  );
}
