// src/types/index.ts

export * from "./patients";
export * from "./appointments";
export * from "./waitingRoom";
export * from "./events";
export * from "./payments";             
export * from "./waivedConsultations";
export * from "./consultations";        

// Evitar colisiones con nombres explícitos
export {
  Appointment as ActiveAppointment,
  Patient as ActivePatient,
  Payment as ConsultationPayment,
} from "./consultation";
