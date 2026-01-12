// src/components/settings/LocationSelector.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CpuChipIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLocationData } from '../../hooks/settings/useLocationData';

interface LocationSelectorProps {
  initialNeighborhoodId?: number;
  onLocationChange: (value: number | string, parishId: number | null) => void;
}

export default function LocationSelector({ initialNeighborhoodId, onLocationChange }: LocationSelectorProps) {
  const { useCountries, useStates, useMunicipalities, useParishes, useNeighborhoods } = useLocationData();

  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | null>(null);
  const [selectedParish, setSelectedParish] = useState<number | null>(null);
  const [neighborhoodInput, setNeighborhoodInput] = useState("");

  // 🔹 Referencia para evitar el bucle infinito de inicialización
  const hasInitialized = useRef(false);

  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: states = [], isLoading: loadingStates } = useStates(selectedCountry);
  const { data: municipalities = [], isLoading: loadingMunis } = useMunicipalities(selectedState);
  const { data: parishes = [], isLoading: loadingParishes } = useParishes(selectedMunicipality);
  const { data: neighborhoods = [], isLoading: loadingHoods } = useNeighborhoods(selectedParish);

  // 🔹 Efecto corregido: Solo se ejecuta para cargar el valor inicial una vez
  useEffect(() => {
    if (initialNeighborhoodId && neighborhoods.length > 0 && !hasInitialized.current) {
      const initial = neighborhoods.find(n => n.id === initialNeighborhoodId);
      if (initial) {
        setNeighborhoodInput(initial.name);
        // Marcamos como inicializado para que cambios posteriores en 'neighborhoods'
        // no vuelvan a disparar setNeighborhoodInput y rompan el renderizado
        hasInitialized.current = true;
      }
    }
  }, [initialNeighborhoodId, neighborhoods]);

  const handleCountryChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedCountry(id);
    setSelectedState(null); 
    setSelectedMunicipality(null); 
    setSelectedParish(null); 
    setNeighborhoodInput("");
    onLocationChange("", null);
  };

  const handleStateChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedState(id);
    setSelectedMunicipality(null); 
    setSelectedParish(null); 
    setNeighborhoodInput("");
    onLocationChange("", null);
  };

  const handleMuniChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedMunicipality(id);
    setSelectedParish(null); 
    setNeighborhoodInput("");
    onLocationChange("", null);
  };

  const handleParishChange = (val: string) => {
    const id = val ? Number(val) : null;
    setSelectedParish(id);
    setNeighborhoodInput("");
    // Importante: No marcamos inicializado aquí para permitir que si el usuario
    // cambia la parroquia, el flujo siga siendo manual
    onLocationChange("", id); 
  };

  const handleNeighborhoodInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNeighborhoodInput(value);
    
    // Si el usuario escribe manualmente, bloqueamos la inicialización automática
    hasInitialized.current = true;

    const match = neighborhoods.find(n => n.name.toLowerCase() === value.toLowerCase());
    onLocationChange(match ? match.id : value, selectedParish);
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
        className="w-full bg-black/60 border border-[var(--palantir-border)] text-[10px] font-mono p-3 rounded-none focus:border-[var(--palantir-active)] outline-none appearance-none uppercase"
      >
        <option value="">-- {loading ? 'LOADING...' : `SELECT_${label.toUpperCase()}`} --</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-[#12181f] text-white">
            {opt.name.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-black/20 border border-[var(--palantir-border)]/30">
        {RenderSelect("Country", selectedCountry, countries, handleCountryChange, false, loadingCountries)}
        {RenderSelect("State", selectedState, states, handleStateChange, !selectedCountry, loadingStates)}
        {RenderSelect("Municipality", selectedMunicipality, municipalities, handleMuniChange, !selectedState, loadingMunis)}
        {RenderSelect("Parish", selectedParish, parishes, handleParishChange, !selectedMunicipality, loadingParishes)}
        
        <div className={`flex flex-col gap-1.5 flex-1 min-w-[200px] ${!selectedParish ? 'opacity-30' : 'opacity-100'}`}>
          <label className="text-[8px] font-black font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em] flex items-center justify-between px-1">
            <span>Neighborhood / Sector</span>
            {loadingHoods && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-[var(--palantir-active)]" />}
          </label>
          <div className="relative">
            <input
              list="neighborhood-options"
              value={neighborhoodInput}
              disabled={!selectedParish || loadingHoods}
              onChange={handleNeighborhoodInputChange}
              placeholder={!selectedParish ? "-- LOCKED --" : "-- TYPE_OR_SELECT_NEIGHBORHOOD --"}
              className="w-full bg-black/60 border border-[var(--palantir-border)] text-[10px] font-mono p-3 rounded-none focus:border-[var(--palantir-active)] outline-none placeholder:text-white/20"
            />
            <datalist id="neighborhood-options">
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.name} />
              ))}
            </datalist>

            {neighborhoodInput && !neighborhoods.some(n => n.name.toLowerCase() === neighborhoodInput.toLowerCase()) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <span className="text-[7px] font-black text-[var(--palantir-active)] uppercase tracking-tighter animate-pulse">New_Entry</span>
                <PlusIcon className="w-3 h-3 text-[var(--palantir-active)]" />
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
