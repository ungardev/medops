import React from "react";

export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "ok" | "warning" | "critical" | "normal";
}

const variantStyles: Record<NonNullable<MetricCardProps["variant"]>, string> = {
  normal: "border border-gray-200 dark:border-gray-700",
  ok: "border border-green-500 text-green-600 dark:text-green-400",
  warning: "border border-yellow-500 text-yellow-600 dark:text-yellow-400",
  critical: "border border-red-500 text-red-600 dark:text-red-400",
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  variant = "normal",
}) => {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-[#f5f7fa] to-white dark:from-[#1a1a1a] dark:to-gray-900 p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${variantStyles[variant]}`}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wide">
          {title}
        </h4>
        <div className="text-3xl font-semibold text-[#0d2c53] dark:text-white tabular-nums">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
