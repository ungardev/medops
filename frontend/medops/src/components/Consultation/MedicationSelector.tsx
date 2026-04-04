// src/components/Consultation/MedicationSelector.tsx
import { useState, useEffect, useCallback } from "react";
import { useMedicationCatalog } from "../../hooks/medications/useMedicationCatalog";
import { useRecentMedications } from "../../hooks/medications/useRecentMedications";
import { MedicationCatalogItem, RecentMedication } from "../../types/medication";
import { 
  MagnifyingGlassIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  CheckCircleIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
interface MedicationSelectorProps {
  valueCatalogId?: number;
  valueText?: string;
  onChange: (data: { 
    catalogId?: number; 
    text?: string;
    medication?: MedicationCatalogItem;
  }) => void;
}
function highlightText(text: string | null, searchTerm: string): React.ReactNode {
  if (!text || !searchTerm) return text || '';
  
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <span key={i} className="bg-emerald-500/30 text-emerald-400 font-bold">
        {part}
      </span>
    ) : (
      part
    )
  );
}
export default function MedicationSelector({ 
  valueCatalogId, 
  valueText, 
  onChange,
}: MedicationSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(valueText || "");
  const [showResults, setShowResults] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  
  const { data: medications = [], isLoading } = useMedicationCatalog(searchTerm, showResults);
  const { recentMedications, addRecent } = useRecentMedications();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.medication-selector-container')) {
        setShowResults(false);
        setShowRecent(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSelect = useCallback((med: MedicationCatalogItem) => {
    setSearchTerm(med.name);
    addRecent(med);
    onChange({ 
      catalogId: med.id, 
      text: undefined,
      medication: med 
    });
    setShowResults(false);
    setShowRecent(false);
  }, [onChange, addRecent]);
  const handleSelectRecent = useCallback((med: RecentMedication) => {
    const medication: MedicationCatalogItem = {
      id: med.id,
      name: med.name,
      generic_name: med.generic_name,
      presentation: med.presentation,
      presentation_display: med.presentation_display,
      concentration: med.concentration,
      route: med.route,
      route_display: med.route_display,
      unit: med.unit,
      unit_display: med.unit_display,
      presentation_size: null,
      concentration_detail: null,
      code: null,
      inhrr_code: null,
      inhrr_status: null,
      atc_code: null,
      is_controlled: med.is_controlled,
      therapeutic_action: null,
      source: med.source,
      is_active: true,
      last_scraped_at: null,
    };
    
    setSearchTerm(med.name);
    onChange({ 
      catalogId: med.id, 
      text: undefined,
      medication: medication 
    });
    setShowResults(false);
    setShowRecent(false);
  }, [onChange]);
  const handleManualChange = (val: string) => {
    setSearchTerm(val);
    onChange({ catalogId: undefined, text: val });
    setShowResults(true);
    setShowRecent(false);
  };
  const handleFocus = () => {
    if (searchTerm.length === 0 && recentMedications.length > 0) {
      setShowRecent(true);
    } else if (searchTerm.length >= 2) {
      setShowResults(true);
    }
  };
  const getPresentationIcon = (presentation: string): string => {
    switch (presentation?.toLowerCase()) {
      case 'tablet': return '💊';
      case 'capsule': return '💊';
      case 'injection': return '💉';
      case 'syrup': return '🧪';
      case 'solution': return '🧴';
      case 'cream': return '🧴';
      case 'drop': return '💧';
      case 'suspension': return '🍶';
      case 'ointment': return '🫙';
      case 'gel': return '🧴';
      case 'inhaler': return '🫁';
      case 'powder': return '⚗️';
      default: return '💊';
    }
  };
  const isCatalogMatch = !!valueCatalogId;
  return (
    <div className="relative w-full group medication-selector-container">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isCatalogMatch ? (
            <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
          ) : (
            <MagnifyingGlassIcon className="w-5 h-5 text-white/50" />
          )}
        </div>
        
        <input
          type="text"
          placeholder="Buscar en catálogo INHRR (15,000+ medicamentos)..."
          value={searchTerm}
          onChange={(e) => handleManualChange(e.target.value)}
          onFocus={handleFocus}
          className={`w-full bg-white/5 border pl-12 pr-28 py-3 text-[12px] text-white/80 focus:border-emerald-500/50 outline-none transition-all rounded-lg ${
            isCatalogMatch 
              ? 'border-emerald-500/30 bg-emerald-500/5' 
              : 'border-white/15'
          }`}
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-1">
          {isCatalogMatch ? (
            <>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
                INHRR
              </span>
              <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
                ✓
              </span>
            </>
          ) : searchTerm ? (
            <span className="text-[9px] font-bold bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded border border-orange-500/25">
              MANUAL
            </span>
          ) : null}
        </div>
      </div>
      {showRecent && recentMedications.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a0a0b] border border-white/15 shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 rounded-lg">
          <div className="px-4 py-2.5 text-[9px] font-bold text-white/50 uppercase tracking-wider border-b border-white/10 flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            Recientemente Usados
          </div>
          {recentMedications.map((med) => (
            <button
              key={med.id}
              onClick={() => handleSelectRecent(med)}
              className="w-full text-left px-4 py-3 hover:bg-emerald-500/10 flex items-center justify-between group/item border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getPresentationIcon(med.presentation)}</span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-white/80 group-hover/item:text-emerald-400 transition-colors">
                    {med.name}
                  </span>
                  <span className="text-[10px] text-white/50">
                    {med.generic_name} · {med.presentation_display} · {med.concentration}
                  </span>
                </div>
              </div>
              <CheckCircleIcon className="w-5 h-5 text-emerald-400 opacity-0 group-hover/item:opacity-100" />
            </button>
          ))}
        </div>
      )}
      {showResults && searchTerm.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a0a0b] border border-white/15 shadow-2xl max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 rounded-lg">
          
          {isLoading && (
            <div className="p-4 text-[10px] text-white/50 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 animate-pulse rounded-full" />
              Buscando en catálogo INHRR...
            </div>
          )}
          {!isLoading && medications && medications.length > 0 && (
            <div className="py-1">
              <div className="px-4 py-2.5 text-[9px] font-bold text-white/50 uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BeakerIcon className="w-4 h-4" />
                  Resultados ({medications.length})
                </span>
                <span className="text-[8px] opacity-50">Catálogo INHRR</span>
              </div>
              
              {medications.map((med: MedicationCatalogItem) => (
                <button
                  key={med.id}
                  onClick={() => handleSelect(med)}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-500/10 flex items-start justify-between group/item border-b border-white/5 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{getPresentationIcon(med.presentation)}</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[12px] font-medium text-white/80 group-hover/item:text-emerald-400 transition-colors leading-tight">
                        {highlightText(med.name, searchTerm)}
                      </span>
                      
                      {med.generic_name && (
                        <span className="text-[10px] text-white/50">
                          <span className="text-emerald-400/70">Genérico:</span>{' '}
                          {highlightText(med.generic_name, searchTerm)}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                          {med.presentation_display}
                        </span>
                        {med.concentration && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                            {med.concentration}
                          </span>
                        )}
                        <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/60 border border-white/10">
                          {med.route_display}
                        </span>
                        {med.is_controlled && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25 font-bold">
                            CONTROLADO
                          </span>
                        )}
                        {med.source === 'INHRR' && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">
                            INHRR
                          </span>
                        )}
                      </div>
                      {med.therapeutic_action && (
                        <span className="text-[9px] text-white/40 mt-0.5">
                          {med.therapeutic_action}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 opacity-0 group-hover/item:opacity-100 mt-1 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
          {!isLoading && (!medications || medications.length === 0) && searchTerm && (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center">
                <MagnifyingGlassIcon className="w-6 h-6 text-orange-400/70" />
              </div>
              <div>
                <p className="text-[12px] font-medium text-white/80 mb-1">
                  No encontrado en el catálogo
                </p>
                <p className="text-[10px] text-white/50">
                  "{searchTerm}"
                </p>
              </div>
              
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 mt-3">
                <p className="text-[10px] text-white/50 leading-relaxed">
                  <span className="text-emerald-400 font-bold">Nota:</span>{' '}
                  Nuestro catálogo cuenta con 15,000+ medicamentos del INHRR. 
                  Si no encuentra el medicamento, puede continuar con entrada manual.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}