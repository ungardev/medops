// src/components/Dashboard/MetricCard.tsx
import React from "react";

export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "warning" | "critical" | "normal" | "ok";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition h-full">
      <div className="flex flex-col justify-between h-full">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </h4>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {value}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 min-h-[1.25rem]">
          {subtitle ?? ""}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
