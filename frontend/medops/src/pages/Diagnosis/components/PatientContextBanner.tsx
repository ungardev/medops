// src/pages/Diagnosis/components/PatientContextBanner.tsx
import { useState } from "react";
import { searchPatients } from "@/api/patients";
import type { PatientRef } from "@/types/patients";
import { User, X, Search, AlertCircle } from "lucide-react";

interface Props {
  selectedPatient: PatientRef | null;
  onChange: (patient: PatientRef) => void;
  error?: string | null;
}

export default function PatientContextBanner({ selectedPatient, onChange, error }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q || q.length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchPatients(q);
      setResults(res.results || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  if (selectedPatient) {
    return (
      <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-white">{selectedPatient.full_name}</div>
            <div className="text-xs text-white/50">
              {selectedPatient.national_id || "Sin cédula"}
            </div>
          </div>
        </div>
        <button
          onClick={() => onChange(null as unknown as PatientRef)}
          className="text-white/40 hover:text-white transition-colors p-1"
          title="Cambiar paciente"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <input
          type="text"
          placeholder="Buscar paciente por nombre o cédula..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-sm"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
          </div>
        )}
      </div>
      {results.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {results.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onChange(p);
                setResults([]);
                setQuery("");
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
            >
              <User className="h-4 w-4 text-white/40 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{p.full_name}</div>
                <div className="text-xs text-white/40">
                  {p.national_id || "Sin cédula"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {query && !searching && results.length === 0 && (
        <div className="text-center py-3 text-white/40 text-sm">
          No se encontraron pacientes
        </div>
      )}
    </div>
  );
}
