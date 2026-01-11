// src/pages/Patients/Patients.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  TrashIcon,
  CpuChipIcon,
  ServerIcon,
  FingerPrintIcon
} from "@heroicons/react/24/outline";

// Hooks
import { usePatients } from "../../hooks/patients/usePatients";
import { usePatientsSearch } from "../../hooks/patients/usePatientsSearch";
import { useDeletePatient } from "../../hooks/patients/useDeletePatient";

// Componentes de Common
import PageHeader from "../../components/Common/PageHeader";
import Pagination from "../../components/Common/Pagination";
import EmptyState from "../../components/Common/EmptyState";
import { EmptyStateRegistry } from "../../components/Common/EmptyStateRegistry";

// Components
import NewPatientModal from "../../components/Patients/NewPatientModal";
import PatientsTable from "../../components/Patients/PatientsTable";

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
    if (window.confirm(`⚠️ CRITICAL_NOTICE: ¿Confirmar purga del registro #${p.id}? Esta operación es irreversible.`)) {
      deletePatient(p.id, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["patients"] });
        }
      });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-[var(--palantir-bg)] min-h-screen">
      
      {/* 🛠️ HEADER TÉCNICO CON MÉTRICAS DE BASE DE DATOS */}
      <PageHeader 
        title="Subject Directory" 
        breadcrumb="MEDOPS // DATABASE // SUBJECT_RECORDS"
        stats={[
          { 
            label: "Total_Records", 
            value: paged?.total?.toString().padStart(4, '0') || "----" 
          },
          { 
            label: "Data_Stream", 
            value: isLoadingPaged || isSearching ? "SCANNING" : "STABLE",
            color: isLoadingPaged || isSearching ? "text-amber-500 animate-pulse" : "text-emerald-500"
          },
          { 
            label: "Current_View", 
            value: list.length.toString().padStart(2, '0'),
            color: "text-[var(--palantir-active)]"
          }
        ]}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[var(--palantir-active)] hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded-sm transition-all shadow-lg shadow-blue-500/20"
          >
            <UserPlusIcon className="w-4 h-4" />
            New_Subject_Entry
          </button>
        }
      />

      {/* 🔍 ACCESO A MAINFRAME (BÚSQUEDA) */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className={`w-5 h-5 transition-colors ${isSearching ? 'text-[var(--palantir-active)] animate-pulse' : 'text-[var(--palantir-muted)]'}`} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
          }}
          placeholder="ACCESS_CENTRAL_DATABASE: BUSCAR POR NOMBRE, UID O FOLIO..."
          className="w-full bg-[var(--palantir-surface)] border border-[var(--palantir-border)] text-[var(--palantir-text)] text-xs font-mono py-4 pl-12 pr-4 rounded-sm focus:outline-none focus:border-[var(--palantir-active)] transition-all placeholder:text-[var(--palantir-muted)]/30 uppercase tracking-[0.1em] shadow-inner"
        />
        {(isSearching || query.length > 0) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <CpuChipIcon className={`w-4 h-4 ${isSearching ? 'text-[var(--palantir-active)] animate-spin' : 'text-[var(--palantir-muted)] opacity-20'}`} />
          </div>
        )}
      </div>

      {/* 🖥️ SUBJECT_GRID_CONTROLLER */}
      <div className="border border-[var(--palantir-border)] bg-[var(--palantir-surface)] rounded-sm overflow-hidden shadow-2xl backdrop-blur-sm">
        <PatientsTable
          headers={["UID_Index", "Identity_Subject", "National_ID", "Class_Status", "Comm_Link", "Actions"]}
          isLoading={isLoadingPaged && query.length === 0}
        >
          {list.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={React.createElement(EmptyStateRegistry.pacientes.icon, { className: "w-12 h-12 text-[var(--palantir-muted)] opacity-20" })}
                  title={EmptyStateRegistry.pacientes.title}
                  message={query.trim().length > 0 ? "No matches found in the current data slice." : EmptyStateRegistry.pacientes.message}
                />
              </td>
            </tr>
          ) : (
            list.map((p) => (
              <tr 
                key={p.id} 
                className="border-b border-[var(--palantir-border)]/30 hover:bg-[var(--palantir-active)]/[0.03] transition-colors group"
              >
                {/* ID con formato de terminal */}
                <td className="px-4 py-4 text-[11px] font-mono text-[var(--palantir-active)] font-bold">
                  #{String(p.id).padStart(5, '0')}
                </td>
                
                {/* Nombre Completo con estilización de "registro" */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <FingerPrintIcon className="w-3 h-3 text-[var(--palantir-muted)] opacity-30" />
                    <div className="text-[11px] font-black text-[var(--palantir-text)] uppercase tracking-tight group-hover:text-[var(--palantir-active)] transition-colors">
                      {p.full_name}
                    </div>
                  </div>
                </td>

                {/* Documento de Identidad */}
                <td className="px-4 py-4 text-[11px] font-mono text-[var(--palantir-muted)]">
                  {p.national_id || "NOT_ASSIGNED"}
                </td>

                {/* Género/Status */}
                <td className="px-4 py-4">
                  <span className="text-[9px] px-2 py-0.5 border border-[var(--palantir-border)] text-[var(--palantir-muted)] font-mono uppercase bg-black/20">
                    {p.gender || "UDF"}
                  </span>
                </td>

                {/* Info de Contacto */}
                <td className="px-4 py-4 text-[10px] font-mono text-[var(--palantir-muted)] truncate max-w-[180px]">
                  {p.contact_info || "---"}
                </td>

                {/* Acciones Rápidas */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleView(p.id)}
                      className="flex items-center gap-1.5 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-all group/btn"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span className="text-[8px] font-black uppercase hidden group-hover/btn:inline">Access</span>
                    </button>
                    <button 
                      disabled={isDeleting}
                      onClick={() => handleDelete(p)}
                      className="text-red-500/30 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </PatientsTable>

        {/* 📟 PANEL DE PAGINACIÓN TÉCNICA */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--palantir-border)]/30 bg-black/20">
          <div className="flex items-center gap-3">
            <ServerIcon className="w-4 h-4 text-[var(--palantir-active)]/40" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                Data_Slice: {((currentPage - 1) * pageSize) + 1} — {Math.min(currentPage * pageSize, paged?.total ?? 0)}
              </span>
              <span className="text-[7px] font-mono text-[var(--palantir-active)]/30 uppercase">Integrity_Verified: 100%</span>
            </div>
          </div>
          
          {query.trim().length === 0 && (paged?.total ?? 0) > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={paged?.total ?? 0}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      <NewPatientModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refetch}
      />
    </div>
  );
}
