// src/components/Common/PatientsEmptyState.tsx
import React from "react";
import { UserIcon } from "@heroicons/react/24/outline";

interface PatientsEmptyStateProps {
  message?: string;
}

export default function PatientsEmptyState({
  message = "No se encontraron pacientes",
}: PatientsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <UserIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        {message}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Intenta ajustar tu búsqueda o registrar un nuevo paciente.
      </p>
    </div>
  );
}
