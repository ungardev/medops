// src/components/InstitutionalFooter.tsx

export default function InstitutionalFooter() {
  return (
    <footer
      className="h-10 bg-[var(--palantir-surface)] border-t border-[var(--palantir-border)] px-6
                 flex items-center justify-between
                 text-[11px] font-mono tracking-wider
                 text-[var(--palantir-muted)] transition-all duration-300"
    >
      {/* 🔹 Estado del Sistema e Info Institucional */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--palantir-active)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--palantir-active)]"></span>
          </span>
          <span className="uppercase font-bold text-[var(--palantir-text)]">System_Ready</span>
        </div>
        <span className="hidden sm:inline text-[var(--palantir-border)]">|</span>
        <span className="hidden sm:inline uppercase opacity-80">
          © {new Date().getFullYear()} MEDOPS // CLINICAL_AUDIT_ACTIVE
        </span>
      </div>

      {/* 🔹 Versión y Enlaces de Acceso Rápido */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[var(--palantir-muted)] opacity-60">CORE_REL:</span>
          <span className="text-[var(--palantir-active)] font-bold">v1.2.0-STABLE</span>
        </div>
        
        <div className="hidden md:flex items-center gap-4 border-l border-[var(--palantir-border)] ml-4 pl-4">
          <a
            href="/settings/config"
            className="hover:text-[var(--palantir-text)] transition-colors duration-200 uppercase"
          >
            Config
          </a>
          <a
            href="/reports"
            className="hover:text-[var(--palantir-text)] transition-colors duration-200 uppercase"
          >
            Logs
          </a>
        </div>
      </div>
    </footer>
  );
}
