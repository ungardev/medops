// src/components/Settings/EditInstitutionModal.tsx
import React, { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  ArrowPathIcon, 
  ShieldCheckIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import { useInstitutionSettings } from "../../hooks/settings/useInstitutionSettings";

interface Props {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  institution?: any;
}

export default function EditInstitutionModal({ open, onClose, institution }: Props) {
  const { data: settings, updateInstitution, isUpdating } = useInstitutionSettings();
  
  const dataSource = institution || settings;
  
  const [formData, setFormData] = useState({
    logo: null as File | null
  });

  const logoPreview = dataSource?.logo && typeof dataSource.logo === 'string' 
    ? dataSource.logo 
    : null;

  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({ logo: null });
      setNewLogoPreview(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.logo) {
      console.error("Selecciona una imagen");
      return;
    }
    
    try {
      await updateInstitution({
        logo: formData.logo,
        institutionId: dataSource?.id
      });
      
      onClose();
    } catch (err) {
      console.error("Error al actualizar institución:", err);
    }
  };

  const sectionStyles = "bg-white/5 border border-white/15 rounded-lg p-5 space-y-4";
  const readOnlyTextStyles = "text-[12px] text-white/70";

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <GlobeAltIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-white">
                Editar Logo de la Institución
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">Subir nuevo logo para la institución</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div className={sectionStyles}>
              <div className="flex items-center gap-3 mb-4">
                <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-[11px] font-medium text-emerald-400/80">
                  Logo de la Institución
                </h3>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative group w-32 h-32 border border-white/15 bg-white/5 p-2 overflow-hidden rounded-lg">
                  {(newLogoPreview || logoPreview) ? (
                    <img 
                      src={newLogoPreview || logoPreview || ""}
                      alt="Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <BuildingOfficeIcon className="w-12 h-12 text-white/20" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-emerald-500/30 rounded-lg">
                    <span className="text-[10px] font-medium text-white/80">Cambiar</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-white/30">ID: {dataSource?.id || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className={sectionStyles}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <h3 className="text-[11px] font-medium text-blue-400/80">
                  Datos de la Institución
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 space-y-3">
                <div>
                  <label className={labelStyles}>Nombre del Centro</label>
                  <p className={readOnlyTextStyles}>{dataSource?.name || 'No disponible'}</p>
                </div>
                <div>
                  <label className={labelStyles}>RIF</label>
                  <p className={`${readOnlyTextStyles} font-medium`}>{dataSource?.tax_id || 'No disponible'}</p>
                </div>
                <div>
                  <label className={labelStyles}>Teléfono</label>
                  <p className={readOnlyTextStyles}>{dataSource?.phone || 'No disponible'}</p>
                </div>
                <div>
                  <label className={labelStyles}>Dirección</label>
                  <p className={readOnlyTextStyles}>{dataSource?.address || 'No disponible'}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[9px] text-white/30 italic">
                  Los datos de la institución solo pueden ser editados desde Django Admin.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-white/15 bg-white/5">
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isUpdating || !formData.logo}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-medium text-white bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="w-4 h-4" />
                    Guardar Logo
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}