// src/components/Consultation/PrescriptionPanel.tsx
import React, { useState, useCallback } from "react";
import {
  Diagnosis,
  Prescription,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
  PrescriptionComponent,
} from "../../types/consultation";
import { MedicationCatalogItem } from "../../types/medication";
import PrescriptionBadge from "./PrescriptionBadge";
import MedicationSelector from "./MedicationSelector";
import { useUpdatePrescription } from "../../hooks/consultations/useUpdatePrescription";
import { useDeletePrescription } from "../../hooks/consultations/useDeletePrescription";
import { useRecentMedications } from "../../hooks/medications/useRecentMedications";
import { 
  BeakerIcon, 
  PlusIcon, 
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  PencilSquareIcon,
  BoltIcon,
  BeakerIcon as FlaskIcon,
} from "@heroicons/react/24/outline";
interface Option {
  value: string;
  label: string;
}
const frequencyOptions: Option[] = [
  { value: "once_daily", label: "Una vez al día" },
  { value: "bid", label: "2 veces al día (BID)" },
  { value: "tid", label: "3 veces al día (TID)" },
  { value: "qid", label: "4 veces al día (QID)" },
  { value: "q4h", label: "Cada 4 horas" },
  { value: "q6h", label: "Cada 6 horas" },
  { value: "q8h", label: "Cada 8 horas" },
  { value: "q12h", label: "Cada 12 horas" },
  { value: "q24h", label: "Cada 24 horas" },
  { value: "qod", label: "Día por medio" },
  { value: "stat", label: "Una sola vez / Inmediato" },
  { value: "prn", label: "Según necesidad" },
  { value: "hs", label: "Al acostarse" },
  { value: "ac", label: "Antes de las comidas" },
  { value: "pc", label: "Después de las comidas" },
  { value: "achs", label: "Antes de comidas y al acostarse" },
];
const routeOptions: Option[] = [
  { value: "oral", label: "Oral" },
  { value: "iv", label: "Intravenosa (IV)" },
  { value: "im", label: "Intramuscular (IM)" },
  { value: "sc", label: "Subcutánea (SC)" },
  { value: "sublingual", label: "Sublingual" },
  { value: "inhalation", label: "Inhalación" },
  { value: "rectal", label: "Rectal" },
  { value: "topical", label: "Tópica" },
  { value: "other", label: "Otro" },
];
export interface PrescriptionPanelProps {
  diagnoses: Diagnosis[];
  prescriptions?: Prescription[];
  appointmentId?: number;
  readOnly?: boolean;
  onAdd?: (data: CreatePrescriptionInput) => void;
}
const PrescriptionPanel: React.FC<PrescriptionPanelProps> = ({
  diagnoses,
  prescriptions,
  appointmentId,
  readOnly,
  onAdd,
}) => {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [medicationCatalogId, setMedicationCatalogId] = useState<number | undefined>(undefined);
  const [medicationText, setMedicationText] = useState<string | undefined>(undefined);
  const [selectedMedication, setSelectedMedication] = useState<MedicationCatalogItem | null>(null);
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState<UpdatePrescriptionInput["frequency"]>("once_daily");
  const [route, setRoute] = useState<UpdatePrescriptionInput["route"]>("oral");
  const [indications, setIndications] = useState("");
  const [components, setComponents] = useState<PrescriptionComponent[]>([]);
  
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  
  const { mutate: updatePrescription } = useUpdatePrescription();
  const { mutate: deletePrescription } = useDeletePrescription();
  const { addRecent } = useRecentMedications();
  const routeMapping: Record<string, string> = {
    'oral': 'oral',
    'intravenous': 'iv',
    'intramuscular': 'im',
    'subcutaneous': 'sc',
    'sublingual': 'sublingual',
    'inhalation': 'inhalation',
    'rectal': 'rectal',
    'topical': 'topical',
    'ophthalmic': 'topical',
    'otic': 'topical',
    'nasal': 'topical',
  };
  const handleMedicationChange = useCallback((data: { 
    catalogId?: number; 
    text?: string;
    medication?: MedicationCatalogItem;
  }) => {
    setMedicationCatalogId(data.catalogId);
    setMedicationText(data.text);
    
    if (data.medication) {
      setSelectedMedication(data.medication);
      addRecent(data.medication);
      
      if (data.medication.route && data.medication.route !== 'other') {
        const mappedRoute = routeMapping[data.medication.route];
        if (mappedRoute) {
          setRoute(mappedRoute as any);
        }
      }
      
      if (data.medication.generic_name && !isAdvancedMode) {
        setComponents([
          {
            substance: data.medication.generic_name,
            dosage: data.medication.concentration || "",
            unit: (data.medication.unit as any) || "mg"
          }
        ]);
      }
      
      setIsAutofilled(true);
      setTimeout(() => setIsAutofilled(false), 1000);
    } else {
      setSelectedMedication(null);
      setComponents([]);
    }
  }, [addRecent, isAdvancedMode]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || (!medicationCatalogId && !medicationText) || !appointmentId) return;
    
    const payload: CreatePrescriptionInput = {
      appointment: appointmentId,
      diagnosis: Number(diagnosisId),
      medication_catalog: medicationCatalogId || undefined,
      medication_text: medicationText?.trim() || undefined,
      duration: duration.trim() || undefined,
      frequency,
      route,
      indications: indications.trim() || undefined,
      components: components.length > 0 ? components.map((c) => ({
        substance: c.substance.trim(),
        dosage: String(c.dosage),
        unit: c.unit,
      })) : undefined,
    };
    
    onAdd?.(payload);
    
    setDiagnosisId("");
    setMedicationCatalogId(undefined);
    setMedicationText(undefined);
    setSelectedMedication(null);
    setDuration("");
    setFrequency("once_daily");
    setRoute("oral");
    setIndications("");
    setComponents([]);
    setIsAdvancedMode(false);
  };
  const getQuickDuration = (days: number) => {
    setDuration(`${days} días`);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 border-b border-white/15 pb-4">
        <div className="flex items-center gap-3">
          <BeakerIcon className="w-5 h-5 text-emerald-400" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-white">
            Órdenes Farmacológicas
          </span>
        </div>
        {selectedMedication?.source === 'INHRR' && (
          <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/25 flex items-center gap-1">
            <FlaskIcon className="w-4 h-4" />
            CATÁLOGO INHRR
          </span>
        )}
      </div>
      <div className="space-y-6">
        {diagnoses.length === 0 ? (
          <div className="p-8 border border-dashed border-white/15 text-center opacity-50 rounded-lg">
            <span className="text-[11px] text-white/60">Esperando datos de prescripción...</span>
          </div>
        ) : (
          diagnoses.map((d) => (
            <div key={d.id} className="border-l-2 border-white/15 pl-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/25">
                  {d.icd_code}
                </span>
                <h4 className="text-[12px] font-medium text-white/80">
                  {d.title || d.description || "Sin título"}
                </h4>
              </div>
              <div className="grid gap-3 ml-2">
                {d.prescriptions && d.prescriptions.length > 0 ? (
                  d.prescriptions.map((p: Prescription) => (
                    <PrescriptionBadge
                      key={p.id}
                      id={p.id}
                      medication={p.medication_catalog?.name || p.medication_text || "—"}
                      medicationCatalog={p.medication_catalog ? {
                        name: p.medication_catalog.name,
                        presentation: p.medication_catalog.presentation,
                        concentration: p.medication_catalog.concentration,
                        generic_name: p.medication_catalog.generic_name,
                      } : null}
                      isFromCatalog={!!p.medication_catalog}
                      duration={p.duration ?? undefined}
                      frequency={p.frequency}
                      route={p.route}
                      components={p.components || []}
                      indications={p.indications || undefined}
                      issuedAt={p.issued_at || undefined}
                      doctor={p.doctor}
                      institution={p.institution}
                      {...(!readOnly && {
                        onEdit: (id, med, dur, freq, rt, comps) =>
                          updatePrescription({
                            id,
                            medication_text: med,
                            duration: (dur ?? undefined)?.trim() || undefined,
                            frequency: freq,
                            route: rt,
                            components: comps || [],
                          } as UpdatePrescriptionInput),
                        onDelete: (id) => deletePrescription(id),
                      })}
                    />
                  ))
                ) : (
                  <span className="text-[10px] text-white/50 italic pl-2">
                    Sin prescripciones activas
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {!readOnly && diagnoses.length > 0 && appointmentId && (
        <div className="mt-8 pt-6 border-t border-white/15">
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/15 p-5 space-y-5 rounded-lg">
            
            <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Nueva Prescripción</span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className="flex items-center gap-1 text-[10px] font-medium text-white/60 hover:text-emerald-400 uppercase transition-all"
              >
                {isAdvancedMode ? (
                  <>
                    <BoltIcon className="w-4 h-4" /> Modo Rápido
                  </>
                ) : (
                  <>
                    <PencilSquareIcon className="w-4 h-4" /> Modo Avanzado
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider ml-1">
                  Diagnóstico
                </label>
                <select
                  value={diagnosisId}
                  onChange={(e) => setDiagnosisId(Number(e.target.value))}
                  required
                  className="w-full bg-white/5 border border-white/15 px-4 py-2.5 text-[12px] focus:border-emerald-500/50 outline-none appearance-none rounded-lg"
                >
                  <option value="">Seleccionar diagnóstico</option>
                  {diagnoses.map((d) => (
                    <option key={d.id} value={d.id}>
                      [{d.icd_code}] {d.title || d.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider ml-1 flex items-center gap-1">
                  Medicamento
                  {isAutofilled && (
                    <span className="text-[9px] text-emerald-400 animate-pulse flex items-center gap-0.5">
                      <SparklesIcon className="w-3 h-3" /> Auto-completado
                    </span>
                  )}
                </label>
                <MedicationSelector
                  valueCatalogId={medicationCatalogId}
                  valueText={medicationText}
                  onChange={handleMedicationChange}
                />
              </div>
            </div>
            {selectedMedication && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Información del Catálogo
                  </span>
                  <div className="flex gap-1">
                    {selectedMedication.is_controlled && (
                      <span className="text-[8px] font-bold bg-red-500/15 text-red-400 px-2 py-0.5 rounded border border-red-500/25">
                        CONTROLADO
                      </span>
                    )}
                    {selectedMedication.source === 'INHRR' && (
                      <span className="text-[8px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
                        INHRR
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                  {selectedMedication.generic_name && (
                    <div>
                      <span className="text-white/50">Principio activo:</span>
                      <span className="text-white ml-1">{selectedMedication.generic_name}</span>
                    </div>
                  )}
                  {selectedMedication.concentration && (
                    <div>
                      <span className="text-white/50">Concentración:</span>
                      <span className="text-white ml-1">{selectedMedication.concentration}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-white/50">Presentación:</span>
                    <span className="text-white ml-1">{selectedMedication.presentation_display}</span>
                  </div>
                  <div>
                    <span className="text-white/50">Vía:</span>
                    <span className="text-white ml-1">{selectedMedication.route_display}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-white/60">Duración rápida:</span>
              {[7, 10, 14, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => getQuickDuration(days)}
                  className="px-3 py-1.5 text-[10px] bg-white/5 hover:bg-emerald-500/15 border border-white/15 hover:border-emerald-500/30 rounded-lg transition-colors"
                >
                  {days} días
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <DocumentTextIcon className="w-4 h-4" /> Duración
                </label>
                <input
                  type="text"
                  placeholder="Ej: 7 días"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 px-4 py-2.5 text-[12px] outline-none focus:border-emerald-500/50 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" /> Frecuencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/15 px-4 py-2.5 text-[12px] focus:border-emerald-500/50 outline-none rounded-lg"
                >
                  {frequencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <ArrowsRightLeftIcon className="w-4 h-4" /> Vía
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/15 px-4 py-2.5 text-[12px] focus:border-emerald-500/50 outline-none rounded-lg"
                >
                  {routeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {isAdvancedMode && (
              <div className="space-y-4 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider ml-1">
                      Componentes
                    </label>
                    <button
                      type="button"
                      onClick={() => setComponents([...components, { substance: "", dosage: "", unit: "mg" }])}
                      className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:opacity-80 uppercase transition-all"
                    >
                      <PlusIcon className="w-4 h-4" /> Agregar componente
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {components.length === 0 && (
                      <div className="text-center py-4 bg-white/5 border border-dashed border-white/10 rounded-lg">
                        <span className="text-[10px] text-white/50">Sin componentes definidos</span>
                      </div>
                    )}
                    {components.map((comp, index) => (
                      <div key={index} className="flex gap-2 items-center bg-white/5 p-3 border border-white/10 rounded-lg animate-in slide-in-from-left-2 duration-200">
                        <input
                          type="text"
                          placeholder="Sustancia"
                          value={comp.substance}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[index].substance = e.target.value;
                            setComponents(newComps);
                          }}
                          className="flex-1 bg-transparent border-b border-white/15 px-2 py-1.5 text-[11px] outline-none focus:border-emerald-500/50"
                        />
                        <input
                          type="text"
                          placeholder="Dosis"
                          value={comp.dosage}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[index].dosage = e.target.value;
                            setComponents(newComps);
                          }}
                          className="w-16 bg-transparent border-b border-white/15 px-2 py-1.5 text-[11px] outline-none focus:border-emerald-500/50 text-center"
                        />
                        <select
                          value={comp.unit}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[index].unit = e.target.value as any;
                            setComponents(newComps);
                          }}
                          className="bg-transparent border-b border-white/15 px-2 py-1.5 text-[11px] outline-none"
                        >
                          <option value="mg">mg</option>
                          <option value="ml">ml</option>
                          <option value="g">g</option>
                          <option value="tablet">tab</option>
                          <option value="capsule">cap</option>
                          <option value="drop">gtt</option>
                          <option value="unit">UI</option>
                        </select>
                        <button 
                          type="button" 
                          onClick={() => setComponents(components.filter((_, i) => i !== index))} 
                          className="text-red-400/60 hover:text-red-400 p-1 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider ml-1">
                    Indicaciones / Notas
                  </label>
                  <textarea
                    value={indications}
                    onChange={(e) => setIndications(e.target.value)}
                    placeholder="Indicaciones específicas para el paciente..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/15 px-4 py-2.5 text-[12px] outline-none focus:border-emerald-500/50 resize-none rounded-lg"
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.98] rounded-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Generar Prescripción Médica
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default PrescriptionPanel;