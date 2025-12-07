// src/hooks/appointments/useAllAppointments.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Appointment } from "../../types/appointments";
import { mapAppointmentList } from "../../utils/appointmentsMapper";

interface AllAppointmentsResult {
  list: Appointment[];
  totalCount: number;
}

async function fetchAllAppointments(): Promise<AllAppointmentsResult> {
  const first = await apiFetch<any>("appointments/?page=1&page_size=50");

  const normalize = (raw: any): Appointment[] =>
    (Array.isArray(raw?.results) ? raw.results : [])
      .map((rawAppt: any) => {
        const mapped: Appointment = mapAppointmentList(rawAppt);
        return {
          ...mapped,
          // 🔹 Blindaje: aseguramos formato YYYY-MM-DD
          appointment_date: mapped.appointment_date?.slice(0, 10) ?? "",
        };
      });

  const firstResults = normalize(first);
  const count = first?.count ?? firstResults.length;
  const pageSize = 50;
  const totalPages = Math.ceil(count / pageSize);

  let allResults = [...firstResults];
  let nextUrl = first?.next;

  while (nextUrl) {
    // ⚔️ Ahora podemos pasar nextUrl directo gracias al blindaje en client.ts
    const pageData = await apiFetch<any>(nextUrl);
    const pageResults = normalize(pageData);
    allResults = [...allResults, ...pageResults];
    nextUrl = pageData?.next;
  }

  return {
    list: allResults,
    totalCount: allResults.length,
  };
}

export function useAllAppointments() {
  return useQuery<AllAppointmentsResult, Error>({
    queryKey: ["appointments", "all"],
    queryFn: fetchAllAppointments,
    staleTime: 60_000,
  });
}
