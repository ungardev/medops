// src/pages/PatientPortal/DoctorProfile.tsx
import { useParams } from 'react-router-dom';
import { useDoctor, useDoctorServices } from '@/hooks/doctor/useDoctor';
import { DoctorProfileCard } from '@/components/Doctor/DoctorProfileCard';
import { ServicePurchaseFlow } from '@/components/Doctor/ServicePurchaseFlow';
import { useState } from 'react';
export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const doctorId = parseInt(id || '0');
  
  const { data: doctor, isLoading: doctorLoading } = useDoctor(doctorId);
  const { data: services, isLoading: servicesLoading } = useDoctorServices(doctorId);
  
  const [selectedService, setSelectedService] = useState<any>(null);
  
  if (doctorLoading || servicesLoading) {
    return <div className="text-white p-8">Cargando perfil...</div>;
  }
  
  if (!doctor) {
    return <div className="text-white p-8">Doctor no encontrado</div>;
  }
  
  // Obtener patientId del contexto real (ej. localStorage, contexto de auth)
  // Por ahora usamos 1 como placeholder
  const currentPatientId = 1; 
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil del Doctor */}
        <div className="lg:col-span-1">
          <DoctorProfileCard doctor={doctor} mode="view" />
        </div>
        
        {/* Servicios */}
        <div className="lg:col-span-2">
          <h2 className="text-white text-xl font-bold mb-4">Servicios Disponibles</h2>
          <div className="space-y-4">
            {services?.map((service) => (
              <div key={service.id} className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">{service.name}</h3>
                    <p className="text-white/60 text-sm">{service.description}</p>
                    <p className="text-white/40 text-xs mt-1">
                      Duración: {service.duration_minutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-mono text-lg">
                      $ {service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <button
                      onClick={() => setSelectedService(service)}
                      className="mt-2 px-4 py-2 bg-white text-black text-xs font-bold uppercase rounded-sm hover:bg-white/90"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Modal de Compra */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="w-full max-w-md">
            <ServicePurchaseFlow
              service={selectedService}
              patientId={currentPatientId}
              onSuccess={() => {
                setSelectedService(null);
                // Redirigir a órdenes de cobro o mostrar mensaje de éxito
              }}
              onCancel={() => setSelectedService(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}