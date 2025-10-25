// src/components/PatientsSearch.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPatients } from "../api/patients";
import { PatientRef } from "../types/patients";

interface PatientsSearchProps {
  onSelect: (patient: PatientRef) => void;
  placeholder?: string;
}

export default function PatientsSearch({ onSelect, placeholder }: PatientsSearchProps) {
  const [query, setQuery] = useState("");

  const { data: results = [] } = useQuery<PatientRef[]>({
    queryKey: ["searchPatients", query],
    queryFn: () => searchPatients(query),
    enabled: query.length > 1,
  });

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder={placeholder || "Buscar paciente..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul
          style={{
            position: "absolute",
            background: "white",
            border: "1px solid #ccc",
            width: "100%",
            maxHeight: "150px",
            overflowY: "auto",
            zIndex: 10,
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {results.map((p) => (
            <li
              key={p.id}
              style={{ padding: "0.5rem", cursor: "pointer" }}
              onClick={() => {
                onSelect(p);
                setQuery(p.full_name); // mostrar nombre en el input
              }}
            >
              {p.full_name} {p.national_id && `– ${p.national_id}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
