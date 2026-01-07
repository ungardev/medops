// src/components/Consultation/MedicationSelector.tsx
import { useState, useEffect } from "react";
import { useMedicationCatalog, MedicationCatalogItem } from "../../hooks/consultations/useMedicationCatalog";
import { 
  MagnifyingGlassIcon, 
  CircleStackIcon, 
  PencilSquareIcon,
  CheckCircleIcon 
} from "@heroicons/react/24/outline";

interface MedicationSelectorProps {
  valueCatalogId?: number;
  valueText?: string;
  onChange: (data: { catalogId?: number; text?: string }) => void;
}

export default function MedicationSelector({ valueCatalogId, valueText, onChange }: MedicationSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(valueText || "");
  const [showResults, setShowResults] = useState(false);
  const { data, isLoading } = useMedicationCatalog(searchTerm);

  // Normalización de datos del hook
  const medications: MedicationCatalogItem[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.results)
    ? (data as any).results
    : [];

  const handleSelect = (med: MedicationCatalogItem) => {
    setSearchTerm(med.name);
    onChange({ catalogId: med.id, text: undefined });
    setShowResults(false);
  };

  const handleManualChange = (val: string) => {
    setSearchTerm(val);
    onChange({ catalogId: undefined, text: val });
    setShowResults(true);
  };

  return (
    <div className="relative w-full group">
      {/* INPUT PRINCIPAL */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {valueCatalogId ? (
            <CircleStackIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          ) : (
            <MagnifyingGlassIcon className="w-4 h-4 text-[var(--palantir-muted)]" />
          )}
        </div>
        
        <input
          type="text"
          placeholder="SEARCH_CATALOG_OR_TYPE_MANUAL..."
          value={searchTerm}
          onChange={(e) => handleManualChange(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="w-full bg-black/40 border border-[var(--palantir-border)] pl-10 pr-4 py-2.5 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all"
        />

        {/* INDICADOR DE ESTADO */}
        <div className="absolute inset-y-0 right-3 flex items-center">
          {valueCatalogId ? (
            <span className="text-[8px] font-black bg-[var(--palantir-active)]/20 text-[var(--palantir-active)] px-1.5 py-0.5 rounded border border-[var(--palantir-active)]/30 font-mono">
              CATALOG_MATCH
            </span>
          ) : searchTerm && (
            <span className="text-[8px] font-black bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-mono">
              MANUAL_ENTRY
            </span>
          )}
        </div>
      </div>

      {/* DROPDOWN DE RESULTADOS */}
      {showResults && (searchTerm.length > 0 || medications.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a0a0b] border border-[var(--palantir-border)] shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          
          {isLoading && (
            <div className="p-3 text-[10px] font-mono text-[var(--palantir-muted)] flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--palantir-active)] animate-pulse" />
              QUERYING_DATABASE...
            </div>
          )}

          {!isLoading && medications.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest border-b border-white/5">
                Suggested_Compounds
              </div>
              {medications.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--palantir-active)]/10 flex items-center justify-between group/item"
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[var(--palantir-text)] group-hover/item:text-[var(--palantir-active)] transition-colors">
                      {m.name}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--palantir-muted)]">
                      {m.presentation} · {m.concentration}
                    </span>
                  </div>
                  <CheckCircleIcon className="w-4 h-4 text-[var(--palantir-active)] opacity-0 group-hover/item:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {!isLoading && medications.length === 0 && searchTerm && (
            <div className="p-4 text-center">
              <PencilSquareIcon className="w-5 h-5 text-orange-400/50 mx-auto mb-2" />
              <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">
                No_Catalog_Match. <br/>
                <span className="text-orange-400/80">Proceeding_with_Manual_Entry</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* OVERLAY PARA CERRAR AL HACER CLICK FUERA */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
