// src/components/Layout/InstitutionalFooter.tsx
export default function InstitutionalFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      className="h-8 bg-white/5 backdrop-blur-md border-t border-white/10 px-6
                 flex items-center justify-between
                 text-[9px] tracking-wider
                 text-white/40 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
          </span>
          <span className="uppercase font-medium text-emerald-400/70 tracking-wider">
            Sistema Activo
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-4 border-l border-white/10 pl-4">
          <div className="flex gap-2">
            <span className="opacity-50">Nodo:</span>
            <span className="text-white/60 font-medium">Principal</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline uppercase opacity-50">
          © {currentYear} MEDOPZ
        </span>
        <div className="flex items-center gap-3 border-l border-white/10 ml-2 pl-3">
          <div className="flex items-center gap-1.5">
            <span className="opacity-50">Versión:</span>
            <span className="text-white/60 font-medium">v1.2.0</span>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <div className="w-[1px] h-3 bg-white/10"></div>
            <a
              href="/settings/config"
              className="hover:text-emerald-400 transition-colors duration-200 font-medium"
            >
              Configuración
            </a>
            <a
              href="/reports"
              className="hover:text-emerald-400 transition-colors duration-200 font-medium"
            >
              Reportes
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}