import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  ChevronRightIcon, 
  CpuChipIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';

// Hooks & Types
import { useLocationData } from '../../hooks/settings/useLocationData';

interface LocationSelectorProps {
  initialNeighborhoodId?: number;
  onLocationChange: (neighborhoodId: number) => void;
}

export default function LocationSelector({ initialNeighborhoodId, onLocationChange }: LocationSelectorProps) {
  const { 
    useCountries, 
    useStates, 
    useMunicipalities, 
    useParishes, 
    useNeighborhoods 
  } = useLocationData();

  // 🛡️ PROTECCIÓN ELITE: Estados inicializados estrictamente en NULL para evitar el error :1
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | null>(null);
  const [selectedParish, setSelectedParish] = useState<number | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | null>(initialNeighborhoodId || null);

  // Consumo de Hooks de Datos
  // El hook useCountries() no recibe parámetros, por lo que cargará Venezuela sin problemas.
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  
  // Los demás hooks solo se disparan si el ID es un número gracias al 'enabled' del useLocationData
  const { data: states = [], isLoading: loadingStates } = useStates(selectedCountry);
  const { data: municipalities = [], isLoading: loadingMunis } = useMunicipalities(selectedState);
  const { data: parishes = [], isLoading: loadingParishes } = useParishes(selectedMunicipality);
  const { data: neighborhoods = [], isLoading: loadingHoods } = useNeighborhoods(selectedParish);

  useEffect(() => {
    if (initialNeighborhoodId) {
      setSelectedNeighborhood(Number(initialNeighborhoodId));
    }
  }, [initialNeighborhoodId]);

  // 🧹 HANDLERS CON PURIFICACIÓN DE DATOS (Regex Anti-Basura)
  const cleanId = (val: string): number | null => {
    const sanitized = val.replace(/[^0-9]/g, '');
    return sanitized ? Number(sanitized) : null;
  };

  const handleCountryChange = (val: string) => {
    const id = cleanId(val);
    setSelectedCountry(id);
    setSelectedState(null);
    setSelectedMunicipality(null);
    setSelectedParish(null);
    setSelectedNeighborhood(null);
  };

  const handleStateChange = (val: string) => {
    const id = cleanId(val);
    setSelectedState(id);
    setSelectedMunicipality(null);
    setSelectedParish(null);
    setSelectedNeighborhood(null);
  };

  const handleMuniChange = (val: string) => {
    const id = cleanId(val);
    setSelectedMunicipality(id);
    setSelectedParish(null);
    setSelectedNeighborhood(null);
  };

  const handleParishChange = (val: string) => {
    const id = cleanId(val);
    setSelectedParish(id);
    setSelectedNeighborhood(null);
  };

  const handleNeighborhoodChange = (val: string) => {
    const id = cleanId(val);
    setSelectedNeighborhood(id);
    if (id) onLocationChange(id);
  };

  const RenderSelect = (
    label: string, 
    value: number | null, 
    options: any[], 
    onChange: (val: string) => void, 
    disabled: boolean,
    loading: boolean
  ) => (
    <div className={`flex flex-col gap-1.5 flex-1 min-w-[200px] transition-all duration-500 ${disabled ? 'opacity-30' : 'opacity-100'}`}>
      <label className="text-[8px] font-black font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em] flex items-center justify-between px-1">
        <span className="flex items-center gap-1">
          <ChevronRightIcon className={`w-2 h-2 ${value ? 'text-[var(--palantir-active)]' : 'text-white/20'}`} /> 
          {label}
        </span>
        {loading && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-[var(--palantir-active)]" />}
      </label>
      
      <div className="relative group">
        <select
          value={value || ""}
          disabled={disabled || loading}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-black/60 border border-[var(--palantir-border)] text-[10px] font-mono p-3 rounded-none
            focus:outline-none focus:border-[var(--palantir-active)] focus:ring-1 focus:ring-[var(--palantir-active)]/20
            transition-all uppercase appearance-none cursor-crosshair
            ${disabled ? 'grayscale italic' : 'hover:bg-black/80'}
          `}
        >
          <option value="" className="text-[var(--palantir-muted)] italic">
            -- {loading ? 'SCANNING...' : `SELECT_${label}`} --
          </option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-[#12181f] text-white">
              {opt.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[var(--palantir-active)] opacity-50"></div>
        </div>
        <div className={`absolute bottom-0 left-0 h-[1px] bg-[var(--palantir-active)] transition-all duration-700 ${value ? 'w-full opacity-100 shadow-[0_0_8px_var(--palantir-active)]' : 'w-0 opacity-0'}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 border border-[var(--palantir-border)]/30 p-6 bg-black/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/20">
            <MapPinIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--palantir-text)] leading-none block">Geographic_Core_Link</span>
            <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mt-1 block">Module: Cascade_Selector_v2.2</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          {!selectedNeighborhood ? (
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-mono text-amber-500/80 animate-pulse uppercase tracking-tighter">Chain_Incomplete</span>
              <CircleStackIcon className="w-3 h-3 text-amber-500/50 animate-bounce" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-500">
               <span className="text-[8px] font-black font-mono uppercase tracking-widest">Integrity_Verified</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 relative z-10">
        {RenderSelect("Country", selectedCountry, countries, handleCountryChange, false, loadingCountries)}
        {RenderSelect("State", selectedState, states, handleStateChange, !selectedCountry, loadingStates)}
        {RenderSelect("Municipality", selectedMunicipality, municipalities, handleMuniChange, !selectedState, loadingMunis)}
        {RenderSelect("Parish", selectedParish, parishes, handleParishChange, !selectedMunicipality, loadingParishes)}
        {RenderSelect("Neighborhood", selectedNeighborhood, neighborhoods, handleNeighborhoodChange, !selectedParish, loadingHoods)}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--palantir-border)]/10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase">Encryption</span>
            <span className="text-[8px] font-mono text-white/40 uppercase">AES-256</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase">Node</span>
            <span className="text-[8px] font-mono text-white/40 uppercase">LATAM_01</span>
          </div>
        </div>
        <div className="bg-[var(--palantir-active)]/5 px-3 py-1 border border-[var(--palantir-active)]/10">
           <span className="text-[9px] font-mono font-bold text-[var(--palantir-active)] uppercase tracking-[0.2em]">
            {selectedNeighborhood ? `PTR_ID: 0x${Number(selectedNeighborhood).toString(16).toUpperCase()}` : 'ID_PENDING'}
          </span>
        </div>
      </div>
    </div>
  );
}
