import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPatients, createPatient, updatePatient, deletePatient } from "api/patients";
import { Patient, PatientInput } from "types/patients";
import PatientsList from "components/PatientsList";
import PatientForm from "components/PatientForm";

export default function Patients() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  const createMutation = useMutation({
    mutationFn: (input: PatientInput) => createPatient(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });

  // payload para update: { id, data }
  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: PatientInput }) =>
      updatePatient(payload.id, payload.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });

  // payload para delete: { id }
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

      {/* Listado con editar/eliminar */}
      <PatientsList
        patients={data || []}
        onEdit={(patient) => {
          // Aquí puedes abrir un modal con PatientForm para editar;
          // por simplicidad, construimos data desde el paciente actual:
          const editData: PatientInput = {
            national_id: patient.national_id || undefined,
            first_name: patient.first_name,
            middle_name: patient.middle_name || undefined,
            last_name: patient.last_name,
            second_last_name: patient.second_last_name || undefined,
            birthdate: patient.birthdate || undefined,
            gender: patient.gender,
            contact_info: patient.contact_info || undefined,
          };
          updateMutation.mutate({ id: patient.id, data: editData });
        }}
        onDelete={(id) => deleteMutation.mutate({ id })}
      />
    </div>
  );
}
