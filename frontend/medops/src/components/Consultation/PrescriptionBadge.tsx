// src/components/Consultation/PrescriptionBadge.tsx
import React, { useState } from "react";
import type { Prescription } from "../../types/consultation";  // ✅ AGREGADO: Import de Prescription para acceder a doctor/institution
import { 
  PencilSquareIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  BeakerIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  CalendarIcon,
  UserGroupIcon,        // ✅ AGREGADO: Icono para doctor
  BuildingOfficeIcon,    // ✅ AGREGADO: Icono para institución
  ShieldCheckIcon       // ✅ AGREGADO: Icono de verificación
} from "@heroicons/react/24/outline";
type Frequency =
  | "once_daily" | "bid" | "tid" | "qid"
  | "q4h" | "q6h" | "q8h" | "q12h" | "q24h"
  | "qod" | "stat" | "prn" | "hs"
  | "ac" | "pc" | "achs";
type Route =
  | "oral" | "iv" | "im" | "sc"
  | "topical" | "sublingual" | "inhalation"
  | "rectal" | "other";
type Unit =
  | "mg" | "ml" | "g"
  | "tablet" | "capsule" | "drop"
  | "puff" | "unit" | "patch";
export interface PrescriptionComponent {
  id?: number;
  substance: string;
  dosage: string;
  unit: Unit;
}
export interface PrescriptionBadgeProps {
  id: number;
  medication: string;
  duration?: string | null;
  frequency?: Frequency;
  route?: Route;
  components: PrescriptionComponent[];
  doctor?: Prescription['doctor'];  // ✅ AGREGADO: Campo opcional para mostrar metadata
  institution?: Prescription['institution'];  // ✅ AGREGADO: Campo opcional para mostrar metadata
  onEdit?: (
    id: number,
    medication: string,
    duration?: string | null,
    frequency?: Frequency,
    route?: Route,
    components?: PrescriptionComponent[]
  ) => void;
  onDelete?: (id: number) => void;
}
export default function PrescriptionBadge({
  id,
  medication,
  duration,
  frequency = "once_daily",
  route = "oral",
  components,
  doctor,
  institution,
  onEdit,
  onDelete,
}: PrescriptionBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMedication, setEditedMedication] = useState(medication);
  const [editedDuration, setEditedDuration] = useState(duration || "");
  const [editedFrequency, setEditedFrequency] = useState<Frequency>(frequency);
  const [editedRoute, setEditedRoute] = useState<Route>(route);
  const [editedComponents, setEditedComponents] = useState<PrescriptionComponent[]>(components);
  
  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editedMedication.trim(), editedDuration || null, editedFrequency, editedRoute, editedComponents);
    }
    setIsEditing(false);
  };
  
  return (
    <div className="group border border-[var(--palantir-border)] bg-white/5 rounded-sm overflow-hidden transition-all hover:border-[var(--palantir-active)]/40">
      {/* HEADER: Medication Name & Actions */}
      <div className="flex items-center justify-between bg-white/5 px-3 py-2 border-b border-[var(--palantir-border)]">
        <div className="flex items-center gap-2">
          <BeakerIcon className="w-3.5 h-3.5 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--palantir-text)]">
            {isEditing ? "Editing_Entry" : medication}
          </span>
        </div>
        
        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="p-1 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)]">
              <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete?.(id)} className="p-1 text-[var(--palantir-muted)] hover:text-red-400">
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {/* ✅ AGREGADO: SECCIÓN DE METADATA (FASE 1) - Doctor e Institución */}
      {!isEditing && (doctor || institution) && (
        <div className="flex items-center gap-3 text-xs font-mono text-[var(--palantir-muted)] px-3 py-2 border-b border-white/5">
          {doctor && (
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-3.5 h-3.5" />
              <span>{doctor.full_name}</span>
              {doctor.is_verified && (
                <ShieldCheckIcon className="w-3.5 h-3.5 inline ml-1 text-emerald-500" />
              )}
            </div>
          )}
          {doctor && institution && <span className="text-white/20">•</span>}
          {institution && (
            <div className="flex items-center gap-1">
              <BuildingOfficeIcon className="w-3.5 h-3.5" />
              <span>{institution.name}</span>
            </div>
          )}
        </div>
      )}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Input Nombre */}
            <input
              type="text"
              value={editedMedication}
              onChange={(e) => setEditedMedication(e.target.value)}
              className="w-full bg-black/40 border border-[var(--palantir-border)] px-2 py-1.5 text-[11px] font-mono outline-none focus:border-[var(--palantir-active)]"
            />
            {/* Editor de Componentes */}
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)]">Composition</label>
              {editedComponents.map((comp, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    type="text"
                    value={comp.substance}
                    onChange={(e) => {
                      const newComps = [...editedComponents];
                      newComps[index].substance = e.target.value;
                      setEditedComponents(newComps);
                    }}
                    className="flex-1 bg-black/20 border border-white/5 px-2 py-1 text-[10px] font-mono outline-none"
                    placeholder="Substance"
                  />
                  <input
                    type="text"
                    value={comp.dosage}
                    onChange={(e) => {
                      const newComps = [...editedComponents];
                      newComps[index].dosage = e.target.value;
                      setEditedComponents(newComps);
                    }}
                    className="w-12 bg-black/20 border border-white/5 px-2 text-center text-[10px] font-mono outline-none"
                    placeholder="Dose"
                  />
                  <button 
                    onClick={() => setEditedComponents(editedComponents.filter((_, i) => i !== index))}
                    className="text-red-400/50 hover:text-red-400 px-1"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditedComponents([...editedComponents, { substance: "", dosage: "", unit: "mg" }])}
                className="text-[8px] font-black uppercase text-[var(--palantir-active)]"
              >
                + Add_Substance
              </button>
            </div>
            {/* Footer de Edición */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button onClick={() => setIsEditing(false)} className="text-[9px] font-black uppercase text-[var(--palantir-muted)] hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="bg-[var(--palantir-active)]/20 text-[var(--palantir-active)] border border-[var(--palantir-active)]/30 px-2 py-1 text-[9px] font-black uppercase hover:bg-[var(--palantir-active)] hover:text-white transition-all">
                Commit_Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Componentes */}
            <div className="col-span-2 space-y-1">
              <span className="text-[8px] font-black uppercase text-[var(--palantir-muted)] tracking-widest block">Components</span>
              <div className="space-y-0.5">
                {components.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--palantir-active)]/40" />
                    <span className="text-[var(--palantir-text)] opacity-90">{c.substance}</span>
                    <span className="text-[var(--palantir-active)] font-bold">{c.dosage}{c.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Info Técnica Grid */}
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase text-[var(--palantir-muted)] flex items-center gap-1">
                <ClockIcon className="w-2.5 h-2.5" /> Freq
              </span>
              <span className="text-[10px] font-mono text-[var(--palantir-text)] uppercase">{frequency.replace('_', ' ')}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase text-[var(--palantir-muted)] flex items-center gap-1">
                <ArrowsRightLeftIcon className="w-2.5 h-2.5" /> Route
              </span>
              <span className="text-[10px] font-mono text-[var(--palantir-text)] uppercase">{route}</span>
            </div>
            {duration && (
              <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
                <CalendarIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
                <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">
                  Duration_Period: <span className="text-[var(--palantir-text)] font-bold">{duration}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}