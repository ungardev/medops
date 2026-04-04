// src/components/Settings/InstitutionFormModal.tsx
import React, { useState } from "react";
import EliteModal from "../Common/EliteModal";
import { XMarkIcon, CloudArrowUpIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import NeighborhoodSearch from "@/components/Address/NeighborhoodSearch";
import { InstitutionSettings } from "@/types/config";
interface InstitutionFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSave: (payload: any) => Promise<any>;
}
export const InstitutionFormModal = ({ open, onClose, initialData, onSave }: InstitutionFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    tax_id: initialData?.tax_id || "",
    address: initialData?.address || "",
    neighborhood: initialData?.neighborhood?.id || null,
    is_active: initialData?.is_active ?? true,
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (logoFile) {
        const data = new FormData();
        data.append("name", formData.name);
        data.append("tax_id", formData.tax_id);
        data.append("address", formData.address);
        if (formData.neighborhood) {
            data.append("neighborhood_id", String(formData.neighborhood));
        }
        data.append("is_active", String(formData.is_active));
        data.append("logo", logoFile);
        await onSave(data);
      } else {
        await onSave({
            ...formData,
            neighborhood_id: formData.neighborhood
        });
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar institución", error);
    } finally {
      setLoading(false);
    }
  };
  
  const inputStyles = `w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30`;
  const labelStyles = `text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block`;
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar Institución' : 'Nueva Institución'}
      subtitle={initialData ? 'Actualizar datos de la institución' : 'Registrar nueva institución'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white/5 border border-white/15 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <BuildingOfficeIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-[11px] font-medium text-emerald-400/80">
              Datos de la Institución
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelStyles}>Nombre de la Organización</label>
              <input 
                className={inputStyles} 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Ej: Clínica Central"
                required
              />
            </div>
            <div>
              <label className={labelStyles}>RIF</label>
              <input 
                className={inputStyles} 
                value={formData.tax_id} 
                onChange={e => setFormData({...formData, tax_id: e.target.value})} 
                placeholder="J-12345678-0"
              />
            </div>
            <div>
              <label className={labelStyles}>Logo</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={e => setLogoFile(e.target.files?.[0] || null)}
                />
                <div className={`${inputStyles} flex items-center gap-2 group-hover:border-white/25 cursor-pointer`}>
                  <CloudArrowUpIcon className="w-4 h-4 text-white/20" />
                  <span className="text-[11px] truncate">
                    {logoFile ? logoFile.name : "Subir logo (PNG transparente)"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/15 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            <h3 className="text-[11px] font-medium text-purple-400/80">
              Ubicación Geográfica
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>Ubicación</label>
              <NeighborhoodSearch 
                value={formData.neighborhood}
                onSelect={(n: any) => setFormData({...formData, neighborhood: n.id})}
              />
            </div>
            <div>
              <label className={labelStyles}>Dirección Física</label>
              <textarea 
                className={`${inputStyles} h-20 resize-none`}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="Calle / Edificio / Consultorio"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-white/15">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium py-2.5 hover:bg-emerald-500/25 transition-all disabled:opacity-50 rounded-lg border border-emerald-500/25"
          >
            {loading ? 'Guardando...' : initialData ? 'Actualizar Cambios' : 'Crear Institución'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </EliteModal>
  );
};