// src/pages/Patients/Patients.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  UserPlusIcon, 
  MagnifyingGlassIcon, 
  TrashIcon,
  CpuChipIcon,
  ServerIcon
} from "@heroicons/react/24/outline";
import { usePatients } from "../../hooks/patients/usePatients";
import { usePatientsSearch } from "../../hooks/patients/usePatientsSearch";
import { useDeletePatient } from "../../hooks/patients/useDeletePatient";
import PageHeader from "../../components/Common/PageHeader";
import Pagination from "../../components/Common/Pagination";
import EmptyState from "../../components/Common/EmptyState";
import { EmptyStateRegistry } from "../../components/Common/EmptyStateRegistry";
import NewPatientModal from "../../components/Patients/NewPatientModal";
import PatientsTable from "../../components/Patients/PatientsTable";
import { Patient } from "../../types/patients";
export default function Patients() {
  const [query, setQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient();
  const { data: paged, isLoading: isLoadingPaged, refetch } = usePatients(currentPage, pageSize);
  const { data: searchResults = [], isLoading: isSearching } = usePatientsSearch(query);
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
  const pageHeader = (
    <PageHeader 
      breadcrumbs={[
        { label: "MEDOPZ", path: "/" },
        { label: "PATIENTS", active: true }
      ]}
      stats={[
        { 
          label: "TOTAL_RECORDS", 
          value: paged?.total?.toString().padStart(4, '0') || "----" 
        },
        { 
          label: "DATA_STREAM", 
          value: isLoadingPaged || isSearching ? "SCANNING" : "STABLE",
          color: isLoadingPaged || isSearching ? "text-white animate-pulse" : "text-emerald-500"
        },
        { 
          label: "VIEW_COUNT", 
          value: list.length.toString().padStart(2, '0'),
          color: "text-white"
        }
      ]}
      actions={
        <div className="flex bg-[#111] border border-white/10 p-1 rounded-sm shadow-xl">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-sm transition-all border border-white/5 active:scale-[0.98]"
          >
            <UserPlusIcon className="w-4 h-4 opacity-50" />
            NEW PATIENT
          </button>
        </div>
      }
    />
  );
  const searchSection = (
    <div className="relative group">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className={`w-5 h-5 transition-colors ${isSearching ? 'text-white animate-pulse' : 'text-white/20'}`} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="ACCESS_CENTRAL_DATABASE: BUSCAR POR NOMBRE, UID O FOLIO..."
        className="w-full bg-black/40 border border-white/10 text-white text-xs font-mono py-4 pl-12 pr-4 rounded-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10 uppercase tracking-[0.1em] shadow-inner"
      />
      {(isSearching || query.length > 0) && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <CpuChipIcon className={`w-4 h-4 ${isSearching ? 'text-white animate-spin opacity-40' : 'text-white/10'}`} />
        </div>
      )}
    </div>
  );
  const tableSection = (
    <div className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md rounded-sm overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <PatientsTable
          headers={["UID_Index", "Identity_Subject", "National_ID", "Gender", "Comm_Link", "Actions"]}
          isLoading={isLoadingPaged && query.length === 0}
        >
          {list.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={React.createElement(EmptyStateRegistry.pacientes.icon, { className: "w-12 h-12 text-white/5" })}
                  title={EmptyStateRegistry.pacientes.title}
                  message={query.trim().length > 0 ? "No matches found in the current data slice." : EmptyStateRegistry.pacientes.message}
                />
              </td>
            </tr>
          ) : (
            list.map((p) => (
              <tr 
                key={p.id} 
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => handleView(p.id)}
              >
                {/* UID - siempre visible pero más pequeño en mobile */}
                <td className="px-3 py-3 lg:py-4 text-[10px] lg:text-[11px] font-mono text-white font-bold w-[100px] lg:w-[120px]">
                  #{String(p.id).padStart(5, '0')}
                </td>
                
                {/* Nombre - siempre visible, responsivo */}
                <td className="px-3 py-3 lg:py-4 min-w-[200px] lg:min-w-[280px]">
                  <div className="text-[11px] lg:text-[12px] font-bold text-white uppercase group-hover:text-emerald-400 transition-colors line-clamp-1 cursor-pointer">
                    {p.full_name}
                  </div>
                </td>
                
                {/* National ID - oculto en mobile */}
                <td className="hidden md:table-cell px-3 py-3 lg:py-4 text-[10px] lg:text-[11px] font-mono text-white/40 w-[140px] lg:w-[160px]">
                  {p.national_id || "NOT_ASSIGNED"}
                </td>
                
                {/* Gender - oculto en mobile, visible en lg */}
                <td className="hidden md:table-cell px-3 py-3 lg:py-4 w-[100px] lg:w-[130px]">
                  <span className="text-[8px] lg:text-[9px] px-2 py-0.5 border border-white/10 text-white/40 font-mono uppercase bg-black/40 block text-center truncate">
                    {p.gender || "UDF"}
                  </span>
                </td>
                
                {/* Comm Link - oculto en mobile */}
                <td className="hidden lg:table-cell px-3 py-3 lg:py-4 text-[9px] lg:text-[10px] font-mono text-white/40 max-w-[180px] lg:max-w-[220px]">
                  <div className="truncate" title={p.contact_info || ""}>
                    {p.contact_info || "---"}
                  </div>
                </td>
                
                {/* Actions - siempre visible */}
                <td className="px-3 py-3 lg:py-4 w-[80px] lg:w-[110px]">
                  <div 
                    className="flex items-center justify-end lg:justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      disabled={isDeleting}
                      onClick={() => handleDelete(p)}
                      className="text-white/10 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </PatientsTable>
      </div>
      
      {/* Panel de paginación */}
      <div className="flex items-center justify-between p-4 border-t border-white/5 bg-black/40">
        <div className="flex items-center gap-3">
          <ServerIcon className="w-4 h-4 text-white/20" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
              Data_Slice: {((currentPage - 1) * pageSize) + 1} — {Math.min(currentPage * pageSize, paged?.total ?? 0)}
            </span>
            <span className="text-[7px] font-mono text-emerald-500/30 uppercase">Integrity_Verified: 100%</span>
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
  );
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      
      {pageHeader}
      
      {searchSection}
      
      {tableSection}
      
      <NewPatientModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={refetch}
      />
    </div>
  );
}