// src/components/Dashboard/DashboardButtonGroup.tsx
import React from "react";
import ButtonGroup from "@/components/Common/ButtonGroup";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";
type RangeOption = "day" | "week" | "month";
type CurrencyOption = "USD" | "VES";
const rangeItems = [
  { label: "Día", value: "day" },
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
];
const currencyItems = [
  { label: "USD", value: "USD" },
  { label: "Bs.", value: "VES" },
];
export function DashboardButtonGroup() {
  const { range, setRange, currency, setCurrency } = useDashboardFilters();
  const handleRangeSelect = (val: string) => setRange(val as RangeOption);
  const handleCurrencySelect = (val: string) => setCurrency(val as CurrencyOption);
  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 mb-4 px-1">
      
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-white/20 rounded-full" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
            Período
          </span>
        </div>
        
        <ButtonGroup
          items={rangeItems}
          selected={range}
          onSelect={handleRangeSelect}
        />
      </div>
      <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
        <div className="flex items-center gap-2 justify-end w-full">
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/50 text-right">
            Moneda
          </span>
          <div className="w-1 h-3 bg-emerald-400/40 rounded-full" />
        </div>
        <ButtonGroup
          items={currencyItems}
          selected={currency}
          onSelect={handleCurrencySelect}
        />
      </div>
    </div>
  );
}
export default DashboardButtonGroup;