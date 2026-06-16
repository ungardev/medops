import React from "react";
import { X } from "lucide-react";
import { useDoctorSearch } from "@/hooks/core/useDoctorSearch";

interface DoctorSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (doctor: DoctorSearchResult) => void;
  onManualConfirm: (name: string) => void;
  onClear: () => void;
  selectedName?: string | null;
  label?: string;
  placeholder?: string;
  accentColor?: "emerald" | "red" | "blue" | "purple";
}

interface DoctorSearchResult {
  id: number;
  full_name: string;
  first_name?: string;
  last_name?: string;
  specialties?: { id: number; name: string }[];
}

const ACCENT_COLORS = {
  emerald: { badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", input: "focus:border-emerald-500/50" },
  red: { badge: "bg-red-500/10 border-red-500/20 text-red-300", input: "focus:border-red-500/50" },
  blue: { badge: "bg-blue-500/10 border-blue-500/20 text-blue-300", input: "focus:border-blue-500/50" },
  purple: { badge: "bg-purple-500/10 border-purple-500/20 text-purple-300", input: "focus:border-purple-500/50" },
};

export default function DoctorSearchInput({
  value,
  onChange,
  onSelect,
  onManualConfirm,
  onClear,
  selectedName,
  label,
  placeholder = "Buscar doctor...",
  accentColor = "emerald",
}: DoctorSearchInputProps) {
  const { results, loading } = useDoctorSearch(value);
  const colors = ACCENT_COLORS[accentColor];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      e.preventDefault();
      onManualConfirm(value);
      onChange("");
    }
  };

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          className={`w-full bg-white/5 border border-white/15 rounded-xl px-5 py-3 text-sm text-white/80 focus:outline-none ${colors.input} transition-all placeholder:text-white/30`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {value.length >= 2 && results.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-xl max-h-96 overflow-y-auto z-10 shadow-xl">
            {results.slice(0, 5).map((doctor) => (
              <div
                key={doctor.id}
                className="px-5 py-3 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer border-b border-white/10 last:border-b-0 transition-colors"
                onClick={() => {
                  onSelect(doctor);
                  onChange("");
                }}
              >
                <div className="font-medium">{doctor.full_name || "Sin nombre"}</div>
                <div className="text-xs text-white/50">
                  {doctor.specialties?.[0]?.name || "Sin especialidad"}
                </div>
              </div>
            ))}
          </div>
        )}
        {value.length >= 2 && results.length === 0 && !loading && (
          <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-xl p-3 z-10 shadow-xl flex flex-col gap-2">
            <span className="text-white/50 text-[11px]">No se encontraron doctores.</span>
            <button
              type="button"
              onClick={() => {
                onManualConfirm(value);
                onChange("");
              }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 text-left"
            >
              + Usar &quot;{value}&quot; como nombre manual
            </button>
          </div>
        )}
        {value.length >= 2 && loading && (
          <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-xl p-3 z-10 shadow-xl">
            <span className="text-white/50 text-[10px] flex items-center gap-2">
              <div className="w-3 h-3 border border-white/20 border-t-emerald-400 rounded-full animate-spin" />
              Buscando...
            </span>
          </div>
        )}
      </div>
      {selectedName && (
        <div className="mt-3 flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
          <span className="text-xs text-white/70">{selectedName}</span>
          <button
            onClick={onClear}
            className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-colors ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}