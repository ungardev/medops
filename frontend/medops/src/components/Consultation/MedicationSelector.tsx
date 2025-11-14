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
        className="input"
      />

      {isLoading && <p className="text-muted">Buscando...</p>}

      {medications.length > 0 ? (
        <ul className="border rounded p-2 max-h-40 overflow-y-auto">
          {medications.map((m) => (
            <li
              key={m.id}
              className="cursor-pointer hover:bg-gray-100 p-1"
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
          className="input"
        />
      )}
    </div>
  );
}
