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
import { useLocationData } from "../../hooks/settings/useLocationData";
import FieldSelect from "./FieldSelect";
interface Props {
  open: boolean;
  onClose: () => void;
  institution?: any;
}
export default function EditInstitutionModal({ open, onClose, institution }: Props) {
  const { data: settings, updateInstitution, isUpdating } = useInstitutionSettings();
  const { createNeighborhood, useCountries, useStates, useMunicipalities, useParishes, useNeighborhoods } = useLocationData();
  
  const dataSource = institution || settings;
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    tax_id: "",
    address: "",
    countryId: null as number | null,
    stateId: null as number | null,
    municipalityId: null as number | null,
    parishId: null as number | null,
    neighborhoodId: null as number | null,
    neighborhoodName: "" as string,
    logo: null as File | null
  });
  
  const logoPreview = dataSource?.logo && typeof dataSource.logo === 'string' 
    ? dataSource.logo 
    : null;
  
  const countriesResult = useCountries();
  const statesResult = useStates(formData.countryId);
  const municipalitiesResult = useMunicipalities(formData.stateId);
  const parishesResult = useParishes(formData.municipalityId);
  const neighborhoodsResult = useNeighborhoods(formData.parishId);
  
  const countries = countriesResult.data || [];
  const states = statesResult.data || [];
  const municipalities = municipalitiesResult.data || [];
  const parishes = parishesResult.data || [];
  const neighborhoods = neighborhoodsResult.data || [];
  
  const isLoadingAny = Boolean(
    countriesResult.isLoading || 
    statesResult.isLoading || 
    municipalitiesResult.isLoading || 
    parishesResult.isLoading || 
    neighborhoodsResult.isLoading
  );
  useEffect(() => {
    if (open && dataSource) {
      const neighborhood = dataSource.neighborhood;
      setFormData({
        name: dataSource.name || "",
        phone: dataSource.phone || "",
        tax_id: dataSource.tax_id || "",
        address: dataSource.address || "",
        countryId: (neighborhood as any)?.parish?.municipality?.state?.country?.id || null,
        stateId: (neighborhood as any)?.parish?.municipality?.state?.id || null,
        municipalityId: (neighborhood as any)?.parish?.municipality?.id || null,
        parishId: (neighborhood as any)?.parish?.id || null,
        neighborhoodId: (neighborhood as any)?.id || null,
        neighborhoodName: (neighborhood as any)?.name || "",
        logo: null
      });
    }
  }, [open, dataSource]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
    }
  };
  const handleCountryChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, countryId: id, stateId: null, municipalityId: null, parishId: null, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleStateChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, stateId: id, municipalityId: null, parishId: null, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleMunicipalityChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, municipalityId: id, parishId: null, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleParishChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, parishId: id, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleNeighborhoodChange = (val: string) => {
    const existingNeighborhood = neighborhoods.find(n => n.name.toLowerCase() === val.toLowerCase());
    if (existingNeighborhood) {
      setFormData(prev => ({ ...prev, neighborhoodId: existingNeighborhood.id, neighborhoodName: val }));
    } else {
      setFormData(prev => ({ ...prev, neighborhoodId: null, neighborhoodName: val }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.countryId || !formData.stateId || !formData.municipalityId || !formData.parishId || !formData.neighborhoodName.trim()) {
      console.error("Faltan campos requeridos");
      return;
    }
    
    try {
      let finalNeighborhoodId: number;
      
      if (formData.neighborhoodId) {
        finalNeighborhoodId = formData.neighborhoodId;
      } else {
        const newNB = await createNeighborhood(formData.neighborhoodName.trim(), formData.parishId);
        finalNeighborhoodId = newNB.id;
      }
      
      await updateInstitution({
        name: formData.name,
        phone: formData.phone,
        tax_id: formData.tax_id,
        address: formData.address,
        neighborhood: finalNeighborhoodId,
        logo: formData.logo
      });
      
      onClose();
    } catch (err) {
      console.error("Error al actualizar institución:", err);
    }
  };
  const inputStyles = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelStyles = "text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block";
  const sectionStyles = "bg-white/5 border border-white/15 rounded-lg p-5 space-y-4";
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <GlobeAltIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-white">
                Editar Institución
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">Actualizar datos de la institución</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {isLoadingAny && (
            <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 rounded-lg">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[11px] text-blue-400/80">
                Cargando datos geográficos...
              </span>
            </div>
          )}
          
          <div className={sectionStyles}>
            <div className="flex items-center gap-3 mb-4">
              <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-[11px] font-medium text-emerald-400/80">
                Logo de la Institución
              </h3>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative group w-32 h-32 border border-white/15 bg-white/5 p-2 overflow-hidden rounded-lg">
                {logoPreview ? (
                  <img 
                    src={logoPreview}
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
                Datos de Identidad
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Nombre del Centro</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className={inputStyles}
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Teléfono</label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className={inputStyles}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>RIF</label>
                <input 
                  type="text"
                  value={formData.tax_id}
                  onChange={e => setFormData({...formData, tax_id: e.target.value})}
                  className={`${inputStyles} font-medium`}
                />
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              <h3 className="text-[11px] font-medium text-purple-400/80">
                Ubicación Geográfica
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <FieldSelect
                  label="País"
                  value={formData.countryId}
                  options={countries}
                  onChange={handleCountryChange}
                  disabled={false}
                  loading={countriesResult.isLoading}
                />
              </div>
              
              <div>
                <FieldSelect
                  label="Estado"
                  value={formData.stateId}
                  options={states}
                  onChange={handleStateChange}
                  disabled={!formData.countryId}
                  loading={statesResult.isLoading}
                />
              </div>
              
              <div>
                <FieldSelect
                  label="Municipio"
                  value={formData.municipalityId}
                  options={municipalities}
                  onChange={handleMunicipalityChange}
                  disabled={!formData.stateId}
                  loading={municipalitiesResult.isLoading}
                />
              </div>
              
              <div>
                <FieldSelect
                  label="Parroquia"
                  value={formData.parishId}
                  options={parishes}
                  onChange={handleParishChange}
                  disabled={!formData.municipalityId}
                  loading={parishesResult.isLoading}
                />
              </div>
              
              <div className={(!formData.parishId || neighborhoodsResult.isLoading) ? 'opacity-40' : 'opacity-100'}>
                <label className={labelStyles}>Urbanización</label>
                <input
                  list="neighborhood-options"
                  value={formData.neighborhoodName}
                  disabled={!formData.parishId || neighborhoodsResult.isLoading}
                  onChange={(e) => handleNeighborhoodChange(e.target.value)}
                  placeholder={!formData.parishId ? "—" : "Seleccionar..."}
                  className={inputStyles}
                />
                <datalist id="neighborhood-options">
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <label className={labelStyles}>Dirección</label>
            <textarea 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              rows={3}
              className={`${inputStyles} h-20 resize-none`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/15 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              formData.countryId && formData.stateId && formData.municipalityId && 
              formData.parishId && formData.neighborhoodName 
                ? 'bg-emerald-400' 
                : 'bg-amber-400 animate-pulse'
            }`} />
            <span className="text-[9px] text-white/30">
              {formData.countryId && formData.stateId && formData.municipalityId && 
               formData.parishId && formData.neighborhoodName 
                ? 'Ubicación completa' 
                : 'Ubicación incompleta'}
            </span>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isUpdating || !formData.countryId || !formData.stateId || 
                       !formData.municipalityId || !formData.parishId || !formData.neighborhoodName.trim()}
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
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}