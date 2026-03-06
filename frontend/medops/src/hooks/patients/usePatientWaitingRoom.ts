// src/hooks/patients/usePatientWaitingRoom.ts
import { useMemo } from "react";
import { useWaitingRoomEntriesToday } from "@/hooks/waitingroom/useWaitingRoomEntriesToday";
import type { WaitingRoomEntry, WaitingRoomStatus } from "@/types/waitingRoom";
interface PatientWaitingRoomResult {
  allEntries: WaitingRoomEntry[];
  patientEntry: WaitingRoomEntry | null;
  patientsAhead: number;
  waitingCount: number;
  inConsultationCount: number;
  completedCount: number;
}
export function usePatientWaitingRoom(): PatientWaitingRoomResult {
  const { data: entries, isLoading, error } = useWaitingRoomEntriesToday();
  
  const storedPatientId = typeof window !== "undefined" 
    ? localStorage.getItem("patient_id") 
    : null;
  
  const patientId = storedPatientId ? Number(storedPatientId) : null;
  
  const result = useMemo(() => {
    const allEntries: WaitingRoomEntry[] = (entries ?? []).filter((entry: WaitingRoomEntry) =>
      ["waiting", "in_consultation", "completed"].includes(entry.status)
    );
    
    const patientEntry = patientId 
      ? allEntries.find((entry: WaitingRoomEntry) => entry.patient?.id === patientId) ?? null
      : null;
    
    let patientsAhead = 0;
    if (patientEntry && patientEntry.status === "waiting") {
      const waitingEntries = allEntries
        .filter((e: WaitingRoomEntry) => e.status === "waiting")
        .sort((a: WaitingRoomEntry, b: WaitingRoomEntry) => (a.order ?? 0) - (b.order ?? 0));
      
      const patientIndex = waitingEntries.findIndex((e: WaitingRoomEntry) => e.patient?.id === patientId);
      patientsAhead = patientIndex > 0 ? patientIndex : 0;
    }
    
    const waitingCount = allEntries.filter((e: WaitingRoomEntry) => e.status === "waiting").length;
    const inConsultationCount = allEntries.filter((e: WaitingRoomEntry) => e.status === "in_consultation").length;
    const completedCount = allEntries.filter((e: WaitingRoomEntry) => e.status === "completed").length;
    
    return {
      allEntries,
      patientEntry,
      patientsAhead,
      waitingCount,
      inConsultationCount,
      completedCount,
    };
  }, [entries, patientId]);
  
  return {
    ...result,
    allEntries: result.allEntries,
    patientEntry: result.patientEntry,
    patientsAhead: result.patientsAhead,
    waitingCount: result.waitingCount,
    inConsultationCount: result.inConsultationCount,
    completedCount: result.completedCount,
  };
}