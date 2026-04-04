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
  
  const getHeaderWidth = (header: string) => {
    const h = header.toUpperCase();
    if (h.includes("ID")) return "w-[80px]";
    if (h.includes("NOMBRE")) return "min-w-[200px] lg:min-w-[280px]";
    if (h.includes("CÉDULA")) return "hidden md:table-cell w-[140px] lg:w-[160px]";
    if (h.includes("GÉNERO")) return "hidden md:table-cell w-[100px] lg:w-[130px]";
    if (h.includes("CONTACTO")) return "hidden lg:table-cell max-w-[180px] lg:max-w-[220px]";
    if (h.includes("ACCIONES")) return "w-[80px] lg:w-[110px] text-right";
    return "";
  };
  return (
    <div className="w-full overflow-hidden border border-white/15 bg-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed lg:table-auto">
          <thead>
            <tr className="bg-white/5 border-b border-white/15">
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider ${getHeaderWidth(h)}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center">
                  <span className="text-[11px] text-white/40 animate-pulse">
                    Cargando datos...
                  </span>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center text-red-400 text-[11px] font-medium">
                  Error al cargar los datos
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}