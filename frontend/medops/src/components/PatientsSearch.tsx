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
    <div className="search-container">
      <input
        className="input"
        type="text"
        placeholder={placeholder || "Buscar paciente..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="results-list card">
          {results.map((p) => (
            <li
              key={p.id}
              onClick={() => {
                onSelect(p);
                setQuery(p.full_name);
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
