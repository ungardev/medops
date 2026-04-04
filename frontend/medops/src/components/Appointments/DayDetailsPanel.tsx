// src/components/Appointments/DayDetailsPanel.tsx
import React, { useMemo } from 'react';
import { OperationalItem } from '@/types/operational';
import { Disclosure } from '@headlessui/react';
import { ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
interface DayDetailsPanelProps {
  day: Date;
  items: OperationalItem[];
  onItemClick: (item: OperationalItem) => void;
}
const DayDetailsPanel: React.FC<DayDetailsPanelProps> = ({ day, items, onItemClick }) => {
  const groupedItems = useMemo(() => {
    const groups: Record<string, OperationalItem[]> = {};
    items.forEach(item => {
      const serviceName = item.serviceName || 'Servicio General';
      if (!groups[serviceName]) groups[serviceName] = [];
      groups[serviceName].push(item);
    });
    return groups;
  }, [items]);
  return (
    <div className="bg-white/5 border border-white/15 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/15">
        <div>
          <h3 className="text-[12px] font-semibold text-white capitalize">
            {day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <p className="text-[10px] text-white/40 mt-0.5">
            {items.length} items • {Object.keys(groupedItems).length} servicios
          </p>
        </div>
        <ClockIcon className="w-4 h-4 text-white/30" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Object.entries(groupedItems).map(([serviceName, slots]) => (
          <Disclosure key={serviceName} defaultOpen>
            {({ open }) => (
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <Disclosure.Button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <ChevronRightIcon className={`w-3.5 h-3.5 text-white/30 transition-transform ${open ? 'rotate-90' : ''}`} />
                    <span className="text-[11px] font-medium text-white/70">{serviceName}</span>
                  </div>
                  <span className="text-[9px] text-white/30">{slots.length} items</span>
                </Disclosure.Button>
                <Disclosure.Panel className="p-3 pt-0">
                  <div className="grid grid-cols-4 gap-1.5">
                    {slots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => onItemClick(slot)}
                        className={`
                          text-[10px] py-1.5 px-1 rounded-md transition-colors truncate
                          ${slot.type === 'availability' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/70 hover:bg-emerald-500/15' 
                            : 'bg-blue-500/10 border border-blue-500/20 text-blue-400/70 hover:bg-blue-500/15'
                          }
                        `}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-8 text-white/30 text-[11px]">
            No hay items para este día
          </div>
        )}
      </div>
    </div>
  );
};
export default DayDetailsPanel;