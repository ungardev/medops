// src/types/signs.ts
// =====================================================
// SIGNOS VITALES
// =====================================================
export interface VitalSigns {
  id: number;
  appointment: number;
  
  // Medidas principales
  weight?: number | null;  // kg
  height?: number | null;  // cm
  temperature?: number | null;  // °C
  bp_systolic?: number | null;  // mmHg
  bp_diastolic?: number | null;  // mmHg
  heart_rate?: number | null;  // bpm
  respiratory_rate?: number | null;  // rpm
  oxygen_saturation?: number | null;  // %
  
  // Calculados
  bmi?: number | null;
  
  // Estado de los signos (semáforo para frontend)
  vitals_status?: {
    bp: "normal" | "high" | "low";
    temp: "normal" | "high" | "low";
    o2: "normal" | "critical";
  };
}