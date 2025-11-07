// src/components/Patients/NewPatientModal.tsx
import React from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { PatientInput } from "../../types/patients"; // 👈 importa el tipo correcto

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormValues {
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  national_id: string;
  phone?: string;
  email?: string;
}

const NewPatientModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const createPatient = useCreatePatient();

  if (!open) return null;

  const onSubmit = (values: FormValues) => {
    // Construye el payload de forma explícita y tipada
    const payload: PatientInput = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      national_id: values.national_id.trim(),
      // Campos opcionales solo si vienen con contenido
      ...(values.second_name && values.second_name.trim() !== ""
        ? { second_name: values.second_name.trim() }
        : {}),
      ...(values.second_last_name && values.second_last_name.trim() !== ""
        ? { second_last_name: values.second_last_name.trim() }
        : {}),
      ...(values.phone && values.phone.trim() !== ""
        ? { phone: values.phone.trim() }
        : {}),
      ...(values.email && values.email.trim() !== ""
        ? { email: values.email.trim() }
        : {}),
    };

    createPatient.mutate(payload, {
      onSuccess: () => {
        onCreated();
        reset();
        onClose();
      },
      onError: (e: unknown) => {
        const message =
          e instanceof Error ? e.message : "Error creando paciente";
        console.error("Error creando paciente:", e);
        alert(message);
      },
    });
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Nuevo Paciente</h2>
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <input
            className="input"
            placeholder="Nombre"
            {...register("first_name", { required: "El nombre es obligatorio" })}
          />
          {errors.first_name && (
            <span className="text-danger">{errors.first_name.message}</span>
          )}

          <input
            className="input"
            placeholder="Segundo nombre (opcional)"
            {...register("second_name")}
          />

          <input
            className="input"
            placeholder="Apellido"
            {...register("last_name", { required: "El apellido es obligatorio" })}
          />
          {errors.last_name && (
            <span className="text-danger">{errors.last_name.message}</span>
          )}

          <input
            className="input"
            placeholder="Segundo apellido (opcional)"
            {...register("second_last_name")}
          />

          <input
            className="input"
            placeholder="Documento (Cédula)"
            {...register("national_id", { required: "El documento es obligatorio" })}
          />
          {errors.national_id && (
            <span className="text-danger">{errors.national_id.message}</span>
          )}

          <input className="input" placeholder="Teléfono" {...register("phone")} />

          <input
            className="input"
            placeholder="Email"
            {...register("email", {
              validate: (value) =>
                !value ||
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
                "Email inválido",
            })}
          />
          {errors.email && (
            <span className="text-danger">{errors.email.message}</span>
          )}

          <div className="modal-actions mt-3">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={createPatient.isPending}
            >
              {createPatient.isPending ? "Creando..." : "Crear"}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>

          {createPatient.isError && (
            <p className="text-danger mt-2">
              Error: {(createPatient.error as Error)?.message}
            </p>
          )}
        </form>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default NewPatientModal;
