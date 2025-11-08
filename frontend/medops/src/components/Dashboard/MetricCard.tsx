import React from "react";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "normal" | "ok" | "warning" | "critical";
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  variant = "normal",
}) => {
  return (
    <div className={`metric-card metric-${variant}`}>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
