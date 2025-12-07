// src/components/Common/ExportSuccessToast.tsx
import React from "react";
import type { GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";

interface ExportSuccessToastProps {
  documents: GeneratedDocument[];
  skipped: string[];
  onClose: () => void;
}

const ExportSuccessToast: React.FC<ExportSuccessToastProps> = ({ documents, skipped, onClose }) => {
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
          <p className="font-semibold text-sm">Documentos generados correctamente</p>
          <p className="mt-1 text-xs">
            Generados: <strong>{documents.length}</strong> — Skipped:{" "}
            {skipped.length > 0 ? skipped.join(", ") : "ninguno"}
          </p>
          <ul className="mt-1 space-y-1 text-xs">
            {documents.map((doc, idx) => (
              <li key={idx}>
                <span className="font-medium">{doc.category}:</span> {doc.title}
              </li>
            ))}
          </ul>
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

export default ExportSuccessToast;
