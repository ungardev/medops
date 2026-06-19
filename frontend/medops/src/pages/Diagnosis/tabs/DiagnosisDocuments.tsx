// src/pages/Diagnosis/tabs/DiagnosisDocuments.tsx
import { useEffect, useState } from "react";
import type { PatientRef } from "@/types/patients";
import { useDocumentsByPatient } from "@/hooks/patients/useDocumentsByPatient";
import { useUploadDocument } from "@/hooks/patients/useUploadDocument";
import { useDeleteDocument } from "@/hooks/patients/useDeleteDocument";
import type { MedicalDocument } from "@/types/documents";
import { useNotify } from "@/hooks/useNotify";
import EliteModal from "../components/EliteModal";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface Props {
  patient: PatientRef;
}

const CATEGORY_OPTIONS = [
  { value: "prescription", label: "Prescripcion" },
  { value: "treatment", label: "Plan de Tratamiento" },
  { value: "medical_test_order", label: "Orden de Laboratorio" },
  { value: "medical_referral", label: "Referencia Medica" },
  { value: "medical_report", label: "Informe Clinico" },
  { value: "lab_result", label: "Resultado de Laboratorio" },
  { value: "imaging_report", label: "Estudio de Imagen" },
  { value: "external_study", label: "Estudio Externo" },
  { value: "diagnostic_analysis", label: "Analisis Diagnostico" },
  { value: "other", label: "Otro" },
];

const VISIBILITY_OPTIONS = [
  { value: "patient_visible", label: "Visible al Paciente" },
  { value: "doctor_only", label: "Solo Medico" },
  { value: "doctor_institution", label: "Medico + Institucion" },
  { value: "public", label: "Compartido" },
];

