import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client"; // ✅ Eliminado 'api', solo necesitamos apiFetch
import { Appointment } from "../../types/appointments";

interface ConsultationsResult {
  list: Appointment[];
  totalCount: number;
}

// Normaliza estado a minúsculas
function normalizeStatus(status?: string | null): boolean {
  const s = (status ?? "").toLowerCase().trim();
  return s === "completed" || s === "completada" || s === "completado";
}

async function fetchConsultationsByPatient(patientId: number): Promise<Appointment[]> {
  // ✅ No necesitas pasar Authorization ni Content-Type manualmente. 
  // Tu apiFetch ya lo hace por ti.
  const response = await apiFetch<any>(
    `appointments/?patient=${patientId}`,
    {
      method: "GET",
      headers: {
        "X-Institution-ID": localStorage.getItem('active_institution_id') || "1"
      }
    }
  );

  let arr: Appointment[] = [];

  if (Array.isArray(response)) {
    arr = response;
  } else if (response && typeof response === "object" && Array.isArray(response.results)) {
    arr = response.results;
  }

  return arr.filter((a: Appointment) => normalizeStatus(a.status));
}

export function useConsultationsByPatient(patientId: number) {
  return useQuery<Appointment[], Error, ConsultationsResult>({
    queryKey: ["consultations", patientId],
    queryFn: () => fetchConsultationsByPatient(patientId),
    enabled: !!patientId,
    select: (data: Appointment[]) => ({
      list: Array.isArray(data) ? data : [],
      totalCount: Array.isArray(data) ? data.length : 0,
    }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}