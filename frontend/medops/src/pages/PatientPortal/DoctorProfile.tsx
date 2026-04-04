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
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Perfil del Doctor", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/15 rounded-lg p-6 sticky top-4">
            <DoctorProfileCard doctor={doctor} mode="view" />
            
            {doctor.bio && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-white/50 text-[10px] font-medium mb-2">
                  Biografía
                </h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  {doctor.bio}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="text-white/80 text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-400/60 rounded-full"></span>
            Servicios Disponibles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services?.map((service) => (
              <div 
                key={service.id} 
                className="group bg-white/5 border border-white/15 rounded-lg p-5 hover:bg-white/10 hover:border-white/25 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white/80 font-medium text-base group-hover:text-emerald-400 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-white/30 text-[10px] mt-1">
                      Duración: {service.duration_minutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-medium text-lg">
                      ${service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                {service.description && (
                  <p className="text-white/40 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                <button
                  onClick={() => {
                    setSelectedService(service);
                    setShowServiceDetail(true);
                  }}
                  className="w-full py-2.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/25 transition-colors border border-emerald-500/25"
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
          
          {services?.length === 0 && (
            <div className="text-center py-12 text-white/30">
              No hay servicios disponibles para este médico en este momento.
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