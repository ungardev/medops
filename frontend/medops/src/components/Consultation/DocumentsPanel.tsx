// src/components/Consultation/DocumentsPanel.tsx
import React, { useState, useEffect } from "react";
import { useDocumentsByPatient } from "../../hooks/patients/useDocumentsByPatient";
import { useUploadDocument } from "../../hooks/patients/useUploadDocument";
import { useDeleteDocument } from "../../hooks/patients/useDeleteDocument";
import { useNotify } from "../../hooks/useNotify";
import EliteModal from "../Common/EliteModal";
import type { MedicalDocument } from "../../types/documents";
import { 
  TrashIcon, 
  DocumentIcon, 
  ArrowTopRightOnSquareIcon,
  CloudArrowUpIcon
} from "@heroicons/react/24/outline";
const RAW_ROOT = import.meta.env.VITE_API_ROOT || "http://127.0.0.1/api";
const BASE_URL = RAW_ROOT.replace(/\/api\/?$/, "");
const CATEGORY_OPTIONS = [
  { value: "prescription", label: "Prescripción" },
  { value: "treatment", label: "Plan de Tratamiento" },
  { value: "medical_test_order", label: "Orden de Laboratorio" },
  { value: "medical_referral", label: "Referencia Médica" },
  { value: "medical_report", label: "Informe Clínico" },
  { value: "other", label: "Otro" },
];
export interface DocumentsPanelProps {
  patientId: number;
  appointmentId?: number;
  readOnly?: boolean;
}
const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ patientId, readOnly }) => {
  const { data, isLoading, refetch } = useDocumentsByPatient(patientId);
  const uploadDocument = useUploadDocument(patientId);
  const deleteDocument = useDeleteDocument(patientId);
  const notify = useNotify();
  
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<MedicalDocument | null>(null);
  useEffect(() => {
    if (uploadDocument.isSuccess) notify.success("Documento subido exitosamente");
    if (deleteDocument.isSuccess) notify.success("Documento eliminado");
    if (deleteDocument.isError) notify.error("No se pudo eliminar el documento");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadDocument.isSuccess, deleteDocument.isSuccess, deleteDocument.isError]);
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !description.trim() || !category) {
      notify.error("Complete todos los campos requeridos");
      return;
    }
    await uploadDocument.mutateAsync({ file, description, category });
    setFile(null);
    setDescription("");
    setCategory("");
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
  const resolveFileURL = (file_url: string) => {
    if (!file_url) return "";
    return file_url.startsWith("http") ? file_url : `${BASE_URL}${file_url}`;
  };
  const documents: MedicalDocument[] = Array.isArray(data?.list) ? data.list : [];
  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="bg-white/5 border border-white/20 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/15 bg-white/5 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CloudArrowUpIcon className="w-5 h-5" />
              Subir
            </span>
          </div>
          <form onSubmit={handleUpload} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className={`h-12 flex items-center justify-center border border-dashed rounded-xl transition-all ${file ? 'border-emerald-400/50 bg-emerald-500/5' : 'border-white/20 group-hover:border-emerald-400/30'}`}>
                  <span className="text-sm text-white/60 truncate px-3">
                    {file ? file.name : "Seleccionar"}
                  </span>
                </div>
              </div>
              <input
                type="text"
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/5 border border-white/20 px-4 h-12 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 rounded-xl"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white/5 border border-white/20 px-4 h-12 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 rounded-xl"
              >
                <option value="">Categoría</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={uploadDocument.isPending}
                className="h-12 bg-white/5 border border-white/20 text-sm font-semibold text-white/80 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-400/30 transition-all disabled:opacity-50 rounded-xl"
              >
                {uploadDocument.isPending ? "Subiendo..." : "Subir"}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <span className="text-sm font-bold uppercase tracking-wider text-white/60">
            Documentos
          </span>
          <span className="text-xs text-white/50">
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-white/50 animate-pulse">
            Cargando documentos...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 border border-dashed border-white/15 flex flex-col items-center opacity-50 rounded-xl">
            <DocumentIcon className="w-8 h-8 mb-2 text-white/40" />
            <span className="text-sm text-white/50">No hay documentos registrados</span>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
            {documents.map((d: MedicalDocument) => (
              <div 
                key={d.id} 
                className="group bg-white/5 border border-white/20 p-4 hover:border-white/30 transition-all flex items-start gap-3 rounded-xl"
              >
                <div className="p-2.5 bg-white/5 border border-white/10 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-colors rounded-xl">
                  <DocumentIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-white truncate">
                      {d.description || "Sin título"}
                    </h4>
                    <div className="flex gap-1 ml-2">
                      {d.file_url && (
                        <a
                          href={resolveFileURL(d.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-white/50 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors"
                          title="Abrir archivo"
                        >
                          <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </a>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => handleDeleteClick(d)}
                          disabled={deleteDocument.isPending}
                          className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      {CATEGORY_OPTIONS.find(o => o.value === d.category)?.label || "Otro"}
                    </span>
                    <span>{d.source === "system_generated" ? "Sistema" : "Manual"}</span>
                    <span>{d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("es-VE") : "---"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
            ¿Está seguro que desea eliminar este documento? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/20 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white/80 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteDocument.isPending}
              className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500/30 rounded-xl transition-all disabled:opacity-50"
            >
              {deleteDocument.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </EliteModal>
    </div>
  );
};
export default DocumentsPanel;