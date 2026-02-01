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
      console.error("DATA_SYNC_FAILED", error);
    } finally {
      setLoading(false);
    }
  };
  const inputStyles = `w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all`;
  const labelStyles = `text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block`;
  const sectionStyles = "bg-[#0a0a0a] border border-white/10 rounded-sm p-4 space-y-4";
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title="INSTITUTION_NODE_MANAGER"
      subtitle={initialData ? 'UPDATE_EXISTING_IDENTITY_NODE' : 'INITIALIZE_NEW_INSTITUTION_NODE'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={sectionStyles}>
          <div className="flex items-center gap-2 mb-4">
            <BuildingOfficeIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">
              INSTITUTION_IDENTITY_PROTOCOL
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelStyles}>ORGANIZATION_NAME_IDENTIFIER</label>
              <input 
                className={inputStyles} 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="CLINICA_CENTRAL"
                required
              />
            </div>
            <div>
              <label className={labelStyles}>FISCAL_TAX_IDENTIFIER</label>
              <input 
                className={inputStyles} 
                value={formData.tax_id} 
                onChange={e => setFormData({...formData, tax_id: e.target.value})} 
                placeholder="J-12345678-0"
              />
            </div>
            <div>
              <label className={labelStyles}>INSTITUTION_LOGO_ASSET</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={e => setLogoFile(e.target.files?.[0] || null)}
                />
                <div className={`${inputStyles} flex items-center gap-2 group-hover:border-white/30 cursor-pointer`}>
                  <CloudArrowUpIcon className="w-4 h-4 text-white/20" />
                  <span className="text-[10px] truncate font-mono">
                    {logoFile ? logoFile.name : "UPLOAD_PNG_TRANSPARENT_ASSET"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={sectionStyles}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-400">
              GEOGRAPHIC_NODE_CONFIGURATION
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={labelStyles}>GEOGRAPHIC_HIERARCHY_SELECTOR</label>
              <NeighborhoodSearch 
                value={formData.neighborhood}
                onSelect={(n: any) => setFormData({...formData, neighborhood: n.id})}
              />
            </div>
            <div>
              <label className={labelStyles}>PHYSICAL_ADDRESS_VECTOR</label>
              <textarea 
                className={`${inputStyles} h-20 resize-none`}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="STREET_NAME / BUILDING_IDENTIFIER / OFFICE_NUMBER"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4 pt-6 border-t border-white/10">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-emerald-500 text-black text-[10px] font-black py-4 uppercase tracking-[0.3em] hover:bg-emerald-400 transition-all disabled:opacity-50 font-mono"
          >
            {loading ? 'SYNCHRONIZING_WITH_MAINFRAME...' : 'COMMIT_INSTITUTION_CHANGES'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="px-8 text-[10px] font-black uppercase text-white/20 hover:text-white font-mono"
          >
            ABORT_OPERATION
          </button>
        </div>
      </form>
    </EliteModal>
  );
};