// src/hooks/consultations/index.ts

// Consultas
export * from "./useConsultation";
export * from "./useCurrentConsultation";
export * from "./useConsultationById";   // ✅ nuevo hook para detalle histórico por ID

// Acciones clínicas
export * from "./useCreateDiagnosis";
export * from "./useCreateTreatment";
export * from "./useCreatePrescription";

// Notas
export * from "./useNotes";

// Documentos
export * from "./useDocuments";

// Pagos
export * from "./usePayments";

// Auditoría
export * from "./useAuditLog";

// Acciones ejecutivas
export * from "./useConsultationActions";
