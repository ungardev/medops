import React from "react";
import type { Specialty } from "../../types/config";
import { Search, Plus, X, Activity, Loader2 } from "lucide-react";
interface Props {
  value: Specialty[];
  onChange: (next: Specialty[]) => void;
  query: string;
  setQuery: (q: string) => void;
  options: Specialty[];
  loading?: boolean;
}
export default function SpecialtyMultiSelectPlain({
  value,
  onChange,
  query,
  setQuery,
  options,
  loading = false,
}: Props) {
  const selectedIds = new Set(value.map((v) => v.id));
  const filtered =
    query.length > 0
      ? options.filter((o) =>
          ` `.toLowerCase().includes(query.toLowerCase())
        )
      : options;
  const toggle = (id: number) => {
    const target = options.find((o) => o.id === id);
    if (!target) return;
    if (selectedIds.has(id)) {
      onChange(value.filter((v) => v.id !== id));
    } else {
      onChange([...value, target]);
    }
  };
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Input de Búsqueda Estilizado */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--palantir-muted)] group-focus-within:text-[var(--palantir-active)] transition-colors">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder="Filtrar especialidades por nombre o código..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117]/50 border border-[var(--palantir-border)] rounded-lg text-sm text-white placeholder:text-[var(--palantir-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--palantir-active)]/20 focus:border-[var(--palantir-active)] transition-all"
        />
      </div>
      {/* Contenedor de Opciones */}
      <div className="rounded-xl border border-[var(--palantir-border)] bg-[#11141a] overflow-hidden shadow-inner">
        <div className="max-h-52 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3 text-[var(--palantir-muted)]">
              <Loader2 size={18} className="animate-spin text-[var(--palantir-active)]" />
              <span className="text-xs font-mono uppercase tracking-widest">Sincronizando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--palantir-muted)] opacity-50">
              <Activity size={24} className="mb-2" />
              <span className="text-xs uppercase tracking-tighter">Sin registros coincidentes</span>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--palantir-border)]/50">
              {filtered.map((opt) => {
                const isSelected = selectedIds.has(opt.id);
                return (
                  <li
                    key={opt.id}
                    className={`flex items-center justify-between px-4 py-3 transition-colors `}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-200">{opt.name}</span>
                      <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-wider">
                        Code: {opt.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(opt.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all `}
                    >
                      {isSelected ? <X size={12} /> : <Plus size={12} />}
                      {isSelected ? "Remover" : "Añadir"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      {/* Tags de Selección Activa */}
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em] ml-1">
            Seleccionadas ({value.length})
          </span>
          <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-white/[0.02] border border-dashed border-[var(--palantir-border)]">
            {value.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 text-xs text-[var(--palantir-active)] group animate-in zoom-in-90"
              >
                <span className="font-medium">{s.name}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v.id !== s.id))}
                  className="p-1 rounded-full hover:bg-red-500 hover:text-white transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}