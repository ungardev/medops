// src/components/Dashboard/DashboardButtonGroup.tsx
import React from "react";
import ButtonGroup from "@/components/Common/ButtonGroup"; // Asegúrate de que este componente acepte estilos custom o edita su CSS
import { useDashboardFilters } from "@/context/DashboardFiltersContext";

type RangeOption = "day" | "week" | "month";
type CurrencyOption = "USD" | "VES";

const rangeItems = [
  { label: "01D", value: "day" },
  { label: "07D", value: "week" },
  { label: "30D", value: "month" },
];

const currencyItems = [
  { label: "USD_NODE", value: "USD" },
  { label: "VES_NODE", value: "VES" },
];

export function DashboardButtonGroup() {
  const { range, setRange, currency, setCurrency } = useDashboardFilters();

  const handleRangeSelect = (val: string) => setRange(val as RangeOption);
  const handleCurrencySelect = (val: string) => setCurrency(val as CurrencyOption);

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 mb-8 px-1">
      
      {/* Grupo: Escala Temporal */}
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-[var(--palantir-active)]/40 rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
            Temporal_Resolution
          </span>
        </div>
        
        <div className="p-1 bg-white/[0.02] border border-white/5 rounded-sm inline-flex">
           <ButtonGroup
            items={rangeItems}
            selected={range}
            onSelect={handleRangeSelect}
            // Suponiendo que tu ButtonGroup acepta clases o es personalizable:
            // La idea es que el botón activo sea text-white y el fondo sea white/10
          />
        </div>
      </div>

      {/* Separador Visual para Desktop */}
      <div className="hidden lg:block flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent mx-8" />

      {/* Grupo: Capa de Divisa */}
      <div className="flex flex-col gap-2 items-end w-full sm:w-auto">
        <div className="flex items-center gap-2 justify-end w-full">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-right">
            Monetary_Filter_Layer
          </span>
          <div className="w-1 h-3 bg-emerald-500/40 rounded-full" />
        </div>

        <div className="p-1 bg-white/[0.02] border border-white/5 rounded-sm inline-flex">
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
