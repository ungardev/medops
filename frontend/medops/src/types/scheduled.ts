// src/types/scheduled.ts
export type ScheduledItemType = 'appointment' | 'service' | 'study' | 'therapy';
export type ScheduledItemStatus = 
  | 'tentative'     // Pendiente de confirmación (ej. compra online)
  | 'confirmed'     // Confirmado por el doctor
  | 'in_progress'   // En curso
  | 'completed'     // Finalizado
  | 'cancelled';    // Cancelado
export type PaymentStatus = 
  | 'pending' 
  | 'partial' 
  | 'paid' 
  | 'overdue';
export interface ScheduledItem {
  id: number;
  type: ScheduledItemType;
  
  // Información del Servicio
  title: string;
  serviceId: number;
  institutionId: number;
  doctorId: number;
  
  // Información del Paciente
  patientId: number;
  patientName: string;
  
  // Información de Tiempo
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  duration: number; // minutos
  
  // Estados Operativos
  status: ScheduledItemStatus;
  paymentStatus: PaymentStatus;
  
  // Vínculos Financieros
  chargeOrderId?: number;
  totalAmount: number;
  
  // Metadatos
  notes?: string;
  createdAt: string;
}