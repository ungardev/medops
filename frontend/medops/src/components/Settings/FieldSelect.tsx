// src/components/Settings/FieldSelect.tsx
import React from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { LocationOption, normalizeLocationOption } from '../../types/common';
interface FieldSelectProps {
  label: string;
  value: number | null;
  options: LocationOption[] | any[] | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}
export default function FieldSelect({
  label, value, options, onChange, disabled, loading
}: FieldSelectProps) {
  const safeOptions = React.useMemo(() => {
    if (!Array.isArray(options)) return [];
    
    return options
      .map(normalizeLocationOption)
      .filter((opt): opt is LocationOption => opt !== null);
  }, [options]);
  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-40' : 'opacity-100'}`}>
      <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider flex items-center justify-between px-1">
        <span>{label}</span>
        {loading && <CpuChipIcon className="w-3.5 h-3.5 animate-spin text-white/40" />}
      </label>
      <select
        value={value || ""}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none disabled:opacity-40"
      >
        <option value="">{loading ? 'Cargando...' : `Seleccionar ${label.toLowerCase()}...`}</option>
        {safeOptions.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-[#1a1a1b] text-white">
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}