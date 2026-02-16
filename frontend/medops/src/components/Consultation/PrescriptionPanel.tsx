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
  // Estados del formulario
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [medicationCatalogId, setMedicationCatalogId] = useState<number | undefined>(undefined);
  const [medicationText, setMedicationText] = useState<string | undefined>(undefined);
  const [selectedMedication, setSelectedMedication] = useState<MedicationCatalogItem | null>(null);
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState<UpdatePrescriptionInput["frequency"]>("once_daily");
  const [route, setRoute] = useState<UpdatePrescriptionInput["route"]>("oral");
  const [indications, setIndications] = useState("");
  const [components, setComponents] = useState<PrescriptionComponent[]>([]);
  
  // UI States
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  
  const { mutate: updatePrescription } = useUpdatePrescription();
  const { mutate: deletePrescription } = useDeletePrescription();
  const { addRecent } = useRecentMedications();
  // Mapa de rutas del backend a frontend
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
  // Auto-fill cuando se selecciona del catálogo
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
      
      // Auto-fill route si viene del catálogo
      if (data.medication.route && data.medication.route !== 'other') {
        const mappedRoute = routeMapping[data.medication.route];
        if (mappedRoute) {
          setRoute(mappedRoute as any);
        }
      }
      
      // Auto-fill componentes si hay generic_name
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
    
    // Reset form
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
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-6 border-b border-[var(--palantir-border)] pb-4">
        <div className="flex items-center gap-2">
          <BeakerIcon className="w-5 h-5 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
            Pharmacological_Orders
          </span>
        </div>
        {selectedMedication?.source === 'INHRR' && (
          <span className="text-[8px] font-black bg-[var(--palantir-active)]/20 text-[var(--palantir-active)] px-2 py-1 rounded border border-[var(--palantir-active)]/30 flex items-center gap-1">
            <FlaskIcon className="w-3 h-3" />
            CATÁLOGO INHRR OFICIAL
          </span>
        )}
      </div>
      {/* RENDER DIAGNOSES AND THEIR PRESCRIPTIONS */}
      <div className="space-y-6">
        {diagnoses.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--palantir-border)] text-center opacity-40">
            <span className="text-[10px] font-mono uppercase italic">Awaiting_Prescription_Data...</span>
          </div>
        ) : (
          diagnoses.map((d) => (
            <div key={d.id} className="border-l border-[var(--palantir-border)] pl-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] px-2 py-0.5 rounded text-[9px] font-black font-mono border border-[var(--palantir-active)]/20">
                  {d.icd_code}
                </span>
                <h4 className="text-[11px] font-bold uppercase tracking-tight text-[var(--palantir-text)] opacity-80">
                  {d.title || d.description || "Untitled_Condition"}
                </h4>
              </div>
              <div className="grid gap-2 ml-4">
                {d.prescriptions && d.prescriptions.length > 0 ? (
                  d.prescriptions.map((p: Prescription) => (
                    <PrescriptionBadge
                      key={p.id}
                      id={p.id}
                      medication={p.medication_catalog?.name || p.medication_text || "—"}
                      duration={p.duration ?? undefined}
                      frequency={p.frequency}
                      route={p.route}
                      components={p.components}
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
                  <span className="text-[9px] font-mono uppercase text-[var(--palantir-muted)] italic pl-2">
                    // No_Active_Prescriptions
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* NEW PRESCRIPTION FORM */}
      {!readOnly && diagnoses.length > 0 && appointmentId && (
        <div className="mt-10 pt-6">
          <form onSubmit={handleSubmit} className="bg-white/5 border border-[var(--palantir-border)] p-5 space-y-5 rounded-sm shadow-xl">
            
            {/* FORM HEADER */}
            <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-[var(--palantir-active)]" />
                <span className="text-[9px] font-black uppercase tracking-widest">New_Prescription_Draft</span>
              </div>
              
              {/* Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                className="flex items-center gap-1 text-[8px] font-black text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] uppercase transition-all"
              >
                {isAdvancedMode ? (
                  <>
                    <BoltIcon className="w-3 h-3" /> Modo Rápido
                  </>
                ) : (
                  <>
                    <PencilSquareIcon className="w-3 h-3" /> Modo Avanzado
                  </>
                )}
              </button>
            </div>
            {/* Diagnosis & Medication Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">
                  Condition_Reference
                </label>
                <select
                  value={diagnosisId}
                  onChange={(e) => setDiagnosisId(Number(e.target.value))}
                  required
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] px-4 py-2.5 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none appearance-none text-[var(--palantir-text)]"
                >
                  <option value="">SELECT_DIAGNOSIS</option>
                  {diagnoses.map((d) => (
                    <option key={d.id} value={d.id} className="bg-gray-900">
                      [{d.icd_code}] {d.title || d.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1 flex items-center gap-1">
                  Agent_Selector
                  {isAutofilled && (
                    <span className="text-[7px] text-green-400 animate-pulse flex items-center gap-0.5">
                      <SparklesIcon className="w-3 h-3" /> Auto-filled
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
            {/* Medication Info Display (if selected from catalog) */}
            {selectedMedication && (
              <div className="bg-[var(--palantir-active)]/5 border border-[var(--palantir-active)]/20 rounded p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-[var(--palantir-active)] uppercase tracking-wider">
                    Información del Catálogo
                  </span>
                  <div className="flex gap-1">
                    {selectedMedication.is_controlled && (
                      <span className="text-[7px] font-black bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                        CONTROLADO
                      </span>
                    )}
                    {selectedMedication.source === 'INHRR' && (
                      <span className="text-[7px] font-black bg-[var(--palantir-active)]/20 text-[var(--palantir-active)] px-1.5 py-0.5 rounded">
                        INHRR OFICIAL
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                  {selectedMedication.generic_name && (
                    <div>
                      <span className="text-[var(--palantir-muted)]">Principio activo:</span>
                      <span className="text-white ml-1">{selectedMedication.generic_name}</span>
                    </div>
                  )}
                  {selectedMedication.concentration && (
                    <div>
                      <span className="text-[var(--palantir-muted)]">Concentración:</span>
                      <span className="text-white ml-1">{selectedMedication.concentration}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--palantir-muted)]">Presentación:</span>
                    <span className="text-white ml-1">{selectedMedication.presentation_display}</span>
                  </div>
                  <div>
                    <span className="text-[var(--palantir-muted)]">Vía:</span>
                    <span className="text-white ml-1">{selectedMedication.route_display}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Quick Duration Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase text-[var(--palantir-muted)]">Rápido:</span>
              {[7, 10, 14, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => getQuickDuration(days)}
                  className="px-2 py-1 text-[9px] bg-white/5 hover:bg-[var(--palantir-active)]/20 border border-white/10 hover:border-[var(--palantir-active)]/30 rounded transition-colors"
                >
                  {days} días
                </button>
              ))}
            </div>
            {/* Dosage Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1 flex items-center gap-1">
                  <DocumentTextIcon className="w-3 h-3" /> Time_Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7_DAYS"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] px-4 py-2.5 text-[11px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" /> Frequency_Interval
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] px-4 py-2.5 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none text-[var(--palantir-text)]"
                >
                  {frequencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.label.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1 flex items-center gap-1">
                  <ArrowsRightLeftIcon className="w-3 h-3" /> Admin_Route
                </label>
                <select
                  value={route}
                  onChange={(e) => setRoute(e.target.value as any)}
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] px-4 py-2.5 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none text-[var(--palantir-text)]"
                >
                  {routeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                      {opt.label.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* ADVANCED MODE: Components & Indications */}
            {isAdvancedMode && (
              <div className="space-y-4 border-t border-white/5 pt-4 animate-in slide-in-from-top-2 duration-300">
                
                {/* Components Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">
                      Molecular_Components
                    </label>
                    <button
                      type="button"
                      onClick={() => setComponents([...components, { substance: "", dosage: "", unit: "mg" }])}
                      className="flex items-center gap-1 text-[9px] font-black text-[var(--palantir-active)] hover:opacity-80 uppercase transition-all"
                    >
                      <PlusIcon className="w-3 h-3" /> Add_Component
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {components.length === 0 && (
                      <div className="text-center py-4 bg-black/10 border border-dashed border-white/5 rounded">
                        <span className="text-[8px] font-mono uppercase text-[var(--palantir-muted)]">
                          No_Components_Defined
                        </span>
                      </div>
                    )}
                    {components.map((comp, index) => (
                      <div key={index} className="flex gap-2 items-center bg-black/20 p-2 border border-white/5 animate-in slide-in-from-left-2 duration-200">
                        <input
                          type="text"
                          placeholder="SUBSTANCE"
                          value={comp.substance}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[index].substance = e.target.value;
                            setComponents(newComps);
                          }}
                          className="flex-1 bg-transparent border-b border-[var(--palantir-border)] px-2 py-1 text-[11px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)]"
                        />
                        <input
                          type="text"
                          placeholder="VAL"
                          value={comp.dosage}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[index].dosage = e.target.value;
                            setComponents(newComps);
                          }}
                          className="w-16 bg-transparent border-b border-[var(--palantir-border)] px-2 py-1 text-[11px] font-mono outline-none focus:border-[var(--palantir-active)] text-center text-[var(--palantir-text)]"
                        />
                        <select
                          value={comp.unit}
                          onChange={(e) => {
                            const newComps = [...components];
                            newComps[index].unit = e.target.value as any;
                            setComponents(newComps);
                          }}
                          className="bg-transparent border-b border-[var(--palantir-border)] px-2 py-1 text-[11px] font-mono outline-none text-[var(--palantir-text)]"
                        >
                          <option value="mg" className="bg-gray-900">mg</option>
                          <option value="ml" className="bg-gray-900">ml</option>
                          <option value="g" className="bg-gray-900">g</option>
                          <option value="tablet" className="bg-gray-900">tab</option>
                          <option value="capsule" className="bg-gray-900">cap</option>
                          <option value="drop" className="bg-gray-900">gtt</option>
                          <option value="unit" className="bg-gray-900">UI</option>
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
                {/* Indications */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">
                    Indicaciones / Notas
                  </label>
                  <textarea
                    value={indications}
                    onChange={(e) => setIndications(e.target.value)}
                    placeholder="Indicaciones específicas para el paciente..."
                    rows={2}
                    className="w-full bg-gray-900 border border-[var(--palantir-border)] px-4 py-2.5 text-[11px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)] resize-none"
                  />
                </div>
              </div>
            )}
            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 border border-[var(--palantir-active)] text-[var(--palantir-active)] py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Generate_Medical_Prescription
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default PrescriptionPanel;