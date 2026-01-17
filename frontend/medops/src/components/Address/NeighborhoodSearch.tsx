// src/components/Address/NeighborhoodSearch.tsx
import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface NeighborhoodSearchProps {
  value: number | null; // El ID del neighborhood seleccionado
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

  // ✅ Efecto para limpiar o establecer el nombre si el valor cambia externamente
  useEffect(() => {
    if (!value) {
      setSelectedName("");
    }
    // Si el valor existe pero no tenemos nombre (ej. carga inicial), 
    // podrías hacer una petición al endpoint de detalle, 
    // pero usualmente el 'initialData' del modal ya trae el objeto completo.
  }, [value]);

  // Lógica de búsqueda con debounce
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) { // Bajado a 2 para mejor UX
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
        console.error("SEARCH_ERROR", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, API_BASE]);

  const handleSelect = (item: any) => {
    // Guardamos un nombre legible para el input
    setSelectedName(`${item.name} (${item.parish_name})`);
    onSelect(item); // Pasamos el objeto completo al padre
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
          className="w-full bg-black/60 border border-white/10 rounded-sm px-10 py-3 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/20"
          placeholder={selectedName || placeholder || "TYPE_SECTOR_OR_PARISH..."}
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
            <div className="w-3 h-3 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          )}
          {(selectedName || query) && !loading && (
            <button 
              onClick={clearSelection}
              className="text-white/20 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && results.length > 0 && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div className="fixed inset-0 z-[55]" onClick={() => setShowDropdown(false)} />
          
          <div className="absolute z-[60] w-full mt-1 bg-[#0A0A0A] border border-white/10 shadow-2xl max-h-60 overflow-y-auto scrollbar-hide">
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-emerald-500/10 border-b border-white/5 last:border-none transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-3 h-3 text-white/20 group-hover:text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                      {item.name}
                    </p>
                    <p className="text-[8px] font-mono text-white/40 uppercase">
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
