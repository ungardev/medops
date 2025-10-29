// src/components/PatientInfoTab.tsx
import { usePatient } from "../hooks/usePatient";

interface Props {
  patientId: number;
}

export default function PatientInfoTab({ patientId }: Props) {
  const { data: patient, isLoading, error } = usePatient(patientId);

  if (isLoading) return <p>Cargando información...</p>;
  if (error) return <p className="text-danger">Error: {error.message}</p>;
  if (!patient) return <p>No se encontró información del paciente</p>;

  return (
    <div className="card">
      <ul className="list-unstyled">
        <li><strong>Cédula:</strong> {patient.national_id ?? "—"}</li>
        <li><strong>Fecha de nacimiento:</strong> {patient.birthdate ?? "—"}</li>
        <li><strong>Género:</strong> {patient.gender ?? "—"}</li>
        <li><strong>Contacto:</strong> {patient.contact_info ?? "—"}</li>
        <li><strong>Email:</strong> {patient.email ?? "—"}</li>
        <li><strong>Dirección:</strong> {patient.address ?? "—"}</li>
        <li><strong>Peso:</strong> {patient.weight ? `${patient.weight} kg` : "—"}</li>
        <li><strong>Altura:</strong> {patient.height ? `${patient.height} cm` : "—"}</li>
        <li><strong>Tipo de sangre:</strong> {patient.blood_type ?? "—"}</li>
        <li><strong>Alergias:</strong> {patient.allergies ?? "—"}</li>
        <li><strong>Historial médico:</strong> {patient.medical_history ?? "—"}</li>
      </ul>
    </div>
  );
}
