// src/components/Consultation/SpecialtyComboboxElegante.tsx
import { Combobox, Transition } from "@headlessui/react";
import { useState, useEffect, useRef, Fragment } from "react";
import type { Specialty } from "../../types/config";
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ChevronUpDownIcon,
  HashtagIcon
} from "@heroicons/react/20/solid";
interface Props {
  value: Specialty[];
  onChange: (next: Specialty[]) => void;
  options: Specialty[];
}
export default function SpecialtyComboboxElegante({ value, onChange, options }: Props) {
  const [search, setSearch] = useState("");
  const lock = useRef(false);
  // Garantizamos que no haya duplicados
  const dedupedValue = value.filter(
    (s, i, self) => self.findIndex((x) => x.id === s.id) === i
  );
  useEffect(() => {
    if (dedupedValue.length !== value.length) {
      onChange(dedupedValue);
    }
  }, [value, dedupedValue, onChange]);
  // ✅ FIX: Buscar en o.name, no en string vacío literal
  const filtered = search.length
    ? options.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
      )
    : options;
  const addSpecialty = (s: Specialty | null) => {
    if (!s) return;
    if (lock.current) return;
    
    lock.current = true;
    setTimeout(() => { lock.current = false; }, 50);
    if (dedupedValue.some((v) => v.id === s.id)) return;
    onChange([...dedupedValue, s]);
    setSearch("");
  };
  const removeSpecialty = (id: number) => {
    onChange(dedupedValue.filter((v) => v.id !== id));
  };
  return (
    <div className="w-full space-y-3">
      <Combobox value={null} onChange={addSpecialty}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default overflow-hidden border border-[var(--palantir-border)] bg-black/20 text-left focus-within:border-[var(--palantir-active)] transition-colors">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-3.5 w-3.5 text-[var(--palantir-muted)]" aria-hidden="true" />
            </div>
            
            <Combobox.Input
              className="w-full bg-transparent py-2.5 pl-9 pr-10 text-[10px] font-mono leading-5 text-[var(--palantir-text)] focus:ring-0 outline-none placeholder:text-[var(--palantir-muted)]/50"
              placeholder="SEARCH_SPECIALTY_DIRECTORY..."
              displayValue={() => ""}
              onChange={(event) => setSearch(event.target.value)}
            />
            
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-4 w-4 text-[var(--palantir-muted)]" aria-hidden="true" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setSearch("")}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto border border-[var(--palantir-border)] bg-[#1a1a1a] py-1 shadow-2xl z-50 focus:outline-none">
              {filtered.length === 0 && search !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-[10px] font-mono text-[var(--palantir-muted)]">
                  ERR_NO_MATCH_FOUND
                </div>
              ) : (
                filtered.map((s) => (
                  <Combobox.Option
                    key={s.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 text-[10px] font-mono uppercase tracking-wider `
                    }
                    value={s}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate `}>
                          {s.name} <span className={`ml-2 opacity-50 `}>[{s.code}]</span>
                        </span>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <HashtagIcon className="h-3 w-3 opacity-30" />
                        </span>
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      {/* ÁREA DE TAGS SELECCIONADOS */}
      {dedupedValue.length > 0 && (
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {dedupedValue.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-2 bg-white/5 border border-white/10 pl-2 pr-1 py-1 rounded-sm hover:border-[var(--palantir-active)] transition-all"
            >
              <span className="text-[9px] font-black text-[var(--palantir-text)] uppercase tracking-tighter">
                {s.name}
              </span>
              <button
                type="button"
                onClick={() => removeSpecialty(s.id)}
                className="p-0.5 rounded-sm hover:bg-red-500/20 text-[var(--palantir-muted)] hover:text-red-400 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}