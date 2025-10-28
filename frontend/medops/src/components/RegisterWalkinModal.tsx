// src/components/RegisterWalkinModal.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { createPatient, searchPatients } from "../api/patients";
import { Patient, PatientRef } from "../types/patients";
import type { WaitingRoomEntry } from "../types/waitingRoom";

interface Props {
  onClose: () => void;
  onSuccess: (patientId: number) => void;
  existingEntries: WaitingRoomEntry[]; // 🔹 nueva prop
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

const RegisterWalkinModal: React.FC<Props> = ({ onClose, onSuccess, existingEntries }) => {
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

  // índice resaltado con teclado
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Buscar pacientes existentes mientras se escribe
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }
      try {
        const found: PatientRef[] = await searchPatients(query);
        setResults(found);
        setHighlightedIndex(found.length > 0 ? 0 : -1);
      } catch (e) {
        console.error("Error buscando pacientes:", e);
      }
    };
    fetchResults();
  }, [query]);

  // Cerrar con tecla Esc + navegación con teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (mode === "search" && results.length > 0 && !selectedPatient) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
        } else if (e.key === "Enter" && highlightedIndex >= 0) {
          e.preventDefault();
          setSelectedPatient(results[highlightedIndex]);
          setQuery("");
          setResults([]);
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mode, results, highlightedIndex, selectedPatient, onClose]);

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
      onSuccess(patientId);
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

  // 🔹 Validación: evitar duplicados en frontend
  const alreadyInWaitingRoom = selectedPatient
    ? existingEntries.some(
        (e) =>
          e.patient.id === selectedPatient.id &&
          e.status !== "completed" &&
          e.status !== "canceled"
      )
    : false;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              <ul className="card results-list">
                {results.map((p, index) => (
                  <li
                    key={p.id}
                    className={index === highlightedIndex ? "highlighted" : ""}
                    onClick={() => {
                      setSelectedPatient(p);
                      setQuery("");
                      setResults([]);
                    }}
                  >
                    {p.full_name} {p.national_id ? `— ${p.national_id}` : ""}
                  </li>
                ))}
              </ul>
            )}

            {selectedPatient && (
              <div className="card mt-3 text-center">
                <h3 className="mb-2">
                  {selectedPatient.full_name}
                  {selectedPatient.national_id
                    ? ` (${selectedPatient.national_id})`
                    : ""}
                </h3>
                {alreadyInWaitingRoom ? (
                  <p className="text-danger">
                    ⚠️ Este paciente ya está en la sala de espera
                  </p>
                ) : (
                  <div className="modal-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => onSubmit({} as FormValues)}
                    >
                      Registrar llegada
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary mt-3"
              onClick={() => setMode("create")}
            >
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
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email inválido",
                },
              })}
            />
            {errors.email && (
              <span className="text-danger">{errors.email.message}</span>
            )}

            <div className="modal-actions">
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear y registrar llegada"}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setMode("search")}
              >
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
