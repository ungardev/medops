import React, { useState } from "react";
import { ReportFiltersInput } from "@/types/reports";

interface Props {
  onFilter: (filters: ReportFiltersInput) => void;
}

export default function ReportFilters({ onFilter }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<ReportFiltersInput["type"]>("financial");

  const handleApply = () => {
    onFilter({
      start_date: startDate,
      end_date: endDate,
      type,
    });
  };

  return (
    <div className="filters">
      <h3>Filtros</h3>

      <div className="filter-row">
        <label>Desde:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="filter-row">
        <label>Hasta:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="filter-row">
        <label>Tipo de reporte:</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReportFiltersInput["type"])}
        >
          <option value="financial">Financiero</option>
          <option value="clinical">Clínico</option>
          <option value="combined">Combinado</option>
        </select>
      </div>

      <button className="btn btn-primary mt-2" onClick={handleApply}>
        Aplicar filtros
      </button>
    </div>
  );
}
