// src/pages/Diagnosis/components/DocumentUploadModal.tsx
import { useState } from "react";
import EliteModal from "@/components/Common/EliteModal";
import DocumentDropzone from "./DocumentDropzone";
import ParsedDocumentPreview from "./ParsedDocumentPreview";
import {
  parseDocumentPreview,
  uploadDiagnosticDocument,
  type ParsedDocument,
  type Visibility,
} from "@/api/diagnosis";
import { useNotify } from "@/hooks/useNotify";

interface Props {
  patientId: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "upload" | "preview" | "saving";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: "doctor_only", label: "Solo Médico", description: "Visible únicamente para el médico tratante" },
  { value: "doctor_institution", label: "Médico + Institución", description: "Visible para doctores de la misma institución" },
  { value: "patient_visible", label: "Visible para Paciente", description: "Visible tanto para el médico como para el paciente" },
  { value: "public", label: "Compartido", description: "Compartido con otros médicos (interconsulta)" },
];

const CATEGORY_OPTIONS = [
  { value: "lab_result", label: "Resultado de Laboratorio" },
  { value: "diagnostic_analysis", label: "Análisis Diagnóstico" },
  { value: "imaging_report", label: "Reporte de Imagen" },
  { value: "medical_report", label: "Informe Médico" },
  { value: "external_study", label: "Estudio Externo" },
  { value: "other", label: "Otro" },
];

export default function DocumentUploadModal({
  patientId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const notify = useNotify();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedDocument | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("diagnostic_analysis");
  const [visibility, setVisibility] = useState<Visibility>("doctor_only");
  const [runOcr, setRunOcr] = useState(true);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep("upload");
    setFile(null);
    setParsed(null);
    setDescription("");
    setCategory("diagnostic_analysis");
    setVisibility("doctor_only");
    setRunOcr(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);

    if (runOcr) {
      setStep("preview");
      setLoading(true);
      try {
        const result = await parseDocumentPreview(selectedFile);
        setParsed(result);
        if (!description && result.date_extracted) {
          setDescription(`Documento del ${result.date_extracted}`);
        }
      } catch (e: unknown) {
        notify.error("Error procesando documento. Intenta de nuevo.");
        setStep("upload");
        setFile(null);
      } finally {
        setLoading(false);
      }
    } else {
      setParsed(null);
      setStep("preview");
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setStep("saving");
    setLoading(true);
    try {
      await uploadDiagnosticDocument({
        patientId,
        file,
        description,
        category,
        visibility,
        run_ocr: runOcr,
      });
      notify.success("Documento guardado exitosamente");
      onSuccess?.();
      handleClose();
    } catch (e: unknown) {
      notify.error("Error guardando documento. Intenta de nuevo.");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <EliteModal
      open={open}
      onClose={handleClose}
      title="Subir Documento de Diagnóstico"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Categoría
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-slate-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              Visibilidad
            </label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value as Visibility)}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
            >
              {VISIBILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-slate-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5">
            Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descripción del documento..."
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={runOcr}
            onChange={e => setRunOcr(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30"
          />
          <span className="text-sm text-white/70">
            Ejecutar OCR y extraer valores de laboratorio
          </span>
        </label>

        {step === "upload" && (
          <DocumentDropzone onFile={handleFileSelected} />
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                <span className="ml-3 text-white/50 text-sm">
                  Procesando documento con OCR...
                </span>
              </div>
            ) : parsed ? (
              <ParsedDocumentPreview parsed={parsed} />
            ) : null}

            <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setStep("upload");
                  setParsed(null);
                }}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                Cambiar archivo
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !file}
                className="px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-xl transition-colors flex items-center gap-2 disabled:bg-white/10 disabled:text-white/30"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Documento"
                )}
              </button>
            </div>
          </div>
        )}

        {step === "saving" && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="ml-3 text-white/50 text-sm">
              Subiendo a Cloudflare R2 y guardando...
            </span>
          </div>
        )}
      </div>
    </EliteModal>
  );
}
