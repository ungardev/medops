// src/components/Common/EmptyState.tsx
import React from "react";
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
}
export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      {icon && (
        <div className="mb-5 opacity-40">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-white/60 mb-3">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-white/40 max-w-sm text-center leading-relaxed">
          {message}
        </p>
      )}
    </div>
  );
}