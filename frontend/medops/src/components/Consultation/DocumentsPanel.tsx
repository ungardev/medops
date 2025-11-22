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
    <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Documentos clínicos
      </h3>

      {isLoading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Cargando documentos...</p>
      )}

      <ul className="mb-4">
        {documents.length === 0 && !isLoading && (
          <li className="text-sm text-gray-600 dark:text-gray-400">Sin documentos</li>
        )}
        {documents.map((doc: DocumentItem) => (
          <li
            key={doc.filename || doc.audit_code}
            className="border-b border-gray-200 dark:border-gray-700 py-1"
          >
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
              title={doc.filename || ""}
            >
              {doc.title}
            </a>{" "}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({doc.category}) — Código: {doc.audit_code}
            </span>
          </li>
        ))}
      </ul>

      {skipped.length > 0 && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
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
                       text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700
                       hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
          >
            Elegir archivo
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {file ? file.name : "Ningún archivo seleccionado"}
          </span>

          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <input
            type="text"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors self-start"
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
