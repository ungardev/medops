// src/components/Common/EmptyState.tsx
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {icon && (
        <div className="mb-6 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
          {icon}
        </div>
      )}
      <h3 className="text-[11px] font-black text-[var(--palantir-text)] uppercase tracking-[0.4em] mb-2">
        {title.replace(/ /g, "_")}
      </h3>
      {message && (
        <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter max-w-xs text-center leading-relaxed">
          {message}
        </p>
      )}
      <div className="mt-8 flex gap-1">
        <div className="w-1 h-1 bg-[var(--palantir-active)] rounded-full animate-ping" />
        <div className="w-1 h-1 bg-[var(--palantir-active)] rounded-full animate-ping [animation-delay:0.2s]" />
        <div className="w-1 h-1 bg-[var(--palantir-active)] rounded-full animate-ping [animation-delay:0.4s]" />
      </div>
    </div>
  );
}
