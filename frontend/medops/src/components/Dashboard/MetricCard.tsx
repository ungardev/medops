import React from "react";

export interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  variant?: "warning" | "critical" | "normal" | "ok";
  tooltip?: string; // ✅ nuevo campo
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  variant = "normal",
  tooltip,
}) => {
  return (
    <div className={`metric-card metric-${variant}`}>
      <div className="metric-header">
        <h4>{title}</h4>
        {tooltip && (
          <span className="tooltip-icon" title={tooltip}>
            ℹ️
          </span>
        )}
      </div>
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
