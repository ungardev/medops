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

  const safeOptions: Option[] = Array.isArray(options) ? options : [];

  const selectedOptions = safeOptions.filter((opt) => value.includes(opt.id));
  const filteredOptions = safeOptions.filter(
    (opt) =>
      !value.includes(opt.id) &&
      opt.name.toLowerCase().includes(input.toLowerCase())
  );

  const handleAdd = (id: number) => {
    onChange([...value, id]);
    setInput("");
  };

  const handleRemove = (id: number) => {
    onChange(value.filter((v) => v !== id));
  };

  const handleCreate = () => {
    if (onCreate && input.trim() !== "") {
      onCreate(input.trim());
      setInput("");
    }
  };

  return (
    <div className="w-full text-sm">
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

      {/* Input de búsqueda/creación */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                   focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
      />

      {/* Dropdown de opciones */}
      {input && (
        <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md 
                        bg-white dark:bg-gray-800 shadow-sm max-h-40 overflow-y-auto">
          {filteredOptions.map((opt) => (
            <div
              key={opt.id}
              onClick={() => handleAdd(opt.id)}
              className="px-3 py-2 cursor-pointer hover:bg-[#0d2c53]/10 dark:hover:bg-gray-700"
            >
              {opt.name}
            </div>
          ))}
          {onCreate && (
            <div
              onClick={handleCreate}
              className="px-3 py-2 cursor-pointer text-[#0d2c53] dark:text-blue-400 hover:underline"
            >
              Crear: <strong>{input}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
