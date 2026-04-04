// src/components/Common/ButtonGroup.tsx
import React from "react";
interface SegmentedItem {
  label: string;
  value: string;
}
interface ButtonGroupProps {
  items: SegmentedItem[];
  selected: string;
  onSelect: (value: string) => void;
}
export default function ButtonGroup({ items, selected, onSelect }: ButtonGroupProps) {
  return (
    <div className="inline-flex bg-white/5 p-1 rounded-lg border border-white/15">
      {items.map((item) => {
        const isActive = selected === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`
              relative px-4 py-1.5 text-[11px] font-medium transition-all duration-200 rounded-md
              ${isActive
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"}
            `}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}