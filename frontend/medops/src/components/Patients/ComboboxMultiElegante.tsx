// src/components/Patients/ComboboxMultiElegante.tsx
import React, { useState } from "react";

interface Option {
  id: number;
  name: string;
}

interface Props {
  options: Option[] | undefined | null;
  value: number[];
  onChange: (ids: number[]) => void;
  onCreate?: (name: string) => void;
  placeholder?: string;
}

export default function ComboboxMultiElegante({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Selecciona o crea opciones...",
}: Props) {
  const [input, setInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const safeOptions: Option[] = Array.isArray(options) ? options : [];

  // 🔥 Blindaje: limpiar IDs inválidos ANTES de usarlos
  const cleanValue = value.filter(
    (id) => typeof id === "number" && !isNaN(id)
  );

  const selectedOptions = safeOptions.filter((opt) =>
    cleanValue.includes(opt.id)
  );

  const filteredOptions = safeOptions.filter(
    (opt) =>
      !cleanValue.includes(opt.id) &&
      opt.name.toLowerCase().includes(input.toLowerCase())
  );

  const handleAdd = (id: number) => {
    if (typeof id !== "number" || isNaN(id)) return; // 🔥 Blindaje
    onChange([...cleanValue, id]);
    setInput("");
    setHighlightedIndex(-1);
  };

  const handleRemove = (id: number) => {
    onChange(cleanValue.filter((v) => v !== id));
  };

  const handleCreate = () => {
    const trimmed = input.trim();
    if (!onCreate || trimmed === "") return;

    onCreate(trimmed);
    setInput("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredOptions || filteredOptions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleAdd(filteredOptions[highlightedIndex].id);
      } else if (onCreate && input.trim() !== "") {
        handleCreate();
      }
    }
  };

  return (
    <div className="w-full text-xs sm:text-sm">
      {/* Chips seleccionados */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedOptions.map((opt) => (
          <span
            key={opt.id}
            className="inline-flex items-center px-2 py-1 rounded-md bg-[#0d2c53]/10 dark:bg-[#0d2c53]/40 
                       text-[#0d2c53] dark:text-gray-100 text-xs font-medium"
          >
            {opt.name}
            <button
              onClick={() => handleRemove(opt.id)}
              className="ml-1 text-red-600 dark:text-red-400 hover:underline"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setHighlightedIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                   focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
      />

      {/* Dropdown */}
      {input && (
        <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-800 shadow-sm max-h-40 overflow-y-auto">
          {filteredOptions.map((opt, idx) => (
            <div
              key={opt.id}
              onClick={() => handleAdd(opt.id)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer ${
                idx === highlightedIndex
                  ? "bg-[#0d2c53]/20 dark:bg-gray-600"
                  : "hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700"
              }`}
            >
              {opt.name}
            </div>
          ))}

          {onCreate && (
            <div
              onClick={handleCreate}
              className="px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer text-[#0d2c53] dark:text-blue-400 hover:underline"
            >
              Crear: <strong>{input}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
