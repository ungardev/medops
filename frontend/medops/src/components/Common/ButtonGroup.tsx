// src/components/Common/ButtonGroup.tsx
import React from "react";

interface ButtonGroupProps<T extends string> {
  options: T[];
  selected: T;
  onSelect: (value: T) => void;
}

export default function ButtonGroup<T extends string>({
  options,
  selected,
  onSelect,
}: ButtonGroupProps<T>) {
  return (
    <div className="inline-flex rounded-md overflow-hidden ring-1 ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-700 divide-x divide-gray-300 dark:divide-gray-600">
      {options.map((opt) => {
        const isActive = selected === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap focus:outline-none
              ${isActive
                ? "bg-[#0d2c53] text-white dark:bg-white dark:text-[#0d2c53]"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"}`}
          >
            {opt.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
