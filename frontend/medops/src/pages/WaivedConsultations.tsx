import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWaivedConsultations,
  createWaivedConsultation,
  updateWaivedConsultation,
  deleteWaivedConsultation,
} from "api/waivedConsultations";
import {
  WaivedConsultation,
  WaivedConsultationInput,
} from "types/waivedConsultations";
import WaivedConsultationsList from "components/WaivedConsultationsList";
import WaivedConsultationForm from "components/WaivedConsultationForm";

export default function WaivedConsultations() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<WaivedConsultation | null>(null);

  // 🔎 Query principal
  const { data, isLoading, isError, error } = useQuery<WaivedConsultation[]>({
    queryKey: ["waivedConsultations"],
    queryFn: getWaivedConsultations,
  });

  // ➕ Crear
  const createMutation = useMutation({
    mutationFn: createWaivedConsultation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waivedConsultations"] }),
  });

  // ✏️ Actualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WaivedConsultationInput }) =>
      updateWaivedConsultation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waivedConsultations"] });
      setEditing(null);
    },
  });

  // ❌ Eliminar
  const deleteMutation = useMutation({
    mutationFn: deleteWaivedConsultation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waivedConsultations"] }),
  });

  if (isLoading) return <p>Cargando...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <div>
      <h1>Consultas exoneradas</h1>

      <WaivedConsultationForm
        consultation={editing}
        onSubmit={(formData) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, data: formData });
          } else {
            createMutation.mutate(formData);
          }
        }}
      />

      <WaivedConsultationsList
        consultations={data || []}
        onEdit={(c) => setEditing(c)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
