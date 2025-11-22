import React from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { PatientInput } from "../../types/patients";

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
    const payload: PatientInput = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      national_id: values.national_id.trim(),
      ...(values.second_name?.trim() ? { second_name: values.second_name.trim() } : {}),
      ...(values.second_last_name?.trim() ? { second_last_name: values.second_last_name.trim() } : {}),
      ...(values.phone?.trim() ? { phone: values.phone.trim() } : {}),
      ...(values.email?.trim() ? { email: values.email.trim() } : {}),
    };

    createPatient.mutate(payload, {
      onSuccess: () => {
        onCreated();
        reset();
        onClose();
      },
      onError: (e: unknown) => {
        const message = e instanceof Error ? e.message : "Error creando paciente";
        console.error("Error creando paciente:", e);
        alert(message);
      },
    });
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Nuevo Paciente</h2>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
          <input
            placeholder="Nombre"
            {...register("first_name", { required: "El nombre es obligatorio" })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.first_name && (
            <span className="text-sm text-red-600 dark:text-red-400">{errors.first_name.message}</span>
          )}

          <input
            placeholder="Segundo nombre (opcional)"
            {...register("second_name")}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <input
            placeholder="Apellido"
            {...register("last_name", { required: "El apellido es obligatorio" })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.last_name && (
            <span className="text-sm text-red-600 dark:text-red-400">{errors.last_name.message}</span>
          )}

          <input
            placeholder="Segundo apellido (opcional)"
            {...register("second_last_name")}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <input
            placeholder="Documento (Cédula)"
            {...register("national_id", { required: "El documento es obligatorio" })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.national_id && (
            <span className="text-sm text-red-600 dark:text-red-400">{errors.national_id.message}</span>
          )}

          <input
            placeholder="Teléfono"
            {...register("phone")}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <input
            placeholder="Email"
            {...register("email", {
              validate: (value) =>
                !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Email inválido",
            })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.email && (
            <span className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</span>
          )}

          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={createPatient.isPending}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createPatient.isPending ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>

          {createPatient.isError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
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
