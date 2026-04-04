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
  { value: "prescription", label: "Prescripción" },
  { value: "treatment", label: "Plan de Tratamiento" },
  { value: "medical_test_order", label: "Orden de Laboratorio" },
  { value: "medical_referral", label: "Referencia Médica" },
  { value: "medical_report", label: "Informe Clínico" },
  { value: "other", label: "Otro" },
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
    if (uploadDocument.isSuccess) notify.success("Documento subido exitosamente");
    if (deleteDocument.isSuccess) notify.success("Documento eliminado");
  }, [uploadDocument.isSuccess, deleteDocument.isSuccess]);
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
  const resolveFileURL = (file_url: string) => {
    if (!file_url) return "";
    return file_url.startsWith("http") ? file_url : `${BASE_URL}${file_url}`;
  };
  const documents = Array.isArray(data?.list) ? data.list : [];
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-white/15 bg-white/5 flex items-center justify-between gap-2">
          <span className="text-[12px] font-medium text-blue-400 flex items-center gap-2">
            <CloudArrowUpIcon className="w-5 h-5" />
            Subir Documento
          </span>
        </div>
        <form onSubmit={handleUpload} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 relative group">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className={`h-11 flex items-center justify-center border border-dashed rounded-lg transition-all ${file ? 'border-blue-400/50 bg-blue-500/5' : 'border-white/15 group-hover:border-blue-400/30'}`}>
                <span className="text-[11px] text-white/50 truncate px-3">
                  {file ? file.name : "Seleccionar archivo"}
                </span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white/5 border border-white/15 px-4 h-11 text-[11px] text-white/70 focus:outline-none focus:border-blue-400/50 rounded-lg"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white/5 border border-white/15 px-4 h-11 text-[11px] text-white/70 focus:outline-none focus:border-blue-400/50 rounded-lg"
            >
              <option value="">Categoría</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={uploadDocument.isPending}
              className="h-11 bg-white/5 border border-white/15 text-[11px] font-medium text-white/60 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-400/30 transition-all disabled:opacity-50 rounded-lg"
            >
              {uploadDocument.isPending ? "Subiendo..." : "Subir"}
            </button>
          </div>
        </form>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-[11px] text-white/40 animate-pulse">
            Cargando documentos...
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-full py-12 border border-dashed border-white/15 flex flex-col items-center opacity-50 rounded-lg">
            <DocumentIcon className="w-8 h-8 mb-2 text-white/30" />
            <span className="text-[11px] text-white/40">No hay documentos registrados</span>
          </div>
        ) : (
          documents.map((d: MedicalDocument) => (
            <div 
              key={d.id} 
              className="group bg-white/5 border border-white/15 p-5 hover:border-white/25 transition-all flex items-start gap-4 rounded-lg"
            >
              <div className="p-3 bg-white/5 border border-white/10 group-hover:text-blue-400 transition-colors rounded-lg">
                <DocumentIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-[12px] font-medium text-white truncate">
                    {d.description || "Sin título"}
                  </h4>
                  <div className="flex gap-1">
                    {d.file_url && (
                      <a
                        href={resolveFileURL(d.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/50 hover:text-blue-400 rounded-lg hover:bg-white/5 transition-colors"
                        title="Abrir archivo"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => { if(confirm("¿Eliminar este documento?")) deleteDocument.mutate(d.id); }}
                      className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/40">
                  <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    {CATEGORY_OPTIONS.find(o => o.value === d.category)?.label || "Otro"}
                  </span>
                  <span>{d.source === "system_generated" ? "Generado por sistema" : "Subido manualmente"}</span>
                  <span>{d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("es-VE") : "—"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="pt-4 border-t border-white/10 flex items-center gap-2">
        <ShieldCheckIcon className="w-4 h-4 text-emerald-400/50" />
        <span className="text-[9px] text-white/40">
          El acceso a documentos es registrado y auditado por protocolos de seguridad institucional.
        </span>
      </div>
    </div>
  );
}