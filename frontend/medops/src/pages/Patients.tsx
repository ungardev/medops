import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPatients, createPatient, updatePatient, deletePatient } from "api/patients";
import { Patient, PatientInput } from "types/patients";
import PatientsList from "components/PatientsList";
import PatientForm from "components/PatientForm";


export default function Patients() {
  const { data, isLoading, isError, error } = useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: getPatients,
  });

  console.log("React Query test:", { data, isLoading, isError, error });

  if (isLoading) return <p>Cargando...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <div>
      <h1>Pacientes</h1>
      <ul>
        {data?.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
