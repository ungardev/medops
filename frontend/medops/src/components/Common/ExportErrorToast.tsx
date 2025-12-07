// src/components/Common/ExportErrorToast.tsx
import React from "react";

interface ExportErrorToastProps {
  errors: { category: string; error: string }[];
  onClose: () => void;
}

const ExportErrorToast: React.FC<ExportErrorToastProps> = ({ errors, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-red-50 border border-red-400 text-red-800 rounded-lg shadow-lg p-4">
      <div className="flex items-start">
        {/* Ícono institucional */}
        <svg
          className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm0 6.75a.75.75 0 00-1.5 0v.75a.75.75 0 001.5 0v-.75z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="font-semibold text-sm">Error al generar documentos</p>
          <ul className="mt-1 space-y-1 text-xs">
            {errors.map((err, idx) => (
              <li key={idx}>
                <span className="font-medium">{err.category}:</span> {err.error}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-xs text-red-600 hover:text-red-800 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ExportErrorToast;
