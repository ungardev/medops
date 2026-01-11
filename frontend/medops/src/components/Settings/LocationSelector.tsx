// src/components/settings/LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import { MapPinIcon, ChevronRightIcon, CpuChipIcon } from '@heroicons/react/24/outline';
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

  const handleCountryChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedCountry(id);
    setSelectedState(null); setSelectedMunicipality(null); setSelectedParish(null); setSelectedNeighborhood(null);
  };

  const handleStateChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedState(id);
    setSelectedMunicipality(null); setSelectedParish(null); setSelectedNeighborhood(null);
  };

  const handleMuniChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedMunicipality(id);
    setSelectedParish(null); setSelectedNeighborhood(null);
  };

  const handleParishChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedParish(id);
    setSelectedNeighborhood(null);
  };

  const handleNeighborhoodChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedNeighborhood(id);
    if (id) onLocationChange(id);
  };

  const RenderSelect = (label: string, value: number | null, options: any[], onChange: (val: string) => void, disabled: boolean, loading: boolean) => (
    <div className={`flex flex-col gap-1.5 flex-1 min-w-[200px] ${disabled ? 'opacity-30' : 'opacity-100'}`}>
      <label className="text-[8px] font-black font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em] flex items-center justify-between px-1">
        <span>{label}</span>
        {loading && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-[var(--palantir-active)]" />}
      </label>
      <select
        value={value || ""}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/60 border border-[var(--palantir-border)] text-[10px] font-mono p-3 rounded-none focus:border-[var(--palantir-active)] outline-none appearance-none"
      >
        <option value="">-- {loading ? 'LOADING...' : `SELECT_${label}`} --</option>
        {options.map((opt) => <option key={opt.id} value={opt.id} className="bg-[#12181f] text-white">{opt.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-black/20 border border-[var(--palantir-border)]/30">
        {RenderSelect("Country", selectedCountry, countries, handleCountryChange, false, loadingCountries)}
        {RenderSelect("State", selectedState, states, handleStateChange, !selectedCountry, loadingStates)}
        {RenderSelect("Municipality", selectedMunicipality, municipalities, handleMuniChange, !selectedState, loadingMunis)}
        {RenderSelect("Parish", selectedParish, parishes, handleParishChange, !selectedMunicipality, loadingParishes)}
        {RenderSelect("Neighborhood", selectedNeighborhood, neighborhoods, handleNeighborhoodChange, !selectedParish, loadingHoods)}
    </div>
  );
}
