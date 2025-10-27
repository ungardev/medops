// src/components/RegisterWalkinModal.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { createPatient, searchPatients } from "../api/patients";
import { registerArrival } from "../api/waitingRoom";
import { Patient, PatientRef } from "../types/patients";

interface Props {
  onClose: () => void;
  onSuccess: (entry: any) => void;
}

interface FormValues {
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  national_id?: string;
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

  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);

  // Buscar pacientes existentes mientras se escribe
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      try {
        const found: PatientRef[] = await searchPatients(query);
        setResults(found);
      } catch (e) {
        console.error("Error buscando pacientes:", e);
      }
    };
    fetchResults();
  }, [query]);

  // Cerrar con tecla Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const onSubmit = async (values: FormValues) => {
    try {
      let patientId: number;

      if (selectedPatient) {
        patientId = selectedPatient.id;
      } else {
        const payload: any = {};
        Object.entries(values).forEach(([key, value]) => {
          if (value && value.trim() !== "") {
            payload[key] = value.trim();
          }
        });
        const patient: Patient = await createPatient(payload);
        patientId = patient.id;
      }

      const entry = await registerArrival(patientId);
      onSuccess(entry);
      reset();
      setSelectedPatient(null);
      setQuery("");
      setMode("search");
      onClose();
    } catch (e: any) {
      console.error("Error registrando llegada:", e);
      alert(e.message || "Error registrando llegada");
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Botón de cierre (X) */}
        <button
          className="btn-ghost"
          style={{ position: "absolute", top: "12px", right: "12px" }}
          onClick={onClose}
        >
          ✖
        </button>

        <h2>Registrar llegada</h2>

        {/* === MODO BÚSQUEDA === */}
        {mode === "search" && (
          <div className="form">
            <input
              className="input"
              placeholder="Buscar paciente por nombre o cédula..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedPatient(null);
              }}
            />

            {results.length > 0 && !selectedPatient && (
              <ul className="card" style={{ maxHeight: "200px", overflowY: "auto" }}>
                {results.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between items-center"
                    style={{ padding: "6px", cursor: "pointer" }}
                    onClick={() => {
                      setSelectedPatient(p);
                      setQuery("");
                      setResults([]);
                    }}
                  >
                    <span>
                      {p.full_name} {p.national_id ? `— ${p.national_id}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {selectedPatient && (
              <div className="card mt-3 text-center">
                <h3 className="mb-2">
                  {selectedPatient.full_name}
                  {selectedPatient.national_id ? ` (${selectedPatient.national_id})` : ""}
                </h3>
                <div className="modal-actions">
                  <button className="btn btn-success" onClick={() => onSubmit({} as FormValues)}>
                    Registrar llegada
                  </button>
                  <button className="btn btn-outline" onClick={() => setSelectedPatient(null)}>
                    Cambiar
                  </button>
                </div>
              </div>
            )}

            <button className="btn btn-primary mt-3" onClick={() => setMode("create")}>
              Crear nuevo paciente
            </button>
          </div>
        )}

        {/* === MODO CREACIÓN === */}
        {mode === "create" && (
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
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email inválido",
                },
              })}
            />
            {errors.email && <span className="text-danger">{errors.email.message}</span>}

            <div className="modal-actions">
              <button className="btn btn-success" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear y registrar llegada"}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setMode("search")}>
                Volver
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default RegisterWalkinModal;
