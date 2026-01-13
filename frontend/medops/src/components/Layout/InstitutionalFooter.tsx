// src/components/InstitutionalFooter.tsx

export default function InstitutionalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="h-9 bg-black/60 backdrop-blur-md border-t border-white/[0.05] px-6
                 flex items-center justify-between
                 text-[9px] font-mono tracking-[0.15em]
                 text-white/30 transition-all duration-300"
    >
      {/* 🔹 LADO IZQUIERDO: ESTADO OPERATIVO */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-40"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
          </span>
          <span className="uppercase font-black text-emerald-500/80 tracking-[0.2em]">
            System_Ready
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-5 border-l border-white/5 pl-5">
          <div className="flex gap-2">
            <span className="opacity-40 uppercase">Node:</span>
            <span className="text-white/60 font-bold">SBY_CENTRAL_01</span>
          </div>
          <div className="flex gap-2">
            <span className="opacity-40 uppercase">Latency:</span>
            <span className="text-emerald-500/60 font-bold">12ms</span>
          </div>
        </div>
      </div>

      {/* 🔹 LADO DERECHO: METADATOS Y VERSIONADO */}
      <div className="flex items-center gap-6">
        <span className="hidden sm:inline uppercase opacity-40 hover:opacity-100 transition-opacity cursor-default">
          © {currentYear} MEDOPS // TERMINAL_ID: <span className="text-white/60">ALPHA-9</span>
        </span>

        <div className="flex items-center gap-4 border-l border-white/10 ml-2 pl-4">
          <div className="flex items-center gap-1.5">
            <span className="opacity-40">BUILD:</span>
            <span className="text-[var(--palantir-active)] font-black opacity-80">v1.2.0-STABLE</span>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <div className="w-[1px] h-3 bg-white/10"></div>
            <a
              href="/settings/config"
              className="hover:text-[var(--palantir-active)] transition-colors duration-200 uppercase font-bold"
            >
              Sys_Config
            </a>
            <a
              href="/reports"
              className="hover:text-[var(--palantir-active)] transition-colors duration-200 uppercase font-bold"
            >
              Auth_Logs
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
