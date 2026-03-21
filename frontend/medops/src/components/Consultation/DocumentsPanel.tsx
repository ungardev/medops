// src/components/Consultation/DocumentsPanel.tsx
import React, { useState, useEffect } from "react";
import { useDocumentsByPatient } from "../../hooks/patients/useDocumentsByPatient";
import { useUploadDocument } from "../../hooks/patients/useUploadDocument";
import { useDeleteDocument } from "../../hooks/patients/useDeleteDocument";
import { useNotify } from "../../hooks/useNotify";
import type { MedicalDocument } from "../../types/documents";
import { 
  DocumentArrowUpIcon, 
  TrashIcon, 
  DocumentIcon, 
  ArrowTopRightOnSquareIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
const RAW_ROOT = import.meta.env.VITE_API_ROOT || "http://127.0.0.1/api";
const BASE_URL = RAW_ROOT.replace(/\/api\/?$/, "");
const CATEGORY_OPTIONS = [
  { value: "prescription", label: "PRESC_ORDER" },
  { value: "treatment", label: "TREATMENT_PLAN" },
  { value: "medical_test_order", label: "LAB_REQUISITION" },
  { value: "medical_referral", label: "REF_PROTOCOL" },
  { value: "medical_report", label: "CLINICAL_REPORT" },
  { value: "other", label: "MISC_DATA" },
];
export interface DocumentsPanelProps {
  patientId: number;
  appointmentId?: number;
  readOnly?: boolean;
}
const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ patientId, appointmentId, readOnly }) => {
  const { data, isLoading, refetch } = useDocumentsByPatient(patientId);
  const uploadDocument = useUploadDocument(patientId);
  const deleteDocument = useDeleteDocument(patientId);
  const notify = useNotify();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  useEffect(() => {
    if (uploadDocument.isSuccess) notify.success("Upload complete");
    if (deleteDocument.isSuccess) notify.success("Record deleted");
  }, [uploadDocument.isSuccess, deleteDocument.isSuccess, notify]);
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !description.trim() || !category) {
      notify.error("Missing required fields");
      return;
    }
    await uploadDocument.mutateAsync({ file, description, category });
    setFile(null);
    setDescription("");
    setCategory("");
    await refetch();
  };
  const resolveFileURL = (file_url: string) => {
    if (!file_url) return "";
    return file_url.startsWith("http") ? file_url : `${BASE_URL}${file_url}`;
  };
  const documents: MedicalDocument[] = Array.isArray(data?.list) ? data.list : [];
  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="bg-black/40 border border-white/10 rounded-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <span className="text-[10px] font-mono font-black text-blue-300 uppercase tracking-widest flex items-center gap-2">
              <CloudArrowUpIcon className="w-3.5 h-3.5 text-blue-400" />
              File Upload
            </span>
            {/* ⚠️ ELIMINADO: Badge de encriptación */}
          </div>
          <form onSubmit={handleUpload} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className={`h-10 flex items-center justify-center border border-dashed rounded-sm transition-all ${file ? 'border-blue-400 bg-blue-400/5' : 'border-white/10 group-hover:border-blue-400/50'}`}>
                  <span className="text-[10px] font-mono text-white/60 truncate px-2">
                    {file ? file.name : "Select File"}
                  </span>
                </div>
              </div>
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-black/40 border border-white/10 px-3 h-10 text-[10px] font-mono text-white focus:outline-none focus:border-blue-400/50 uppercase"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-black/40 border border-white/10 px-3 h-10 text-[10px] font-mono text-white focus:outline-none focus:border-blue-400/50"
              >
                <option value="">Category</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={uploadDocument.isPending}
                className="h-10 bg-white/5 border border-white/10 text-[10px] font-mono font-black tracking-widest uppercase hover:bg-blue-400/10 hover:text-white hover:border-blue-400 transition-all disabled:opacity-50"
              >
                {uploadDocument.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-[var(--palantir-border)] pb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
            Documents Status
          </span>
          <span className="text-[9px] font-mono text-white/60">
            {documents.length} documents registered
          </span>
        </div>
        {isLoading ? (
          <div className="py-8 text-center text-[10px] font-mono text-white/60 animate-pulse uppercase tracking-widest">
            Loading...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 border border-dashed border-white/10 flex flex-col items-center opacity-40">
            <DocumentIcon className="w-8 h-8 mb-2" />
            <span className="text-[10px] font-mono uppercase tracking-widest">No documents found</span>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--palantir-border)] space-y-2 pr-1">
            {documents.map((d: MedicalDocument) => (
              <div 
                key={d.id} 
                className="group bg-black/20 border border-white/10 p-3 hover:border-blue-400/30 transition-all flex items-start gap-3"
              >
                <div className="p-2 bg-white/5 border border-white/10 group-hover:text-blue-400 transition-colors">
                  <DocumentIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-tight truncate">
                      {d.description || "Untitled"}
                    </h4>
                    <div className="flex gap-1 ml-2">
                      {d.file_url && (
                        <a
                          href={resolveFileURL(d.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-white/60 hover:text-blue-400"
                          title="ACCESS_FILE"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => { if(confirm("Delete document?")) deleteDocument.mutate(d.id); }}
                          className="p-1 text-white/60 hover:text-red-500"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-mono text-white/50 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-blue-400" />
                      CAT: {CATEGORY_OPTIONS.find(o => o.value === d.category)?.label || "MISC"}
                    </span>
                    <span>SRC: {d.source === "system_generated" ? "SYSTEM" : "UPLOADER"}</span>
                    <span>DATE: {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("es-VE") : "---"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default DocumentsPanel;