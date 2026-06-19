// src/pages/Diagnosis/tabs/DiagnosisCalculators.tsx
import { useEffect, useState, useMemo } from "react";
import { getCalculatorList, getPatientLabValues, getPatientCalculations } from "@/api/diagnosis";
import type { CalculatorConfig, LabValue, SavedCalculation } from "@/api/diagnosis";
import type { PatientRef } from "@/types/patients";
import CalculatorEngine from "../components/CalculatorEngine";
import {
  getPatientAutoFill,
  groupCalculatorsByCategory,
  getSuggestedCalculators,
  buildLabValuesMap,
  formatRelativeTime,
} from "../calculators/registry";
import { Calculator, ChevronDown, ChevronUp, Sparkles, Clock, AlertCircle } from "lucide-react";

interface Props {
  patient: PatientRef;
  patientData?: {
    weight?: string | number | null;
    height?: string | number | null;
    birthdate?: string | null;
    gender?: string | null;
  };
}

function CalculatorCardSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-white/5 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 bg-white/5 rounded" />
          <div className="h-3 w-40 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

function CategorySkeleton({ index }: { index: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-white/5 rounded" />
          <div className="h-3.5 w-20 bg-white/5 rounded" />
          <div className="h-3 w-6 bg-white/5 rounded" />
        </div>
        <div className="h-4 w-4 bg-white/5 rounded" />
      </div>
      <div className="border-t border-white/5">
        <CalculatorCardSkeleton />
        {index === 0 && <CalculatorCardSkeleton />}
      </div>
    </div>
  );
}

export default function DiagnosisCalculators({ patient, patientData }: Props) {
  const [calculators, setCalculators] = useState<CalculatorConfig[]>([]);
  const [labValues, setLabValues] = useState<LabValue[]>([]);
  const [recentCalcs, setRecentCalcs] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getCalculatorList(),
      getPatientLabValues(patient.id),
      getPatientCalculations(patient.id),
    ])
      .then(([calcs, labs, calcsHistory]) => {
        setCalculators(calcs ?? []);
        setLabValues(labs ?? []);
        setRecentCalcs((calcsHistory ?? []).slice(0, 50));
      })
      .catch(() => {
        setError("No se pudieron cargar las calculadoras");
      })
      .finally(() => setLoading(false));
  }, [patient.id]);

  const grouped = groupCalculatorsByCategory(calculators);
  const categories = Object.keys(grouped).sort();
  const autoFill = patientData ? { ...getPatientAutoFill(patientData) } : undefined;
  const labValuesMap = buildLabValuesMap(labValues);
  const suggestedIds = new Set(getSuggestedCalculators(calculators, labValues).map((c) => c.id));

  const lastCalcById = useMemo(() => {
    const map: Record<string, SavedCalculation> = {};
    for (const calc of recentCalcs) {
      if (!map[calc.calculator_id]) {
        map[calc.calculator_id] = calc;
      }
    }
    return map;
  }, [recentCalcs]);

  const firstSuggestedCategory = useMemo(() => {
    for (const cat of categories) {
      if (grouped[cat].some((c) => suggestedIds.has(c.id))) {
        return cat;
      }
    }
    return categories[0] ?? null;
  }, [categories, grouped, suggestedIds]);

  useEffect(() => {
    if (!hasUserInteracted && expandedCategory === null && firstSuggestedCategory) {
      setExpandedCategory(firstSuggestedCategory);
    }
  }, [firstSuggestedCategory, expandedCategory, hasUserInteracted]);

  if (loading) {
    return (
      <div className="space-y-3">
      {labValues.length > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <div className="h-3 w-48 bg-emerald-500/20 rounded animate-pulse" />
        </div>
      )}
        {[0, 1, 2].map((i) => (
          <CategorySkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (activeCalculator) {
    const calc = calculators.find((c) => c.id === activeCalculator);
    const lastCalc = lastCalcById[activeCalculator];
    if (calc) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setActiveCalculator(null)}
            className="text-base text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            ← Volver a calculadoras
          </button>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <CalculatorEngine
              calculator={calc}
              patientId={patient.id}
              autoFill={autoFill}
              labValues={labValuesMap}
              lastSavedResult={lastCalc ?? null}
            />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-3">
      {labValues.length > 0 && suggestedIds.size > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300">
            {suggestedIds.size} calculadora{suggestedIds.size !== 1 ? "s" : ""} con datos de laboratorio disponibles
          </span>
        </div>
      )}
      {categories.map((cat) => {
        const isExpanded = expandedCategory === cat;
        return (
          <div key={cat} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => {
                setHasUserInteracted(true);
                setExpandedCategory(isExpanded ? null : cat);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-medium text-white">{cat}</span>
                <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
                  {grouped[cat].length}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-white/40" />
              ) : (
                <ChevronDown className="h-4 w-4 text-white/40" />
              )}
            </button>

            <div
              className={`border-t border-white/5 transition-all duration-200 ease-out overflow-hidden ${
                isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {isExpanded &&
                grouped[cat].map((calc) => {
                  const isSuggested = suggestedIds.has(calc.id);
                  const lastCalc = lastCalcById[calc.id];
                  return (
                    <button
                      key={calc.id}
                      onClick={() => setActiveCalculator(calc.id)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 ${
                        isSuggested ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <Calculator className={`h-4 w-4 flex-shrink-0 ${isSuggested ? "text-emerald-400" : "text-white/40"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-medium text-white">{calc.name}</span>
                          {isSuggested && (
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="h-3 w-3" /> sugerida
                            </span>
                          )}
                          {lastCalc && (
                            <span className="text-xs text-white/30 flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {lastCalc.result_value} {lastCalc.result_unit}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 truncate">{calc.description}</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
