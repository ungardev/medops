import React, { useState, useEffect } from "react";

interface Patient {
  id: number;
  name: string;
  age: number;
  diagnosis: string;
}

interface PatientFormProps {
  onSubmit: (data: Omit<Patient, "id" | "name"> & { first_name: string; last_name: string }) => void;
  patient?: Patient | null;
}

export default function PatientForm({ onSubmit, patient }: PatientFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<number>(0);
  const [diagnosis, setDiagnosis] = useState("");

  useEffect(() => {
    if (patient) {
      const [first, last] = patient.name.split(" ");
      setFirstName(first || "");
      setLastName(last || "");
      setAge(patient.age);
      setDiagnosis(patient.diagnosis);
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ first_name: firstName, last_name: lastName, age, diagnosis });
    setFirstName("");
    setLastName("");
    setAge(0);
    setDiagnosis("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{patient ? "Editar Paciente" : "Nuevo Paciente"}</h2>
      <input
        type="text"
        placeholder="Nombre"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Apellido"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Edad"
        value={age}
        onChange={(e) => setAge(Number(e.target.value))}
        required
      />
      <input
        type="text"
        placeholder="Diagnóstico"
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
        required
      />
      <button type="submit">{patient ? "Actualizar" : "Crear"}</button>
    </form>
  );
}
