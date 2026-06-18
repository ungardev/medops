// src/pages/Diagnosis/tabs/DiagnosisPatient.tsx
import { useEffect, useState } from "react";
import { getPatientCalculations } from "@/api/diagnosis";
import type { SavedCalculation } from "@/api/diagnosis";
import type { PatientRef } from "@/types/patients";
import CalculationHistory from "../components/CalculationHistory";
import { RefreshCw } from "lucide-react";

interface Props {
  patient: PatientRef;
}

export default function DiagnosisPatient({ patient }: Props) {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    getPatientCalculations(patient.id)
      .then(setCalculations)
      .catch(() => setCalculations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [patient.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Historial de Cálculos</h3>
          <p className="text-xs text-white/40 mt-0.5">
            {calculations.length} cálculo{calculations.length !== 1 ? "s" : ""} registrado
            {calculations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <CalculationHistory calculations={calculations} loading={loading} />
    </div>
  );
}
