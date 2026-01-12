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
  
  // Mapeo de anchos para que coincidan EXACTAMENTE con Patients.tsx
  const getHeaderWidth = (header: string) => {
    const h = header.toUpperCase();
    if (h.includes("UID")) return "w-[120px]";
    if (h.includes("IDENTITY")) return "min-w-[280px]";
    if (h.includes("NATIONAL")) return "w-[160px]";
    if (h.includes("STATUS")) return "w-[130px]";
    if (h.includes("COMM")) return "max-w-[220px]";
    if (h.includes("ACTIONS")) return "w-[110px] text-right";
    return "";
  };

  return (
    <div className="w-full overflow-hidden border border-[var(--palantir-border)] bg-[var(--palantir-surface)] shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed lg:table-auto">
          <thead>
            <tr className="bg-[var(--palantir-bg)] border-b border-[var(--palantir-border)]">
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em] ${getHeaderWidth(h)}`}
                >
                  {h.replace(/ /g, "_")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--palantir-border)]/30">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center">
                  <span className="text-[10px] font-mono text-[var(--palantir-active)] animate-pulse uppercase tracking-widest">
                    Executing_Data_Fetch...
                  </span>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-12 text-center text-red-500 text-[10px] font-black uppercase">
                  Data_Stream_Error_Critical
                </td>
              </tr>
            ) : (
              /* CORRECCIÓN CRÍTICA: 
                 No envolvemos el 'child' en un <tr> porque 'child' ya es un <tr> 
                 que viene desde Patients.tsx. Lo renderizamos directamente.
              */
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
