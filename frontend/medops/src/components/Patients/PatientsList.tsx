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
import { UserIcon, PencilSquareIcon, TrashIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
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
                icon={<UserIcon className="w-12 h-12" />}
                title={emptyConfig.title}
                message={emptyConfig.message}
              />
            </td>
          ) : (
            data.results.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-4 text-sm text-white/70">{p.id}</td>
                <td className="px-5 py-4 text-sm text-white font-medium">{p.full_name}</td>
                <td className="px-5 py-4 text-sm text-white/60">{calculateAge(p.birthdate)}</td>
                <td className="px-5 py-4 text-sm text-white/60">{p.gender}</td>
                <td className="px-5 py-4 text-sm text-white/50 truncate">{p.contact_info || "—"}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-2 text-white/50 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        deletePatient(p.id, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ["patients"], exact: false });
                          },
                          onError: (e: any) => {
                            alert(e?.message || "Error eliminando paciente");
                          },
                        });
                      }}
                      disabled={isPending}
                      className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => navigate(`/patients/${p.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 rounded-xl text-sm font-medium transition-all"
                    >
                      Ver
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </PatientsTable>
      </div>

      <div className="sm:hidden space-y-3">
        {(!data || data.results.length === 0) ? (
          <EmptyState
            icon={<UserIcon className="w-12 h-12" />}
            title={emptyConfig.title}
            message={emptyConfig.message}
          />
        ) : (
          data.results.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/15 bg-white/5 p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-semibold text-white">
                  {p.full_name}
                </span>
                <div className="flex gap-2">
                  <button
                    className="p-2.5 text-white/50 hover:text-emerald-400 hover:bg-white/5 rounded-xl transition-colors"
                    onClick={() => navigate(`/patients/${p.id}`)}
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      deletePatient(p.id, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: ["patients"], exact: false });
                        },
                        onError: (e: any) => {
                          alert(e?.message || "Error eliminando paciente");
                        },
                      });
                    }}
                    disabled={isPending}
                    className="p-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-white/40 space-y-1.5">
                <div><span className="text-white/30">Folio:</span> {p.id}</div>
                <div><span className="text-white/30">Edad:</span> {calculateAge(p.birthdate)}</div>
                <div><span className="text-white/30">Género:</span> {p.gender}</div>
                <div><span className="text-white/30">Contacto:</span> {p.contact_info || "—"}</div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white/60 rounded-xl text-sm transition-all"
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