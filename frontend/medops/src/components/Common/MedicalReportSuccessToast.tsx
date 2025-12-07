// src/components/Common/MedicalReportSuccessToast.tsx
import React from "react";

interface MedicalReportSuccessToastProps {
  fileUrl?: string | null;   // 🔹 ahora acepta string, null o undefined
  auditCode?: string | null; // 🔹 opcional y puede ser null
  onClose: () => void;
}

const MedicalReportSuccessToast: React.FC<MedicalReportSuccessToastProps> = ({ fileUrl, auditCode, onClose }) => {
  // 🔹 protección: si no hay fileUrl, no renderizamos nada
  if (!fileUrl) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-green-50 border border-green-400 text-green-800 rounded-lg shadow-lg p-4">
      <div className="flex items-start">
        {/* Ícono institucional */}
        <svg
          className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.704 5.292a1 1 0 00-1.408-1.416l-7.996 7.998-3.004-3.004a1 1 0 00-1.416 1.416l3.712 3.712a1 1 0 001.416 0l8.696-8.706z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="font-semibold text-sm">Informe médico generado correctamente</p>
          {auditCode && (
            <p className="mt-1 text-xs">
              Código de auditoría: <strong>{auditCode}</strong>
            </p>
          )}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-green-700 hover:text-green-900 underline"
          >
            Ver Informe Médico (PDF)
          </a>
        </div>
        <button
          onClick={onClose}
          className="ml-3 text-xs text-green-600 hover:text-green-800 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default MedicalReportSuccessToast;
