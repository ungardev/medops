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
    <div className="w-full overflow-hidden border border-[var(--palantir-border)] bg-[var(--palantir-surface)] shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--palantir-bg)] border-b border-[var(--palantir-border)]">
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em]"
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
              React.Children.map(children, (child) => (
                <tr className="hover:bg-[var(--palantir-active)]/5 transition-colors group">
                  {child}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
