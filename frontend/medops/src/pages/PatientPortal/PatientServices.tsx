// src/pages/PatientPortal/PatientServices.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { 
  usePatientServicesHistory, 
  usePatientServicesCatalog,
  usePatientServicesRecommended 
} from "@/hooks/patient/usePatientServices";
import { 
  ReceiptIcon, 
  ListIcon, 
  StethoscopeIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  ClockIcon,
  Building2Icon,
  UserIcon,
  Loader2 
} from "lucide-react";
import { ServiceCatalogResponse, DoctorService } from "@/api/patient/client";
export default function PatientServices() {
  const [activeTab, setActiveTab] = useState<"history" | "catalog" | "recommended">("history");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const { data: historyData, isLoading: historyLoading } = usePatientServicesHistory();
  const { data: catalogData, isLoading: catalogLoading } = usePatientServicesCatalog();
  const { data: recommendedData, isLoading: recommendedLoading } = usePatientServicesRecommended();
  
  const handleToggleOrder = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };
  if (historyLoading || catalogLoading || recommendedLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500">Cargando servicios...</p>
        </div>
      </div>
    );
  }
  // Determinar qué estructura de datos tiene el catálogo
  let services: DoctorService[] = [];
  if (catalogData) {
    // Intentar nuevo formato (results)
    if ('results' in catalogData && Array.isArray(catalogData.results)) {
      services = catalogData.results;
    }
    // Intentar formato antiguo (services)
    else if ('services' in catalogData && Array.isArray((catalogData as any).services)) {
      services = (catalogData as any).services;
    }
  }
  // ✅ FIX: Manejar valores undefined para evitar errores en toLocaleString
  const totalInvertido = historyData?.summary?.total_invertido ?? 0;
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "SERVICIOS", active: true }
        ]}
        stats={[
          { 
            label: "ORDENES", 
            value: historyData?.summary?.total_orders?.toString() || "0",
            color: "text-white"
          },
          { 
            label: "INVERTIDO", 
            value: `Bs ${totalInvertido.toLocaleString('es-VE', { minimumFractionDigits: 0 })}`,
            color: "text-emerald-400"
          },
          { 
            label: "SERVICIOS", 
            value: historyData?.summary?.unique_services?.toString() || "0",
            color: "text-blue-400"
          },
        ]}
      />
      {/* TABS */}
      <div className="flex gap-2 bg-white/5 p-1 rounded-sm">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
            activeTab === "history" 
              ? "bg-white text-black" 
              : "text-white/40 hover:text-white"
          }`}
        >
          <ReceiptIcon className="w-4 h-4" />
          Historial
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
            activeTab === "catalog" 
              ? "bg-white text-black" 
              : "text-white/40 hover:text-white"
          }`}
        >
          <ListIcon className="w-4 h-4" />
          Catálogo
        </button>
        <button
          onClick={() => setActiveTab("recommended")}
          className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${
            activeTab === "recommended" 
              ? "bg-white text-black" 
              : "text-white/40 hover:text-white"
          }`}
        >
          <StethoscopeIcon className="w-4 h-4" />
          Recomendados
        </button>
      </div>
      {/* CONTENIDO */}
      <div className="space-y-6">
        {/* HISTORIAL */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {historyData?.orders?.map((order) => (
              <div key={order.id} className="bg-[#0a0a0b] border border-white/10 rounded-sm overflow-hidden">
                <button
                  onClick={() => handleToggleOrder(order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="text-left">
                      <p className="text-sm font-bold">Orden #{order.id}</p>
                      <div className="flex items-center gap-2 text-[9px] text-white/40 mt-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>{order.date}</span>
                        <Building2Icon className="w-3 h-3 ml-2" />
                        <span>{order.institution}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-emerald-400 font-bold">
                      Bs {order.total.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                    </p>
                    {expandedOrder === order.id 
                      ? <ChevronDownIcon className="w-4 h-4" /> 
                      : <ChevronRightIcon className="w-4 h-4" />
                    }
                  </div>
                </button>
                
                {expandedOrder === order.id && (
                  <div className="border-t border-white/10 bg-black/40 p-4 space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-[9px] text-white/40">{item.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Bs {item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                          <p className="text-[9px] text-white/40">x{item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* CATÁLOGO */}
        {activeTab === "catalog" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service.id} className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                    {service.category_name || 'SERVICIO'}
                  </span>
                  <span className="text-[8px] text-white/30">
                    {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">{service.name || 'Servicio sin nombre'}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                  <span className="text-[9px] text-white/40">Precio</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    Bs {service.price_ves ? service.price_ves.toLocaleString('es-VE', { minimumFractionDigits: 0 }) : 'N/A'}
                  </span>
                </div>
                <div className="mt-2 text-[9px] text-white/40">
                  Dr. {service.doctor_name || 'Médico no especificado'}
                </div>
              </div>
            ))}
          </div>
        )}
        {/* RECOMENDADOS */}
        {activeTab === "recommended" && (
          <div className="space-y-4">
            <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4">
              <p className="text-[9px] text-white/40 uppercase mb-4">
                Basado en tu historial de servicios
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedData?.recommended_doctors?.map((doctor) => (
                  <div key={doctor.id} className="bg-white/5 rounded-sm p-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white/40" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{doctor.full_name}</p>
                        <p className="text-[9px] text-white/40">
                          {doctor.specialties?.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}