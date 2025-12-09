// src/components/Common/LoadingOverlay.tsx
export default function LoadingOverlay({ message = "Cargando..." }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
        <svg
          className="animate-spin h-5 w-5 text-[#0d2c53]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <span className="text-sm font-medium text-[#0d2c53] dark:text-white">
          {message}
        </span>
      </div>
    </div>
  );
}
