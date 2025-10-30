// src/components/Patients/PatientDocumentsTab.tsx
import React from "react";
import { PatientTabProps } from "./types";
import { useDocumentsByPatient } from "../../hooks/patients/useDocumentsByPatient";
import { MedicalDocument } from "../../types/documents";

export default function PatientDocumentsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error } = useDocumentsByPatient(patient.id);

  const documents = data?.list ?? [];
  const isEmpty = !isLoading && !error && documents.length === 0;

  if (isLoading) return <p>Cargando documentos...</p>;
  if (error) return <p className="text-danger">Error: {(error as Error).message}</p>;
  if (isEmpty) return <p>No tiene documentos registrados</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Descripción</th>
          <th>Categoría</th>
          <th>Archivo</th>
          <th>Subido</th>
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
