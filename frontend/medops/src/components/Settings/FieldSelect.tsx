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
  // Normalizar todas las opciones al formato correcto
  const safeOptions = React.useMemo(() => {
    if (!Array.isArray(options)) return [];
    
    return options
      .map(normalizeLocationOption)
      .filter((opt): opt is LocationOption => opt !== null);
  }, [options]);
  // 🚀 DEBUGGING MEJORADO - VERIFICAR CARGA COMPLETA
  React.useEffect(() => {
    console.log(`🔍 FieldSelect [${label}]:`, {
      optionsCount: safeOptions.length,
      loading,
      disabled,
      currentValue: value,
      rawOptions: options?.length || 0,
      firstOption: safeOptions[0],
      lastOption: safeOptions[safeOptions.length - 1],
      sampleData: safeOptions.slice(0, 3)
    });
  }, [label, safeOptions, loading, disabled, value, options]);
  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-30' : 'opacity-100'}`}>
      <label className="text-[8px] font-black font-mono text-white/30 uppercase tracking-[0.2em] flex items-center justify-between px-1">
        <span>{label}</span>
        {loading && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-white/60" />}
      </label>
      <select
        value={value || ""}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/60 border border-white/10 text-[10px] font-mono p-3 rounded-none focus:border-white/30 outline-none appearance-none uppercase"
      >
        <option value="">-- {loading ? 'LOADING...' : `SELECT_${label.toUpperCase()}`} --</option>
        {safeOptions.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-[#12181f] text-white">
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}