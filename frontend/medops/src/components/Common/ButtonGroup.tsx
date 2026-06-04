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
    <div className="inline-flex bg-white/5 p-1.5 rounded-xl border border-white/15">
      {items.map((item) => {
        const isActive = selected === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`
              relative px-5 py-2 text-sm font-semibold transition-all duration-200 rounded-lg
              ${isActive
                ? "bg-emerald-500/20 text-white border border-emerald-500/30 shadow-sm"
                : "text-white/70 hover:text-white hover:bg-white/10"}
            `}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}