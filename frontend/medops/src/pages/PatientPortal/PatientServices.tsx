// src/pages/PatientPortal/PatientServices.tsx
import { useState, useMemo } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { Tabs, Tab } from "@/components/ui/Tabs";
import { 
  usePatientServicesHistory, 
  usePatientServicesCatalog,
  usePatientServicesRecommended 
} from "@/hooks/patient/usePatientServices";
import { Loader2 } from "lucide-react";
import { 
  DocumentIcon,
  Bars3Icon,
  ChevronDownIcon, 
  ChevronRightIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import { DoctorService, RecommendedService } from "@/api/patient/client";
import { ServicePurchaseFlow } from "@/components/Doctor/ServicePurchaseFlow";
import { ServiceDetail } from "@/components/Common/ServiceDetail";

const CATEGORIES = [
  "Consulta Medica",
  "Laboratorio y Diagnostico",
  "Medicamentos y Farmacia",
  "Paquetes y Promociones",
  "Procedimientos Medicos",
  "Servicios Administrativos"
];

export default function PatientServices() {
  const [activeTab, setActiveTab] = useState<"history" | "catalog" | "recommended">("catalog");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<DoctorService | null>(null);
  const [showServiceDetail, setShowServiceDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const currentPatientId = localStorage.getItem('patient_id') 
    ? Number(localStorage.getItem('patient_id')) 
    : null;
  const { data: historyData, isLoading: historyLoading } = usePatientServicesHistory();
  const { data: catalogData, isLoading: catalogLoading } = usePatientServicesCatalog();
  const { data: recommendedData, isLoading: recommendedLoading } = usePatientServicesRecommended();
  
  const handleTabChange = (id: string) => {
    if (id === "history" || id === "catalog" || id === "recommended") {
      setActiveTab(id);
    }
  };
  const handleToggleOrder = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };
  const handleSelectRecommendedService = (service: RecommendedService) => {
    const doctorService: DoctorService = {
      id: service.id,
      code: service.code,
      name: service.name,
      doctor_name: service.doctor_name,
      institution_name: service.institution_name,
      price_usd: service.price_usd,
      duration_minutes: service.duration_minutes,
      doctor: 0,
      category: 0,
      category_name: '',
      institution: 0,
      description: '',
      is_active: true,
      is_visible_global: true,
      requires_appointment: true,
      booking_lead_time: 24,
      cancellation_window: 24,
    };
    setSelectedService(doctorService);
    setShowServiceDetail(true);
  };
  let services: DoctorService[] = [];
  if (catalogData) {
    if ('results' in catalogData && Array.isArray(catalogData.results)) {
      services = catalogData.results;
    } else if ('services' in catalogData && Array.isArray((catalogData as any).services)) {
      services = (catalogData as any).services;
    }
  }
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = !selectedCategory || service.category_name === selectedCategory;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchLower) ||
        service.doctor_name?.toLowerCase().includes(searchLower) ||
        service.institution_name?.toLowerCase().includes(searchLower);
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);
  const getCategoryCount = (categoryName: string) => {
    return services.filter(s => s.category_name === categoryName).length;
  };
  if (historyLoading || catalogLoading || recommendedLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-400/60 animate-spin" />
          <p className="text-xs text-emerald-400/60">Cargando servicios...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Servicios", active: true }
        ]}
      />
      
      <Tabs value={activeTab} onChange={handleTabChange} layout="horizontal">
        
        <Tab id="catalog" label={<><Bars3Icon className="w-4 h-4" /> Catálogo</>}>
          <div className="space-y-4">
            {/* Horizontal Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCategory 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80'
                }`}
              >
                Todos ({services.length})
              </button>
              {CATEGORIES.map((category) => {
                const count = getCategoryCount(category);
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white/80'
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/40">
                {filteredServices.length} servicios encontrados
                {selectedCategory && ` en "${selectedCategory}"`}
              </p>
              {(selectedCategory || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Limpiar
                </button>
              )}
            </div>
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="group bg-white/10 border border-white/15 rounded-xl p-5 hover:bg-white/15 hover:border-emerald-500/30 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedService(service);
                      setShowServiceDetail(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-medium">
                        {service.category_name || 'Servicio'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white/90 mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                      {service.name || 'Servicio sin nombre'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                      <UserIcon className="w-4 h-4 text-white/30" />
                      <span>Dr. {service.doctor_name || 'Médico no especificado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                      <BuildingOfficeIcon className="w-4 h-4 text-white/30" />
                      <span>{service.institution_name || 'Institución no especificada'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <span className="text-xs text-white/30 font-mono">
                        {service.code}
                      </span>
                      <span className="text-emerald-400 font-bold text-base">
                        $ {service.price_usd ? service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-dashed border-white/10 rounded-xl">
                <div className="bg-white/5 p-4 rounded-full mb-4">
                  <Bars3Icon className="w-6 h-6 text-white/20" />
                </div>
                <h3 className="text-white/60 font-semibold text-base mb-1">No se encontraron servicios</h3>
                <p className="text-white/30 text-sm text-center max-w-xs mb-4">
                  {searchQuery 
                    ? `No hay resultados para "${searchQuery}"`
                    : `No hay servicios en la categoría seleccionada`
                  }
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                >
                  Ver todos los servicios
                </button>
              </div>
            )}
          </div>
        </Tab>
        <Tab id="history" label={<><DocumentIcon className="w-4 h-4" /> Historial</>}>
          <div className="space-y-3">
            {historyData?.orders?.map((order) => (
              <div key={order.id} className="bg-white/10 border border-white/15 rounded-xl overflow-hidden hover:border-white/25 transition-colors">
                <button
                  onClick={() => handleToggleOrder(order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white/90">Orden #{order.id}</p>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {order.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <BuildingOfficeIcon className="w-3.5 h-3.5" />
                          {order.institution}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-emerald-400 font-bold text-sm">
                      Bs {order.total.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                    </p>
                    {expandedOrder === order.id 
                      ? <ChevronDownIcon className="w-4 h-4 text-white/40" /> 
                      : <ChevronRightIcon className="w-4 h-4 text-white/40" />
                    }
                  </div>
                </button>
                
                {expandedOrder === order.id && (
                  <div className="border-t border-white/10 bg-black/20 p-4 space-y-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="font-medium text-white/70">{item.description}</p>
                          <p className="text-xs text-white/30 font-mono">{item.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white/70">Bs {item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                          <p className="text-xs text-white/30">x{item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Tab>
        <Tab id="recommended" label={<><HeartIcon className="w-4 h-4" /> Recomendados</>}>
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/15 rounded-xl p-5">
              <p className="text-xs font-semibold text-white/50 mb-4 uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-400/60" /> Doctores Recomendados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedData?.recommended_doctors?.map((doctor) => (
                  <div key={doctor.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{doctor.full_name}</p>
                        <p className="text-xs text-white/40 truncate">
                          {doctor.specialties?.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/15 rounded-xl p-5">
              <p className="text-xs font-semibold text-white/50 mb-4 uppercase tracking-wider flex items-center gap-2">
                <CurrencyDollarIcon className="w-4 h-4 text-emerald-400/60" /> Servicios Populares
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedData?.recommended_services?.map((service: RecommendedService) => (
                  <div 
                    key={service.id} 
                    className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-emerald-500/20 group"
                    onClick={() => handleSelectRecommendedService(service)}
                  >
                    <h4 className="text-sm font-semibold text-white/90 mb-2 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {service.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-white/40 mb-2">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Dr. {service.doctor_name}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                      <span className="text-xs text-white/30">
                        {service.times_used} veces usada
                      </span>
                      <span className="text-emerald-400 font-bold text-sm">
                        $ {service.price_usd?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>
      
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
      {!showServiceDetail && selectedService && currentPatientId && (
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
      {!showServiceDetail && selectedService && !currentPatientId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1b] border border-white/20 rounded-xl p-8 text-center max-w-md">
            <p className="text-red-400 text-sm mb-4">Error: No se pudo identificar al paciente.</p>
            <p className="text-white/30 text-xs mb-4">Por favor, inicia sesión nuevamente.</p>
            <button
              onClick={() => setSelectedService(null)}
              className="px-4 py-2.5 bg-white/5 text-white/60 text-xs font-medium rounded-lg hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}