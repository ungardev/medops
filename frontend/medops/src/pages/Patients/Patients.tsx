// src/pages/Patients/Patients.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  TrashIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

// Hooks
import { usePatients } from "../../hooks/patients/usePatients";
import { usePatientsSearch } from "../../hooks/patients/usePatientsSearch";
import { useDeletePatient } from "../../hooks/patients/useDeletePatient";

// ✅ Importación corregida a Common
import PageHeader from "../../components/Common/PageHeader";

// Components
import NewPatientModal from "../../components/Patients/NewPatientModal";
import PatientsTable from "../../components/Patients/PatientsTable";
import Pagination from "../../components/Common/Pagination";
import EmptyState from "../../components/Common/EmptyState";
import { EmptyStateRegistry } from "../../components/Common/EmptyStateRegistry";

// Types
import { Patient } from "../../types/patients";

export default function Patients() {
  const [query, setQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient();

  // Data Fetching
  const { data: paged, isLoading: isLoadingPaged, refetch } = usePatients(currentPage, pageSize);
  const { data: searchResults = [], isLoading: isSearching } = usePatientsSearch(query);

  // Selector de lista (Búsqueda vs Paginación)
  const list = useMemo(() => {
    return query.trim().length > 0 
      ? searchResults 
      : (paged?.results || []);
  }, [query, searchResults, paged]);

  const handleView = (id: number) => navigate(`/patients/${id}`);

  const handleDelete = (p: Patient) => {
    if (window.confirm(`⚠️ CRITICAL: ¿Confirmar eliminación del registro ${p.id}?`)) {
      deletePatient(p.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["patients"] });
        }
      });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      {/* Header técnico con el PageHeader de Common */}
      <PageHeader 
        title="Directorio de Pacientes" 
        breadcrumb="MEDOPS // DATABASE // SUBJECT_RECORDS"
      />

      {/* Barra de Herramientas (Search & Create) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-9 relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className={`w-5 h-5 transition-colors ${isSearching ? 'text-[var(--palantir-active)] animate-pulse' : 'text-[var(--palantir-muted)]'}`} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1); // Reset de página al buscar
            }}
            placeholder="ACCESS_DATABASE: BUSCAR POR NOMBRE O FOLIO..."
            className="w-full bg-[var(--palantir-surface)] border border-[var(--palantir-border)] text-[var(--palantir-text)] text-xs font-mono py-3 pl-10 pr-4 rounded-sm focus:outline-none focus:border-[var(--palantir-active)] transition-all placeholder:text-[var(--palantir-muted)]/30 uppercase"
          />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="md:col-span-3 flex items-center justify-center gap-2 bg-[var(--palantir-active)] hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] py-3 rounded-sm transition-all shadow-lg shadow-blue-500/10"
        >
          <UserPlusIcon className="w-4 h-4" />
          New_Subject_Entry
        </button>
      </div>

      {/* Indicador de proceso de búsqueda */}
      {query.trim().length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <CpuChipIcon className="w-4 h-4 text-[var(--palantir-active)] animate-spin-slow" />
          <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
            Filtering_Results: <span className="text-[var(--palantir-text)]">"{query}"</span> — Found {list.length} matches
          </span>
        </div>
      )}

      {/* Grid de Datos Principal */}
      <PatientsTable
        headers={["ID", "Subject_Name", "Identity_UID", "Status", "Contact_Info", "Actions"]}
        isLoading={isLoadingPaged && query.length === 0}
      >
        {list.length === 0 ? (
          <tr>
            <td colSpan={6}>
              <EmptyState
                icon={React.createElement(EmptyStateRegistry.pacientes.icon, { className: "w-12 h-12 text-[var(--palantir-muted)] opacity-20" })}
                title={EmptyStateRegistry.pacientes.title}
                message={query.trim().length > 0 ? "No se encontraron coincidencias en el mainframe." : EmptyStateRegistry.pacientes.message}
              />
            </td>
          </tr>
        ) : (
          list.map((p) => (
            <React.Fragment key={p.id}>
              {/* ID con formato de terminal */}
              <td className="px-4 py-3 text-[11px] font-mono text-[var(--palantir-active)] font-bold">
                #{String(p.id).padStart(4, '0')}
              </td>
              
              {/* Nombre Completo */}
              <td className="px-4 py-3">
                <div className="text-[11px] font-bold text-[var(--palantir-text)] uppercase tracking-tight">
                  {p.full_name}
                </div>
              </td>

              {/* Documento de Identidad */}
              <td className="px-4 py-3 text-[11px] font-mono text-[var(--palantir-muted)]">
                {p.national_id || "NOT_ASSIGNED"}
              </td>

              {/* Género/Status */}
              <td className="px-4 py-3">
                <span className="text-[9px] px-2 py-0.5 border border-[var(--palantir-border)] text-[var(--palantir-muted)] font-mono uppercase">
                  {p.gender || "Undefined"}
                </span>
              </td>

              {/* Info de Contacto (Usando contact_info para evitar error de tipos) */}
              <td className="px-4 py-3 text-[10px] font-mono text-[var(--palantir-muted)] truncate max-w-[150px]">
                {p.contact_info || "NO_COMM_DATA"}
              </td>

              {/* Acciones Rápidas */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleView(p.id)}
                    className="p-1 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-colors"
                    title="Open Record"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={() => handleDelete(p)}
                    className="p-1 text-red-500/40 hover:text-red-500 transition-colors"
                    title="Purge Record"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </React.Fragment>
          ))
        )}
      </PatientsTable>

      {/* Paginación (Se oculta si el usuario está buscando) */}
      {query.trim().length === 0 && (paged?.total ?? 0) > 0 && (
        <div className="pt-2">
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
