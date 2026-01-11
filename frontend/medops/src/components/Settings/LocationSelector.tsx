import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  ChevronRightIcon, 
  CpuChipIcon 
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

  // Consumo de Hooks de Datos (Reactividad en Cascada)
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: states = [], isLoading: loadingStates } = useStates(selectedCountry);
  const { data: municipalities = [], isLoading: loadingMunis } = useMunicipalities(selectedState);
  const { data: parishes = [], isLoading: loadingParishes } = useParishes(selectedMunicipality);
  const { data: neighborhoods = [], isLoading: loadingHoods } = useNeighborhoods(selectedParish);

  // Handlers de cambio con reset de cascada
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

  // Renderizador de Select con estilo "Cyber-Terminal"
  const RenderSelect = (
    label: string, 
    value: number | string, 
    options: any[], 
    onChange: (id: string) => void, 
    disabled: boolean,
    loading: boolean
  ) => (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
      <label className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ChevronRightIcon className="w-2 h-2 text-[var(--palantir-active)]" /> {label}
        </span>
        {loading && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-[var(--palantir-active)]" />}
      </label>
      
      <div className="relative">
        <select
          value={value}
          disabled={disabled || loading}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-black/40 border border-[var(--palantir-border)] text-[10px] font-mono p-2 rounded-sm 
            focus:outline-none focus:border-[var(--palantir-active)] transition-all uppercase appearance-none
            ${disabled ? 'opacity-20 cursor-not-allowed' : 'opacity-100 hover:border-[var(--palantir-muted)]'}
          `}
        >
          <option value="">-- {loading ? 'SCANNING...' : `SELECT_${label}`} --</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-[var(--palantir-surface)] text-[var(--palantir-text)]">
              {opt.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[var(--palantir-muted)]">
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-current"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 border border-[var(--palantir-border)]/50 p-5 bg-black/10 rounded-sm relative overflow-hidden">
      {/* Indicador visual de línea de proceso */}
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--palantir-active)]/10"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-text)]">
            Geographic_Hierarchy_Link
          </span>
        </div>
        {!selectedNeighborhood && (
          <span className="text-[8px] font-mono text-amber-500 animate-pulse uppercase">
            AWAITING_COMPLETE_CHAIN
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {RenderSelect("Country", selectedCountry, countries, handleCountryChange, false, loadingCountries)}
        {RenderSelect("State", selectedState, states, handleStateChange, !selectedCountry, loadingStates)}
        {RenderSelect("Municipality", selectedMunicipality, municipalities, handleMuniChange, !selectedState, loadingMunis)}
        {RenderSelect("Parish", selectedParish, parishes, handleParishChange, !selectedMunicipality, loadingParishes)}
        {RenderSelect("Neighborhood", selectedNeighborhood, neighborhoods, handleNeighborhoodChange, !selectedParish, loadingHoods)}
      </div>

      <div className="mt-2 pt-2 border-t border-[var(--palantir-border)]/20 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${selectedNeighborhood ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500/50'}`}></div>
        <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
          {selectedNeighborhood 
            ? `RECORD_ID_${selectedNeighborhood}_VALIDATED_FOR_COMMIT` 
            : 'LOCATION_INTEGRITY_PENDING'}
        </span>
      </div>
    </div>
  );
}
