// src/pages/PatientPortal/DoctorProfile.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDoctor, useDoctorServices } from '@/hooks/doctor/useDoctor';
import { DoctorProfileCard } from '@/components/Doctor/DoctorProfileCard';
import { ServicePurchaseFlow } from '@/components/Doctor/ServicePurchaseFlow';
import { ServiceDetail } from '@/components/Common/ServiceDetail';
import PageHeader from '@/components/Common/PageHeader';
export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const doctorId = parseInt(id || '0');
  
  const { data: doctor, isLoading: doctorLoading } = useDoctor(doctorId);
  const { data: services, isLoading: servicesLoading } = useDoctorServices(doctorId);
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  
  if (doctorLoading || servicesLoading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-[10px] text-emerald-400/60">Cargando perfil...</p>
        </div>
      </div>
    );
  }
  
  if (!doctor) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40">Doctor no encontrado</p>
        </div>
      </div>
    );
  }
  
  const currentPatientId = localStorage.getItem('patient_id') ? Number(localStorage.getItem('patient_id')) : 1;
  return (
    <div className="space-y-4">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Perfil del Doctor", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/15 rounded-xl overflow-hidden">
            <DoctorProfileCard doctor={doctor} mode="view" />
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="text-white/90 text-lg font-semibold mb-4 flex items-center gap-3">
            <div className="w-1 h-6 bg-emerald-400 rounded-full" />
            Servicios Disponibles
            <span className="text-xs text-white/30 font-normal">({services?.length || 0})</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services?.map((service) => (
              <div 
                key={service.id} 
                className="group bg-white/10 border border-white/15 rounded-xl p-5 hover:bg-white/15 hover:border-emerald-500/30 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer"
                onClick={() => {
                  setSelectedService(service);
                  setShowServiceDetail(true);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-medium">
                      {service.category_name || 'Servicio'}
                    </span>
                    <h3 className="text-white/90 font-semibold text-sm mt-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {service.name}
                    </h3>
                    <p className="text-white/40 text-xs mt-1">
                      Duración: {service.duration_minutes} min
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-emerald-400 font-bold text-lg">
                      ${service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                {service.description && (
                  <p className="text-white/50 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(service);
                    setShowServiceDetail(true);
                  }}
                  className="w-full py-2.5 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/25 transition-colors border border-emerald-500/25"
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
          
          {services?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-dashed border-white/10 rounded-xl">
              <div className="bg-white/5 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-white/60 font-semibold text-base mb-1">No hay servicios disponibles</h3>
              <p className="text-white/30 text-sm text-center max-w-xs">
                Este médico aún no tiene servicios registrados.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {showServiceDetail && selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <ServiceDetail
              service={selectedService}
              onClose={() => {
                setShowServiceDetail(false);
                setSelectedService(null);
              }}
              onBuy={() => {
                setShowServiceDetail(false);
              }}
            />
          </div>
        </div>
      )}
      
      {!showServiceDetail && selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ServicePurchaseFlow
              service={selectedService}
              patientId={currentPatientId}
              onSuccess={() => {
                setSelectedService(null);
              }}
              onCancel={() => setSelectedService(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}