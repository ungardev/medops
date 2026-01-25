// src/hooks/consultations/index.ts
// Consultas
export * from "./useConsultation";
export * from "./useCurrentConsultation";
export * from "./useConsultationById";   // ✅ nuevo hook para detalle histórico por ID
// 🆕 NUEVOS: Signos Vitales y Notas Clínicas
export * from "./useVitalSigns";
export * from "./useClinicalNote";
// Acciones clínicas
export * from "./useCreateDiagnosis";
export * from "./useCreateTreatment";
export * from "./useCreatePrescription";
// Updates
export * from "./useUpdateDiagnosis";
export * from "./useUpdateTreatment";
export * from "./useUpdatePrescription";
// 🔧 CORRECCIÓN: Eliminar exportación duplicada de useUpdateMedicalReferral
// Ya está exportado desde useMedicalReferrals.ts
// export * from "./useUpdateMedicalReferral";  // ❌ DUPLICADO - ELIMINAR
// Deletes
export * from "./useDeleteDiagnosis";
export * from "./useDeleteTreatment";
export * from "./useDeletePrescription";
// Notas
export * from "./useNotes";
// Documentos
export * from "./useDocuments";
// 🔧 CORRECCIÓN: Exportación explícita de pagos para evitar conflicto
export { 
  usePayments, 
  // useCreatePayment ya existe en usePayments.ts, no duplicar
} from "./usePayments";
export * from "./useChargeOrder";
// Médicos
export * from "./useMedicalTest";
export * from "./useMedicalReferrals";  // ✅ Incluye useUpdateMedicalReferral y useDeleteMedicalReferral
export * from "./useMedicationCatalog";
export * from "./useSpecialties";
// Auditoría
export * from "./useAuditLog";
// Acciones ejecutivas
export * from "./useConsultationActions";
// Reportes
export * from "./useGenerateMedicalReport";
export * from "./useGenerateConsultationDocuments";