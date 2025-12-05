import React from "react";

export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "warning" | "critical" | "normal" | "ok";
}

const variantClasses: Record<NonNullable<MetricCardProps["variant"]>, string> = {
  normal: "border-gray-200 dark:border-gray-700",
  ok: "border-green-500 text-green-600 dark:text-green-400",
  warning: "border-yellow-500 text-yellow-600 dark:text-yellow-400",
  critical: "border-red-500 text-red-600 dark:text-red-400",
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  variant = "normal",
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition min-h-[5rem] border ${variantClasses[variant]}`}
    >
      <div className="flex flex-col justify-between h-full min-w-0 md:min-h-[100px]">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 break-words">
          {title}
        </h4>
        <div className="text-2xl font-bold mb-1 whitespace-nowrap tabular-nums">
          {value}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 min-h-[1.25rem] break-words">
          {subtitle ?? ""}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
