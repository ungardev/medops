// src/pages/Billing/BillingCatalogPage.tsx
import React, { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useBillingCategories, useCreateBillingCategory, useUpdateBillingCategory, useDeleteBillingCategory } from "@/hooks/billing/useBillingCategories";
import { useBillingItems, useCreateBillingItem, useUpdateBillingItem, useDeleteBillingItem } from "@/hooks/billing/useBillingItems";
import type { BillingCategory, BillingItem, BillingCategoryInput, BillingItemInput } from "@/types/billing";
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
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Hooks
  const { data: categories = [], isLoading: loadingCategories } = useBillingCategories();
  const { data: items = [], isLoading: loadingItems } = useBillingItems(activeCategory, searchQuery);
  
  const createCategory = useCreateBillingCategory();
  const updateCategory = useUpdateBillingCategory();
  const deleteCategory = useDeleteBillingCategory();
  
  const createItem = useCreateBillingItem();
  const updateItem = useUpdateBillingItem();
  const deleteItem = useDeleteBillingItem();
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BillingCategory | null>(null);
  const [editingItem, setEditingItem] = useState<BillingItem | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState<BillingCategoryInput>({
    name: "",
    code_prefix: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });
  
  const [itemForm, setItemForm] = useState<BillingItemInput>({
    category: null,
    code: "",
    name: "",
    description: "",
    unit_price: 0,
    currency: "USD",
    sort_order: 0,
    is_active: true,
  });
  
  // Handlers
  const handleOpenCategoryModal = (category?: BillingCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        code_prefix: category.code_prefix,
        description: category.description || "",
        sort_order: category.sort_order,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", code_prefix: "", description: "", sort_order: 0, is_active: true });
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
  
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await deleteCategory.mutateAsync(id);
      notify.success("Categoría eliminada");
    } catch (err) {
      notify.error("Error al eliminar categoría");
    }
  };
  
  const handleOpenItemModal = (item?: BillingItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        category: item.category,
        code: item.code,
        name: item.name,
        description: item.description || "",
        unit_price: item.unit_price,
        currency: item.currency,
        estimated_duration: item.estimated_duration || undefined,
        sort_order: item.sort_order,
        is_active: item.is_active,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        category: activeCategory,
        code: "",
        name: "",
        description: "",
        unit_price: 0,
        currency: "USD",
        sort_order: 0,
        is_active: true,
      });
    }
    setShowItemModal(true);
  };
  
  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, data: itemForm });
        notify.success("Item actualizado");
      } else {
        await createItem.mutateAsync(itemForm);
        notify.success("Item creado");
      }
      setShowItemModal(false);
    } catch (err) {
      notify.error("Error al guardar item");
    }
  };
  
  const handleDeleteItem = async (id: number) => {
    if (!confirm("¿Eliminar este item?")) return;
    try {
      await deleteItem.mutateAsync(id);
      notify.success("Item eliminado");
    } catch (err) {
      notify.error("Error al eliminar item");
    }
  };
  
  const totalItems = categories.reduce((sum, c) => sum + c.items_count, 0);
  const filteredItems = activeCategory 
    ? items 
    : items;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8 bg-black min-h-screen">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "SERVICIOS", active: true }
        ]}
        stats={[
          { label: "CATEGORIAS", value: String(categories.length), color: "text-blue-400" },
          { label: "SERVICIOS", value: String(totalItems), color: "text-emerald-400" },
        ]}
        actions={
          <button
            onClick={() => handleOpenItemModal()}
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
          Todos ({totalItems})
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
            <span className="text-[8px] opacity-60">({cat.items_count})</span>
          </button>
        ))}
        <button
          onClick={() => handleOpenCategoryModal()}
          className="px-3 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-white/5 text-white/30 border border-dashed border-white/20 hover:bg-white/10 hover:text-white transition-all"
        >
          + Cat
        </button>
      </div>
      
      {/* GRID DE ITEMS */}
      {loadingItems ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 animate-pulse border border-white/10" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10">
          <CurrencyDollarIcon className="w-12 h-12 mx-auto text-white/20 mb-4" />
          <p className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
            No hay servicios registrados
          </p>
          <button
            onClick={() => handleOpenItemModal()}
            className="mt-4 px-4 py-2 bg-emerald-600/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
          >
            Agregar Primer Servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white/[0.02] border border-white/10 p-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 border border-blue-500/20">
                    {item.code}
                  </span>
                  {item.category_name && (
                    <span className="text-[7px] font-mono text-white/30 uppercase">
                      {item.category_name}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenItemModal(item)}
                    className="p-1 text-white/40 hover:text-emerald-400 transition-colors"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-[11px] font-bold text-white uppercase tracking-tight mb-2 line-clamp-2">
                {item.name}
              </h3>
              
              {item.description && (
                <p className="text-[9px] text-white/40 line-clamp-2 mb-3">
                  {item.description}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-lg font-black text-emerald-400">
                  ${Number(item.unit_price).toFixed(2)}
                </span>
                <span className="text-[8px] font-mono text-white/30 uppercase">
                  {item.currency}
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
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Prefijo de Código</label>
                <input
                  value={categoryForm.code_prefix}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code_prefix: e.target.value.toUpperCase() })}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none uppercase"
                  placeholder="Ej: CONS"
                  maxLength={10}
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
                disabled={!categoryForm.name || !categoryForm.code_prefix}
                className="flex-1 py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL ITEM */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#0a0a0b]">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white">
                {editingItem ? "Editar_Servicio" : "Nuevo_Servicio"}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-white/40 hover:text-white">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Código</label>
                  <input
                    value={itemForm.code}
                    onChange={(e) => setItemForm({ ...itemForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none uppercase"
                    placeholder="CONS-001"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Categoría</label>
                  <select
                    value={itemForm.category || ""}
                    onChange={(e) => setItemForm({ ...itemForm, category: Number(e.target.value) || null })}
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
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                  placeholder="Consulta General"
                />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Descripción</label>
                <textarea
                  value={itemForm.description || ""}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none min-h-[60px]"
                  placeholder="Descripción del servicio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.unit_price}
                    onChange={(e) => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">Moneda</label>
                  <select
                    value={itemForm.currency}
                    onChange={(e) => setItemForm({ ...itemForm, currency: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white focus:border-emerald-500/50 outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="VES">VES</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.is_active}
                  onChange={(e) => setItemForm({ ...itemForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-[9px] text-white/60">Activo</label>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-white/10">
              <button
                onClick={() => setShowItemModal(false)}
                className="flex-1 py-3 bg-white/5 text-white/60 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!itemForm.code || !itemForm.name}
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
          Tarifario_Institucional // {categories.length} categorías // {totalItems} servicios activos
        </p>
      </div>
    </div>
  );
}