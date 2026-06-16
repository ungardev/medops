import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function DetailSection({ title, icon: Icon, children, className = "", contentClassName = "space-y-2" }: DetailSectionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-white/60 uppercase tracking-wider">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{title}</span>
      </div>
      <div className={`bg-white/5 border border-white/10 rounded-lg p-4 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}

interface DetailRowProps {
  label?: string;
  value?: string | ReactNode;
  valueClassName?: string;
  noValue?: string;
}

export function DetailRow({ label, value, valueClassName = "text-white/80", noValue = "—" }: DetailRowProps) {
  if (value === undefined || value === null || value === "") {
    return label ? (
      <div className="flex justify-between items-start">
        <span className="text-sm text-white/40">{label}</span>
        <span className={`text-sm ${valueClassName} text-white/20`}>{noValue}</span>
      </div>
    ) : (
      <span className="text-sm text-white/20">{noValue}</span>
    );
  }
  if (!label) {
    return <span className={`text-sm ${valueClassName}`}>{value}</span>;
  }
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-white/40">{label}</span>
      <span className={`text-sm ${valueClassName} text-right`}>{value}</span>
    </div>
  );
}

interface DetailMultilineProps {
  label?: string;
  value?: string | null;
  noValue?: string;
}

export function DetailMultiline({ label, value, noValue = "Sin información registrada" }: DetailMultilineProps) {
  if (!value) {
    return label ? (
      <div className="space-y-1">
        <span className="text-sm text-white/40">{label}</span>
        <p className="text-sm text-white/20">{noValue}</p>
      </div>
    ) : (
      <p className="text-sm text-white/20">{noValue}</p>
    );
  }
  if (!label) {
    return <p className="text-sm text-white/80 whitespace-pre-wrap">{value}</p>;
  }
  return (
    <div className="space-y-1">
      <span className="text-sm text-white/40">{label}</span>
      <p className="text-sm text-white/80 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
