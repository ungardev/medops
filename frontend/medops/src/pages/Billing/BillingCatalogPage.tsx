// src/pages/Billing/BillingCatalogPage.tsx
import React, { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useServiceCategories, useCreateServiceCategory, useUpdateServiceCategory, useDeleteServiceCategory } from "@/hooks/services/useServiceCategories";
import { useDoctorServices, useCreateDoctorService, useUpdateDoctorService, useDeleteDoctorService } from "@/hooks/services/useDoctorServices";
import type { ServiceCategory, DoctorService, ServiceCategoryInput, DoctorServiceInput } from "@/types/services";
import { useNotify } from "@/hooks/useNotify";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
export default function BillingCatalogPage() {
  const notify = useNotify();
  
  // Obtener ID del doctor desde localStorage
  const [doctorId, setDoctorId] = useState<number | null>(null);
  
  useEffect(() => {
    // Intentar obtener el ID del doctor desde diferentes claves de localStorage
    const storedDoctorId = localStorage.getItem('doctor_id') || 
                          localStorage.getItem('doctorId') || 
                          localStorage.getItem('user_id') ||
                          localStorage.getItem('userId');
    
    if (storedDoctorId) {
      setDoctorId(parseInt(storedDoctorId, 10));
    } else {
      // Si no hay ID en localStorage, intentar obtenerlo desde useDoctorConfig
      // Opcional: puedes implementar esto si es necesario
      console.warn('No se encontró doctor_id en localStorage');
    }
  }, []);
  
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Hooks actualizados
  const { data: categories = [], isLoading: loadingCategories } = useServiceCategories();
  const { data: services = [], isLoading: loadingServices } = useDoctorServices(activeCategory, searchQuery);
  
  const createCategory = useCreateServiceCategory();
  const updateCategory = useUpdateServiceCategory();
  const deleteCategory = useDeleteServiceCategory();
  
  const createService = useCreateDoctorService();
  const updateService = useUpdateDoctorService();
  const deleteService = useDeleteDoctorService();
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingService, setEditingService] = useState<DoctorService | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState<ServiceCategoryInput>({
    name: "",
    description: "",
    is_active: true,
  });
  
  const [serviceForm, setServiceForm] = useState<DoctorServiceInput>({
    doctor: doctorId, // Usar el ID obtenido desde localStorage
    category: null,
    institution: null,
    code: "",
    name: "",
    description: "",
    price_usd: 0,
    duration_minutes: 30,
    is_active: true,
    is_visible_global: true,
  });
  
  // Actualizar serviceForm cuando cambie doctorId
  useEffect(() => {
    if (doctorId) {
      setServiceForm(prev => ({ ...prev, doctor: doctorId }));
    }
  }, [doctorId]);
  
  // Handlers para categorías (similares a antes)
  const handleOpenCategoryModal = (category?: ServiceCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", is_active: true });
    }
    setShowCategoryModal(true);
  };
  
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data: categoryForm });
        notify.success("Categoría actualizada");
      } else {
        await createCategory.mutateAsync(categoryForm);
        notify.success("Categoría creada");
      }
      setShowCategoryModal(false);
    } catch (err) {
      notify.error("Error al guardar categoría");
    }
  };
  
  // Handlers para servicios (nuevos)
  const handleOpenServiceModal = (service?: DoctorService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        doctor: service.doctor,
        category: service.category,
        institution: service.institution,
        code: service.code,
        name: service.name,
        description: service.description || "",
        price_usd: service.price_usd,
        duration_minutes: service.duration_minutes,
        is_active: service.is_active,
        is_visible_global: service.is_visible_global,
      });
    } else {
      setEditingService(null);
      setServiceForm({
        doctor: doctorId,
        category: activeCategory,
        institution: null,
        code: "",
        name: "",
        description: "",
        price_usd: 0,
        duration_minutes: 30,
        is_active: true,
        is_visible_global: true,
      });
    }
    setShowServiceModal(true);
  };
  
  const handleSaveService = async () => {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, data: serviceForm });
        notify.success("Servicio actualizado");
      } else {
        await createService.mutateAsync(serviceForm);
        notify.success("Servicio creado");
      }
      setShowServiceModal(false);
    } catch (err) {
      notify.error("Error al guardar servicio");
    }
  };
  
  const handleDeleteService = async (id: number) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try {
      await deleteService.mutateAsync(id);
      notify.success("Servicio eliminado");
    } catch (err) {
      notify.error("Error al eliminar servicio");
    }
  };
  
  const totalServices = categories.reduce((sum, c) => sum + (c.services_count || 0), 0);
  const filteredServices = activeCategory 
    ? services 
    : services;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "SERVICIOS", active: true }
        ]}
        stats={[
          { label: "CATEGORIAS", value: String(categories.length), color: "text-blue-400" },
          { label: "SERVICIOS", value: String(totalServices), color: "text-emerald-400" },
        ]}
        actions={
          <button
            onClick={() => handleOpenServiceModal()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest transition-all"
          >
            <PlusIcon className="w-4 h-4" /> Nuevo_Servicio
          </button>
        }
      />
      
      {/* TABS DE CATEGORÍAS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
            activeCategory === null
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
          }`}
        >
          Todos ({totalServices})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategory === cat.id
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            {cat.name}
            <span className="text-[8px] opacity-60">({cat.services_count || 0})</span>
          </button>
        ))}
        <button
          onClick={() => handleOpenCategoryModal()}
          className="px-3 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-white/5 text-white/30 border border-dashed border-white/20 hover:bg-white/10 hover:text-white transition-all"
        >
          + Cat
        </button>
      </div>
      
      {/* GRID DE SERVICIOS */}
      {loadingServices ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10">
          <CurrencyDollarIcon className="w-12 h-12 mx-auto text-white/20 mb-4" />
          <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            No hay servicios registrados
          </p>
          <button
            onClick={() => handleOpenServiceModal()}
            className="mt-4 px-4 py-2 bg-emerald-600/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
          >
            Agregar Primer Servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="group relative bg-white/[0.02] border border-white/10 p-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 border border-blue-500/20">
                    {service.code}
                  </span>
                  {service.category_name && (
                    <span className="text-[7px] font-mono text-white/30 uppercase">
                      {service.category_name}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenServiceModal(service)}
                    className="p-1 text-white/40 hover:text-emerald-400 transition-colors"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="p-1 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-[11px] font-bold text-white uppercase tracking-tight mb-2 line-clamp-2">
                {service.name}
              </h3>
              
              {service.description && (
                <p className="text-[9px] text-white/40 line-clamp-2 mb-3">
                  {service.description}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-lg font-black text-emerald-400">
                  ${Number(service.price_usd).toFixed(2)}
                </span>
                <span className="text-[8px] font-mono text-white/30 uppercase">
                  USD
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* MODAL CATEGORÍA */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white">
                {editingCategory ? "Editar_Categoría" : "Nueva_Categoría"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-white/40 hover:text-white">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Nombre</label>
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                  placeholder="Ej: Consultas"
                />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Descripción</label>
                <textarea
                  value={categoryForm.description || ""}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none min-h-[60px]"
                  placeholder="Descripción opcional..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-[9px] text-white/60">Activo</label>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-white/10">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 py-3 bg-white/5 text-white/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!categoryForm.name}
                className="flex-1 py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL SERVICIO */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#0a0a0b]">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white">
                {editingService ? "Editar_Servicio" : "Nuevo_Servicio"}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-white/40 hover:text-white">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Código</label>
                  <input
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none uppercase"
                    placeholder="CONS-001"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Categoría</label>
                  <select
                    value={serviceForm.category || ""}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: Number(e.target.value) || null })}
                    className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Nombre del Servicio</label>
                <input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                  placeholder="Consulta General"
                />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Descripción</label>
                <textarea
                  value={serviceForm.description || ""}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none min-h-[60px]"
                  placeholder="Descripción del servicio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Precio (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.price_usd}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Duración (min)</label>
                  <input
                    type="number"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={serviceForm.is_active}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-[9px] text-white/60">Activo</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={serviceForm.is_visible_global}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_visible_global: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-[9px] text-white/60">Visible en catálogo global</label>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-white/10">
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 py-3 bg-white/5 text-white/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveService}
                disabled={!serviceForm.code || !serviceForm.name}
                className="flex-1 py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* FOOTER */}
      <div className="pt-8 border-t border-white/5 text-center">
        <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">
          Tarifario_Institucional // {categories.length} categorías // {totalServices} servicios activos
        </p>
      </div>
    </div>
  );
}