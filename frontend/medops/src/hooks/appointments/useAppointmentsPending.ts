import { useQuery } from "@tanstack/react-query";
export interface AppointmentPending {
  id: number;
  appointment_date: string;
  expected_amount: string;
  patient: {
    id: number;
    full_name: string;
    national_id?: string;
    phone_number?: string;
  };
  payments?: any[];
  financial_status?: string;
  status?: string;
  appointment_type?: string;
}
// ✅ CORREGIDO: Enviar token + X-Institution-ID
async function fetchAppointmentsPending(): Promise<AppointmentPending[]> {
  const token = localStorage.getItem('authToken') || '';
  const institutionId = localStorage.getItem('active_institution_id') || '';
  
  const headers: Record<string, string> = {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
  
  if (institutionId) {
    headers['X-Institution-ID'] = institutionId;
  }
  
  const res = await fetch("/api/appointments/pending/", { headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Error al cargar citas pendientes");
  }
  
  return res.json();
}
export function useAppointmentsPending() {
  return useQuery<AppointmentPending[]>({
    queryKey: ["appointments", "pending"],
    queryFn: fetchAppointmentsPending,
    refetchInterval: 30000,
  });
}