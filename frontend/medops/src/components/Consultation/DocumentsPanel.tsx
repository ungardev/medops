// src/components/Consultation/DocumentsPanel.tsx
import React, { useState } from "react";
import {
  useDocuments,
  useUploadDocument,
} from "../../hooks/consultations/useDocuments";
import type { GenerateDocumentsResponse, GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";
import { 
  DocumentArrowUpIcon, 
  ArrowPathIcon, 
  DocumentIcon, 
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  TagIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";

export interface DocumentsPanelProps {
  patientId: number;
  appointmentId?: number;
  readOnly?: boolean;
}

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ patientId, appointmentId, readOnly }) => {
  const { data, isLoading } = useDocuments(patientId, appointmentId);
  const uploadDocument = useUploadDocument(patientId, appointmentId);

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    uploadDocument.mutate(
      { patient: patientId, appointment: appointmentId, file, description, category },
      {
        onSuccess: () => {
          setFile(null);
          setDescription("");
          setCategory("");
        },
      }
    );
  };

  const documents: GeneratedDocument[] = (data as GenerateDocumentsResponse)?.documents || [];
  const skipped: string[] = (data as GenerateDocumentsResponse)?.skipped || [];
  const errors: { category: string; error: string }[] = (data as GenerateDocumentsResponse)?.errors || [];

  return (
    <div className="space-y-6">
      {/* 01. HEADER STATUS */}
      <div className="flex items-center justify-between border-b border-[var(--palantir-border)] pb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
          Repository_Status
        </span>
        {isLoading && <ArrowPathIcon className="w-3 h-3 animate-spin text-[var(--palantir-active)]" />}
      </div>

      {/* 02. DOCUMENT LIST */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--palantir-border)] pr-2">
        {documents.length === 0 && !isLoading ? (
          <div className="py-8 text-center border border-dashed border-[var(--palantir-border)] opacity-40">
            <DocumentIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-[10px] font-mono uppercase">Null_Data_Segments</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.audit_code}
              className="group relative bg-black/20 border border-[var(--palantir-border)] p-3 hover:border-[var(--palantir-active)] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[var(--palantir-active)]/10 text-[var(--palantir-active)]">
                  <DocumentIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black text-[var(--palantir-active)] uppercase tracking-widest">
                      {doc.category || "UNCLASSIFIED"}
                    </span>
                    <span className="text-[8px] font-mono text-[var(--palantir-muted)]">
                      AUDIT_{doc.audit_code}
                    </span>
                  </div>
                  
                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[11px] font-bold text-[var(--palantir-text)] hover:text-[var(--palantir-active)] truncate uppercase tracking-tight"
                    >
                      {doc.title || "Untitled_Sequence"}
                    </a>
                  ) : (
                    <span className="block text-[11px] font-bold text-[var(--palantir-muted)] truncate uppercase tracking-tight">
                      {doc.title || "Pending_Link"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 03. EXCEPTIONS & LOGS */}
      {(skipped.length > 0 || errors.length > 0) && (
        <div className="p-3 bg-red-500/5 border-l-2 border-red-500 space-y-2">
          {skipped.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] font-mono text-yellow-500 uppercase">
              <ExclamationCircleIcon className="w-3 h-3" /> Skipped: {s}
            </div>
          ))}
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[9px] font-mono text-red-500 uppercase">
              <ExclamationCircleIcon className="w-3 h-3" /> Fault: {err.category} // {err.error}
            </div>
          ))}
        </div>
      )}

      {/* 04. UPLOAD PORTAL */}
      {!readOnly && (
        <form onSubmit={handleUpload} className="pt-4 border-t border-[var(--palantir-border)] space-y-3">
          <div className="relative">
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full py-4 border-2 border-dashed transition-all cursor-pointer 
                ${file ? 'border-[var(--palantir-active)] bg-[var(--palantir-active)]/5' : 'border-[var(--palantir-border)] hover:bg-white/5'}`}
            >
              <CloudArrowUpIcon className={`w-6 h-6 mb-1 ${file ? 'text-[var(--palantir-active)]' : 'text-[var(--palantir-muted)]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">
                {file ? file.name : "Initialize_Data_Transfer"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <TagIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--palantir-muted)]" />
              <input
                type="text"
                placeholder="TAG_CATEGORY"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-[var(--palantir-border)] pl-7 pr-2 py-2 text-[10px] font-mono focus:border-[var(--palantir-active)] outline-none text-[var(--palantir-text)] uppercase"
              />
            </div>
            <div className="relative">
              <IdentificationIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--palantir-muted)]" />
              <input
                type="text"
                placeholder="DESC_ID"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-[var(--palantir-border)] pl-7 pr-2 py-2 text-[10px] font-mono focus:border-[var(--palantir-active)] outline-none text-[var(--palantir-text)] uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploadDocument.isPending || !file}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[var(--palantir-active)] hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all shadow-[0_0_15px_rgba(30,136,229,0.2)]"
          >
            {uploadDocument.isPending ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <DocumentArrowUpIcon className="w-4 h-4" />
            )}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Execute_Upload</span>
          </button>
        </form>
      )}
    </div>
  );
};

export default DocumentsPanel;
