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
    <div className="inline-flex bg-black/40 p-1 rounded-sm border border-white/5 backdrop-blur-md">
      {items.map((item) => {
        const isActive = selected === item.value;
        return (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`
              relative px-4 py-1 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300
              ${isActive
                ? "bg-white/10 text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.05)] border border-white/10 rounded-[2px]"
                : "text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent"}
            `}
          >
            {item.label}
            {isActive && (
              <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
