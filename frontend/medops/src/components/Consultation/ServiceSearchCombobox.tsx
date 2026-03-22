import { Combobox, Transition } from "@headlessui/react";
import { useState, Fragment } from "react"; // ✅ Eliminada importación de useRef y createPortal
import type { DoctorService } from "../../types/services";
import { useDoctorServicesSearch } from "../../hooks/services/useDoctorServices";
import { 
  MagnifyingGlassIcon, 
  ChevronUpDownIcon,
  CurrencyDollarIcon,
  CheckIcon
} from "@heroicons/react/20/solid";
interface Props {
  onSelect: (service: DoctorService) => void;
  disabled?: boolean;
}
export default function ServiceSearchCombobox({ onSelect, disabled }: Props) {
  const [query, setQuery] = useState("");
  const { data: results = [], isFetching } = useDoctorServicesSearch(query);
  
  const handleSelect = (service: DoctorService | null) => {
    if (!service) return;
    onSelect(service);
    setQuery("");
  };
  return (
    <Combobox value={null} onChange={handleSelect} disabled={disabled}>
      <div className="relative">
        {/* Botón Principal - Estilo Elite */}
        <div className="relative w-full cursor-default overflow-hidden border border-white/20 bg-[#1a1a1a] text-left focus-within:border-white/60 focus-within:ring-1 focus-within:ring-white/20 transition-all rounded-sm">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-3.5 w-3.5 text-[var(--palantir-muted)]" aria-hidden="true" />
          </div>
          
          <Combobox.Input
            className="w-full bg-transparent py-2.5 pl-9 pr-10 text-[10px] font-mono leading-5 text-white focus:ring-0 outline-none placeholder:text-white/30"
            placeholder="BUSCAR_SERVICIO_CATALOGO..."
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
          />
          
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-4 w-4 text-white/40" aria-hidden="true" />
          </Combobox.Button>
        </div>
        
        {/* ✅ CAMBIO: Menú Desplegable Renderizado Directamente (sin Portal) */}
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto border border-white/20 bg-[#0d0d0d] py-1 shadow-2xl z-[10001] focus:outline-none min-w-[300px]">
            {/* Encabezado del Menú */}
            <div className="px-3 py-2 text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] border-b border-white/5 mb-1">
              SERVICIOS_DISPONIBLES
            </div>
            
            {isFetching ? (
              <div className="relative cursor-default select-none py-3 px-4 text-[10px] font-mono text-white/40 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-transparent rounded-full animate-spin"></div>
                BUSCANDO...
              </div>
            ) : results.length === 0 && query.length >= 2 ? (
              <div className="relative cursor-default select-none py-3 px-4 text-[10px] font-mono text-white/30">
                SIN_RESULTADOS // MIN_2_CARACTERES
              </div>
            ) : query.length < 2 ? (
              <div className="relative cursor-default select-none py-3 px-4 text-[10px] font-mono text-white/30">
                ESCRIBE_PARA_BUSCAR...
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {results.map((service) => (
                  <Combobox.Option
                    key={service.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none px-4 py-2.5 text-[10px] font-mono transition-colors ${
                        active ? 'bg-white/10 text-white' : 'text-white/70'
                      }`
                    }
                    value={service}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white/50">[{service.code}]</span>
                              <span className="uppercase tracking-wider truncate">
                                {service.name}
                              </span>
                            </div>
                            {service.category_name && (
                              <span className="text-[8px] text-white/30 block mt-0.5">
                                {service.category_name}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[var(--palantir-active)] font-black">
                              ${Number(service.price_usd).toFixed(2)}
                            </span>
                            {selected && <CheckIcon className="w-4 h-4 text-emerald-500" />}
                          </div>
                        </div>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <CurrencyDollarIcon className="h-3 w-3 opacity-30" />
                        </span>
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </div>
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}