// src/context/DashboardFiltersContext.tsx
import React, { createContext, useContext, useState } from "react";

type RangeOption = "day" | "week" | "month";
type CurrencyOption = "USD" | "VES";

interface DashboardFiltersContextProps {
  range: RangeOption;
  setRange: (val: RangeOption) => void;
  currency: CurrencyOption;
  setCurrency: (val: CurrencyOption) => void;
}

const DashboardFiltersContext = createContext<DashboardFiltersContextProps | null>(null);

export const DashboardFiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [range, setRange] = useState<RangeOption>("month");
  const [currency, setCurrency] = useState<CurrencyOption>("USD");

  return (
    <DashboardFiltersContext.Provider value={{ range, setRange, currency, setCurrency }}>
      {children}
    </DashboardFiltersContext.Provider>
  );
};

export const useDashboardFilters = () => {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) {
    throw new Error("useDashboardFilters must be used within a DashboardFiltersProvider");
  }
  return ctx;
};
