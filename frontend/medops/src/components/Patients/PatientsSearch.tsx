import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPatients } from "../../api/patients";
import { PatientRef } from "../../types/patients";

interface PatientsSearchProps {
  onSelect: (patient: PatientRef) => void;
  placeholder?: string;
}

export default function PatientsSearch({ onSelect, placeholder }: PatientsSearchProps) {
  const [query, setQuery] = useState("");

  // La API ahora devuelve { count, results }
  const { data } = useQuery<{ count: number; results: PatientRef[] }>({
    queryKey: ["searchPatients", query],
    queryFn: () => searchPatients(query),
    enabled: query.length > 1,
  });

  const results = data?.results ?? [];

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={placeholder || "Buscar paciente..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                   bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                   focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
      {results.length > 0 && (
        <ul className="absolute top-full left-0 w-full mt-1 z-20 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 shadow-lg">
          {results.slice(0, 10).map((p) => (
            <li
              key={p.id}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
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
