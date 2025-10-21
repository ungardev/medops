import React from "react";

interface Patient {
  id: number;
  name: string;
  age: number;
  diagnosis: string;
}

interface PatientsListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: number) => void;
}

export default function PatientsList({ patients, onEdit, onDelete }: PatientsListProps) {
  return (
    <div>
      <h2>Lista de Pacientes</h2>
      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            {p.name} — {p.age} años — {p.diagnosis}
            <button onClick={() => onEdit(p)}>✏️ Editar</button>
            <button onClick={() => onDelete(p.id)}>🗑 Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
