// src/pages/Diagnosis/tabs/DiagnosisDocuments.tsx
import { useEffect, useState } from "react";
import type { PatientRef } from "@/types/patients";
import { useDocumentsByPatient } from "@/hooks/patients/useDocumentsByPatient";
import DocumentUploadModal from "../components/DocumentUploadModal";
import type { MedicalDocument } from "@/types/documents";
import { useDeleteDocument } from "@/hooks/patients/useDeleteDocument";
import { useNotify } from "@/hooks/useNotify";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  BeakerIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface Props {
  patient: PatientRef;
}

const VISIBILITY_LABELS: Record<string, { label: string; color: string }> = {
  doctor_only: { label: "Solo Médico", color: "text-purple-400" },
  doctor_institution: { label: "Médico + Inst.", color: "text-blue-400" },
  patient_visible: { label: "Visible Paciente", color: "text-emerald-400" },
  public: { label: "Compartido", color: "text-amber-400" },
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
  const deleteDocument = useDeleteDocument(patient.id);
  const notify = useNotify();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "doctor_only" | "patient_visible">("all");

  useEffect(() => {
    if (deleteDocument.isSuccess) {
      notify.success("Documento eliminado");
    }
    if (deleteDocument.isError) {
      notify.error("Error al eliminar documento");
    }
  }, [deleteDocument.isSuccess, deleteDocument.isError]);

  const documents = Array.isArray(data?.list) ? data.list : [];

  const filteredDocs = documents.filter(d => {
    if (filter === "all") return d.visibility !== "doctor_only";
    return d.visibility === filter;
  });

  const doctorOnlyCount = documents.filter(d => d.visibility === "doctor_only").length;
  const visibleCount = documents.filter(d => d.visibility !== "doctor_only").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "doctor_only", "patient_visible"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {f === "all" ? `Visibles (${visibleCount})` : f === "doctor_only" ? `Solo Médico (${doctorOnlyCount})` : "Visible Paciente"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <CloudArrowUpIcon className="h-4 w-4" />
          Subir Documento
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="h-12 w-12 mx-auto text-white/20 mb-3" />
          <div className="text-white/40 text-sm">
            No hay documentos{filter === "doctor_only" ? " de análisis interno" : ""} para este paciente
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="mt-3 text-blue-400 text-sm hover:text-blue-300 transition-colors"
          >
            Subir el primer documento
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                {doc.ocr_extracted_text ? (
                  <BeakerIcon className="h-5 w-5 text-blue-400" />
                ) : (
                  <DocumentIcon className="h-5 w-5 text-white/40" />
                )}
              </div>

                <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {doc.description || doc.category_display || "Documento"}
                  </span>
                  <span className={`text-xs ${VISIBILITY_LABELS[doc.visibility ?? ""]?.color ?? "text-white/30"}`}>
                    {VISIBILITY_LABELS[doc.visibility ?? ""]?.label ?? doc.visibility ?? ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                  <span>{doc.category_display || "—"}</span>
                  <span>•</span>
                  <span>{doc.uploaded_at ? formatDate(doc.uploaded_at) : "—"}</span>
                  {doc.uploaded_by_name && (
                    <>
                      <span>•</span>
                      <span>{doc.uploaded_by_name}</span>
                    </>
                  )}
                  {doc.ocr_extracted_text && (
                    <>
                      <span>•</span>
                      <span className="text-blue-400/60">OCR</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    title="Ver documento"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar este documento?")) {
                      deleteDocument.mutate(doc.id);
                    }
                  }}
                  className="p-2 text-white/40 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                  title="Eliminar"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentUploadModal
        patientId={patient.id}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
