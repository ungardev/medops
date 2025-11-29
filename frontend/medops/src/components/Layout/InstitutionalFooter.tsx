export default function InstitutionalFooter() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 transition-colors">
      {/* 🔹 Información institucional */}
      <span className="text-[#0d2c53] dark:text-white">
        © {new Date().getFullYear()} MedOps — Plataforma clínica auditada
      </span>

      {/* 🔹 Versión y enlaces */}
      <div className="flex items-center gap-4">
        <span className="text-[#0d2c53] dark:text-white font-semibold">
          v1.0.0
        </span>
        <a
          href="/settings/config"
          className="hover:text-[#0d2c53] dark:hover:text-white transition-colors"
        >
          Configuración
        </a>
        <a
          href="/reports"
          className="hover:text-[#0d2c53] dark:hover:text-white transition-colors"
        >
          Reportes
        </a>
      </div>
    </footer>
  );
}
