// src/pages/Patients.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "api/patients";
import { Patient, PatientInput, PatientRef } from "types/patients";
import PatientsList from "components/PatientsList";
import PatientForm from "components/PatientForm";
import PatientsSearch from "components/PatientsSearch";

export default function Patients() {
  const queryClient = useQueryClient();
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [now, setNow] = useState(new Date());

  // Actualizar reloj cada minuto
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: patients = [], isLoading, isError, error } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const createMutation = useMutation({
    mutationFn: (input: PatientInput) => createPatient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: PatientInput }) =>
      updatePatient(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowModal(false);
      setEditingPatient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: { id: number }) => deletePatient(payload.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });

  if (isLoading) return <p>Cargando pacientes...</p>;
  if (isError) return <p className="text-danger">Error: {(error as Error).message}</p>;

  const formattedNow = now.toLocaleString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="page">
      {/* Cabecera */}
      <div className="page-header">
        <div>
          <h2>Pacientes</h2>
          <p className="text-muted">{formattedNow}</p>
        </div>
        <div className="actions">
          <PatientsSearch
            placeholder="Buscar paciente..."
            onSelect={async (ref: PatientRef) => {
              const fullPatient = await getPatient(ref.id);
              setEditingPatient(fullPatient);
              setShowModal(true);
            }}
          />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Nuevo paciente
          </button>
        </div>
      </div>

            {/* Listado */}
      <PatientsList
        patients={patients}
        onEdit={async (patient) => {
          const fullPatient = await getPatient(patient.id);
          setEditingPatient(fullPatient);
          setShowModal(true);
        }}
        onDelete={(id) => deleteMutation.mutate({ id })}
      />

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3">
              {editingPatient ? "Editar paciente" : "Nuevo paciente"}
            </h3>
            <PatientForm
              patient={editingPatient}
              onSubmit={(formData) => {
                if (editingPatient) {
                  updateMutation.mutate({ id: editingPatient.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }}
            />
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
