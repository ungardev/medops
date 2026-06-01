// src/utils/institutionLogo.ts
// =====================================================
// UTILIDADES PARA LOGO DE INSTITUCIÓN
// =====================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Construye la URL absoluta del logo de una institución.
 * Maneja tanto URLs absolutas como rutas relativas del backend.
 * 
 * @param logo - URL del logo (puede ser string, File, o null/undefined)
 * @returns URL absoluta lista para usar en <img src>, o undefined si no hay logo
 */
export function getInstitutionLogoUrl(logo: string | File | null | undefined): string | undefined {
  if (!logo) return undefined;
  
  // Si es un File object (upload en progreso), crear object URL
  if (logo instanceof File) {
    return URL.createObjectURL(logo);
  }
  
  const logoStr = String(logo);
  
  // Si ya es URL absoluta o blob, usar directamente
  if (logoStr.startsWith('http') || logoStr.startsWith('blob:')) {
    return logoStr;
  }
  
  // Es ruta relativa - construir URL absoluta
  const baseUrl = API_BASE.replace(/\/api\/?$/, '');
  const cleanPath = logoStr.startsWith('/') ? logoStr : `/${logoStr}`;
  
  return `${baseUrl}${cleanPath}`;
}

/**
 * Versión simple para usar en componentes que no pueden usar hooks
 */
export function buildLogoUrl(relativePath: string | null | undefined): string | undefined {
  if (!relativePath) return undefined;
  
  if (relativePath.startsWith('http') || relativePath.startsWith('blob:')) {
    return relativePath;
  }
  
  const baseUrl = API_BASE.replace(/\/api\/?$/, '');
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${baseUrl}${cleanPath}`;
}