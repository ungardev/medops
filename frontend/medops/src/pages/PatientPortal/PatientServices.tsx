// src/pages/PatientPortal/PatientServices.tsx
import { useState, useMemo } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { Tabs, Tab } from "@/components/ui/Tabs";
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
  Loader2,
  DollarSignIcon,
  SearchIcon,
  XIcon
} from "lucide-react";
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
          <p className="text-[10px] text-emerald-400/60">Cargando servicios...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Servicios", active: true }
        ]}
      />
      
      <Tabs value={activeTab} onChange={handleTabChange} layout="horizontal">
        
        <Tab id="catalog" label={<><ListIcon className="w-4 h-4" /> Catálogo</>}>
          <div className="flex gap-4 mt-6">
            <div className="w-48 flex-shrink-0">
              <div className="bg-white/5 border border-white/15 rounded-lg p-4 sticky top-4">
                <p className="text-[10px] font-medium text-white/50 mb-3">
                  CATEGORÍAS
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors flex justify-between items-center ${
                      !selectedCategory 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-white/50 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium">Todos los servicios</span>
                    <span className="text-[10px] text-white/30">{services.length}</span>
                  </button>
                  
                  {CATEGORIES.map((category) => {
                    const count = getCategoryCount(category);
                    const isActive = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-colors flex justify-between items-center ${
                          isActive 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'text-white/50 hover:bg-white/5'
                        }`}
                      >
                        <span className="font-medium">{category}</span>
                        <span className={`text-[10px] ${count > 0 ? 'text-white/30' : 'text-white/20'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="mb-4 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Buscar por servicio, doctor o institución..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 rounded-lg py-2.5 pl-10 pr-10 text-[12px] text-white/80 placeholder:text-white/20 focus:border-emerald-500/50 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-white/40">
                  {filteredServices.length} servicios encontrados
                  {selectedCategory && ` en "${selectedCategory}"`}
                </p>
                {(selectedCategory || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchQuery("");
                    }}
                    className="text-[11px] text-emerald-400/70 hover:text-emerald-400 font-medium"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
              {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredServices.map((service) => (
                    <div 
                      key={service.id} 
                      className="group bg-white/5 border border-white/15 rounded-lg p-5 hover:bg-white/10 hover:border-white/25 transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedService(service);
                        setShowServiceDetail(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[9px] text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {service.category_name || 'Servicio'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-white/40">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-medium text-white/80 mb-3 line-clamp-2">
                        {service.name || 'Servicio sin nombre'}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-white/50 mb-2">
                        <UserIcon className="w-4 h-4" />
                        <span>Dr. {service.doctor_name || 'Médico no especificado'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40 mb-3">
                        <Building2Icon className="w-4 h-4" />
                        <span>{service.institution_name || 'Institución no especificada'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/10">
                        <span className="text-[9px] text-blue-400/60 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
                          {service.code}
                        </span>
                        <span className="text-emerald-400 font-medium text-[12px]">
                          $ {service.price_usd ? service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white/5 border border-dashed border-white/15 rounded-lg">
                  <div className="bg-white/5 p-4 rounded-full mb-4">
                    <ListIcon className="w-6 h-6 text-white/20" />
                  </div>
                  <h3 className="text-white/60 font-medium text-lg mb-1">No se encontraron servicios</h3>
                  <p className="text-white/30 text-sm text-center max-w-xs mb-4">
                    {searchQuery 
                      ? `No hay resultados para "${searchQuery}"${selectedCategory ? ` en "${selectedCategory}"` : ''}`
                      : `No hay servicios en la categoría "${selectedCategory}"`
                    }
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchQuery("");
                    }}
                    className="px-4 py-2.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/15 transition-colors"
                  >
                    Ver todos los servicios
                  </button>
                </div>
              )}
            </div>
          </div>
        </Tab>
        <Tab id="history" label={<><ReceiptIcon className="w-4 h-4" /> Historial</>}>
          <div className="space-y-4 mt-6">
            {historyData?.orders?.map((order) => (
              <div key={order.id} className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleToggleOrder(order.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div className="text-left">
                      <p className="text-[12px] font-medium text-white/80">Orden #{order.id}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/40 mt-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{order.date}</span>
                        <Building2Icon className="w-3.5 h-3.5 ml-2" />
                        <span>{order.institution}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-emerald-400 font-medium text-[12px]">
                      Bs {order.total.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                    </p>
                    {expandedOrder === order.id 
                      ? <ChevronDownIcon className="w-4 h-4 text-white/30" /> 
                      : <ChevronRightIcon className="w-4 h-4 text-white/30" />
                    }
                  </div>
                </button>
                
                {expandedOrder === order.id && (
                  <div className="border-t border-white/10 bg-black/20 p-5 space-y-3">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-[11px]">
                        <div>
                          <p className="font-medium text-white/70">{item.description}</p>
                          <p className="text-[10px] text-white/30">{item.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white/70">Bs {item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                          <p className="text-[10px] text-white/30">x{item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Tab>
        <Tab id="recommended" label={<><StethoscopeIcon className="w-4 h-4" /> Recomendados</>}>
          <div className="space-y-6 mt-6">
            <div className="bg-white/5 border border-white/15 rounded-lg p-5">
              <p className="text-[10px] font-medium text-white/50 mb-4 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Doctores Recomendados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedData?.recommended_doctors?.map((doctor) => (
                  <div key={doctor.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-white/30" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-white/80 truncate">{doctor.full_name}</p>
                        <p className="text-[10px] text-white/30 truncate">
                          {doctor.specialties?.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/15 rounded-lg p-5">
              <p className="text-[10px] font-medium text-white/50 mb-4 flex items-center gap-2">
                <DollarSignIcon className="w-4 h-4" /> Servicios Populares
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedData?.recommended_services?.map((service: RecommendedService) => (
                  <div 
                    key={service.id} 
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer border border-white/10 group"
                    onClick={() => handleSelectRecommendedService(service)}
                  >
                    <h4 className="text-[12px] font-medium text-white/80 mb-2 line-clamp-1">
                      {service.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mb-1">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Dr. {service.doctor_name}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] text-white/30">
                        {service.times_used} veces usada
                      </span>
                      <span className="text-emerald-400 font-medium text-[11px]">
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
          <div className="bg-[#1a1a1b] border border-white/15 rounded-lg p-8 text-center max-w-md">
            <p className="text-red-400 text-sm mb-4">Error: No se pudo identificar al paciente.</p>
            <p className="text-white/30 text-xs mb-4">Por favor, inicia sesión nuevamente.</p>
            <button
              onClick={() => setSelectedService(null)}
              className="px-4 py-2.5 bg-white/5 text-white/60 text-[10px] font-medium rounded-lg hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}