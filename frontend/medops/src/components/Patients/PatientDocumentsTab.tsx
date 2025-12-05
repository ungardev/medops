// src/components/Patients/PatientDocumentsTab.tsx
import React, { useState, useEffect } from "react";
import { PatientTabProps } from "./types";
import { useDocumentsByPatient } from "../../hooks/patients/useDocumentsByPatient";
import { useUploadDocument } from "../../hooks/patients/useUploadDocument";
import { useDeleteDocument } from "../../hooks/patients/useDeleteDocument";
import { MedicalDocument } from "../../types/documents";
import { useNotify } from "../../hooks/useNotify";

const API_ROOT = import.meta.env.VITE_API_ROOT || "http://127.0.0.1/api";

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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
      <h3 className="text-sm sm:text-base font-semibold text-[#0d2c53] dark:text-gray-100 mb-3 sm:mb-4">
        Documentos clínicos
      </h3>

      {/* Uploader */}
      <form onSubmit={handleUpload} className="grid grid-cols-12 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="col-span-12 sm:col-span-3">
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        </div>
        <div className="col-span-12 sm:col-span-3">
          <input
            type="text"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        </div>
        <div className="col-span-12 sm:col-span-3 flex items-center">
          <button
            type="submit"
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors text-xs sm:text-sm w-full"
            disabled={uploadDocument.isPending}
          >
            {uploadDocument.isPending ? "Subiendo..." : "Subir"}
          </button>
        </div>
      </form>

      {/* Estados */}
      {isLoading && (
        <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">Cargando documentos...</p>
      )}
      {error && (
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
          Error: {(error as Error).message}
        </p>
      )}
      {isEmpty && (
        <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
          No tiene documentos registrados
        </p>
      )}
            {/* Tabla / Tarjetas */}
      {!isLoading && !error && documents.length > 0 && (
        <>
          {/* Desktop: tabla */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm text-left text-[#0d2c53] dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md">
              <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-[#0d2c53] dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2 border-b">Descripción</th>
                  <th className="px-4 py-2 border-b">Categoría</th>
                  <th className="px-4 py-2 border-b">Archivo</th>
                  <th className="px-4 py-2 border-b">Subido</th>
                  <th className="px-4 py-2 border-b text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d: MedicalDocument) => (
                  <tr key={d.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{d.description || "Documento sin descripción"}</td>
                    <td className="px-4 py-2">{d.category || "Sin categoría"}</td>
                    <td className="px-4 py-2">
                      {d.file_url ? (
                        <a
                          href={`${API_ROOT}${d.file_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0d2c53] dark:text-blue-400 hover:underline"
                        >
                          Ver archivo
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {d.uploaded_at
                        ? new Date(d.uploaded_at).toLocaleDateString("es-VE")
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center">
                        <button
                          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                          onClick={() => handleDelete(d.id)}
                          disabled={deleteDocument.isPending}
                        >
                          {deleteDocument.isPending ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: tarjetas */}
          <div className="sm:hidden space-y-3">
            {documents.map((d: MedicalDocument) => (
              <div key={d.id} className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3">
                <p className="text-sm font-semibold text-[#0d2c53] dark:text-gray-100 mb-1">
                  {d.description || "Documento sin descripción"}
                </p>
                <p className="text-xs text-[#0d2c53] dark:text-gray-300">
                  <strong>Categoría:</strong> {d.category || "Sin categoría"}
                </p>
                <p className="text-xs text-[#0d2c53] dark:text-gray-300">
                  <strong>Archivo:</strong>{" "}
                  {d.file_url ? (
                    <a
                      href={`${API_ROOT}${d.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0d2c53] dark:text-blue-400 hover:underline"
                    >
                      Ver archivo
                    </a>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Sin archivo</span>
                  )}
                </p>
                <p className="text-xs text-[#0d2c53] dark:text-gray-300">
                  <strong>Subido:</strong>{" "}
                  {d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString("es-VE") : "—"}
                </p>
                <div className="mt-2 flex justify-end">
                  <button
                    className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    onClick={() => handleDelete(d.id)}
                    disabled={deleteDocument.isPending}
                  >
                    {deleteDocument.isPending ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
