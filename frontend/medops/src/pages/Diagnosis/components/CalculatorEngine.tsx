// src/pages/Diagnosis/components/CalculatorEngine.tsx
import { useState } from "react";
import type { CalculatorConfig, CalculationResult } from "@/api/diagnosis";
import { runCalculation } from "@/api/diagnosis";
import { getRiskColor } from "../calculators/registry";
import { Activity, BookOpen, CheckCircle } from "lucide-react";

interface Props {
  calculator: CalculatorConfig;
  patientId: number;
  autoFill?: Record<string, string | undefined> | undefined;
  onResult?: (result: CalculationResult) => void;
}

export default function CalculatorEngine({
  calculator,
  patientId,
  autoFill = {},
  onResult,
}: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const inp of calculator.inputs) {
      if (inp.type === "boolean") init[inp.name] = false;
      else if (inp.type === "select" && inp.options?.length) init[inp.name] = inp.options[0].value;
      else if (inp.auto_fill_from_patient && autoFill[inp.auto_fill_from_patient] != null) {
        const fillVal = autoFill[inp.auto_fill_from_patient] as string;
        if (inp.type === "number") init[inp.name] = parseFloat(fillVal);
        else init[inp.name] = fillVal;
      }
    }
    return init;
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runCalculation({ calculator_id: calculator.id, inputs: values, patient_id: patientId });
      setResult(res);
      onResult?.(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al ejecutar cálculo");
    } finally {
      setLoading(false);
    }
  };

  const allRequiredFilled = calculator.inputs
    .filter((i) => i.required)
    .every((i) => {
      const v = values[i.name];
      return v !== undefined && v !== null && v !== "";
    });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">{calculator.name}</h3>
        <p className="text-sm text-white/50">{calculator.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-white/50">
            {calculator.specialty}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {calculator.inputs.map((input) => (
          <div key={input.name}>
            <label className="block text-sm font-medium text-white/70 mb-1.5">
              {input.label}
              {input.required && <span className="text-red-400 ml-1">*</span>}
              {input.default_unit && (
                <span className="text-white/30 ml-1 text-xs">({input.default_unit})</span>
              )}
            </label>

            {input.type === "boolean" && (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(values[input.name])}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [input.name]: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 peer-checked:bg-blue-500/50 peer-checked:after:bg-blue-400 after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            )}

            {input.type === "select" && input.options && (
              <select
                value={String(values[input.name] ?? "")}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [input.name]: e.target.value }))
                }
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              >
                {input.options.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)} className="bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {input.type === "number" && (
              <input
                type="number"
                value={
                  values[input.name] != null ? String(values[input.name]) : ""
                }
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [input.name]: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                min={input.min_value}
                max={input.max_value}
                step={input.step}
                placeholder={`Ingrese ${input.label.toLowerCase()}`}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Resultado</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{result.value}</span>
            {result.unit && <span className="text-lg text-white/50">{result.unit}</span>}
          </div>

          {result.interpretation && (
            <div className="text-sm text-white/70">{result.interpretation}</div>
          )}

          {result.risk_level && (
            <div>
              <span className={`text-sm font-medium ${getRiskColor(result.risk_level)}`}>
                {result.risk_level}
              </span>
            </div>
          )}

          {result.details && result.details.length > 0 && (
            <div className="pt-3 border-t border-white/5 space-y-1">
              {result.details.map((d, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-white/40">{d.label}</span>
                  <span className="text-white/70">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleCalculate}
        disabled={loading || !allRequiredFilled}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
            Calculando...
          </>
        ) : (
          <>
            <Activity className="h-4 w-4" />
            Calcular
          </>
        )}
      </button>

      {calculator.references.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-white/30">
          <BookOpen className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span>{calculator.references.join(" • ")}</span>
        </div>
      )}
    </div>
  );
}
