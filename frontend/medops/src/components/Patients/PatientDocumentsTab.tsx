// src/components/Patients/PatientDocumentsTab.tsx
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
  const deleteDocument = useDeleteDocument();
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

  const documents = Array.isArray(data?.list) ? data.list : [];
  const isEmpty = !isLoading && !error && documents.length === 0;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Documentos clínicos</h3>

      {/* Uploader */}
      <form onSubmit={handleUpload} className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-3">
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="col-span-3">
          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="col-span-3">
          <input
            type="text"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="col-span-3 flex items-center">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm w-full"
            disabled={uploadDocument.isPending}
          >
            {uploadDocument.isPending ? "Subiendo..." : "Subir"}
          </button>
        </div>
      </form>

      {/* Estados */}
      {isLoading && <p className="text-sm text-gray-600 dark:text-gray-400">Cargando documentos...</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">Error: {(error as Error).message}</p>}
      {isEmpty && <p className="text-sm text-gray-500 dark:text-gray-400">No tiene documentos registrados</p>}

      {/* Tabla */}
      {!isLoading && !error && documents.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
            <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 border-b">Descripción</th>
                <th className="px-4 py-2 border-b">Categoría</th>
                <th className="px-4 py-2 border-b">Archivo</th>
                <th className="px-4 py-2 border-b">Subido</th>
                <th className="px-4 py-2 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d: MedicalDocument) => (
                <tr key={d.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{d.description || "Documento sin descripción"}</td>
                  <td className="px-4 py-2">{d.category || "Sin categoría"}</td>
                  <td className="px-4 py-2">
                    <a
                      href={d.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Ver archivo
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    {d.uploaded_at
                      ? new Date(d.uploaded_at).toLocaleDateString("es-VE")
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="px-3 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition"
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
        </div>
      )}
    </div>
  );
}
