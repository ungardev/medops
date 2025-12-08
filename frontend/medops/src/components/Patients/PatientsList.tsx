// src/components/Patients/PatientsList.tsx
import React, { useState } from "react";
import { Patient } from "types/patients";
import { useNavigate } from "react-router-dom";
import PatientsTable from "./PatientsTable";
import { useDeletePatient } from "../../hooks/patients/useDeletePatient";
import Pagination from "../Common/Pagination";
import { usePatients } from "../../hooks/patients/usePatients";
import EmptyState from "../Common/EmptyState";
import { EmptyStateRegistry } from "../Common/EmptyStateRegistry";
import { FaUser, FaTimes } from "react-icons/fa";
import { useQueryClient } from "@tanstack/react-query";

interface PatientsListProps {
  onEdit: (patient: Patient) => void;
}

function calculateAge(birthdate?: string | null): number | string {
  if (!birthdate) return "—";
  const birth = new Date(birthdate);
  const diff = Date.now() - birth.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}

export default function PatientsList({ onEdit }: PatientsListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: deletePatient, isPending } = useDeletePatient();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, isError } = usePatients(currentPage, pageSize);

  const emptyConfig = EmptyStateRegistry.pacientes;
  const emptyIcon = React.createElement(emptyConfig.icon, emptyConfig.iconProps);

    return (
    <>
      <div className="hidden sm:block overflow-x-auto">
        <PatientsTable
          headers={["Folio", "Nombre completo", "Edad", "Género", "Contacto", "Acciones"]}
          isLoading={isLoading}
          isError={isError}
        >
          {(!data || data.results.length === 0) ? (
            <td colSpan={6}>
              <EmptyState
                icon={emptyIcon}
                title={emptyConfig.title}
                message={emptyConfig.message}
              />
            </td>
          ) : (
            data.results.map((p) => (
              <React.Fragment key={p.id}>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100 truncate">
                  {p.id}
                </td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100 truncate">
                  {p.full_name}
                </td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100">
                  {calculateAge(p.birthdate)}
                </td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100">
                  {p.gender}
                </td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100 truncate">
                  {p.contact_info || "—"}
                </td>
                <td className="px-3 sm:px-4 py-1.5 sm:py-2 flex gap-2">
                  <button
                    className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-xs sm:text-sm 
                               text-[#0d2c53] dark:text-gray-200 hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700"
                    onClick={() => onEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-xs sm:text-sm 
                               text-red-600 dark:text-red-400 hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700"
                    onClick={() => {
                      console.log("[ACTION] clic directo en eliminar para paciente", p.id);
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
                    }}
                    disabled={isPending}
                  >
                    {isPending ? "Eliminando..." : "Eliminar"}
                  </button>
                  <button
                    className="px-3 py-1 rounded-md bg-[#0d2c53] text-white text-xs sm:text-sm border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
                    onClick={() => navigate(`/patients/${p.id}`)}
                  >
                    Ver ficha
                  </button>
                </td>
              </React.Fragment>
            ))
          )}
        </PatientsTable>
      </div>

      <div className="sm:hidden space-y-3">
        {(!data || data.results.length === 0) ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyConfig.title}
            message={emptyConfig.message}
          />
        ) : (
          data.results.map((p) => (
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
                    onClick={() => navigate(`/patients/${p.id}`)}
                  >
                    <FaUser />
                  </button>
                  <button
                    className="p-2 rounded-md hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                    onClick={() => {
                      console.log("[ACTION] clic directo en eliminar para paciente", p.id);
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
                    }}
                    disabled={isPending}
                  >
                    {isPending ? "…" : <FaTimes />}
                  </button>
                </div>
              </div>
              <div className="text-xs text-[#0d2c53] dark:text-gray-300 space-y-1">
                <div><strong>Folio:</strong> {p.id}</div>
                <div><strong>Edad:</strong> {calculateAge(p.birthdate)}</div>
                <div><strong>Género:</strong> {p.gender}</div>
                <div><strong>Contacto:</strong> {p.contact_info || "—"}</div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-xs 
                             text-[#0d2c53] dark:text-gray-200 hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700"
                  onClick={() => onEdit(p)}
                >
                  Editar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {data && data.total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={data.total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
}
