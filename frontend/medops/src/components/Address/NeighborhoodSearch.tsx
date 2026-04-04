// src/components/Address/NeighborhoodSearch.tsx
import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
interface NeighborhoodSearchProps {
  value: number | null;
  onSelect: (neighborhood: any) => void;
  placeholder?: string;
}
export default function NeighborhoodSearch({ value, onSelect, placeholder }: NeighborhoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  useEffect(() => {
    if (!value) {
      setSelectedName("");
    }
  }, [value]);
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/neighborhood-search/?q=${query}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Error en búsqueda:", error);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, API_BASE]);
  const handleSelect = (item: any) => {
    setSelectedName(`${item.name} (${item.parish_name})`);
    onSelect(item);
    setShowDropdown(false);
    setQuery("");
  };
  const clearSelection = () => {
    setSelectedName("");
    setQuery("");
    onSelect({ id: null });
  };
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          className="w-full bg-white/5 border border-white/15 rounded-lg px-10 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30"
          placeholder={selectedName || placeholder || "Buscar sector o parroquia..."}
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && (
            <div className="w-3 h-3 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
          )}
          {(selectedName || query) && !loading && (
            <button 
              onClick={clearSelection}
              className="text-white/20 hover:text-white/50 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {showDropdown && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setShowDropdown(false)} />
          
          <div className="absolute z-[60] w-full mt-1 bg-[#1a1a1b] border border-white/15 shadow-2xl max-h-60 overflow-y-auto rounded-lg">
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-emerald-500/10 border-b border-white/5 last:border-none transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-3.5 h-3.5 text-white/20 group-hover:text-emerald-400" />
                  <div>
                    <p className="text-[11px] font-medium text-white/80">
                      {item.name}
                    </p>
                    <p className="text-[9px] text-white/30">
                      {item.parish_name} / {item.municipality_name} / {item.state_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}