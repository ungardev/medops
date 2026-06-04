import { useState, useEffect } from "react";
import { searchPatients } from "@/api/patients";
import type { PatientRef } from "@/types/patients";
import { Search, X, User } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (patientId: number) => void;
}

export default function PatientSearchModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 1) {
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }
      try {
        const response = await searchPatients(query);
        const safeResults: PatientRef[] = response.results || [];
        setResults(safeResults);
        setHighlightedIndex(safeResults.length > 0 ? 0 : -1);
      } catch (e) {
        setResults([]);
      }
    };
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handlePatientSelected = (patient: PatientRef) => {
    setSelectedPatient(patient);
  };

  const handleProceed = () => {
    if (selectedPatient) {
      onSelect(selectedPatient.id);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handlePatientSelected(results[highlightedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#1a1a1b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Search className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Seleccionar Paciente
              </h3>
              <p className="text-sm text-white/40 mt-0.5">Buscar en la base de datos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          {!selectedPatient ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  autoFocus
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-5 py-3 pl-12 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30"
                  placeholder="Buscar por nombre o cédula..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedPatient(null); }}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {results.length > 0 && (
                <div className="border border-white/15 rounded-xl divide-y divide-white/5 max-h-48 overflow-y-auto bg-black/20">
                  {results.slice(0, 5).map((patient, index) => (
                    <div
                      key={patient.id}
                      className={`px-5 py-4 cursor-pointer flex justify-between items-center transition-colors ${
                        index === highlightedIndex ? "bg-white/5" : "hover:bg-white/5"
                      }`}
                      onClick={() => handlePatientSelected(patient)}
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-white/30" />
                        <span className="text-sm font-medium text-white/80">{patient.full_name}</span>
                      </div>
                      <span className="text-xs text-white/30">{patient.national_id || "Sin ID"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-white/15 bg-white/5 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Paciente Seleccionado</p>
                  <h3 className="text-lg font-medium text-white/90">{selectedPatient.full_name}</h3>
                  <p className="text-sm font-mono text-white/40 mt-1">{selectedPatient.national_id || "Sin ID"}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={handleProceed}
                  className="flex-1 bg-emerald-500/15 text-emerald-400 text-sm font-medium py-3 rounded-xl hover:bg-emerald-500/25 transition-all border border-emerald-500/25"
                >
                  Continuar
                </button>
                <button 
                  onClick={() => { setSelectedPatient(null); setQuery(""); }}
                  className="px-5 border border-white/15 text-white/40 text-sm font-medium rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}