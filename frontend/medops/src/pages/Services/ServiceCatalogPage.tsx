// src/pages/Services/ServiceCatalogPage.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { useServiceCategories, useCreateServiceCategory, useUpdateServiceCategory, useDeleteServiceCategory } from "@/hooks/services/useServiceCategories";
import { useDoctorServices, useCreateDoctorService, useUpdateDoctorService, useDeleteDoctorService } from "@/hooks/services/useDoctorServices";
import type { ServiceCategory, DoctorService, ServiceCategoryInput, DoctorServiceInput } from "@/types/services";
import { useNotify } from "@/hooks/useNotify";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  TagIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
export default function ServiceCatalogPage() {
  const notify = useNotify();
  const navigate = useNavigate();
  
  const { data: doctorConfig, isLoading: loadingDoctor } = useDoctorConfig();
  const doctorId = doctorConfig?.id ?? null;
  
  const { institutions, activeInstitution } = useInstitutions();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: categories = [], isLoading: loadingCategories } = useServiceCategories();
  const { data: services = [], isLoading: loadingServices } = useDoctorServices(activeCategory, searchQuery);
  
  const createCategory = useCreateServiceCategory();
  const updateCategory = useUpdateServiceCategory();
  const deleteCategory = useDeleteServiceCategory();
  
  const createService = useCreateDoctorService();
  const updateService = useUpdateDoctorService();
  const deleteService = useDeleteDoctorService();
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingService, setEditingService] = useState<DoctorService | null>(null);
  
  const [categoryForm, setCategoryForm] = useState<ServiceCategoryInput>({
    name: "",
    description: "",
    is_active: true,
  });
  
  const [serviceForm, setServiceForm] = useState<DoctorServiceInput>({
    doctor: doctorId,
    category: null,
    institution: activeInstitution?.id || null,
    code: "",
    name: "",
    description: "",
    price_usd: 0,
    duration_minutes: 30,
    is_active: true,
    is_visible_global: true,
  });
  
  useEffect(() => {
    if (doctorId) {
      setServiceForm(prev => ({ ...prev, doctor: doctorId }));
    }
  }, [doctorId]);
  
  useEffect(() => {
    if (activeInstitution?.id) {
      setServiceForm(prev => ({ ...prev, institution: activeInstitution.id }));
    }
  }, [activeInstitution]);
  
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
        institution: activeInstitution?.id || null,
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
  
  const handleViewDetails = (serviceId: number) => {
    navigate(`/services/${serviceId}`);
  };
  
  const totalServices = categories.reduce((sum, c) => sum + (c.services_count || 0), 0);
  const filteredServices = activeCategory 
    ? services 
    : services;
  
  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Servicios", active: true }
        ]}
        stats={[
          { label: "Categorías", value: String(categories.length), color: "text-blue-400" },
          { label: "Servicios", value: String(totalServices), color: "text-emerald-400" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenServiceModal()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/25 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Nuevo Servicio
            </button>
            <Link
              to="/doctor/manage-services"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-medium rounded-lg hover:bg-amber-500/25 transition-all"
            >
              <EyeIcon className="w-5 h-5" />
              Gestionar Solicitudes
            </Link>
          </div>
        }
      />
      
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all rounded-xl ${
            activeCategory === null
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
              : "bg-white/5 text-white/50 border border-white/15 hover:bg-white/10"
          }`}
        >
          Todos ({totalServices})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 rounded-xl ${
              activeCategory === cat.id
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                : "bg-white/5 text-white/50 border border-white/15 hover:bg-white/10"
            }`}
          >
            {cat.name}
            <span className="text-sm text-white/30">({cat.services_count || 0})</span>
          </button>
        ))}
        <button
          onClick={() => handleOpenCategoryModal()}
          className="px-4 py-3 text-sm font-medium whitespace-nowrap bg-white/5 text-white/30 border border-dashed border-white/20 hover:bg-white/10 hover:text-white/50 transition-all rounded-xl"
        >
          + Categoría
        </button>
      </div>
      
      {loadingServices ? (
        <div className="relative">
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-3 text-white/40">
              <div className="w-5 h-5 border-2 border-emerald-400/50 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando servicios...</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-36 bg-white/5 animate-pulse border border-white/15 rounded-xl" />
            ))}
          </div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/15 rounded-xl">
          <CurrencyDollarIcon className="w-14 h-14 mx-auto text-white/15 mb-5" />
          <p className="text-sm text-white/30">
            No hay servicios registrados
          </p>
          <button
            onClick={() => handleOpenServiceModal()}
            className="mt-5 px-5 py-3 bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 hover:bg-emerald-500/15 transition-all rounded-lg"
          >
            Agregar Primer Servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="group relative bg-white/5 border border-white/15 p-6 hover:border-white/25 transition-all cursor-pointer rounded-xl"
              onClick={() => handleViewDetails(service.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium bg-blue-500/10 text-blue-400 px-3 py-1 border border-blue-500/20 rounded-md">
                    {service.code}
                  </span>
                  {service.category_name && (
                    <span className="text-sm text-white/30">
                      {service.category_name}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenServiceModal(service); }}
                    className="p-2 text-white/30 hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5"
                    title="Editar servicio"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}
                    className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                    title="Eliminar servicio"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(service.id); }}
                    className="p-2 text-white/30 hover:text-blue-400 transition-colors rounded-lg hover:bg-white/5"
                    title="Ver detalles y horarios"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-base font-medium text-white/80 mb-2 line-clamp-2">
                {service.name}
              </h3>
              
              {service.description && (
                <p className="text-sm text-white/30 line-clamp-2 mb-4">
                  {service.description}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-2xl font-semibold text-emerald-400">
                  ${Number(service.price_usd).toFixed(2)}
                </span>
                <span className="text-sm text-white/30">
                  USD
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-md rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/15 bg-white/5">
              <h3 className="text-base font-semibold text-white">
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Nombre</label>
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none rounded-lg placeholder:text-white/30"
                  placeholder="Ej: Consultas"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Descripción</label>
                <textarea
                  value={categoryForm.description || ""}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none min-h-[80px] rounded-lg placeholder:text-white/30"
                  placeholder="Descripción opcional..."
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label className="text-sm text-white/60">Activo</label>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-5 border-t border-white/15 bg-white/5">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 py-3 bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-all rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!categoryForm.name}
                className="flex-1 py-3 bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-emerald-500/25"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/15 bg-white/5 sticky top-0">
              <h3 className="text-base font-semibold text-white">
                {editingService ? "Editar Servicio" : "Nuevo Servicio"}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Código</label>
                  <input
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none uppercase rounded-lg placeholder:text-white/30"
                    placeholder="CONS-001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Categoría</label>
                  <select
                    value={serviceForm.category || ""}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: Number(e.target.value) || null })}
                    className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none rounded-lg"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Institución</label>
                <select
                  value={serviceForm.institution || ""}
                  onChange={(e) => setServiceForm({ ...serviceForm, institution: Number(e.target.value) || null })}
                  className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none rounded-lg"
                >
                  <option value="">Global (Todas)</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Nombre del Servicio</label>
                <input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none rounded-lg placeholder:text-white/30"
                  placeholder="Consulta General"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Descripción</label>
                <textarea
                  value={serviceForm.description || ""}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none min-h-[80px] rounded-lg placeholder:text-white/30"
                  placeholder="Descripción del servicio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Precio (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.price_usd}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_usd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none rounded-lg"
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block">Duración (min)</label>
                  <input
                    type="number"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full bg-white/5 border border-white/15 p-4 text-sm text-white/80 focus:border-emerald-500/50 outline-none rounded-lg"
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={serviceForm.is_active}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label className="text-sm text-white/60">Activo</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={serviceForm.is_visible_global}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_visible_global: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label className="text-sm text-white/60">Visible en catálogo global</label>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-5 border-t border-white/15 bg-white/5">
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 py-3 bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-all rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveService}
                disabled={!serviceForm.code || !serviceForm.name}
                className="flex-1 py-3 bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-emerald-500/25"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-8 border-t border-white/10 text-center">
        <p className="text-sm text-white/20">
          {categories.length} categorías · {totalServices} servicios activos
        </p>
      </div>
    </div>
  );
}