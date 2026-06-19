// src/pages/Diagnosis/tabs/DiagnosisCalculators.tsx
import { useEffect, useState } from "react";
import { getCalculatorList, getPatientLabValues } from "@/api/diagnosis";
import type { CalculatorConfig, LabValue } from "@/api/diagnosis";
import type { PatientRef } from "@/types/patients";
import CalculatorEngine from "../components/CalculatorEngine";
import {
  getPatientAutoFill,
  CATEGORY_ICONS,
  groupCalculatorsByCategory,
  getSuggestedCalculators,
  buildLabValuesMap,
} from "../calculators/registry";
import { Calculator, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

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
  const [labValues, setLabValues] = useState<LabValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCalculatorList(), getPatientLabValues(patient.id)])
      .then(([calcs, labs]) => {
        setCalculators(calcs);
        setLabValues(labs);
      })
      .catch(() => {
        setCalculators([]);
        setLabValues([]);
      })
      .finally(() => setLoading(false));
  }, [patient.id]);

  const grouped = groupCalculatorsByCategory(calculators);
  const categories = Object.keys(grouped).sort();
  const autoFill = patientData ? { ...getPatientAutoFill(patientData) } : undefined;
  const labValuesMap = buildLabValuesMap(labValues);
  const suggestedIds = new Set(getSuggestedCalculators(calculators, labValues).map((c) => c.id));

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
              labValues={labValuesMap}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-3">
      {labValues.length > 0 && (
        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          <span className="text-xs text-cyan-300">
            {suggestedIds.size} calculadora{suggestedIds.size !== 1 ? "s" : ""} con datos de laboratorio disponibles
          </span>
        </div>
      )}
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
              {grouped[cat].map((calc) => {
                const isSuggested = suggestedIds.has(calc.id);
                return (
                  <button
                    key={calc.id}
                    onClick={() => setActiveCalculator(calc.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 ${
                      isSuggested ? "bg-cyan-500/5" : ""
                    }`}
                  >
                    <Calculator className={`h-4 w-4 flex-shrink-0 ${isSuggested ? "text-cyan-400" : "text-blue-400"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{calc.name}</span>
                        {isSuggested && (
                          <span className="text-xs bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                            <Sparkles className="h-3 w-3 inline" /> sugerida
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/40 truncate">{calc.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
