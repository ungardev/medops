// src/components/Common/EmptyState.tsx
import React from "react";
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
}
export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {icon && (
        <div className="mb-4 opacity-30">
          {icon}
        </div>
      )}
      <h3 className="text-[12px] font-semibold text-white/60 mb-2">
        {title}
      </h3>
      {message && (
        <p className="text-[11px] text-white/40 max-w-xs text-center leading-relaxed">
          {message}
        </p>
      )}
    </div>
  );
}