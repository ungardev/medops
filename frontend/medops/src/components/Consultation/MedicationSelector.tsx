import { useState } from "react";
import { useMedicationCatalog, MedicationCatalogItem } from "../../hooks/consultations/useMedicationCatalog";

interface MedicationSelectorProps {
  valueCatalogId?: number;
  valueText?: string;
  onChange: (data: { catalogId?: number; text?: string }) => void;
}

export default function MedicationSelector({ valueCatalogId, valueText, onChange }: MedicationSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: medications = [], isLoading } = useMedicationCatalog(searchTerm);

  const handleSelect = (med: MedicationCatalogItem) => {
    onChange({ catalogId: med.id, text: undefined });
  };

  const handleTextChange = (text: string) => {
    onChange({ catalogId: undefined, text });
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Buscar medicamento..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                   bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                   focus:outline-none focus:ring-2 focus:ring-blue-600"
      />

      {isLoading && <p className="text-sm text-gray-600 dark:text-gray-400">Buscando...</p>}

      {medications.length > 0 ? (
        <ul className="border border-gray-300 dark:border-gray-600 rounded p-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 text-sm">
          {medications.map((m) => (
            <li
              key={m.id}
              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 text-gray-800 dark:text-gray-100"
              onClick={() => handleSelect(m)}
            >
              {m.name} — {m.presentation} — {m.concentration}
            </li>
          ))}
        </ul>
      ) : (
        <input
          type="text"
          placeholder="Nombre del medicamento"
          value={valueText || ""}
          onChange={(e) => handleTextChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      )}
    </div>
  );
}
