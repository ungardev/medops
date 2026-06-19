// src/pages/Diagnosis/components/LabResultsTable.tsx
import { useState } from "react";
import type { ParsedLabValue } from "@/api/diagnosis";

interface Props {
  values: ParsedLabValue[];
  onChange?: (values: ParsedLabValue[]) => void;
  readOnly?: boolean;
}

const DIRECTION_COLORS: Record<string, string> = {
  high: "bg-red-500",
  low: "bg-blue-500",
  normal: "bg-emerald-500",
};

const DIRECTION_LABELS: Record<string, string> = {
  high: "Alto",
  low: "Bajo",
  normal: "Normal",
};

export default function LabResultsTable({ values, onChange, readOnly = false }: Props) {
  const [editing, setEditing] = useState<Record<number, ParsedLabValue>>({});

  const handleChange = (index: number, field: keyof ParsedLabValue, fieldValue: unknown) => {
    if (readOnly) return;
    const updated = { ...editing[index] ?? values[index], [field]: fieldValue };
    setEditing(prev => ({ ...prev, [index]: updated }));
    onChange?.(values.map((v, i) => (i === index ? updated : v)));
  };

  if (values.length === 0) {
    return (
      <div className="text-center py-6 text-white/40 text-sm">
        No se detectaron valores de laboratorio en este documento
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-3 text-white/50 font-medium text-xs">Prueba</th>
            <th className="text-right py-2 px-3 text-white/50 font-medium text-xs">Valor</th>
            <th className="text-center py-2 px-3 text-white/50 font-medium text-xs">Estado</th>
            <th className="text-right py-2 px-3 text-white/50 font-medium text-xs">Ref.</th>
          </tr>
        </thead>
        <tbody>
          {values.map((val, idx) => {
            const current = editing[idx] ?? val;
            return (
              <tr
                key={idx}
                className="border-b border-white/5 hover:bg-white/3 transition-colors"
              >
                <td className="py-2.5 px-3">
                  <div className="font-medium text-white">{val.test_name}</div>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {readOnly ? (
                    <span className="text-white font-medium">{val.value}</span>
                  ) : (
                    <input
                      type="number"
                      value={current.value}
                      onChange={e => handleChange(idx, "value", parseFloat(e.target.value) || 0)}
                      className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-right text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                  )}
                  {val.unit && (
                    <span className="ml-1 text-white/40 text-xs">{val.unit}</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${DIRECTION_COLORS[current.abnormal_direction] ?? 'bg-white/30'}`} />
                    {val.confidence < 0.7 && (
                      <span
                        className="text-[10px] px-1 py-0.5 bg-amber-500/20 text-amber-300 rounded"
                        title={`Confianza OCR: ${(val.confidence * 100).toFixed(0)}%`}
                      >
                        !
                      </span>
                    )}
                    <span className="text-xs text-white/50">
                      {DIRECTION_LABELS[current.abnormal_direction]}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {val.reference_range ? (
                    <span className="text-xs text-white/40">{val.reference_range}</span>
                  ) : (
                    <span className="text-xs text-white/20">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {values.some(v => v.confidence < 0.7) && (
        <div className="mt-2 text-xs text-amber-400 flex items-center gap-1 px-3">
          ! Algunos valores tienen baja confianza de OCR — verificar antes de guardar
        </div>
      )}
    </div>
  );
}
