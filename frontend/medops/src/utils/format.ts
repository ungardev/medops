// src/utils/format.ts
// =====================================================
// UTILIDADES DE FORMATEO - Centralizadas para consistencia
// =====================================================
/**
 * Formatea un monto monetario con símbolo de moneda y separadores
 * @param amount - El monto a formatear (número o string)
 * @param currency - El código de moneda (USD, EUR, GBP, etc.)
 * @returns String formateado: "$1,234.56"
 */
export function formatCurrency(amount: number | string | undefined, currency?: string): string {
  if (amount === undefined || amount === null) return "$0.00";
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0.00";
  
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  return `${currencySymbol}${num.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}
/**
 * Formatea una fecha en formato británico (DD/MM/YYYY)
 * @param date - La fecha en formato ISO string o null
 * @returns String formateado: "01/01/2024" o "—" si es null/undefined
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString('en-GB');
}
/**
 * Formatea una fecha y hora en formato legible
 * @param date - La fecha en formato ISO string o null
 * @returns String formateado: "01/01/2024 14:30" o "—" si es null/undefined
 */
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
/**
 * Trunca un texto a un máximo de caracteres con ellipsis
 * @param text - El texto a truncar
 * @param maxLength - Longitud máxima (default: 50)
 * @returns Texto truncado con "..." si excede el máximo
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}