import { useQuery } from "@tanstack/react-query";
import { getConsultations } from "api/consultations";
import { Consultation } from "types/consultations";

export function usePatientAppointments(patientId: number) {
  return useQuery<Consultation[]>({
    queryKey: ["consultations", patientId],
    queryFn: async () => {
      const all = await getConsultations();
      return all.filter(
        (c) => c.patient === patientId && c.status === "completed" && c.type === "appointment"
      );
    },
  });
}
