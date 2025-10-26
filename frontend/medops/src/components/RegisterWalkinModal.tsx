// src/components/RegisterWalkinModal.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { createPatient } from "../api/patients";
import { registerArrival } from "../api/waitingRoom";
import { Patient } from "../types/patients";

interface Props {
  onClose: () => void;
  onSuccess: (entry: any) => void;
}

interface FormValues {
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  document: string;
  phone?: string;
  email?: string;
}

const RegisterWalkinModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      // 🔹 limpiar payload: quitar campos vacíos
      const payload: any = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          payload[key] = value.trim();
        }
      });

      // Crear paciente
      const patient: Patient = await createPatient(payload);

      // Registrar llegada como walk-in
      const entry = await registerArrival(patient.id);
      onSuccess(entry);
      reset();
      onClose();
    } catch (e: any) {
      console.error("Error creando paciente:", e);
      alert(e.message || "Error creando paciente");
    }
  };

  return (
    <div className="modal">
      <h2>Registrar llegada</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          placeholder="Nombre"
          {...register("first_name", { required: "El nombre es obligatorio" })}
        />
        {errors.first_name && <span>{errors.first_name.message}</span>}

        <input placeholder="Segundo nombre (opcional)" {...register("second_name")} />

        <input
          placeholder="Apellido"
          {...register("last_name", { required: "El apellido es obligatorio" })}
        />
        {errors.last_name && <span>{errors.last_name.message}</span>}

        <input placeholder="Segundo apellido (opcional)" {...register("second_last_name")} />

        <input
          placeholder="Documento (Cédula)"
          {...register("document", { required: "El documento es obligatorio" })}
        />
        {errors.document && <span>{errors.document.message}</span>}

        <input placeholder="Teléfono" {...register("phone")} />

        <input
          placeholder="Email"
          {...register("email", {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email inválido",
            },
          })}
        />
        {errors.email && <span>{errors.email.message}</span>}

        <div className="actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear y registrar llegada"}
          </button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterWalkinModal;
