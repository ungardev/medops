// src/components/Patients/PatientsList.tsx
import React from "react";
import { Patient } from "types/patients";
import { useNavigate } from "react-router-dom";
import PatientsTable from "./PatientsTable";
import { useDeletePatient } from "../../hooks/patients/useDeletePatient";

interface PatientsListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
}

function calculateAge(birthdate?: string | null): number | string {
  if (!birthdate) return "—";
  const birth = new Date(birthdate);
  const diff = Date.now() - birth.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}

export default function PatientsList({ patients, onEdit }: PatientsListProps) {
  const navigate = useNavigate();
  const deletePatient = useDeletePatient();

  const handleDelete = (id: number) => {
    if (confirm("¿Seguro que deseas eliminar este paciente?")) {
      deletePatient.mutate(id, {
        onSuccess: () => {
          console.log("Paciente eliminado");
        },
        onError: (e: any) => {
          console.error("Error eliminando paciente:", e);
          alert(e.message || "Error eliminando paciente");
        },
      });
    }
  };

  return (
    <PatientsTable
      headers={[
        "Cédula",
        "Nombre completo",
        "Edad",
        "Género",
        "Contacto",
        "Acciones",
      ]}
    >
      {patients.map((p) => (
        <tr key={p.id}>
          <td>{p.national_id || "—"}</td>
          <td>{p.full_name}</td>
          <td>{calculateAge(p.birthdate)}</td>
          <td>{p.gender}</td>
          <td>{p.contact_info || "—"}</td>
          <td className="actions">
            <button className="btn btn-outline" onClick={() => onEdit(p)}>
              Editar
            </button>
            <button
              className="btn btn-outline text-danger"
              onClick={() => handleDelete(p.id)}
              disabled={deletePatient.isPending}
            >
              {deletePatient.isPending ? "Eliminando..." : "Eliminar"}
            </button>
            <button
              className="btn btn-primary-compact"
              onClick={() => navigate(`/patients/${p.id}`)}
            >
              Ver ficha
            </button>
          </td>
        </tr>
      ))}
    </PatientsTable>
  );
}
