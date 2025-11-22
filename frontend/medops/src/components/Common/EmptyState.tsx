// src/components/Common/EmptyState.tsx
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
}

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon && <div className="mb-3">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
      {message && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );
}
