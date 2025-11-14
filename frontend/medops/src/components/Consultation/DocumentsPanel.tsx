import { useState } from "react";
import {
  useDocuments,
  useUploadDocument,
} from "../../hooks/consultations/useDocuments";

interface DocumentsPanelProps {
  patientId: number;
  appointmentId?: number; // 👈 opcional
}

export default function DocumentsPanel({ patientId, appointmentId }: DocumentsPanelProps) {
  const { data: documents, isLoading } = useDocuments(patientId, appointmentId);
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

  return (
    <div className="documents-panel card">
      <h3 className="text-lg font-bold mb-2">Documentos clínicos</h3>

      {isLoading && <p className="text-muted">Cargando documentos...</p>}

      <ul className="mb-4">
        {documents?.length === 0 && (
          <li className="text-muted">Sin documentos</li>
        )}
        {documents?.map((doc) => (
          <li key={doc.id} className="border-b py-1">
            <a
              href={doc.file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {doc.description || "Documento"}
            </a>{" "}
            <span className="text-sm text-muted">
              ({doc.category}) —{" "}
              {new Date(doc.uploaded_at).toLocaleDateString()} por{" "}
              {doc.uploaded_by}
            </span>
          </li>
        ))}
      </ul>

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
        <button type="submit" className="btn-primary self-start">
          + Subir documento
        </button>
      </form>
    </div>
  );
}
