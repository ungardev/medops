// src/components/Appointments/ServiceItemsList.tsx
import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus } from '@/types/appointments';
import { OperationalItem } from '@/types/operational';
import { DoctorService } from '@/types/services';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
import { 
  PencilSquareIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  FunnelIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
interface ServiceItemsListProps {
  items: OperationalItem[];
  services: DoctorService[];
  selectedServiceId: number | null;
  onServiceChange: (serviceId: number | null) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onItemClick?: (item: OperationalItem) => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (item: OperationalItem) => void;
  onStatusChange?: (id: number, status: AppointmentStatus) => void;
}
const ServiceItemsList: React.FC<ServiceItemsListProps> = ({
  items,
  services,
  selectedServiceId,
  onServiceChange,
  onAppointmentClick,
  onItemClick,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { statusStyles } = useAppointmentStatusStyles();
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  // Filtrar items por servicio seleccionado
  const filteredItems = useMemo(() => {
    if (!selectedServiceId) return items;
    return items.filter(item => {
      // Para citas: verificar servicio del appointment
      if (item.type === 'appointment' && item.metadata?.appointment) {
        const appointment = item.metadata.appointment as Appointment;
        return appointment.doctor_service === selectedServiceId;
      }
      // Para disponibilidades: verificar servicioId
      if (item.type === 'availability') {
        return item.serviceId === selectedServiceId;
      }
      return false;
    });
  }, [items, selectedServiceId]);
  // Obtener nombre del servicio seleccionado
  const selectedServiceName = useMemo(() => {
    if (!selectedServiceId) return 'Todas las Citas';
    const service = services.find(s => s.id === selectedServiceId);
    return service?.name || 'Servicio Desconocido';
  }, [selectedServiceId, services]);
  const handleStatusChange = (appointment: Appointment) => {
    if (onStatusChange) {
      const newStatus = appointment.status === 'pending' ? 'completed' : 'pending';
      onStatusChange(appointment.id, newStatus as AppointmentStatus);
    }
  };
  const handleItemClick = (item: OperationalItem) => {
    if (onItemClick) onItemClick(item);
    if (item.type === 'appointment' && item.metadata?.appointment && onAppointmentClick) {
      onAppointmentClick(item.metadata.appointment as Appointment);
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Header con Selector de Servicio */}
      <div className="flex items-center justify-between mb-3 p-2 bg-[#111] border border-white/10 rounded-sm">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-white/40" />
          <span className="text-[10px] text-white/60 uppercase tracking-wider">
            FILTRAR POR SERVICIO
          </span>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0b] border border-white/10 rounded text-xs text-white hover:border-white/30 transition-all"
          >
            <BuildingOfficeIcon className="w-3.5 h-3.5 text-white/40" />
            <span className="truncate max-w-[150px]">{selectedServiceName}</span>
          </button>
          
          {showServiceDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#1a1a1a] border border-white/10 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => { onServiceChange(null); setShowServiceDropdown(false); }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-colors ${
                  !selectedServiceId ? 'bg-white/10 text-white' : 'text-white/60'
                }`}
              >
                Todas las Citas
              </button>
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => { onServiceChange(service.id); setShowServiceDropdown(false); }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-colors ${
                    selectedServiceId === service.id ? 'bg-white/10 text-white' : 'text-white/60'
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Lista de Items */}
      <div className="flex-1 overflow-y-auto space-y-[2px]">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-xs">
            No hay items para este servicio
          </div>
        ) : (
          filteredItems.map((item) => {
            // Renderizado para citas
            if (item.type === 'appointment' && item.metadata?.appointment) {
              const appointment = item.metadata.appointment as Appointment;
              const status = appointment.status;
              const style = statusStyles[status] || statusStyles.pending;
              const patientName = appointment.patient?.full_name || 'Sin nombre';
              const doctorName = appointment.doctor?.full_name || 'Sin asignar';
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="bg-[#0a0a0b] border border-white/5 hover:border-white/15 rounded-sm p-2 cursor-pointer transition-all hover:bg-[#111] group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1 h-8 rounded-full ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-white truncate">
                            {patientName}
                          </span>
                          <span className="text-[9px] text-white/40 font-mono">
                            {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-white/30 truncate">
                            {doctorName}
                          </span>
                          <span className={`text-[8px] px-1 rounded ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(appointment); }}
                          className="p-1.5 text-white/40 hover:text-blue-400 hover:bg-white/5 rounded transition-all"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onStatusChange && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleStatusChange(appointment);
                          }}
                          className="p-1.5 text-white/40 hover:text-green-400 hover:bg-white/5 rounded transition-all"
                          title={appointment.status === 'pending' ? 'Completar' : 'Reabrir'}
                        >
                          {appointment.status === 'pending' ? (
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                          className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded transition-all"
                          title="Eliminar"
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            
            // Renderizado para disponibilidades
            if (item.type === 'availability') {
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="bg-[#0a0a0b] border border-white/5 hover:border-emerald-500/30 rounded-sm p-2 cursor-pointer transition-all hover:bg-[#111] group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-1 h-8 rounded-full bg-emerald-500/70" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-emerald-300 truncate">
                            {item.serviceName || 'Servicio'}
                          </span>
                          <span className="text-[9px] text-white/40 font-mono">
                            {item.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-emerald-400/60">
                            Disponible
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                        className="p-1.5 text-white/40 hover:text-emerald-400 hover:bg-white/5 rounded transition-all"
                        title="Agendar"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                          className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded transition-all"
                          title="Eliminar"
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            // Renderizado para otros tipos (bloqueos, etc.)
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="bg-[#0a0a0b] border border-white/5 hover:border-red-500/30 rounded-sm p-2 cursor-pointer transition-all hover:bg-[#111] group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-1 h-8 rounded-full bg-red-500/70" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-red-300 truncate">
                          {item.title || 'Bloqueo'}
                        </span>
                        <span className="text-[9px] text-white/40 font-mono">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-red-400/60">
                          No disponible
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded transition-all"
                        title="Eliminar"
                      >
                        <XCircleIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Footer con estadísticas */}
      <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[9px] text-white/40">
        <span>{filteredItems.length} items mostrados</span>
        <span>{selectedServiceName}</span>
      </div>
    </div>
  );
};
export default ServiceItemsList;