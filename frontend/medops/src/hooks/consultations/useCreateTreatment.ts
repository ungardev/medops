import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment, CreateTreatmentInput } from "../../types/consultation"; // 👈 usa el tipo institucional

export function useCreateTreatment() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Treatment, Error, CreateTreatmentInput>({
    mutationFn: async (data) => {
      // 🔹 aplicamos defaults si no vienen del formulario
      const payload: CreateTreatmentInput = {
        status: data.status ?? "active",
        treatment_type: data.treatment_type ?? "pharmacological",
        ...data,
      };

      console.debug("Payload enviado a POST /api/treatments/", payload);
      return apiFetch<Treatment>("treatments/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      // 🔹 refresca la consulta actual para que aparezca el nuevo tratamiento
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
