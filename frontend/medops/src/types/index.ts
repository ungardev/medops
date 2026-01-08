export * from "./patients";
export * from "./appointments";
export * from "./waitingRoom";
export * from "./events";
export * from "./payments";             
export * from "./waivedConsultations";
export * from "./consultations";        

// Evitar colisiones con nombres explícitos
export type { Appointment as ActiveAppointment } from "./consultation";
export type { Patient as ActivePatient } from "./consultation";
export type { Payment as ConsultationPayment } from "./consultation";
