import React, { useState } from "react";
import { Patient } from "types/patients";
import { useNavigate } from "react-router-dom";
import PatientsTable from "./PatientsTable";
import { useDeletePatient } from "../../hooks/patients/useDeletePatient";
import Pagination from "../Common/Pagination";
import { usePatients } from "../../hooks/patients/usePatients";
import EmptyState from "../Common/EmptyState";
import { EmptyStateRegistry } from "../Common/EmptyStateRegistry";

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
  const deletePatient = useDeletePatient();

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Hook institucionalizado con backend paginado
  const { data, isLoading, isError } = usePatients(currentPage, pageSize);

  const handleDelete = (id: number) => {
    if (confirm("¿Seguro que deseas eliminar este paciente?")) {
      deletePatient.mutate(id, {
        onSuccess: () => {
          console.log("Paciente eliminado");
        },
        onError: (e: any) => {
          console.error("Error eliminando paciente:", e);
          alert(e.message || "Error eliminando paciente");
        },
      });
    }
  };

  // Configuración institucional del EmptyState para pacientes
  const emptyConfig = EmptyStateRegistry.pacientes;
  const emptyIcon = React.createElement(emptyConfig.icon, emptyConfig.iconProps);

  return (
    <>
      <PatientsTable
        headers={[
          "Cédula",
          "Nombre completo",
          "Edad",
          "Género",
          "Contacto",
          "Acciones",
        ]}
        isLoading={isLoading}
        isError={isError}
      >
        {data?.results.length === 0 ? (
          <td colSpan={6}>
            <EmptyState
              icon={emptyIcon}
              title={emptyConfig.title}
              message={emptyConfig.message}
            />
          </td>
        ) : (
          data?.results.map((p) => (
            <>
              <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">
                {p.national_id || "—"}
              </td>
              <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">
                {p.full_name}
              </td>
              <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">
                {calculateAge(p.birthdate)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">
                {p.gender}
              </td>
              <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100">
                {p.contact_info || "—"}
              </td>
              <td className="px-4 py-2 flex gap-2">
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-sm 
                             text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => onEdit(p)}
                >
                  Editar
                </button>
                <button
                  className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-sm 
                             text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletePatient.isPending}
                >
                  {deletePatient.isPending ? "Eliminando..." : "Eliminar"}
                </button>
                <button
                  className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                  onClick={() => navigate(`/patients/${p.id}`)}
                >
                  Ver ficha
                </button>
              </td>
            </>
          ))
        )}
      </PatientsTable>

      {/* Paginación */}
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
