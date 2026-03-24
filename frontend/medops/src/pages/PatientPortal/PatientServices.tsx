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
export default function PatientServices() {
  // FASE 1: Ordenar tabs - Catalogo es el primero
  const [activeTab, setActiveTab] = useState<"history" | "catalog" | "recommended">("catalog");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<DoctorService | null>(null);
  
  // FASE 2: Estado para filtros
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Obtener patientId de localStorage
  const currentPatientId = localStorage.getItem('patient_id') 
    ? Number(localStorage.getItem('patient_id')) 
    : 1;
  
  const { data: historyData, isLoading: historyLoading } = usePatientServicesHistory();
  const { data: catalogData, isLoading: catalogLoading } = usePatientServicesCatalog();
  const { data: recommendedData, isLoading: recommendedLoading } = usePatientServicesRecommended();
  
  // ✅ CORRECCIÓN 1: Función wrapper para onChange del Tabs
  const handleTabChange = (id: string) => {
    if (id === "history" || id === "catalog" || id === "recommended") {
      setActiveTab(id);
    }
  };
  const handleToggleOrder = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };
  // ✅ CORRECCIÓN 2: Función para mapear RecommendedService a DoctorService
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
  };
  // Determinar servicios del catálogo (manejo de formatos)
  let services: DoctorService[] = [];
  if (catalogData) {
    if ('results' in catalogData && Array.isArray(catalogData.results)) {
      services = catalogData.results;
    } else if ('services' in catalogData && Array.isArray((catalogData as any).services)) {
      services = (catalogData as any).services;
    }
  }
  // FASE 2: Extraer categorías únicas
  const uniqueCategories = useMemo(() => {
    const categories = Array.from(new Set(
      services.map(s => s.category_name).filter(Boolean)
    ));
    return categories.sort(); // Ordenar alfabéticamente
  }, [services]);
  // FASE 2: Filtrar servicios por categoría y búsqueda
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = !selectedCategory || service.category_name === selectedCategory;
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.institution_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);
  // FASE 2: Contar servicios por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      if (service.category_name) {
        counts[service.category_name] = (counts[service.category_name] || 0) + 1;
      }
    });
    return counts;
  }, [services]);
  const totalInvertido = historyData?.summary?.total_invertido ?? 0;
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
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* FASE 1: Eliminado stats del PageHeader */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "SERVICIOS", active: true }
        ]}
      />
      
      {/* Tabs Componente - FASE 1: Reordenados */}
      <Tabs value={activeTab} onChange={handleTabChange} layout="horizontal">
        
        {/* TAB 1: CATALOGO (Ahora primero) */}
        <Tab id="catalog" label={<><ListIcon className="w-4 h-4" /> Catálogo</>}>
          <div className="flex gap-4 mt-6">
            {/* FASE 2: Sidebar de Categorías */}
            <div className="w-48 flex-shrink-0">
              <div className="bg-black/20 border border-white/10 rounded-sm p-3 sticky top-4">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">
                  CATEGORÍAS
                </p>
                <div className="space-y-1">
                  {/* Botón "Todas" */}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-sm text-xs transition-colors flex justify-between items-center ${
                      !selectedCategory 
                        ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500' 
                        : 'text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <span>Todos los servicios</span>
                    <span className="text-[9px] text-white/40">{services.length}</span>
                  </button>
                  
                  {/* Categorías */}
                  {uniqueCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-sm text-xs transition-colors flex justify-between items-center ${
                        selectedCategory === category 
                          ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500' 
                          : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <span>{category}</span>
                      <span className="text-[9px] text-white/40">
                        {categoryCounts[category] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Área Principal del Catálogo */}
            <div className="flex-1">
              {/* Buscador */}
              <div className="mb-4 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Buscar por servicio, doctor o institución..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-sm py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/40 focus:border-emerald-500/50 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Resultados y Grid */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/50">
                  {filteredServices.length} servicios encontrados
                  {selectedCategory && ` en "${selectedCategory}"`}
                  {searchQuery && ` con "${searchQuery}"`}
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300"
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
              {/* Grid de Servicios */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <div 
                      key={service.id} 
                      className="group bg-black/30 border border-white/10 rounded-sm p-4 hover:border-white/20 hover:bg-black/40 transition-all cursor-pointer"
                      onClick={() => setSelectedService(service)}
                    >
                      {/* Header: Categoría y Duración */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                          {service.category_name || 'SERVICIO'}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-white/50">
                          <ClockIcon className="w-3 h-3" />
                          {service.duration_minutes ? `${service.duration_minutes} min` : 'N/A'}
                        </span>
                      </div>
                      {/* Nombre del Servicio (Prioridad 1) */}
                      <h4 className="text-[13px] font-black text-white uppercase tracking-tight mb-3 line-clamp-2">
                        {service.name || 'Servicio sin nombre'}
                      </h4>
                      {/* Doctor (Prioridad 2) */}
                      <div className="flex items-center gap-2 text-[11px] text-white/70 mb-2">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Dr. {service.doctor_name || 'Médico no especificado'}</span>
                      </div>
                      {/* Institución (Prioridad 3) */}
                      <div className="flex items-center gap-2 text-[10px] text-white/60 mb-3">
                        <Building2Icon className="w-3.5 h-3.5" />
                        <span>{service.institution_name || 'Institución no especificada'}</span>
                      </div>
                      {/* Precio y Código (Prioridad 4 y 5) */}
                      <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <span className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                          {service.code}
                        </span>
                        <span className="text-emerald-400 font-bold text-sm">
                          $ {service.price_usd ? service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-white/50">
                    <p>No se encontraron servicios que coincidan con los filtros.</p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 mt-2 text-sm"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tab>
        {/* TAB 2: HISTORIAL */}
        <Tab id="history" label={<><ReceiptIcon className="w-4 h-4" /> Historial</>}>
          <div className="space-y-4 mt-6">
            {historyData?.orders?.map((order) => (
              <div key={order.id} className="bg-black/30 border border-white/10 rounded-sm overflow-hidden">
                <button
                  onClick={() => handleToggleOrder(order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${order.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Orden #{order.id}</p>
                      <div className="flex items-center gap-2 text-[9px] text-white/70 mt-1">
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
                          <p className="font-medium text-white/90">{item.description}</p>
                          <p className="text-[9px] text-white/60">{item.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white/90">Bs {item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                          <p className="text-[9px] text-white/60">x{item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Tab>
        {/* TAB 3: RECOMENDADOS */}
        <Tab id="recommended" label={<><StethoscopeIcon className="w-4 h-4" /> Recomendados</>}>
          <div className="space-y-6 mt-6">
            <div className="bg-black/30 border border-white/10 rounded-sm p-4">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserIcon className="w-3 h-3" /> Doctores Recomendados
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedData?.recommended_doctors?.map((doctor) => (
                  <div key={doctor.id} className="bg-black/20 rounded-sm p-4 hover:bg-black/30 transition-colors cursor-pointer border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{doctor.full_name}</p>
                        <p className="text-[9px] text-white/60 truncate">
                          {doctor.specialties?.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-sm p-4">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSignIcon className="w-3 h-3" /> Servicios Populares
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedData?.recommended_services?.map((service: RecommendedService) => (
                  <div 
                    key={service.id} 
                    className="bg-black/20 rounded-sm p-4 hover:bg-black/30 transition-colors cursor-pointer border border-white/5 group"
                    onClick={() => handleSelectRecommendedService(service)}
                  >
                    <h4 className="text-[11px] font-black text-white uppercase mb-2 line-clamp-1">
                      {service.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[9px] text-white/60 mb-1">
                      <UserIcon className="w-3 h-3" />
                      <span>Dr. {service.doctor_name}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[8px] text-white/50">
                        {service.times_used} veces usada
                      </span>
                      <span className="text-emerald-400 font-bold text-xs">
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
      
      {/* Modal de Compra de Servicio */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
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