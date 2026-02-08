// src/types/common.ts
export interface LocationOption {
  id: number;
  name: string;
  value?: string; // Para compatibilidad temporal
  label?: string; // Para compatibilidad temporal
}
export interface LocationOptionLike {
  id?: number;
  name?: string;
  value?: string;
  label?: string;
}
// Función helper para normalizar opciones
export function normalizeLocationOption(item: any): LocationOption | null {
  if (!item) return null;
  
  // Si ya tiene la estructura correcta
  if (item.id !== undefined && item.name !== undefined) {
    return {
      id: Number(item.id),
      name: String(item.name),
      value: item.value || String(item.id),
      label: item.label || String(item.name)
    };
  }
  
  // Si tiene estructura {value, label}
  if (item.value !== undefined && item.label !== undefined) {
    return {
      id: Number(item.value),
      name: String(item.label),
      value: String(item.value),
      label: String(item.label)
    };
  }
  
  return null;
}
