// src/pages/Diagnosis/tabs/DiagnosisCalculators.tsx
import { useEffect, useState } from "react";
import { getCalculatorList } from "@/api/diagnosis";
import type { CalculatorConfig } from "@/api/diagnosis";
import type { PatientRef } from "@/types/patients";
import CalculatorEngine from "../components/CalculatorEngine";
import { getPatientAutoFill, CATEGORY_ICONS, groupCalculatorsByCategory } from "../calculators/registry";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  patient: PatientRef;
  patientData?: {
    weight?: string | number | null;
    height?: string | number | null;
    birthdate?: string | null;
    gender?: string | null;
  };
}

export default function DiagnosisCalculators({ patient, patientData }: Props) {
  const [calculators, setCalculators] = useState<CalculatorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    getCalculatorList()
      .then(setCalculators)
      .catch(() => setCalculators([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupCalculatorsByCategory(calculators);
  const categories = Object.keys(grouped).sort();
  const autoFill = patientData ? { ...getPatientAutoFill(patientData) } : undefined;

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  if (activeCalculator) {
    const calc = calculators.find((c) => c.id === activeCalculator);
    if (calc) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setActiveCalculator(null)}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Volver a calculadoras
          </button>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <CalculatorEngine
              calculator={calc}
              patientId={patient.id}
              autoFill={autoFill}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() =>
              setExpandedCategory(expandedCategory === cat ? null : cat)
            }
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{CATEGORY_ICONS[cat] ?? "📋"}</span>
              <span className="text-sm font-medium text-white">{cat}</span>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
                {grouped[cat].length}
              </span>
            </div>
            {expandedCategory === cat ? (
              <ChevronUp className="h-4 w-4 text-white/40" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/40" />
            )}
          </button>

          {expandedCategory === cat && (
            <div className="border-t border-white/5">
              {grouped[cat].map((calc) => (
                <button
                  key={calc.id}
                  onClick={() => setActiveCalculator(calc.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <Calculator className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{calc.name}</div>
                    <div className="text-xs text-white/40 truncate">{calc.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
