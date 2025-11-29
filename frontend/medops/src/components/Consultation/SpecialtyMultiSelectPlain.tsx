import React from "react";
import type { Specialty } from "../../types/consultation";

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
      ? options.filter((o) => `${o.name} ${o.code}`.toLowerCase().includes(query.toLowerCase()))
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
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        placeholder="Buscar especialidades..."
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
      />

      <div className="rounded-md border border-gray-300 dark:border-gray-600 max-h-40 overflow-auto">
        {loading ? (
          <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">Sin resultados</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((opt) => {
              const isSelected = selectedIds.has(opt.id);
              const itemBg = isSelected ? "bg-[#0d2c53]/10 dark:bg-blue-900/20" : "bg-white dark:bg-gray-800";
              const itemText = "text-[#0d2c53] dark:text-gray-100";
              const actionClasses = isSelected
                ? "bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444]"
                : "bg-gray-100 text-[#0d2c53] border border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600";

              return (
                <li key={opt.id} className={`flex items-center justify-between px-3 py-2 text-sm ${itemBg} ${itemText}`}>
                  <span>
                    {opt.name} ({opt.code})
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`px-2 py-1 rounded-md border text-xs transition-colors ${actionClasses}`}
                  >
                    {isSelected ? "Quitar" : "Agregar"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {value.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[#0d2c53]/10 dark:bg-gray-700 text-sm text-[#0d2c53] dark:text-gray-100">
              {s.name} ({s.code})
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.id !== s.id))}
                className="px-2 py-0.5 rounded bg-[#0d2c53] text-white hover:bg-[#0b2444] text-xs"
              >
                Quitar
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
