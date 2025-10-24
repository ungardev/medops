import React, { ReactNode } from "react";

interface PatientsTableProps {
  headers: string[];
  children: ReactNode; // aquí van las filas <tr> que renderices
}

export default function PatientsTable({ headers, children }: PatientsTableProps) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                style={{
                  borderBottom: "2px solid #ddd",
                  textAlign: "left",
                  padding: "8px",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
