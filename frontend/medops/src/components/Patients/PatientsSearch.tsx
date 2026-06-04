import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface PatientsSearchProps {
  onQueryChange: (query: string) => void;
  placeholder?: string;
}

export default function PatientsSearch({ onQueryChange, placeholder }: PatientsSearchProps) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
      <input
        type="text"
        placeholder={placeholder || "Buscar paciente..."}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm text-white/70 placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/5 transition-all"
      />
    </div>
  );
}