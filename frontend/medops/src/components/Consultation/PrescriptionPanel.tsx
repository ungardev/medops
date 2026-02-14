// src/components/Consultation/PrescriptionPanel.tsx
import React, { useState } from "react";
import {
  Diagnosis,
  Prescription,
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
  PrescriptionComponent,
} from "../../types/consultation";
import PrescriptionBadge from "./PrescriptionBadge";
import { useUpdatePrescription } from "../../hooks/consultations/useUpdatePrescription";
import { useDeletePrescription } from "../../hooks/consultations/useDeletePrescription";
import MedicationSelector from "./MedicationSelector";
import { 
  BeakerIcon, 
  PlusIcon, 
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentCheckIcon
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
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState<UpdatePrescriptionInput["frequency"]>("once_daily");
  const [route, setRoute] = useState<UpdatePrescriptionInput["route"]>("oral");
  const [components, setComponents] = useState<PrescriptionComponent[]>([]);
  
  const { mutate: updatePrescription } = useUpdatePrescription();
  const { mutate: deletePrescription } = useDeletePrescription();
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
      components: components.map((c) => ({
        substance: c.substance.trim(),
        dosage: String(c.dosage),
        unit: c.unit,
      })),
    };
    
    onAdd?.(payload);
    setDiagnosisId("");
    setMedicationCatalogId(undefined);
    setMedicationText(undefined);
    setDuration("");
    setFrequency("once_daily");
    setRoute("oral");
    setComponents([]);
  };
  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--palantir-border)] pb-4">
        <BeakerIcon className="w-5 h-5 text-[var(--palantir-active)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
          Pharmacological_Orders
        </span>
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
          <form onSubmit={handleSubmit} className="bg-white/5 border border-[var(--palantir-border)] p-5 space-y-6 rounded-sm shadow-xl">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-3">
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-[var(--palantir-active)]" />
              <span className="text-[9px] font-black uppercase tracking-widest">New_Prescription_Draft</span>
            </div>
            {/* Top Grid: Diagnosis & Medication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Condition_Reference</label>
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
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Agent_Selector</label>
                <MedicationSelector
                  valueCatalogId={medicationCatalogId}
                  valueText={medicationText}
                  onChange={({ catalogId, text }) => {
                    setMedicationCatalogId(catalogId);
                    setMedicationText(text);
                  }}
                />
              </div>
            </div>
            {/* Components Subform */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Molecular_Components</label>
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
                    <span className="text-[8px] font-mono uppercase text-[var(--palantir-muted)]">No_Components_Defined</span>
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
                    <button type="button" onClick={() => setComponents(components.filter((_, i) => i !== index))} className="text-red-400/60 hover:text-red-400 p-1 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
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
                    <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label.toUpperCase()}</option>
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
                    <option key={opt.value} value={opt.value} className="bg-gray-900">{opt.label.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* FIXED BUTTON: Dark background with visible text */}
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 border border-[var(--palantir-active)] text-[var(--palantir-active)] py-4 flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Generate_Medical_Prescription</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default PrescriptionPanel;