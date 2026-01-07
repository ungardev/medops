// src/components/Dashboard/DashboardButtonGroup.tsx
import React from "react";
import ButtonGroup from "@/components/Common/ButtonGroup";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";

type RangeOption = "day" | "week" | "month";
type CurrencyOption = "USD" | "VES";

const rangeItems = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

const currencyItems = [
  { label: "USD", value: "USD" },
  { label: "VES", value: "VES" },
];

export function DashboardButtonGroup() {
  const { range, setRange, currency, setCurrency } = useDashboardFilters();

  const handleRangeSelect = (val: string) => setRange(val as RangeOption);
  const handleCurrencySelect = (val: string) => setCurrency(val as CurrencyOption);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-1">
      {/* Grupo: Escala Temporal */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)] leading-none mb-1.5">
            Temporal_Range
          </span>
          <ButtonGroup
            items={rangeItems}
            selected={range}
            onSelect={handleRangeSelect}
          />
        </div>
      </div>

      {/* Grupo: Capa de Divisa */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end sm:items-start">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)] leading-none mb-1.5">
            Currency_Layer
          </span>
          <ButtonGroup
            items={currencyItems}
            selected={currency}
            onSelect={handleCurrencySelect}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardButtonGroup;
