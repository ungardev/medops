// src/components/WaitingRoom/RegisterWalkinModal.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { createPatient, searchPatients } from "../../api/patients";
import { Patient, PatientRef } from "../../types/patients";
import type { WaitingRoomEntry } from "../../types/waitingRoom";

interface Props {
  onClose: () => void;
  onSuccess: (patientId: number) => void;
  existingEntries: WaitingRoomEntry[];
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
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }
      try {
        const response = await searchPatients(query);
        setResults(response.results);
        setHighlightedIndex(response.results.length > 0 ? 0 : -1);
      } catch (e) {
        console.error("Error buscando pacientes:", e);
      }
    };
    fetchResults();
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (mode === "search" && results.length > 0 && !selectedPatient) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
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
          if (value && value.trim() !== "") payload[key] = value.trim();
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

  const alreadyInWaitingRoom = selectedPatient
    ? existingEntries.some(
        (e) =>
          e.patient.id === selectedPatient.id &&
          e.status !== "completed" &&
          e.status !== "canceled"
      )
    : false;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 animate-fade-slide"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-4">
          Registrar llegada
        </h2>

        {/* === MODO BÚSQUEDA === */}
        {mode === "search" && (
          <div className="space-y-4">
            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              placeholder="Buscar paciente por nombre o cédula..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedPatient(null);
              }}
            />

            {results.length > 0 && !selectedPatient && (
              <ul className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((p, index) => (
                  <li
                    key={p.id}
                    className={`px-3 py-2 cursor-pointer ${
                      index === highlightedIndex
                        ? "bg-[#0d2c53] text-white"
                        : "text-[#0d2c53] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
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
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-center">
                <h3 className="text-[#0d2c53] dark:text-white font-semibold mb-2">
                  {selectedPatient.full_name}
                  {selectedPatient.national_id ? ` (${selectedPatient.national_id})` : ""}
                </h3>
                {alreadyInWaitingRoom ? (
                  <p className="text-red-600 font-medium">
                    ⚠️ Este paciente ya está en la sala de espera
                  </p>
                ) : (
                  <div className="flex gap-2 justify-center mt-3">
                    <button
                      className="px-4 py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
                      onClick={() => onSubmit({} as FormValues)}
                    >
                      Registrar llegada
                    </button>
                    <button
                      className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors w-full"
              onClick={() => setMode("create")}
            >
              Crear nuevo paciente
            </button>
          </div>
        )}

        {/* === MODO CREACIÓN === */}
        {mode === "create" && (
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              placeholder="Nombre"
              {...register("first_name", { required: "El nombre es obligatorio" })}
            />
            {errors.first_name && (
              <span className="text-red-600 text-sm">{errors.first_name.message}</span>
            )}

            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100"
              placeholder="Segundo nombre (opcional)"
              {...register("second_name")}
            />

            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              placeholder="Apellido"
              {...register("last_name", { required: "El apellido es obligatorio" })}
            />
            {errors.last_name && (
              <span className="text-red-600 text-sm">{errors.last_name.message}</span>
            )}

            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100"
              placeholder="Segundo apellido (opcional)"
              {...register("second_last_name")}
            />

            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
              placeholder="Documento (Cédula)"
              {...register("national_id", { required: "El documento es obligatorio" })}
            />
            {errors.national_id && (
              <span className="text-red-600 text-sm">{errors.national_id.message}</span>
            )}

            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100"
              placeholder="Teléfono"
              {...register("phone")}
            />

            <input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100"
              placeholder="Email"
              {...register("email", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email inválido",
                },
              })}
            />
            {errors.email && (
              <span className="text-red-600 text-sm">{errors.email.message}</span>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creando..." : "Crear y registrar llegada"}
              </button>
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
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
