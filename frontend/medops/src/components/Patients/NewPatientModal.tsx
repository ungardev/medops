import React from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { createPatient } from "../../api/patients";
import { Patient } from "../../types/patients";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // callback para refrescar lista
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
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>();

  if (!open) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: any = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          payload[key] = value.trim();
        }
      });
      const patient: Patient = await createPatient(payload);
      console.log("Paciente creado:", patient);
      onCreated();
      reset();
      onClose();
    } catch (e: any) {
      console.error("Error creando paciente:", e);
      alert(e.message || "Error creando paciente");
    }
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
          {errors.first_name && <span className="text-danger">{errors.first_name.message}</span>}

          <input className="input" placeholder="Segundo nombre (opcional)" {...register("second_name")} />

          <input
            className="input"
            placeholder="Apellido"
            {...register("last_name", { required: "El apellido es obligatorio" })}
          />
          {errors.last_name && <span className="text-danger">{errors.last_name.message}</span>}

          <input className="input" placeholder="Segundo apellido (opcional)" {...register("second_last_name")} />

          <input
            className="input"
            placeholder="Documento (Cédula)"
            {...register("national_id", { required: "El documento es obligatorio" })}
          />
          {errors.national_id && <span className="text-danger">{errors.national_id.message}</span>}

          <input className="input" placeholder="Teléfono" {...register("phone")} />

          <input
            className="input"
            placeholder="Email"
            {...register("email", {
              validate: (value) =>
                !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Email inválido",
            })}
          />
          {errors.email && <span className="text-danger">{errors.email.message}</span>}

          <div className="modal-actions mt-3">
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear"}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default NewPatientModal;
