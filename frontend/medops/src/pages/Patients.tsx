import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPatients, getPatient, createPatient, updatePatient, deletePatient } from "api/patients";
import { Patient, PatientInput } from "types/patients";
import PatientsList from "components/PatientsList";
import PatientForm from "components/PatientForm";

export default function Patients() {
  const queryClient = useQueryClient();
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError, error } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const createMutation = useMutation({
    mutationFn: (input: PatientInput) => createPatient(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
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

  if (isLoading) return <p>Cargando...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <div>
      <h1>Pacientes</h1>

      {/* Crear */}
      <PatientForm onSubmit={(data) => createMutation.mutate(data)} />

      {/* Listado */}
      <PatientsList
        patients={data || []}
        onEdit={async (patient) => {
          const fullPatient = await getPatient(patient.id);
          setEditingPatient(fullPatient);
          setShowModal(true);
        }}
        onDelete={(id) => deleteMutation.mutate({ id })}
      />

      {/* Modal de edición */}
      {showModal && editingPatient && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={() => setShowModal(false)}>❌ Cerrar</button>
            <PatientForm
              patient={editingPatient}
              onSubmit={(formData) =>
                updateMutation.mutate({ id: editingPatient.id, data: formData })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
