import React from "react";

export interface MetricCardProps {
  title: string;
  value: number | string; // 🔹 aceptamos string porque formatAmount devuelve texto
  subtitle?: string;
  variant?: "warning" | "critical" | "normal" | "ok";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  variant = "normal",
}) => {
  return (
    <div className={`metric-card metric-${variant}`}>
      <div className="metric-header">
        <h4>{title}</h4>
      </div>
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
