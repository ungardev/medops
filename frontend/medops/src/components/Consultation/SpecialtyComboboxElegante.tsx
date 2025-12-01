import { Combobox } from "@headlessui/react";
import { useState } from "react";
import type { Specialty } from "../../types/consultation";

interface Props {
  value: Specialty[];
  onChange: (next: Specialty[]) => void;
  options: Specialty[];
}

export default function SpecialtyComboboxElegante({ value, onChange, options }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.length
    ? options.filter((o) =>
        `${o.name} ${o.code}`.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const addSpecialty = (s: Specialty | null) => {
    if (s && !value.some((v) => v.id === s.id)) {
      onChange([...value, s]);
    }
    setSearch("");
  };

  const removeSpecialty = (id: number) => {
    onChange(value.filter((v) => v.id !== id));
  };
    return (
    <>
      <Combobox<Specialty> onChange={addSpecialty}>
        <div className="relative">
          <Combobox.Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
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
              <div className="px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sin resultados</div>
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

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map((s) => (
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
