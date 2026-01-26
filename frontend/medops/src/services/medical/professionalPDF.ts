// src/services/medical/professionalPDF.ts
// 🔥 VERSIÓN CORREGIDA - Integración con WeasyPrint Backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
// 📋 Interfaces actualizadas según backend real
export interface ProfessionalPDFRequest {
  template_name: 'medical_report_universal' | 'medical_referral' | 'consent_form';
  context: {
    patient_id: number;
    appointment_id: number;
    clinical_note?: {
      subjective?: string;
      objective?: string;
      analysis?: string;
      plan?: string;
    };
    diagnoses?: Array<{
      title: string;
      icd_code?: string;
      description?: string;
      severity?: 'high' | 'medium' | 'low';
    }>;
    treatments?: Array<{
      plan: string;
      treatment_type?: string;
      start_date?: string;
      end_date?: string;
      status?: 'completed' | 'in_progress' | 'pending';
    }>;
    prescriptions?: Array<{
      medication: string;
      dosage?: string;
      route?: string;
      frequency?: string;
      duration?: string;
    }>;
    medical_tests?: Array<{
      name: string;
      test_type?: string;
      urgency?: 'high' | 'normal' | 'low';
      notes?: string;
      status?: 'completed' | 'ordered' | 'pending';
    }>;
  };
  institution_settings: {
    id: number;
    name: string;
    country_code: 'VE' | 'MX' | 'BR' | 'CO';
    corporate_country_code: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
  };
}
export interface ProfessionalPDFResponse {
  // 🔥 Backend devuelve blob PDF, no JSON
  blob: Blob;
  filename: string;
  audit_code: string;
  file_size: number;
  generated_at: string;
  template_used: string;
}
export interface InstitutionSettings {
  id: number;
  name: string;
  country_code: 'VE' | 'MX' | 'BR' | 'CO';
  corporate_country_code: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}
export class ProfessionalPDFService {
  
  /**
   * 🔥 MÉTODO PRINCIPAL - Generar PDF profesional con WeasyPrint
   */
  static async generateDocument(request: ProfessionalPDFRequest): Promise<ProfessionalPDFResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          // 🔥 Agregar headers de autenticación si es necesario
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify(request)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Error generando PDF profesional');
      }
      // 🔥 Backend devuelve blob PDF directamente
      const blob = await response.blob();
      
      // 🔥 Extraer nombre de archivo del Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/);
      const filename = filenameMatch?.[1] || `medical_report_${new Date().toISOString().slice(0,10)}.pdf`;
      return {
        blob,
        filename,
        audit_code: this.extractAuditCodeFromFilename(filename),
        file_size: blob.size,
        generated_at: new Date().toISOString(),
        template_used: request.template_name
      };
    } catch (error) {
      console.error('ProfessionalPDFService.generateDocument error:', error);
      throw error;
    }
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Extraer código de auditoría del filename
   */
  private static extractAuditCodeFromFilename(filename: string): string {
    // Formato esperado: medical_report_20240125_143052.pdf
    // O: medical_report_universal_AUDITCODE_20240125_143052.pdf
    const auditMatch = filename.match(/[A-Z0-9]{16}/);
    return auditMatch ? auditMatch[0] : 'AUDIT_CODE_NOT_FOUND';
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Descargar PDF directamente
   */
  static async downloadDocument(request: ProfessionalPDFRequest): Promise<void> {
    try {
      const pdfResponse = await this.generateDocument(request);
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(pdfResponse.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfResponse.filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Obtener URL para visualización
   */
  static async getPreviewURL(request: ProfessionalPDFRequest): Promise<string> {
    try {
      const pdfResponse = await this.generateDocument(request);
      return window.URL.createObjectURL(pdfResponse.blob);
    } catch (error) {
      console.error('Preview error:', error);
      throw error;
    }
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Generar Reporte Médico Universal
   */
  static async generateMedicalReport(
    appointmentId: number,
    patientId: number,
    clinicalData: any,
    institution: InstitutionSettings
  ): Promise<ProfessionalPDFResponse> {
    
    const request: ProfessionalPDFRequest = {
      template_name: 'medical_report_universal',
      context: {
        patient_id: patientId,
        appointment_id: appointmentId,
        ...clinicalData
      },
      institution_settings: institution
    };
    return this.generateDocument(request);
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Generar Referencia Médica
   */
  static async generateMedicalReferral(
    appointmentId: number,
    patientId: number,
    referralData: any,
    institution: InstitutionSettings
  ): Promise<ProfessionalPDFResponse> {
    
    const request: ProfessionalPDFRequest = {
      template_name: 'medical_referral',
      context: {
        patient_id: patientId,
        appointment_id: appointmentId,
        ...referralData
      },
      institution_settings: institution
    };
    return this.generateDocument(request);
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Validar datos antes de enviar
   */
  private static validateRequest(request: ProfessionalPDFRequest): void {
    if (!request.template_name) {
      throw new Error('template_name es requerido');
    }
    
    if (!request.context.patient_id) {
      throw new Error('patient_id es requerido en context');
    }
    
    if (!request.context.appointment_id) {
      throw new Error('appointment_id es requerido en context');
    }
    
    if (!request.institution_settings.id) {
      throw new Error('institution_settings.id es requerido');
    }
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Obtener configuración de institución activa
   */
  static async getCurrentInstitution(): Promise<InstitutionSettings | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/config/institution/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        }
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.institution || null;
      
    } catch (error) {
      console.error('Error getting current institution:', error);
      return null;
    }
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Crear objeto de Blob para visualización
   */
  static createBlobURL(blob: Blob): string {
    return window.URL.createObjectURL(blob);
  }
  /**
   * 🔥 MÉTODO AUXILIAR - Liberar Blob URL
   */
  static revokeBlobURL(url: string): void {
    window.URL.revokeObjectURL(url);
  }
}
// 🔥 EXPORTACIONES ADICIONALES PARA COMPATIBILIDAD
export default ProfessionalPDFService;
// 🔥 CONSTANTES ÚTILES
export const PDF_TEMPLATES = {
  MEDICAL_REPORT: 'medical_report_universal',
  MEDICAL_REFERRAL: 'medical_referral',
  CONSENT_FORM: 'consent_form'
} as const;
export const COUNTRY_CODES = {
  VENEZUELA: 'VE',
  MEXICO: 'MX',
  BRAZIL: 'BR',
  COLOMBIA: 'CO'
} as const;
// 🔥 TIPOS DE ERROR ESPECÍFICOS
export class PDFGenerationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'PDFGenerationError';
  }
}
// 🔥 INTERFACES PARA TIPO SEGURIDAD
export interface ClinicalNoteData {
  subjective?: string;
  objective?: string;
  analysis?: string;
  plan?: string;
}
export interface DiagnosisData {
  title: string;
  icd_code?: string;
  description?: string;
  severity?: 'high' | 'medium' | 'low';
}
export interface TreatmentData {
  plan: string;
  treatment_type?: string;
  start_date?: string;
  end_date?: string;
  status?: 'completed' | 'in_progress' | 'pending';
}
export interface PrescriptionData {
  medication: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  duration?: string;
}