// src/components/Patients/ComboboxMultiElegante.tsx
import React, { useState } from "react";
import { X, Plus, ChevronDown, Command } from "lucide-react";

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
  const [isFocused, setIsFocused] = useState(false);

  const safeOptions: Option[] = Array.isArray(options) ? options : [];
  const cleanValue = value.filter((id) => typeof id === "number" && !isNaN(id));

  const selectedOptions = safeOptions.filter((opt) => cleanValue.includes(opt.id));

  const filteredOptions = safeOptions.filter(
    (opt) =>
      !cleanValue.includes(opt.id) &&
      opt.name.toLowerCase().includes(input.toLowerCase())
  );

  const handleAdd = (id: number) => {
    if (typeof id !== "number" || isNaN(id)) return;
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
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  return (
    <div className="w-full relative group">
      {/* Contenedor de Selección (Chips) */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedOptions.map((opt) => (
          <div
            key={opt.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/20 text-[var(--palantir-active)] text-xs font-bold animate-in zoom-in-95"
          >
            {opt.name}
            <button
              onClick={() => handleRemove(opt.id)}
              className="p-0.5 hover:bg-red-500/20 rounded-full text-red-400 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Input de búsqueda estilo terminal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--palantir-muted)]">
          <Command size={14} className={isFocused ? "text-[var(--palantir-active)]" : ""} />
        </div>
        <input
          type="text"
          value={input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => {
            setInput(e.target.value);
            setHighlightedIndex(-1);
            setIsFocused(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2.5 bg-[#0d1117]/50 border border-[var(--palantir-border)] rounded-lg text-sm text-white placeholder:text-[var(--palantir-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--palantir-active)]/20 focus:border-[var(--palantir-active)] transition-all"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[var(--palantir-muted)]">
          <ChevronDown size={16} className={isFocused ? "rotate-180 transition-transform" : "transition-transform"} />
        </div>
      </div>

      {/* Dropdown flotante */}
      {isFocused && (input || filteredOptions.length > 0) && (
        <div className="absolute z-[100] mt-2 w-full bg-[#11141a] border border-[var(--palantir-border)] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            {filteredOptions.map((opt, idx) => (
              <div
                key={opt.id}
                onMouseDown={(e) => e.preventDefault()} // Previene el blur del input
                onClick={() => handleAdd(opt.id)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  idx === highlightedIndex
                    ? "bg-[var(--palantir-active)]/10 text-white"
                    : "text-slate-300 hover:bg-white/[0.03]"
                }`}
              >
                <span className="text-sm">{opt.name}</span>
                {idx === highlightedIndex && (
                  <span className="text-[10px] font-mono text-[var(--palantir-active)] opacity-70">
                    ENTER PARA AÑADIR
                  </span>
                )}
              </div>
            ))}

            {onCreate && input.trim() !== "" && !filteredOptions.some(o => o.name.toLowerCase() === input.toLowerCase()) && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCreate}
                className="px-4 py-3 border-t border-[var(--palantir-border)]/50 cursor-pointer group bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <Plus size={16} />
                  <span className="text-sm font-medium">Crear nuevo: <span className="text-white font-bold">{input}</span></span>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-4 py-1.5 bg-black/40 border-t border-[var(--palantir-border)]/30 flex justify-between items-center">
            <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">Select_Engine_Active</span>
            <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">{filteredOptions.length} resultados</span>
          </div>
        </div>
      )}
    </div>
  );
}
