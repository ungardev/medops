// src/components/PatientDocumentsTab.tsx
import { useDocumentsByPatient } from "../hooks/useDocumentsByPatient";
import { MedicalDocument } from "../types/documents";

interface Props {
  patientId: number;
}

export default function PatientDocumentsTab({ patientId }: Props) {
  const { data, isLoading, error } = useDocumentsByPatient(patientId);

  const documents = data?.list ?? [];
  const isEmpty = !isLoading && !error && documents.length === 0;

  if (isLoading) return <p>Cargando documentos...</p>;
  if (error) return <p className="text-danger">Error: {error.message}</p>;
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
                ? new Date(d.uploaded_at).toLocaleDateString()
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
