// src/hooks/medications/useRecentMedications.ts
import { useState, useEffect, useCallback } from 'react';
import { RecentMedication, MedicationCatalogItem } from '../../types/medication';
const STORAGE_KEY = 'medopz_recent_medications';
const MAX_RECENT = 5;
export function useRecentMedications() {
  const [recentMedications, setRecentMedications] = useState<RecentMedication[]>([]);
  // Cargar desde localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentMedications(parsed);
      } catch (e) {
        console.error('Error parsing recent medications:', e);
      }
    }
  }, []);
  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentMedications));
  }, [recentMedications]);
  const addRecent = useCallback((medication: MedicationCatalogItem) => {
    setRecentMedications((prev) => {
      // Remover si ya existe
      const filtered = prev.filter(m => m.id !== medication.id);
      
      // Agregar al inicio con todos los campos necesarios
      const newRecent: RecentMedication = {
        id: medication.id,
        name: medication.name,
        generic_name: medication.generic_name,
        presentation: medication.presentation,
        presentation_display: medication.presentation_display,
        concentration: medication.concentration,
        route: medication.route,
        route_display: medication.route_display,
        unit: medication.unit,
        unit_display: medication.unit_display,
        is_controlled: medication.is_controlled,
        source: medication.source,
        used_at: new Date().toISOString(),
      };
      
      const updated = [newRecent, ...filtered].slice(0, MAX_RECENT);
      return updated;
    });
  }, []);
  const clearRecent = useCallback(() => {
    setRecentMedications([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  return {
    recentMedications,
    addRecent,
    clearRecent,
  };
}