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
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
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
                className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                Cargando pacientes...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-3 text-center text-sm text-red-600 dark:text-red-400"
              >
                Error cargando pacientes
              </td>
            </tr>
          ) : (
            // Aplicamos alternancia de filas
            React.Children.map(children, (child, idx) => (
              <tr
                className={
                  idx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-900"
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
