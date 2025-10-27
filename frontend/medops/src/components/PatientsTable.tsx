import React, { ReactNode } from "react";

interface PatientsTableProps {
  headers: string[];
  children: ReactNode;
}

export default function PatientsTable({ headers, children }: PatientsTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((h, idx) => (
            <th key={idx}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
