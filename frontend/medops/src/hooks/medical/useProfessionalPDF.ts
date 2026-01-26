// src/hooks/medical/useProfessionalPDF.ts - VERSIÓN 2.0 FINAL CORREGIDA
// 🔥 Integración completa con WeasyPrint backend y nuevo servicio PDF
import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ProfessionalPDFService, 
  ProfessionalPDFRequest, 
  ProfessionalPDFResponse,
  InstitutionSettings,
  ClinicalNoteData,
  DiagnosisData,
  TreatmentData,
  PrescriptionData,
  PDFGenerationError
} from '../../services/medical/professionalPDF';  // ✅ Corregido: ruta correcta
// 📋 Interfaces del Hook
export interface UseProfessionalPDFProps {
  appointmentId: number;
  patientId: number;
  autoLoadInstitution?: boolean;
}
export interface GeneratePDFOptions {
  template?: 'medical_report_universal' | 'medical_referral' | 'consent_form';
  includeSignatures?: boolean;
  includeQRCode?: boolean;
  customData?: {
    clinicalNote?: ClinicalNoteData;
    diagnoses?: DiagnosisData[];
    treatments?: TreatmentData[];
    prescriptions?: PrescriptionData[];
  };
}
export interface PDFDocument {  // ✅ Mantenido el nombre pero se usará window.document explícitamente
  id: string;
  template: string;
  filename: string;
  auditCode: string;
  fileSize: number;
  generatedAt: string;
  blobUrl?: string;
  status: 'generating' | 'completed' | 'error';
  error?: string;
}
export function useProfessionalPDF({ 
  appointmentId, 
  patientId, 
  autoLoadInstitution = true 
}: UseProfessionalPDFProps) {
  
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<'medical_report_universal' | 'medical_referral' | 'consent_form'>('medical_report_universal');
  const [generatedDocuments, setGeneratedDocuments] = useState<PDFDocument[]>([]);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  // 🏥 Obtener institución activa
  const { 
    data: currentInstitution, 
    isLoading: loadingInstitution,
    error: institutionError 
  } = useQuery({
    queryKey: ['current-institution'],
    queryFn: () => ProfessionalPDFService.getCurrentInstitution(),
    enabled: autoLoadInstitution,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  // 🔄 Generar PDF profesional - CORREGIDO
  const generatePDF = useMutation({
    mutationFn: async (options: GeneratePDFOptions = {}): Promise<PDFDocument> => {
      if (!currentInstitution) {
        throw new PDFGenerationError('No hay institución activa configurada', 'NO_INSTITUTION');
      }
      const request: ProfessionalPDFRequest = {
        template_name: options.template || selectedTemplate,
        context: {
          patient_id: patientId,
          appointment_id: appointmentId,
          clinical_note: options.customData?.clinicalNote,
          diagnoses: options.customData?.diagnoses || [],
          treatments: options.customData?.treatments || [],
          prescriptions: options.customData?.prescriptions || [],
        },
        institution_settings: currentInstitution
      };
      // 🔥 Usar nuevo servicio
      const pdfResponse = await ProfessionalPDFService.generateDocument(request);
      
      // Crear blob URL para visualización
      const blobUrl = ProfessionalPDFService.createBlobURL(pdfResponse.blob);
      blobUrlsRef.current.add(blobUrl);
      const newDocument: PDFDocument = {
        id: `${appointmentId}-${Date.now()}`,
        template: pdfResponse.template_used,
        filename: pdfResponse.filename,
        auditCode: pdfResponse.audit_code,
        fileSize: pdfResponse.file_size,
        generatedAt: pdfResponse.generated_at,
        blobUrl,
        status: 'completed'
      };
      return newDocument;
    },
    onMutate: () => {
      // Opcional: mostrar estado de carga
      const loadingDoc: PDFDocument = {
        id: `loading-${Date.now()}`,
        template: selectedTemplate,
        filename: 'Generando...',
        auditCode: '...',
        fileSize: 0,
        generatedAt: new Date().toISOString(),
        status: 'generating'
      };
      
      setGeneratedDocuments(prev => [...prev, loadingDoc]);
    },
    onSuccess: (newDocument) => {
      // Reemplazar documento de carga con el real
      setGeneratedDocuments(prev => 
        prev.map(doc => 
          doc.status === 'generating' && doc.template === newDocument.template 
            ? newDocument 
            : doc
        )
      );
      // Invalidar queries relacionados
      queryClient.invalidateQueries({ queryKey: ['professional-pdf-documents', appointmentId] });
    },
    onError: (error: Error) => {
      // Reemplazar documento de carga con error
      setGeneratedDocuments(prev => 
        prev.map(doc => 
          doc.status === 'generating' 
            ? { 
                ...doc, 
                status: 'error' as const, 
                error: error.message 
              }
            : doc
        )
      );
    }
  });
  // 🔥 Métodos especializados mejorados
  const generateMedicalReport = useCallback((clinicalData?: {
    clinicalNote?: ClinicalNoteData;
    diagnoses?: DiagnosisData[];
    treatments?: TreatmentData[];
    prescriptions?: PrescriptionData[];
  }) => {
    return generatePDF.mutateAsync({
      template: 'medical_report_universal',
      customData: clinicalData
    });
  }, [generatePDF]);
  const generateMedicalReferral = useCallback((referralData?: {
    clinicalNote?: ClinicalNoteData;
    diagnoses?: DiagnosisData[];
  }) => {
    return generatePDF.mutateAsync({
      template: 'medical_referral',
      customData: referralData
    });
  }, [generatePDF]);
  const generateConsentForm = useCallback((consentData?: {
    clinicalNote?: ClinicalNoteData;
  }) => {
    return generatePDF.mutateAsync({
      template: 'consent_form',
      customData: consentData
    });
  }, [generatePDF]);
  // 📥 Descargar PDF - MEJORADO
  const downloadPDF = useCallback(async (pdfDocument: PDFDocument) => {  // ✅ Corregido: renombrado parámetro
    try {
      if (!pdfDocument.blobUrl) {
        throw new Error('No hay blob URL disponible para descargar');
      }
      const response = await fetch(pdfDocument.blobUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');  // ✅ Corregido: window.document
      link.href = url;
      link.download = pdfDocument.filename;  // ✅ Corregido: pdfDocument.filename
      window.document.body.appendChild(link);  // ✅ Corregido: window.document.body
      link.click();
      
      // Cleanup
      window.document.body.removeChild(link);  // ✅ Corregido: window.document.body
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw error;
    }
  }, []);
  // 👁️ Vista previa de PDF - NUEVO
  const previewPDF = useCallback((pdfDocument: PDFDocument): string | null => {  // ✅ Corregido: renombrado parámetro
    return pdfDocument.blobUrl || null;
  }, []);
  // 🗑️ Limpiar blobs - NUEVO
  const cleanupBlobs = useCallback(() => {
    blobUrlsRef.current.forEach(url => {
      ProfessionalPDFService.revokeBlobURL(url);
    });
    blobUrlsRef.current.clear();
    setGeneratedDocuments([]);
  }, []);
  // 🔄 Refrescar documentos - NUEVO
  const refreshDocuments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['professional-pdf-documents', appointmentId] });
  }, [queryClient, appointmentId]);
  // ❌ Eliminar documento específico - NUEVO
  const removeDocument = useCallback((documentId: string) => {
    setGeneratedDocuments(prev => {
      const documentToRemove = prev.find(doc => doc.id === documentId);
      if (documentToRemove?.blobUrl) {
        ProfessionalPDFService.revokeBlobURL(documentToRemove.blobUrl);
        blobUrlsRef.current.delete(documentToRemove.blobUrl);
      }
      return prev.filter(doc => doc.id !== documentId);
    });
  }, []);
  // 🧹 Cleanup al desmontar - CORREGIDO
  useEffect(() => {
    return () => {
      cleanupBlobs();
    };
  }, [cleanupBlobs]);
  return {
    // 🏥 Estado Institucional
    currentInstitution,
    loadingInstitution,
    institutionError,
    // 📋 Estado de Documentos
    selectedTemplate,
    setSelectedTemplate,
    generatedDocuments,
    
    // 🔄 Estado de Generación
    isGenerating: generatePDF.isPending,
    generationError: generatePDF.error,
    
    // 🚀 Acciones Principales
    generatePDF: generatePDF.mutate,
    generatePDFAsync: generatePDF.mutateAsync,
    
    // 🏥 Métodos Especializados
    generateMedicalReport,
    generateMedicalReferral,
    generateConsentForm,
    
    // 📥 Gestión de Descargas
    downloadPDF,
    previewPDF,
    
    // 🧹 Gestión de Documentos
    removeDocument,
    refreshDocuments,
    cleanupBlobs,
    
    // 📊 Utilidades
    getDocumentById: (id: string) => generatedDocuments.find(doc => doc.id === id),
    getDocumentsByTemplate: (template: string) => generatedDocuments.filter(doc => doc.template === template),
    hasGeneratedDocuments: generatedDocuments.length > 0,
    totalFileSize: generatedDocuments.reduce((sum, doc) => sum + doc.fileSize, 0)
  };
}
// 🎯 Hook simplificado para casos básicos
export function useBasicProfessionalPDF(appointmentId: number, patientId: number) {
  const {
    generateMedicalReport,
    generateMedicalReferral,
    isGenerating,
    currentInstitution
  } = useProfessionalPDF({ appointmentId, patientId });
  return {
    generateMedicalReport,
    generateMedicalReferral,
    isGenerating,
    hasInstitution: !!currentInstitution
  };
}
// 🎯 Exportaciones adicionales
export default useProfessionalPDF;
// 📊 Constantes útiles
export const PDF_GENERATION_STATUS = {
  IDLE: 'idle',
  GENERATING: 'generating',
  SUCCESS: 'success',
  ERROR: 'error'
} as const;
export const PDF_ERRORS = {
  NO_INSTITUTION: 'No hay institución activa',
  NO_PATIENT_DATA: 'Faltan datos del paciente',
  TEMPLATE_NOT_FOUND: 'Template no encontrado',
  GENERATION_FAILED: 'Error en generación de PDF',
  NETWORK_ERROR: 'Error de conexión'
} as const;