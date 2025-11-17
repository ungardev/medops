// src/components/Consultation/DocumentsPanel.tsx
import React, { useState } from "react";
import {
  useDocuments,
  useUploadDocument,
  DocumentItem,
} from "../../hooks/consultations/useDocuments";

// 🔹 Exportamos la interfaz para index.ts
export interface DocumentsPanelProps {
  patientId: number;
  appointmentId?: number;
  readOnly?: boolean; // flag para modo lectura
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
    <div className="documents-panel card">
      <h3 className="text-lg font-bold mb-2">Documentos clínicos</h3>

      {isLoading && <p className="text-muted">Cargando documentos...</p>}

      <ul className="mb-4">
        {documents.length === 0 && !isLoading && (
          <li className="text-muted">Sin documentos</li>
        )}
        {documents.map((doc: DocumentItem) => (
          <li key={doc.filename || doc.audit_code} className="border-b py-1">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
              title={doc.filename || ""}
            >
              {doc.title}
            </a>{" "}
            <span className="text-sm text-muted">
              ({doc.category}) — Código: {doc.audit_code}
            </span>
          </li>
        ))}
      </ul>

      {skipped.length > 0 && (
        <p className="text-sm text-warning">
          No se generaron: {skipped.join(", ")}
        </p>
      )}

      {!readOnly && (
        <form onSubmit={handleUpload} className="flex flex-col gap-2">
          <input
            id="file-upload"
            type="file"
            className="input-file-hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="file-upload" className="input-file-trigger btn-outline">
            Elegir archivo
          </label>
          <span className="input-file-name text-sm text-muted">
            {file ? file.name : "Ningún archivo seleccionado"}
          </span>

          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          />
          <button
            type="submit"
            className="btn-primary self-start"
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
