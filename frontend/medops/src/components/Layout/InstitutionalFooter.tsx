export default function InstitutionalFooter() {
  return (
    <footer
      className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700
                 px-4 sm:px-6 md:px-8
                 py-2 sm:py-3 md:py-4
                 flex flex-col md:flex-row items-center justify-between
                 text-xs sm:text-sm md:text-base
                 text-gray-600 dark:text-gray-400 transition-colors gap-2 md:gap-4"
    >
      {/* 🔹 Información institucional */}
      <span className="text-[#0d2c53] dark:text-white text-center md:text-left">
        © {new Date().getFullYear()} MedOps — Plataforma clínica auditada
      </span>

      {/* 🔹 Versión y enlaces */}
      <div className="flex items-center gap-3 md:gap-6">
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
