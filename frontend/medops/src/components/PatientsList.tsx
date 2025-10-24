import React from "react";
import { Patient } from "types/patients";
import { useNavigate } from "react-router-dom";

interface PatientsListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: number) => void;
}

function calculateAge(birthdate?: string | null): number | string {
  if (!birthdate) return "—";
  const birth = new Date(birthdate);
  const diff = Date.now() - birth.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}

export default function PatientsList({ patients, onEdit, onDelete }: PatientsListProps) {
  const navigate = useNavigate();

  return (
    <div>
      <h2>Lista de Pacientes</h2>
      <table>
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Nombre completo</th>
            <th>Edad</th>
            <th>Género</th>
            <th>Contacto</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.national_id || "—"}</td>
              <td>{p.name}</td> {/* 🔹 usar name en lugar de concatenar */}
              <td>{calculateAge(p.birthdate)}</td>
              <td>{p.gender}</td>
              <td>{p.contact_info || "—"}</td>
              <td>
                <button onClick={() => onEdit(p)}>✏️ Editar</button>
                <button onClick={() => onDelete(p.id)}>🗑 Eliminar</button>
                <button onClick={() => navigate(`/patients/${p.id}`)}>📄 Ver ficha</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
