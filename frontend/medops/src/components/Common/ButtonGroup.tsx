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
    <div className="inline-flex bg-[var(--palantir-bg)] p-0.5 rounded-[3px] border border-[var(--palantir-border)]">
      {items.map((item) => {
        const isActive = selected === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`
              px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200
              ${isActive
                ? "bg-[var(--palantir-active)] text-white shadow-[0_0_10px_rgba(var(--palantir-active-rgb),0.3)] rounded-[2px]"
                : "text-[var(--palantir-muted)] hover:text-[var(--palantir-text)] hover:bg-[var(--palantir-border)]/30"}
            `}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
