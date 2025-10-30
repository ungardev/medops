// src/components/Patients/PatientForm.tsx
import React, { useState, useEffect } from "react";
import { Patient, PatientInput } from "types/patients";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { useUpdatePatient } from "../../hooks/patients/useUpdatePatient";

interface PatientFormProps {
  patient?: Patient | null;
  onClose?: () => void;
  onSaved?: () => void; // callback para refrescar lista o cerrar modal
}

type Gender = "M" | "F" | "Unknown";

export default function PatientForm({ patient, onClose, onSaved }: PatientFormProps) {
  const [nationalId, setNationalId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("Unknown");
  const [contactInfo, setContactInfo] = useState("");

  const createPatient = useCreatePatient();
  const updatePatient = patient ? useUpdatePatient(patient.id) : null;

  useEffect(() => {
    if (patient) {
      setNationalId(patient.national_id || "");
      setFirstName(patient.first_name || "");
      setMiddleName(patient.middle_name || "");
      setLastName(patient.last_name || "");
      setSecondLastName(patient.second_last_name || "");
      setBirthdate(patient.birthdate || "");
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
      gender,
      contact_info: contactInfo || undefined,
    };

    if (patient && updatePatient) {
      updatePatient.mutate(payload, {
        onSuccess: () => {
          console.log("Paciente actualizado");
          onSaved?.();
          onClose?.();
        },
        onError: (e: any) => {
          console.error("Error actualizando paciente:", e);
          alert(e.message || "Error actualizando paciente");
        },
      });
    } else {
      createPatient.mutate(payload, {
        onSuccess: () => {
          console.log("Paciente creado");
          onSaved?.();
          setNationalId("");
          setFirstName("");
          setMiddleName("");
          setLastName("");
          setSecondLastName("");
          setBirthdate("");
          setGender("Unknown");
          setContactInfo("");
          onClose?.();
        },
        onError: (e: any) => {
          console.error("Error creando paciente:", e);
          alert(e.message || "Error creando paciente");
        },
      });
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        className="input"
        type="text"
        placeholder="Cédula"
        value={nationalId}
        onChange={(e) => setNationalId(e.target.value)}
      />

      <input
        className="input"
        type="text"
        placeholder="Nombre"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />

      <input
        className="input"
        type="text"
        placeholder="Segundo nombre"
        value={middleName}
        onChange={(e) => setMiddleName(e.target.value)}
      />

      <input
        className="input"
        type="text"
        placeholder="Apellido"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />

      <input
        className="input"
        type="text"
        placeholder="Segundo apellido"
        value={secondLastName}
        onChange={(e) => setSecondLastName(e.target.value)}
      />

      <input
        className="input"
        type="date"
        value={birthdate}
        onChange={(e) => setBirthdate(e.target.value)}
      />

      <select
        className="select"
        value={gender}
        onChange={(e) => setGender(e.target.value as Gender)}
      >
        <option value="Unknown">Desconocido</option>
        <option value="M">Masculino</option>
        <option value="F">Femenino</option>
      </select>

      <textarea
        className="textarea"
        placeholder="Información de contacto"
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="btn btn-primary"
          type="submit"
          disabled={patient ? updatePatient?.isPending : createPatient.isPending}
        >
          {patient
            ? updatePatient?.isPending
              ? "Actualizando..."
              : "Actualizar"
            : createPatient.isPending
            ? "Creando..."
            : "Crear"}
        </button>
        <button className="btn btn-outline" type="button" onClick={onClose}>
          Cancelar
        </button>
      </div>

      {(createPatient.isError || updatePatient?.isError) && (
        <p className="text-danger mt-2">
          Error:{" "}
          {(createPatient.error as Error)?.message ||
            (updatePatient?.error as Error)?.message}
        </p>
      )}
    </form>
  );
}
