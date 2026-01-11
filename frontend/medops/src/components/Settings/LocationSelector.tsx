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

  // Estados locales para las selecciones actuales (IDs)
  const [selectedCountry, setSelectedCountry] = useState<number | string>('');
  const [selectedState, setSelectedState] = useState<number | string>('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | string>('');
  const [selectedParish, setSelectedParish] = useState<number | string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | string>(initialNeighborhoodId || '');

  // Consumo de Hooks de Datos (Reactividad en Cascada Blindada)
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: states = [], isLoading: loadingStates } = useStates(selectedCountry);
  const { data: municipalities = [], isLoading: loadingMunis } = useMunicipalities(selectedState);
  const { data: parishes = [], isLoading: loadingParishes } = useParishes(selectedMunicipality);
  const { data: neighborhoods = [], isLoading: loadingHoods } = useNeighborhoods(selectedParish);

  // EFECTO DE HIDRATACIÓN: Si recibimos un initialId, la jerarquía se autocompleta desde el backend
  // (Nota: Esto asume que el backend te envía la cadena de IDs en el objeto de Institución)
  useEffect(() => {
    if (initialNeighborhoodId) {
      setSelectedNeighborhood(initialNeighborhoodId);
    }
  }, [initialNeighborhoodId]);

  // Handlers de cambio con reset de cascada total (Clean State Policy)
  const handleCountryChange = (id: string) => {
    setSelectedCountry(id);
    setSelectedState('');
    setSelectedMunicipality('');
    setSelectedParish('');
    setSelectedNeighborhood('');
  };

  const handleStateChange = (id: string) => {
    setSelectedState(id);
    setSelectedMunicipality('');
    setSelectedParish('');
    setSelectedNeighborhood('');
  };

  const handleMuniChange = (id: string) => {
    setSelectedMunicipality(id);
    setSelectedParish('');
    setSelectedNeighborhood('');
  };

  const handleParishChange = (id: string) => {
    setSelectedParish(id);
    setSelectedNeighborhood('');
  };

  const handleNeighborhoodChange = (id: string) => {
    setSelectedNeighborhood(id);
    onLocationChange(Number(id));
  };

  // Renderizador de Select con estética de "Hardware Module"
  const RenderSelect = (
    label: string, 
    value: number | string, 
    options: any[], 
    onChange: (id: string) => void, 
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
          value={value}
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
            -- {loading ? 'SCANNING_PROTOCOLS...' : `SELECT_${label}`} --
          </option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-[#12181f] text-white py-2">
              {opt.name}
            </option>
          ))}
        </select>
        
        {/* Decoración visual de flecha personalizada */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[var(--palantir-active)] opacity-50"></div>
        </div>

        {/* Borde inferior dinámico */}
        <div className={`absolute bottom-0 left-0 h-[1px] bg-[var(--palantir-active)] transition-all duration-700 ${value ? 'w-full opacity-100 shadow-[0_0_8px_var(--palantir-active)]' : 'w-0 opacity-0'}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 border border-[var(--palantir-border)]/30 p-6 bg-black/30 rounded-none relative overflow-hidden group/selector">
      
      {/* Background Grid Pattern (Look Elite) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {/* Indicador de proceso lateral */}
      <div className={`absolute top-0 left-0 w-[2px] h-full transition-colors duration-1000 ${selectedNeighborhood ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-[var(--palantir-active)]/20'}`}></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/20">
            <MapPinIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--palantir-text)] leading-none block">
              Geographic_Core_Link
            </span>
            <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest mt-1 block">
              Module: Cascade_Selector_v2.1
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          {!selectedNeighborhood ? (
            <div className="flex items-center gap-2">
               <span className="text-[8px] font-mono text-amber-500/80 animate-pulse uppercase tracking-tighter">
                Waiting_for_chain_completion
              </span>
              <CircleStackIcon className="w-3 h-3 text-amber-500/50 animate-bounce" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-500">
               <span className="text-[8px] font-black font-mono uppercase tracking-widest">
                Integrity_Verified
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Selectores con espaciado Elite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 relative z-10">
        {RenderSelect("Country", selectedCountry, countries, handleCountryChange, false, loadingCountries)}
        {RenderSelect("State", selectedState, states, handleStateChange, !selectedCountry, loadingStates)}
        {RenderSelect("Municipality", selectedMunicipality, municipalities, handleMuniChange, !selectedState, loadingMunis)}
        {RenderSelect("Parish", selectedParish, parishes, handleParishChange, !selectedMunicipality, loadingParishes)}
        {RenderSelect("Neighborhood", selectedNeighborhood, neighborhoods, handleNeighborhoodChange, !selectedParish, loadingHoods)}
      </div>

      {/* Footer Metadata */}
      <div className="mt-4 pt-4 border-t border-[var(--palantir-border)]/10 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase">Encryption_Status</span>
            <span className="text-[8px] font-mono text-white/40 uppercase">AES-256_ACTIVE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase">Sync_Node</span>
            <span className="text-[8px] font-mono text-white/40 uppercase">SRV_LATAM_01</span>
          </div>
        </div>
        
        <div className="bg-[var(--palantir-active)]/5 px-3 py-1 border border-[var(--palantir-active)]/10">
           <span className="text-[9px] font-mono font-bold text-[var(--palantir-active)] uppercase tracking-[0.2em]">
            {selectedNeighborhood ? `PTR_ID: 0x${Number(selectedNeighborhood).toString(16).toUpperCase()}` : '0x000000'}
          </span>
        </div>
      </div>
    </div>
  );
}
