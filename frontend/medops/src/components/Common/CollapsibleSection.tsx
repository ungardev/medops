// src/components/Common/CollapsibleSection.tsx
import React, { useState, ReactNode } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
interface CollapsibleSectionProps {
  title: string;
  icon: ReactNode;
  color: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}
export default function CollapsibleSection({
  title,
  icon,
  color,
  children,
  defaultExpanded = true,
  className = "",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colorClasses: Record<string, string> = {
    "emerald-400": "text-emerald-400 bg-emerald-400/10",
    "red-400": "text-red-400 bg-red-400/10",
    "blue-400": "text-blue-400 bg-blue-400/10",
  };
  const colorClass = colorClasses[color] || "text-white/60 bg-white/5";
  return (
    <section className={`relative ${className}`}>
      {isExpanded && (
        <div 
          className="absolute -left-4 top-0 h-full w-0.5 hidden lg:block rounded-full opacity-30" 
          style={{ backgroundColor: color.includes("emerald") ? "#34d399" : color.includes("red") ? "#f87171" : color.includes("blue") ? "#60a5fa" : "#fff" }}
        />
      )}
      <div 
        className="flex items-center gap-3 mb-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`p-2 rounded-lg transition-colors ${colorClass}`}>
          <div className="w-5 h-5">
            {icon}
          </div>
        </div>
        
        <span className={`text-[12px] font-semibold ${color.includes("emerald") ? "text-emerald-400" : color.includes("red") ? "text-red-400" : color.includes("blue") ? "text-blue-400" : "text-white/70"}`}>
          {title}
        </span>
        
        <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
        
        <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-white/5' : 'group-hover:bg-white/5'}`}>
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="pl-2 lg:pl-4 animate-in fade-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </section>
  );
}