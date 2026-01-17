// src/components/Settings/InstitutionFormModal.tsx
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import NeighborhoodSearch from "@/components/Address/NeighborhoodSearch";
import { InstitutionSettings } from "@/types/config";

interface InstitutionFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  // ✅ Ajustado para coincidir con lo que el hook espera (Multipart o JSON)
  onSave: (payload: any) => Promise<any>;
}

export const InstitutionFormModal = ({ open, onClose, initialData, onSave }: InstitutionFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    tax_id: initialData?.tax_id || "",
    address: initialData?.address || "",
    neighborhood: initialData?.neighborhood?.id || null, // Guardamos solo el ID
    is_active: initialData?.is_active ?? true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (logoFile) {
        // ✅ Si hay archivo, enviamos FormData obligatoriamente
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
        // ✅ Si no hay archivo, enviamos un objeto limpio (JSON)
        await onSave({
            ...formData,
            neighborhood_id: formData.neighborhood // Mapeo para el backend
        });
      }
      onClose();
    } catch (error) {
      console.error("DATA_SYNC_FAILED", error);
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = `w-full bg-black/60 border border-white/10 rounded-sm px-4 py-3 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all`;
  const labelStyles = `text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block`;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-[#050505] border border-white/10 shadow-2xl relative">
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <div>
              <Dialog.Title className="text-xs font-black text-white uppercase tracking-[0.4em]">
                {initialData ? 'Update_Identity_Node' : 'Initialize_New_Node'}
              </Dialog.Title>
              <p className="text-[9px] font-mono text-white/20 mt-1">CORE_REGISTRY_PROTOCOL_v2.1</p>
            </div>
            <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className={labelStyles}>Organization_Name</label>
                <input 
                  className={inputStyles} 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="E.g., CLINICA CENTRAL"
                  required
                />
              </div>

              <div>
                <label className={labelStyles}>Fiscal_Tax_ID</label>
                <input 
                  className={inputStyles} 
                  value={formData.tax_id} 
                  onChange={e => setFormData({...formData, tax_id: e.target.value})} 
                  placeholder="J-12345678-0"
                />
              </div>

              <div>
                <label className={labelStyles}>Node_Logo_Import</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={e => setLogoFile(e.target.files?.[0] || null)}
                  />
                  <div className={inputStyles + " flex items-center gap-2 group-hover:border-white/30"}>
                    <CloudArrowUpIcon className="w-4 h-4 text-white/20" />
                    <span className="text-[10px] truncate">
                      {logoFile ? logoFile.name : "Upload_PNG_Transparent"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className={labelStyles}>Geographic_Node_Hierarchy</label>
                <NeighborhoodSearch 
                  value={formData.neighborhood}
                  onSelect={(n: any) => setFormData({...formData, neighborhood: n.id})}
                />
              </div>

              <div>
                <label className={labelStyles}>Physical_Address_Vector</label>
                <textarea 
                  className={`${inputStyles} h-20 resize-none`}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="STREET_NAME / BUILDING / OFFICE_NUMBER"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-white text-black text-[10px] font-black py-4 uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
              >
                {loading ? 'SYNCING_WITH_MAINFRAME...' : 'Commit_Changes'}
              </button>
              <button 
                type="button" 
                onClick={onClose}
                className="px-8 text-[10px] font-black uppercase text-white/20 hover:text-white"
              >
                Abort
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
