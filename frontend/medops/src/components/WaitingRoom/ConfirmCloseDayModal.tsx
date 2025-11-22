import React from "react";

interface ConfirmCloseDayModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmCloseDayModal: React.FC<ConfirmCloseDayModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full animate-fade-slide"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Confirmar cierre de jornada
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Desea cerrar la jornada de hoy? Esta acción cancelará a todos los pacientes pendientes.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={onConfirm}
          >
            Sí, cerrar
          </button>
          <button
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
            onClick={onCancel}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCloseDayModal;