const VISIBILITY_BADGE: Record<string, { label: string; color: string }> = {
  patient_visible: { label: "Visible Paciente", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  doctor_only: { label: "Solo Medico", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  doctor_institution: { label: "Medico + Inst.", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  public: { label: "Compartido", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DiagnosisDocuments({ patient }: Props) {
  const { data, isLoading, refetch } = useDocumentsByPatient(patient.id);
  const uploadDocument = useUploadDocument(patient.id);
  const deleteDocument = useDeleteDocument(patient.id);
  const notify = useNotify();
  const [filter, setFilter] = useState<"all" | "doctor_only" | "patient_visible">("all");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<"patient_visible" | "doctor_only" | "doctor_institution" | "public">("patient_visible");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<MedicalDocument | null>(null);

  useEffect(() => {
    if (uploadDocument.isSuccess) {
      notify.success("Documento subido exitosamente");
      setFile(null);
      setDescription("");
      setCategory("");
    }
    if (deleteDocument.isSuccess) notify.success("Documento eliminado");
    if (deleteDocument.isError) notify.error("No se pudo eliminar el documento");
  }, [uploadDocument.isSuccess, deleteDocument.isSuccess, deleteDocument.isError]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !description.trim() || !category) {
      notify.error("Complete todos los campos requeridos");
      return;
    }
    await uploadDocument.mutateAsync({ file, description, category, visibility });
    await refetch();
  };

  const handleDeleteClick = (doc: MedicalDocument) => {
    setDocumentToDelete(doc);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (documentToDelete) {
      deleteDocument.mutate(documentToDelete.id);
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const documents = Array.isArray(data?.list) ? data.list : [];

  const filteredDocs = documents.filter(d => {
    if (filter === "all") return d.visibility !== "doctor_only";
    return d.visibility === filter;
  });

  const doctorOnlyCount = documents.filter(d => d.visibility === "doctor_only").length;
  const visibleCount = documents.filter(d => d.visibility !== "doctor_only").length;

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/15 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/15 bg-white/5 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
            <CloudArrowUpIcon className="w-5 h-5" />
            Subir Documento
          </span>
          <div className="flex gap-2">
            {(["all", "doctor_only", "patient_visible"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
              >
                {f === "all" ? `Visibles (${visibleCount})` : f === "doctor_only" ? `Solo Medico (${doctorOnlyCount})` : "Visible Paciente"}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleUpload} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1 relative group">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className={`h-12 flex items-center justify-center border border-dashed rounded-xl transition-all ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/15 group-hover:border-emerald-500/30'}`}>
                <span className="text-sm text-white/50 truncate px-3">
                  {file ? file.name : "Seleccionar archivo"}
                </span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Descripcion"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border border-white/15 px-4 h-12 text-sm text-white/70 focus:outline-none focus:border-emerald-500/50 rounded-xl"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white/5 border border-white/15 px-4 h-12 text-sm text-white/70 focus:outline-none focus:border-emerald-500/50 rounded-xl"
            >
              <option value="">Categoria</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as typeof visibility)}
              className="bg-white/5 border border-white/15 px-4 h-12 text-sm text-white/70 focus:outline-none focus:border-emerald-500/50 rounded-xl"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={uploadDocument.isPending}
              className="h-12 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadDocument.isPending ? "Subiendo..." : "Subir"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-sm text-white/40 animate-pulse">
            Cargando documentos...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full py-12 border border-dashed border-white/15 flex flex-col items-center opacity-50 rounded-xl">
            <DocumentIcon className="w-8 h-8 mb-2 text-white/30" />
            <span className="text-sm text-white/40">No hay documentos{filter === "doctor_only" ? " de analisis interno" : ""} para este paciente</span>
          </div>
        ) : (
          filteredDocs.map((d: MedicalDocument) => {
            const badge = VISIBILITY_BADGE[d.visibility ?? ""];
            const hasOCR = Boolean(d.ocr_extracted_text);
            return (
              <div
                key={d.id}
                className="group bg-white/5 border border-white/15 p-5 hover:border-white/25 transition-all flex items-start gap-4 rounded-xl"
              >
                <div className="p-3 bg-white/5 border border-white/10 group-hover:border-emerald-500/30 transition-colors rounded-xl">
                  {hasOCR ? (
                    <BeakerIcon className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <DocumentIcon className="w-5 h-5 text-white/50 group-hover:text-emerald-400 transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-medium text-white truncate flex-1">
                      {d.description || d.category_display || "Documento"}
                    </h4>
                    {badge && (
                      <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/40">
                    <span className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${hasOCR ? 'bg-emerald-400' : 'bg-white/30'}`} />
                      {CATEGORY_OPTIONS.find(o => o.value === d.category)?.label || d.category_display || "Otro"}
                    </span>
                    {hasOCR && (
                      <span className="text-emerald-400/60 flex items-center gap-1">
                        <BeakerIcon className="w-3 h-3" /> OCR
                      </span>
                    )}
                    <span>{d.uploaded_at ? formatDate(d.uploaded_at) : "-"}</span>
                    {d.uploaded_by_name && <span>{d.uploaded_by_name}</span>}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {d.file_url && (
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/50 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition-colors"
                        title="Abrir archivo"
                      >
                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteClick(d)}
                      disabled={deleteDocument.isPending}
                      className="p-2 text-white/50 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center gap-2">
        <ShieldCheckIcon className="w-5 h-5 text-emerald-400/50" />
        <span className="text-xs text-white/40">
          El acceso a documentos es registrado y auditado por protocolos de seguridad institucional.
        </span>
      </div>

      <EliteModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="ELIMINAR DOCUMENTO"
        subtitle={documentToDelete?.description || ""}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            Esta seguro que desea eliminar este documento? Esta accion no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/15 text-[12px] font-medium text-white/60 hover:bg-white/10 hover:text-white/80 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteDocument.isPending}
              className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-[12px] font-medium text-red-400 hover:bg-red-500/30 rounded-lg transition-all disabled:opacity-50"
            >
              {deleteDocument.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </EliteModal>
    </div>
  );
}
