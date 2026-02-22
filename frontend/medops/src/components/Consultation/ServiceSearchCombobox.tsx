// src/components/Consultation/ServiceSearchCombobox.tsx
import { Combobox, Transition } from "@headlessui/react";
import { useState, Fragment } from "react";
import type { BillingItem } from "../../types/billing";
import { useBillingItemsSearch } from "../../hooks/billing/useBillingItems";
import { 
  MagnifyingGlassIcon, 
  ChevronUpDownIcon,
  CurrencyDollarIcon
} from "@heroicons/react/20/solid";
interface Props {
  onSelect: (item: BillingItem) => void;
  disabled?: boolean;
}
export default function ServiceSearchCombobox({ onSelect, disabled }: Props) {
  const [query, setQuery] = useState("");
  const { data: results = [], isFetching } = useBillingItemsSearch(query);
  
  const handleSelect = (item: BillingItem | null) => {
    if (!item) return;
    onSelect(item);
    setQuery("");
  };
  return (
    <Combobox value={null} onChange={handleSelect} disabled={disabled}>
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden border border-[var(--palantir-border)] bg-black/40 text-left focus-within:border-[var(--palantir-active)] transition-colors">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-3.5 w-3.5 text-[var(--palantir-muted)]" aria-hidden="true" />
          </div>
          
          <Combobox.Input
            className="w-full bg-transparent py-2.5 pl-9 pr-10 text-[10px] font-mono leading-5 text-[var(--palantir-text)] focus:ring-0 outline-none placeholder:text-[var(--palantir-muted)]/50"
            placeholder="BUSCAR_SERVICIO_CATALOGO..."
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
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
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto border border-[var(--palantir-border)] bg-[#1a1a1a] py-1 shadow-2xl z-50 focus:outline-none">
            {isFetching ? (
              <div className="relative cursor-default select-none py-2 px-4 text-[10px] font-mono text-[var(--palantir-muted)]">
                BUSCANDO...
              </div>
            ) : results.length === 0 && query.length >= 2 ? (
              <div className="relative cursor-default select-none py-2 px-4 text-[10px] font-mono text-[var(--palantir-muted)]">
                SIN_RESULTADOS // MIN_2_CARACTERES
              </div>
            ) : query.length < 2 ? (
              <div className="relative cursor-default select-none py-2 px-4 text-[10px] font-mono text-[var(--palantir-muted)]">
                ESCRIBE_PARA_BUSCAR...
              </div>
            ) : (
              results.map((item) => (
                <Combobox.Option
                  key={item.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 text-[10px] font-mono ${active ? 'bg-[var(--palantir-active)]/10 text-[var(--palantir-text)]' : 'text-[var(--palantir-muted)]'}`
                  }
                  value={item}
                >
                  {({ active }) => (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-wider">
                          <span className="opacity-50">[{item.code}]</span> {item.name}
                        </span>
                        <span className="text-[var(--palantir-active)] font-black">
                          ${Number(item.unit_price).toFixed(2)}
                        </span>
                      </div>
                      {item.category_name && (
                        <span className="text-[8px] opacity-40 block mt-0.5">
                          {item.category_name}
                        </span>
                      )}
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <CurrencyDollarIcon className="h-3 w-3 opacity-30" />
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
  );
}