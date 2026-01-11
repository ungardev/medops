// src/components/settings/LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import { MapPinIcon, ChevronRightIcon, CpuChipIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import { useLocationData } from '../../hooks/settings/useLocationData';

interface LocationSelectorProps {
  initialNeighborhoodId?: number;
  onLocationChange: (neighborhoodId: number) => void;
}

export default function LocationSelector({ initialNeighborhoodId, onLocationChange }: LocationSelectorProps) {
  const { useCountries, useStates, useMunicipalities, useParishes, useNeighborhoods } = useLocationData();

  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | null>(null);
  const [selectedParish, setSelectedParish] = useState<number | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | null>(initialNeighborhoodId || null);

  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: states = [], isLoading: loadingStates } = useStates(selectedCountry);
  const { data: municipalities = [], isLoading: loadingMunis } = useMunicipalities(selectedState);
  const { data: parishes = [], isLoading: loadingParishes } = useParishes(selectedMunicipality);
  const { data: neighborhoods = [], isLoading: loadingHoods } = useNeighborhoods(selectedParish);

  useEffect(() => {
    if (initialNeighborhoodId) setSelectedNeighborhood(Number(initialNeighborhoodId));
  }, [initialNeighborhoodId]);

  const cleanId = (val: string): number | null => {
    const sanitized = val.replace(/[^0-9]/g, '');
    return sanitized ? Number(sanitized) : null;
  };

  const handleCountryChange = (val: string) => {
    const id = cleanId(val);
    setSelectedCountry(id);
    setSelectedState(null); setSelectedMunicipality(null); setSelectedParish(null); setSelectedNeighborhood(null);
  };

  const handleStateChange = (val: string) => {
    const id = cleanId(val);
    setSelectedState(id);
    setSelectedMunicipality(null); setSelectedParish(null); setSelectedNeighborhood(null);
  };

  const handleMuniChange = (val: string) => {
    const id = cleanId(val);
    setSelectedMunicipality(id);
    setSelectedParish(null); setSelectedNeighborhood(null);
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

  const RenderSelect = (label: string, value: number | null, options: any[], onChange: (val: string) => void, disabled: boolean, loading: boolean) => (
    <div className={`flex flex-col gap-1.5 flex-1 min-w-[200px] transition-all duration-500 ${disabled ? 'opacity-30' : 'opacity-100'}`}>
      <label className="text-[8px] font-black font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em] flex items-center justify-between px-1">
        <span className="flex items-center gap-1">
          <ChevronRightIcon className={`w-2 h-2 ${value ? 'text-[var(--palantir-active)]' : 'text-white/20'}`} /> {label}
        </span>
        {loading && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-[var(--palantir-active)]" />}
      </label>
      <div className="relative group">
        <select
          value={value || ""}
          disabled={disabled || loading}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/60 border border-[var(--palantir-border)] text-[10px] font-mono p-3 rounded-none focus:outline-none focus:border-[var(--palantir-active)] transition-all uppercase appearance-none cursor-crosshair hover:bg-black/80"
        >
          <option value="">-- {loading ? 'SCANNING...' : `SELECT_${label}`} --</option>
          {options.map((opt) => <option key={opt.id} value={opt.id} className="bg-[#12181f] text-white">{opt.name}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[var(--palantir-active)] opacity-50"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 border border-[var(--palantir-border)]/30 p-6 bg-black/30 relative">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/20"><MapPinIcon className="w-4 h-4 text-[var(--palantir-active)]" /></div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--palantir-text)] leading-none block">Geographic_Core_Link</span>
            <span className="text-[7px] font-mono text-[var(--palantir-muted)] uppercase mt-1 block">Module: Cascade_Selector_v2.2</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 relative z-10">
        {RenderSelect("Country", selectedCountry, countries, handleCountryChange, false, loadingCountries)}
        {RenderSelect("State", selectedState, states, handleStateChange, !selectedCountry, loadingStates)}
        {RenderSelect("Municipality", selectedMunicipality, municipalities, handleMuniChange, !selectedState, loadingMunis)}
        {RenderSelect("Parish", selectedParish, parishes, handleParishChange, !selectedMunicipality, loadingParishes)}
        {RenderSelect("Neighborhood", selectedNeighborhood, neighborhoods, handleNeighborhoodChange, !selectedParish, loadingHoods)}
      </div>
    </div>
  );
}
