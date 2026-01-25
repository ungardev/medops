// src/components/Consultation/index.ts
// 🔥 CORREGIDO: Solo exportar interfaces que realmente existen con export
// 🏥 CABECERA DE PACIENTE
export { default as PatientHeader } from "./PatientHeader";
// ❌ NO EXPORTAR: PatientHeaderProps (interface sin export en archivo original)
// 🔹 DIAGNÓSTICO
export { default as DiagnosisPanel } from "./DiagnosisPanel";
export type { DiagnosisPanelProps } from "./DiagnosisPanel";
// 🔹 TRATAMIENTO
export { default as TreatmentPanel } from "./TreatmentPanel";
export type { TreatmentPanelProps } from "./TreatmentPanel";
// 🔹 PRESCRIPCIÓN
export { default as PrescriptionPanel } from "./PrescriptionPanel";
export type { PrescriptionPanelProps } from "./PrescriptionPanel";
// 🔹 NOTAS CLÍNICAS - CORREGIDO: Usar ClinicalNotePanel con Props interface
export { default as NotesPanel } from "./ClinicalNotePanel";
export type { Props as ClinicalNotePanelProps } from "./ClinicalNotePanel";
// 🔹 DOCUMENTOS
export { default as DocumentsPanel } from "./DocumentsPanel";
export type { DocumentsPanelProps } from "./DocumentsPanel";
// 🔹 AUDITORÍA
export { default as AuditLogPanel } from "./AuditLogPanel";
// ❌ NO EXPORTAR: AuditLogPanelProps (interface sin export en archivo original)
// 🔹 ACCIONES DE CONSULTA
export { default as ConsultationActions } from "./ConsultationActions";
// ❌ NO EXPORTAR: ConsultationActionsProps (interface sin export en archivo original)
// 🔹 ORDEN DE COBRO
export { default as ChargeOrderPanel } from "./ChargeOrderPanel";
// ❌ VERIFICAR: ChargeOrderPanelProps (necesito revisar este archivo)
// 🔹 PRUEBAS MÉDICAS
export { default as MedicalTestsPanel } from "./MedicalTestsPanel";
export type { MedicalTestsPanelProps } from "./MedicalTestsPanel";
// 🔹 REFERENCIAS MÉDICAS
export { default as MedicalReferralsPanel } from "./MedicalReferralsPanel";
export type { MedicalReferralsPanelProps } from "./MedicalReferralsPanel";
// 🔹 ACCIONES DE DOCUMENTOS
export { default as ConsultationDocumentsActions } from "./ConsultationDocumentsActions";
// ❌ NO EXPORTAR: ConsultationDocumentsActionsProps (interface sin export en archivo original)