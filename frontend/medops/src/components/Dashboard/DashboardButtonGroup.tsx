// src/components/Dashboard/DashboardButtonGroup.tsx
import React from "react";
import ButtonGroup from "@/components/Common/ButtonGroup";
import { useDashboardFilters } from "@/context/DashboardFiltersContext";

type RangeOption = "day" | "week" | "month";
type CurrencyOption = "USD" | "VES";

const rangeItems = [
  { label: "DAY", value: "day" },
  { label: "WEEK", value: "week" },
  { label: "MONTH", value: "month" },
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
    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 mb-4 px-1">
      
      {/* Grupo: Escala Temporal */}
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-white/20 rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
            TEMPORAL_RESOLUTION
          </span>
        </div>
        
        <ButtonGroup
          items={rangeItems}
          selected={range}
          onSelect={handleRangeSelect}
        />
      </div>

      {/* Grupo: Capa de Divisa */}
      <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
        <div className="flex items-center gap-2 justify-end w-full">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-right">
            MONETARY_FILTER
          </span>
          <div className="w-1 h-3 bg-emerald-500/40 rounded-full" />
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
