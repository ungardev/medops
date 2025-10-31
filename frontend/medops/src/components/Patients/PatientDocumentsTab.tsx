import React, { useState, useEffect } from "react";
import { PatientTabProps } from "./types";
import { useDocumentsByPatient } from "../../hooks/patients/useDocumentsByPatient";
import { useUploadDocument } from "../../hooks/patients/useUploadDocument";
import { useDeleteDocument } from "../../hooks/patients/useDeleteDocument";
import { MedicalDocument } from "../../types/documents";
import { useNotify } from "../../hooks/useNotify";

export default function PatientDocumentsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error, refetch } = useDocumentsByPatient(patient.id);
  const uploadDocument = useUploadDocument(patient.id);
  const deleteDocument = useDeleteDocument(); // 👈 ya no recibe patientId
  const notify = useNotify();

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (uploadDocument.isSuccess) notify.success("Documento subido correctamente");
    if (uploadDocument.isError) notify.error("Error al subir el documento");
    if (deleteDocument.isSuccess) notify.success("Documento eliminado");
    if (deleteDocument.isError) notify.error("Error al eliminar el documento");
  }, [
    uploadDocument.isSuccess,
    uploadDocument.isError,
    deleteDocument.isSuccess,
    deleteDocument.isError,
  ]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await uploadDocument.mutateAsync({ file, description, category });
    setFile(null);
    setDescription("");
    setCategory("");
    await refetch();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este documento?")) return;
    await deleteDocument.mutateAsync(id);
    await refetch();
  };

  const documents = data?.list ?? [];
  const isEmpty = !isLoading && !error && documents.length === 0;

  return (
    <div>
      {/* Uploader */}
      <form onSubmit={handleUpload} className="mb-4 flex gap-2 items-center">
        <input
          type="file"
          accept=".pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="input"
        />
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
          className="btn btn-primary"
          disabled={uploadDocument.isPending}
        >
          {uploadDocument.isPending ? "Subiendo..." : "Subir"}
        </button>
      </form>

      {/* Estados */}
      {isLoading && <p>Cargando documentos...</p>}
      {error && <p className="text-danger">Error: {(error as Error).message}</p>}
      {isEmpty && <p>No tiene documentos registrados</p>}

      {/* Tabla */}
      {!isLoading && !error && documents.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Archivo</th>
              <th>Subido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d: MedicalDocument) => (
              <tr key={d.id}>
                <td>{d.description || "Documento sin descripción"}</td>
                <td>{d.category || "Sin categoría"}</td>
                <td>
                  <a href={d.file} target="_blank" rel="noopener noreferrer">
                    Ver archivo
                  </a>
                </td>
                <td>
                  {d.uploaded_at
                    ? new Date(d.uploaded_at).toLocaleDateString("es-VE")
                    : "—"}
                </td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(d.id)}
                    disabled={deleteDocument.isPending}
                  >
                    {deleteDocument.isPending ? "Eliminando..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
