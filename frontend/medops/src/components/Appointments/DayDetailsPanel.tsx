// src/components/Appointments/DayDetailsPanel.tsx
import React, { useMemo } from 'react';
import { OperationalItem } from '@/types/operational';
import { Disclosure } from '@headlessui/react';
import { ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
interface DayDetailsPanelProps {
  day: Date;
  items: OperationalItem[];
  onItemClick: (item: OperationalItem) => void; // ✅ CAMBIO: onSlotClick → onItemClick
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
    <div className="bg-[#0a0a0b] border border-white/10 rounded-sm h-full flex flex-col">
      <div className="flex items-center justify-between p-3 bg-[#111] border-b border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <p className="text-xs text-white/40">
            {items.length} items • {Object.keys(groupedItems).length} servicios
          </p>
        </div>
        <ClockIcon className="w-4 h-4 text-white/40" />
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Object.entries(groupedItems).map(([serviceName, slots]) => (
          <Disclosure key={serviceName} defaultOpen>
            {({ open }) => (
              <div className="bg-[#111] border border-white/10 rounded-sm overflow-hidden">
                <Disclosure.Button className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <ChevronRightIcon className={`w-3 h-3 text-white/40 transition-transform ${open ? 'rotate-90' : ''}`} />
                    <span className="text-xs font-medium text-white">{serviceName}</span>
                  </div>
                  <span className="text-xs text-white/40">{slots.length} items</span>
                </Disclosure.Button>
                <Disclosure.Panel className="p-2 pt-0">
                  <div className="grid grid-cols-4 gap-1">
                    {slots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => onItemClick(slot)}
                        className={`
                          text-[10px] py-1 px-1 rounded transition-colors truncate
                          ${slot.type === 'availability' 
                            ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-800/40' 
                            : 'bg-blue-900/30 border border-blue-500/30 text-blue-300 hover:bg-blue-800/40'
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
          <div className="text-center py-8 text-white/40 text-xs">
            No hay items para este día
          </div>
        )}
      </div>
    </div>
  );
};
export default DayDetailsPanel;