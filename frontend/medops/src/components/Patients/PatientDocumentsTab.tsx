// src/components/Patients/PatientDocumentsTab.tsx
import React, { useState, useEffect } from "react";
import { PatientTabProps } from "./types";
import { useDocumentsByPatient } from "../../hooks/patients/useDocumentsByPatient";
import { useUploadDocument } from "../../hooks/patients/useUploadDocument";
import { useDeleteDocument } from "../../hooks/patients/useDeleteDocument";
import { MedicalDocument } from "../../types/documents";
import { useNotify } from "../../hooks/useNotify";
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
export default function PatientDocumentsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error, refetch } = useDocumentsByPatient(patient.id);
  const uploadDocument = useUploadDocument(patient.id);
  const deleteDocument = useDeleteDocument(patient.id);
  const notify = useNotify();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  useEffect(() => {
    if (uploadDocument.isSuccess) notify.success("ENCRYPTED_UPLOAD_COMPLETE");
    if (deleteDocument.isSuccess) notify.success("RECORD_PURGED_SUCCESSFULLY");
  }, [uploadDocument.isSuccess, deleteDocument.isSuccess]);
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !description.trim() || !category) {
      notify.error("MISSING_REQUIRED_FIELDS");
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
  const documents = Array.isArray(data?.list) ? data.list : [];
  return (
    <div className="space-y-6">
      {/* --- SECTION 01: FILE UPLOAD TERMINAL --- */}
      <div className="bg-black/40 border border-white/10 rounded-sm overflow-hidden">
        <div className="px-6 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <span className="text-[10px] font-mono font-black text-blue-300 uppercase tracking-widest flex items-center gap-2">
            <CloudArrowUpIcon className="w-3.5 h-3.5 text-blue-400" />
            File_Upload_Protocol
          </span>
          <span className="text-[9px] font-mono text-white/60">ENCRYPTION: AES_256_ACTIVE</span>
        </div>
        <form onSubmit={handleUpload} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Custom File Input Wrapper */}
            <div className="md:col-span-1 relative group">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className={`h-11 flex items-center justify-center border border-dashed rounded-sm transition-all ${file ? 'border-blue-400 bg-blue-400/5' : 'border-white/10 group-hover:border-blue-400/50'}`}>
                <span className="text-[10px] font-mono text-white/60 truncate px-2">
                  {file ? file.name : "SELECT_FILE_RAW"}
                </span>
              </div>
            </div>
            <input
              type="text"
              placeholder="DESCRIPTION_ID"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-black/40 border border-white/10 px-4 h-11 text-[11px] font-mono text-white focus:outline-none focus:border-blue-400/50 uppercase"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black/40 border border-white/10 px-4 h-11 text-[11px] font-mono text-white focus:outline-none focus:border-blue-400/50"
            >
              <option value="">CATEGORY_SELECT</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={uploadDocument.isPending}
              className="h-11 bg-white/5 border border-white/10 text-[10px] font-mono font-black tracking-widest uppercase hover:bg-blue-400/10 hover:text-white hover:border-blue-400 transition-all disabled:opacity-50"
            >
              {uploadDocument.isPending ? "UPLOADING..." : "EXEC_UPLOAD"}
            </button>
          </div>
        </form>
      </div>
      {/* --- SECTION 02: DOCUMENT REPOSITORY --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[10px] font-mono text-white/60 animate-pulse uppercase tracking-widest">
            Scanning_Data_Vault...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full py-12 border border-dashed border-white/10 flex flex-col items-center opacity-30">
            <DocumentIcon className="w-8 h-8 mb-2" />
            <span className="text-[10px] font-mono uppercase tracking-widest">No_Binary_Records_Found</span>
          </div>
        ) : (
          documents.map((d: MedicalDocument) => (
            <div 
              key={d.id} 
              className="group bg-black/20 border border-white/10 p-4 hover:border-blue-400/30 transition-all flex items-start gap-4"
            >
              <div className="p-3 bg-white/5 border border-white/10 group-hover:text-blue-400 transition-colors">
                <DocumentIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">
                    {d.description || "UNTITLED_RECORD"}
                  </h4>
                  <div className="flex gap-1">
                    {d.file_url && (
                      <a
                        href={resolveFileURL(d.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-white/60 hover:text-blue-400"
                        title="ACCESS_FILE"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => { if(confirm("EXEC_PURGE?")) deleteDocument.mutate(d.id); }}
                      className="p-1 text-white/60 hover:text-red-500"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-white/60 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-400" />
                    CAT: {CATEGORY_OPTIONS.find(o => o.value === d.category)?.label || "MISC"}
                  </span>
                  <span>SRC: {d.source === "system_generated" ? "SYSTEM" : "UPLOADER"}</span>
                  <span>DATE: {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("es-VE") : "---"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="pt-4 border-t border-white/10 flex items-center gap-2 opacity-50">
        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-[8px] font-mono text-white/60 uppercase tracking-widest">
          All document access is logged and audited by institutional security protocols.
        </span>
      </div>
    </div>
  );
}