// frontend/medops/src/pages/Services/ServiceDetailPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDoctorService } from '@/hooks/services/useDoctorServices';
import { 
  useServiceSchedules, 
  useCreateServiceSchedule, 
  useDeleteServiceSchedule 
} from '@/hooks/services/useServiceSchedules';
import PageHeader from '@/components/Common/PageHeader';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  ClockIcon,
  PlusIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
const DIAS_SEMANA = [
  { label: 'Lunes', value: 0 },
  { label: 'Martes', value: 1 },
  { label: 'Miércoles', value: 2 },
  { label: 'Jueves', value: 3 },
  { label: 'Viernes', value: 4 },
  { label: 'Sábado', value: 5 },
  { label: 'Domingo', value: 6 },
];
export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'schedules'>('schedules');
  
  const { data: service, isLoading } = useDoctorService(Number(id));
  const { data: schedules = [] } = useServiceSchedules(Number(id));
  const createSchedule = useCreateServiceSchedule();
  const deleteSchedule = useDeleteServiceSchedule();
  
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 30,
    max_appointments: 1,
  });
  if (isLoading) return (
    <div className="p-10 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!service) return (
    <div className="p-10 text-center">
      <p className="text-red-400">Servicio no encontrado</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-white/50 hover:text-white underline">
        Volver
      </button>
    </div>
  );
  const handleAddSchedule = async () => {
    try {
      await createSchedule.mutateAsync({
        service: Number(id),
        institution: service.institution!,
        ...newSchedule,
      });
    } catch (error) {
      console.error("Error al agregar horario", error);
    }
  };
  return (
    <div className="max-w-[1200px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Servicios", path: "/services" },
          { label: service.name, active: true }
        ]}
        actions={
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white px-4 py-2 bg-white/5 border border-white/15 rounded-lg transition-all">
            <ArrowLeftIcon className="w-4 h-4" /> Volver
          </button>
        }
      />
      
      <div className="flex items-center gap-4 bg-white/5 border border-white/15 p-5 rounded-lg">
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-white/90">{service.name}</h1>
          <p className="text-white/40 text-sm">{service.category_name} · {service.code}</p>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-semibold text-lg">${service.price_usd}</p>
          <p className="text-white/30 text-xs">{service.duration_minutes} min / cita</p>
        </div>
      </div>
      
      <div className="flex border-b border-white/15">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2.5 text-[11px] font-medium transition-all ${
            activeTab === 'info' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Información
        </button>
        <button 
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2.5 text-[11px] font-medium transition-all flex items-center gap-2 ${
            activeTab === 'schedules' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <ClockIcon className="w-4 h-4" /> Horarios Semanales
        </button>
      </div>
      
      <div className="bg-white/5 border border-white/15 p-6 rounded-lg">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-white/80">Detalles del Servicio</h2>
            <p className="text-white/50">{service.description || 'Sin descripción.'}</p>
          </div>
        )}
        
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-white/80">Configuración de Horarios</h2>
              <span className="text-xs text-white/30">Define cuándo está disponible este servicio</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="md:col-span-1">
                <label className="block text-[9px] text-white/40 uppercase mb-1.5">Día</label>
                <select 
                  value={newSchedule.day_of_week}
                  onChange={(e) => setNewSchedule({...newSchedule, day_of_week: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-white/80 text-sm rounded-lg focus:border-emerald-500/50 outline-none"
                >
                  {DIAS_SEMANA.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[9px] text-white/40 uppercase mb-1.5">Inicio</label>
                <input 
                  type="time" 
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-white/80 text-sm rounded-lg focus:border-emerald-500/50 outline-none"
                  style={{colorScheme: 'dark'}}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[9px] text-white/40 uppercase mb-1.5">Fin</label>
                <input 
                  type="time" 
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-white/80 text-sm rounded-lg focus:border-emerald-500/50 outline-none"
                  style={{colorScheme: 'dark'}}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[9px] text-white/40 uppercase mb-1.5">Duración (min)</label>
                <input 
                  type="number" 
                  value={newSchedule.slot_duration}
                  onChange={(e) => setNewSchedule({...newSchedule, slot_duration: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-white/80 text-sm rounded-lg focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[9px] text-white/40 uppercase mb-1.5">Cupos/Slot</label>
                <input 
                  type="number" 
                  value={newSchedule.max_appointments}
                  onChange={(e) => setNewSchedule({...newSchedule, max_appointments: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-white/80 text-sm rounded-lg focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button 
                  onClick={handleAddSchedule}
                  className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-medium py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors border border-emerald-500/25"
                >
                  <PlusIcon className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mt-6">
              {DIAS_SEMANA.map((dia) => {
                const daySchedules = schedules.filter(s => s.day_of_week === dia.value);
                
                return (
                  <div key={dia.value} className="border border-white/15 rounded-lg bg-white/5 min-h-[200px] flex flex-col">
                    <div className="p-2.5 text-center border-b border-white/10 bg-white/5 rounded-t-lg">
                      <span className="text-[10px] font-medium text-white/60">{dia.label}</span>
                    </div>
                    
                    <div className="p-2 flex-1 space-y-2">
                      {daySchedules.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-[9px] text-white/20 italic">Sin horario</span>
                        </div>
                      ) : (
                        daySchedules.map((schedule) => (
                          <div 
                            key={schedule.id} 
                            className="group relative bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 hover:bg-emerald-500/15 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[10px] text-emerald-400/80 font-medium">
                                  {schedule.start_time} - {schedule.end_time}
                                </p>
                                <p className="text-[8px] text-white/30">
                                  {schedule.slot_duration}min / {schedule.max_appointments}c
                                </p>
                              </div>
                              <button 
                                onClick={() => deleteSchedule.mutate(schedule.id)}
                                className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-opacity p-1"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-[9px] text-white/30 bg-white/5 p-3 rounded-lg border border-white/10">
              <strong className="text-white/40">Nota:</strong> Los slots de disponibilidad se generarán automáticamente basándose en estos horarios. 
              El calendario principal mostrará la disponibilidad en tiempo real.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}