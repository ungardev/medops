import { Combobox } from "@headlessui/react";
import { useState, useEffect } from "react";
import type { Specialty } from "../../types/consultation";

interface Props {
  value: Specialty[];
  onChange: (next: Specialty[]) => void;
  options: Specialty[];
}

export default function SpecialtyComboboxElegante({ value, onChange, options }: Props) {
  const [search, setSearch] = useState("");

  // ✅ LOGS DE DEPURACIÓN
  console.log("=== COMBOBOX RENDER ===");
  console.log("VALUE >>>", value.map((s) => s.id));
  console.log("OPTIONS >>>", options.map((s) => s.id));

  // ✅ Deduplicación interna por si el padre manda duplicados
  const dedupedValue = value.filter(
    (s, i, self) => self.findIndex((x) => x.id === s.id) === i
  );

  // ✅ Si el padre manda duplicados, los limpiamos automáticamente
  useEffect(() => {
    if (dedupedValue.length !== value.length) {
      console.log("DEDUP ENFORCED >>>", dedupedValue.map((s) => s.id));
      onChange(dedupedValue);
    }
  }, [value]);

  const filtered = search.length
    ? options.filter((o) =>
        `${o.name} ${o.code}`.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // ✅ Blindaje institucional contra doble selección
  const addSpecialty = (s: Specialty | null) => {
    console.log("ADD SPECIALTY CALLED >>>", s);

    if (!s) return;

    // ✅ Evitar duplicados incluso si Headless UI dispara dos eventos
    if (dedupedValue.some((v) => v.id === s.id)) {
      console.log("IGNORED DUPLICATE >>>", s.id);
      return;
    }

    const next = [...dedupedValue, s];

    console.log("ADDING >>>", next.map((x) => x.id));

    onChange(next);

    // ✅ Limpiar input después de seleccionar
    setSearch("");
  };

  const removeSpecialty = (id: number) => {
    const next = dedupedValue.filter((v) => v.id !== id);
    console.log("REMOVING >>>", id, "NEXT >>>", next.map((x) => x.id));
    onChange(next);
  };

  return (
    <>
      <Combobox<Specialty> onChange={addSpecialty}>
        <div className="relative">
          <Combobox.Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            placeholder="Buscar especialidad..."
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />

          <Combobox.Options
            className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md
                       border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800 shadow-lg z-10 text-xs sm:text-sm"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Sin resultados
              </div>
            ) : (
              filtered.map((s) => (
                <Combobox.Option
                  key={s.id}
                  value={s}
                  className={({ active }) =>
                    `cursor-pointer px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${
                      active
                        ? "bg-[#0d2c53] text-white"
                        : "text-[#0d2c53] dark:text-gray-100"
                    }`
                  }
                >
                  {s.name} ({s.code})
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>

      {dedupedValue.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {dedupedValue.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-[#0d2c53]/10 dark:bg-gray-700
                         text-xs sm:text-sm text-[#0d2c53] dark:text-gray-100"
            >
              {s.name} ({s.code})
              <button
                type="button"
                onClick={() => removeSpecialty(s.id)}
                className="px-2 py-0.5 rounded bg-[#0d2c53] text-white hover:bg-[#0b2444] text-xs sm:text-sm"
              >
                Quitar
              </button>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
