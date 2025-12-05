// src/components/Patients/PatientsTable.tsx
import React, { ReactNode } from "react";

interface PatientsTableProps {
  headers: string[];
  children: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
}

export default function PatientsTable({
  headers,
  children,
  isLoading = false,
  isError = false,
}: PatientsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* 🔹 Blindamos estilos institucionales aquí */}
      <table className="min-w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700 text-xs sm:text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-2 sm:px-4 py-1.5 sm:py-2 text-left font-semibold text-[#0d2c53] dark:text-gray-200 truncate"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {isLoading ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-[#0d2c53] dark:text-gray-400"
              >
                Cargando pacientes...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-2 sm:px-4 py-2 sm:py-3 text-center text-red-600 dark:text-red-400"
              >
                Error cargando pacientes
              </td>
            </tr>
          ) : (
            React.Children.map(children, (child, idx) => (
              <tr
                className={
                  idx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-[#0d2c53]/5 dark:bg-gray-900"
                }
              >
                {child}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
