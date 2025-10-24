import React, { useState, useEffect } from "react";
import { Patient, PatientInput } from "types/patients";

interface PatientFormProps {
  onSubmit: (data: PatientInput) => void;
  patient?: Patient | null;
}

type Gender = "M" | "F" | "Unknown";

export default function PatientForm({ onSubmit, patient }: PatientFormProps) {
  const [nationalId, setNationalId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("Unknown");
  const [contactInfo, setContactInfo] = useState("");

  useEffect(() => {
    if (patient) {
      setNationalId(patient.national_id || "");
      setFirstName(patient.first_name || "");
      setMiddleName(patient.middle_name || "");
      setLastName(patient.last_name || "");
      setSecondLastName(patient.second_last_name || "");
      setBirthdate(patient.birthdate || "");
      // Normaliza cualquier valor inesperado a "Unknown"
      const g = patient.gender as Gender | undefined;
      setGender(g === "M" || g === "F" || g === "Unknown" ? g : "Unknown");
      setContactInfo(patient.contact_info || "");
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PatientInput = {
      national_id: nationalId || undefined,
      first_name: firstName,
      middle_name: middleName || undefined,
      last_name: lastName,
      second_last_name: secondLastName || undefined,
      birthdate: birthdate || undefined,
      gender, // siempre "M" | "F" | "Unknown"
      contact_info: contactInfo || undefined,
    };
    onSubmit(payload);

    if (!patient) {
      setNationalId("");
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setSecondLastName("");
      setBirthdate("");
      setGender("Unknown");
      setContactInfo("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{patient ? "Editar Paciente" : "Nuevo Paciente"}</h2>

      <input
        type="text"
        placeholder="Cédula"
        value={nationalId}
        onChange={(e) => setNationalId(e.target.value)}
      />

      <input
        type="text"
        placeholder="Nombre"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Segundo nombre"
        value={middleName}
        onChange={(e) => setMiddleName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Apellido"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Segundo apellido"
        value={secondLastName}
        onChange={(e) => setSecondLastName(e.target.value)}
      />

      <input
        type="date"
        value={birthdate}
        onChange={(e) => setBirthdate(e.target.value)}
      />

      <select
        value={gender}
        onChange={(e) => setGender(e.target.value as Gender)}
      >
        <option value="Unknown">Desconocido</option>
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
      </select>

      <textarea
        placeholder="Información de contacto"
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
      />

      <button type="submit">{patient ? "Actualizar" : "Crear"}</button>
    </form>
  );
}
