import React from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline';
interface Option {
  id: number;
  name: string;
}
interface FieldSelectProps {
  label: string;
  value: number | null;
  options: Option[] | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}
export default function FieldSelect({
  label, value, options, onChange, disabled, loading
}: FieldSelectProps) {
  const safeOptions = Array.isArray(options) ? options : [];
  
  return (
    <div className={`flex flex-col gap-1.5 flex-1 min-w-[200px] ${disabled ? 'opacity-30' : 'opacity-100'}`}>
      <label className="text-[8px] font-black font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em] flex items-center justify-between px-1">
        <span>{label}</span>
        {loading && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-[var(--palantir-active)]" />}
      </label>
      <select
        value={value || ""}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/60 border border-[var(--palantir-border)] text-[10px] font-mono p-3 rounded-none focus:border-[var(--palantir-active)] outline-none appearance-none uppercase"
      >
        <option value="">-- {loading ? 'LOADING...' : `SELECT_${label.toUpperCase()}`} --</option>
        {safeOptions.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-[#12181f] text-white">
            {opt.name.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}