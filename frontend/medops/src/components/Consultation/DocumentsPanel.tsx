// src/components/Consultation/DocumentsPanel.tsx
import React, { useState } from "react";
import {
  useDocuments,
  useUploadDocument,
  DocumentItem,
} from "../../hooks/consultations/useDocuments";

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

  const documents: DocumentItem[] = data?.documents || [];
  const skipped: string[] = data?.skipped || [];

  return (
    <div
      className="
        rounded-lg shadow-lg p-3 sm:p-4 
        bg-white dark:bg-gray-900 
        lg:bg-white lg:dark:bg-gray-800 
        relative z-10
      "
    >
      {/* 🔹 Título visible en todas las versiones */}
      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-[#0d2c53] dark:text-white mb-2">
        Documentos clínicos
      </h3>

      {isLoading && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Cargando documentos...
        </p>
      )}

      <ul className="mb-4 space-y-1">
        {documents.length === 0 && !isLoading && (
          <li className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Sin documentos
          </li>
        )}
        {documents.map((doc: DocumentItem) => (
          <li
            key={doc.audit_code}
            className="border-b border-gray-200 dark:border-gray-700 py-1 text-xs sm:text-sm"
          >
            {doc.file_url ? (
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[#0d2c53] dark:text-blue-400 hover:underline focus:outline-none"
                title={`Documento ${doc.category} — ${doc.audit_code}`}
              >
                {doc.title || "Documento sin descripción"} ({doc.category}) — Código: {doc.audit_code}
              </a>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {doc.title || "Documento sin descripción"} ({doc.category}) — Código: {doc.audit_code}
              </span>
            )}
          </li>
        ))}
      </ul>

      {skipped.length > 0 && (
        <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
          No se generaron: {skipped.join(", ")}
        </p>
      )}

      {!readOnly && (
        <form onSubmit={handleUpload} className="flex flex-col gap-2">
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="file-upload"
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600
                       text-xs sm:text-sm text-[#0d2c53] dark:text-gray-200 bg-gray-100 dark:bg-gray-700
                       hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
          >
            Elegir archivo
          </label>
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {file ? file.name : "Ningún archivo seleccionado"}
          </span>

          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
          <input
            type="text"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
          <button
            type="submit"
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors self-start"
            disabled={uploadDocument.isPending}
          >
            {uploadDocument.isPending ? "Subiendo..." : "+ Subir documento"}
          </button>
        </form>
      )}
    </div>
  );
};

export default DocumentsPanel;
