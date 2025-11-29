import { useState } from "react";

interface PatientsSearchProps {
  onQueryChange: (query: string) => void;
  placeholder?: string;
}

export default function PatientsSearch({ onQueryChange, placeholder }: PatientsSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onQueryChange(value);
  };

  return (
    <input
      type="text"
      placeholder={placeholder || "Buscar paciente..."}
      value={query}
      onChange={handleChange}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                 bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
    />
  );
}
