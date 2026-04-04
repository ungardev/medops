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
  BuildingOfficeIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
interface ServiceItemsListProps {
  items: OperationalItem[];
  services: DoctorService[];
  selectedServiceId: number | null;
  statusFilter?: AppointmentStatus | "all";
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
  statusFilter = "all",
  onServiceChange,
  onAppointmentClick,
  onItemClick,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { statusStyles, getStatusStyle } = useAppointmentStatusStyles();
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (selectedServiceId) {
      result = result.filter(item => item.serviceId === selectedServiceId);
    }
    
    if (statusFilter && statusFilter !== "all") {
      result = result.filter(item => 
        item.type === 'appointment' && item.status === statusFilter
      );
    }
    
    if (!showAvailability) {
      result = result.filter(item => item.type !== 'availability');
    }
    
    return result.slice(0, 50);
  }, [items, selectedServiceId, statusFilter, showAvailability]);
  
  const appointmentCount = useMemo(() => {
    let result = items;
    if (selectedServiceId) {
      result = result.filter(item => item.serviceId === selectedServiceId);
    }
    return result.filter(i => i.type === 'appointment').length;
  }, [items, selectedServiceId]);
  
  const availabilityCount = useMemo(() => {
    let result = items;
    if (selectedServiceId) {
      result = result.filter(item => item.serviceId === selectedServiceId);
    }
    return result.filter(i => i.type === 'availability').length;
  }, [items, selectedServiceId]);
  
  const groupedAvailability = useMemo(() => {
    if (!showAvailability) return {};
    
    const groups: Record<string, OperationalItem[]> = {};
    filteredItems
      .filter(item => item.type === 'availability')
      .forEach(item => {
        const key = item.serviceName || 'Otros';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });
    
    return groups;
  }, [filteredItems, showAvailability]);
  
  const extractAppointmentData = (item: OperationalItem) => {
    if (item.metadata?.appointment) {
      const appointment = item.metadata.appointment as Appointment;
      return {
        patientName: appointment.patient?.full_name || 'Sin nombre',
        doctorName: appointment.doctor?.full_name || 'Sin asignar',
        date: appointment.appointment_date,
        status: appointment.status,
        rawAppointment: appointment
      };
    }
    
    const patientName = item.patientName || (item as any).patient_name;
    const doctorName = item.doctorName || (item as any).doctor_name;
    
    return {
      patientName: patientName || 'Sin nombre',
      doctorName: doctorName || 'Sin asignar',
      date: item.date,
      status: item.status,
      rawAppointment: null
    };
  };
  
  const selectedServiceName = useMemo(() => {
    if (!selectedServiceId) return 'Todos los Servicios';
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
    
    const appointment = item.metadata?.appointment as Appointment || item as any;
    
    if (item.type === 'appointment' && onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 p-3 bg-white/5 border border-white/15 rounded-lg">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-white/30" />
          <span className="text-[10px] text-white/50 uppercase tracking-wider">
            Filtrar
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAvailability(!showAvailability)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-medium uppercase tracking-wider transition-all ${
              showAvailability 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                : 'bg-white/5 text-white/30 border border-white/10 hover:text-white/50'
            }`}
          >
            {showAvailability ? (
              <EyeSlashIcon className="w-3.5 h-3.5" />
            ) : (
              <EyeIcon className="w-3.5 h-3.5" />
            )}
            {showAvailability ? 'Ocultar' : 'Slots'}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/15 rounded-lg text-[11px] text-white/70 hover:border-white/25 transition-all"
            >
              <BuildingOfficeIcon className="w-3.5 h-3.5 text-white/30" />
              <span className="truncate max-w-[150px]">{selectedServiceName}</span>
            </button>
            
            {showServiceDropdown && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-[#1a1a1b] border border-white/15 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <button
                  onClick={() => { onServiceChange(null); setShowServiceDropdown(false); }}
                  className={`w-full px-3 py-2 text-left text-[11px] hover:bg-white/5 transition-colors ${
                    !selectedServiceId ? 'bg-white/10 text-white' : 'text-white/60'
                  }`}
                >
                  Todos los Servicios
                </button>
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => { onServiceChange(service.id); setShowServiceDropdown(false); }}
                    className={`w-full px-3 py-2 text-left text-[11px] hover:bg-white/5 transition-colors ${
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
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-[11px]">
            {!showAvailability 
              ? 'No hay citas para este servicio.'
              : 'No hay items para este servicio'
            }
          </div>
        ) : (
          <>
            {filteredItems.filter(i => i.type === 'appointment').map((item) => {
              const data = extractAppointmentData(item);
              const style = getStatusStyle(data.status as AppointmentStatus);
              
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="bg-white/5 border border-white/10 hover:border-white/20 rounded-lg p-3 cursor-pointer transition-all hover:bg-white/10 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-1 h-8 rounded-full ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-white/80 truncate">
                            {data.patientName}
                          </span>
                          <span className="text-[9px] text-white/30">
                            {new Date(data.date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-white/30 truncate">
                            {data.doctorName}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && data.rawAppointment && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(data.rawAppointment); }}
                          className="p-1.5 text-white/30 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onStatusChange && data.rawAppointment && (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleStatusChange(data.rawAppointment);
                          }}
                          className="p-1.5 text-white/30 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-all"
                          title={data.rawAppointment.status === 'pending' ? 'Completar' : 'Reabrir'}
                        >
                          {data.rawAppointment.status === 'pending' ? (
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                          className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <XCircleIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {showAvailability && Object.entries(groupedAvailability).map(([serviceName, slots]) => (
              <div key={serviceName} className="mt-4">
                <div className="text-[9px] font-medium text-emerald-400/50 uppercase tracking-wider mb-2 px-1">
                  {serviceName} ({slots.length} slots)
                </div>
                {slots.slice(0, 10).map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="bg-white/5 border border-white/10 hover:border-emerald-500/20 rounded-lg p-3 cursor-pointer transition-all hover:bg-white/10 group mb-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-1 h-8 rounded-full bg-emerald-500/50" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-emerald-400/70 truncate">
                              {item.time || 'Sin hora'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-emerald-400/40">
                              Disponible
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                          className="p-1.5 text-white/30 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-all"
                          title="Agendar"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {slots.length > 10 && (
                  <div className="text-[8px] text-white/20 text-center py-1">
                    +{slots.length - 10} más slots disponibles
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
      
      <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[9px] text-white/30">
        <span>
          {appointmentCount} citas
          {showAvailability && ` | ${availabilityCount} slots`}
          {filteredItems.length >= 50 && ' (máx 50)'}
        </span>
        <span>{selectedServiceName}</span>
      </div>
    </div>
  );
};
export default ServiceItemsList;