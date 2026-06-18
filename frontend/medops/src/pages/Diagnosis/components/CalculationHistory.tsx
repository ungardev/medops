// src/pages/Diagnosis/components/CalculationHistory.tsx
import { SavedCalculation } from "@/api/diagnosis";
import { getRiskColor } from "../calculators/registry";
import { Clock, User } from "lucide-react";

interface Props {
  calculations: SavedCalculation[];
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CalculationHistory({ calculations, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className="text-center py-8 text-white/40 text-sm">
        No hay cálculos registrados para este paciente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calculations.map((calc) => (
        <div
          key={calc.id}
          className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-medium text-white">{calc.calculator_name}</div>
              <div className="flex items-center gap-1 text-xs text-white/40 mt-0.5">
                <Clock className="h-3 w-3" />
                {formatDate(calc.created_at)}
              </div>
            </div>
            {calc.risk_level && (
              <span className={`text-xs font-medium ${getRiskColor(calc.risk_level)}`}>
                {calc.risk_level}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold text-white">{calc.result_value}</span>
            {calc.result_unit && (
              <span className="text-sm text-white/50">{calc.result_unit}</span>
            )}
          </div>

          {calc.interpretation && (
            <div className="text-xs text-white/60 mb-2">{calc.interpretation}</div>
          )}

          {calc.result_details?.details && calc.result_details.details.length > 0 && (
            <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-white/5">
              {calc.result_details.details.map((d, i) => (
                <div key={i} className="text-xs">
                  <span className="text-white/40">{d.label}: </span>
                  <span className="text-white/70">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          {calc.doctor_name && (
            <div className="flex items-center gap-1 mt-2 text-xs text-white/30">
              <User className="h-3 w-3" />
              Dr(a). {calc.doctor_name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
