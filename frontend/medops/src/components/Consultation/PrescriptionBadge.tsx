// src/components/Consultation/PrescriptionBadge.tsx
import React, { useState } from "react";
import type { Prescription } from "../../types/consultation";
import { 
  PencilSquareIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  BeakerIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CircleStackIcon
} from "@heroicons/react/24/outline";
const FREQUENCY_LABELS: Record<string, string> = {
  "once_daily": "1 vez al día",
  "bid": "2 veces al día",
  "tid": "3 veces al día",
  "qid": "4 veces al día",
  "q4h": "Cada 4 horas",
  "q6h": "Cada 6 horas",
  "q8h": "Cada 8 horas",
  "q12h": "Cada 12 horas",
  "q24h": "Cada 24 horas",
  "qod": "Día por medio",
  "stat": "Inmediato",
  "prn": "Según necesidad",
  "hs": "Al acostarse",
  "ac": "Antes de comidas",
  "pc": "Después de comidas",
  "achs": "Antes de comidas y al acostarse",
};
const ROUTE_LABELS: Record<string, string> = {
  "oral": "Oral",
  "iv": "Intravenosa (IV)",
  "im": "Intramuscular (IM)",
  "sc": "Subcutánea",
  "sublingual": "Sublingual",
  "inhalation": "Inhalación",
  "rectal": "Rectal",
  "topical": "Tópica",
  "other": "Otra",
};
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
  medicationCatalog?: {
    name?: string;
    presentation?: string;
    concentration?: string;
    generic_name?: string;
  } | null;
  isFromCatalog?: boolean;
  duration?: string | null;
  frequency?: Frequency;
  route?: Route;
  components?: PrescriptionComponent[];
  indications?: string | null;
  issuedAt?: string;
  doctor?: Prescription['doctor'];
  institution?: Prescription['institution'];
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
  medicationCatalog,
  isFromCatalog = false,
  duration,
  frequency = "once_daily",
  route = "oral",
  components = [],
  indications,
  issuedAt,
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
  const [editedComponents, setEditedComponents] = useState<PrescriptionComponent[]>(components || []);
  
  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editedMedication.trim(), editedDuration || null, editedFrequency, editedRoute, editedComponents);
    }
    setIsEditing(false);
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <div className="group border border-white/15 bg-white/5 rounded-lg overflow-hidden transition-all hover:border-white/25">
      <div className="flex items-center justify-between bg-white/5 px-4 py-3 border-b border-white/15">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BeakerIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-[12px] font-medium text-white truncate">
            {isEditing ? "Editando..." : medication}
          </span>
          {isFromCatalog ? (
            <span className="flex-shrink-0 text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
              CATÁLOGO
            </span>
          ) : (
            <span className="flex-shrink-0 text-[9px] font-bold bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded border border-orange-500/25">
              MANUAL
            </span>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="p-2 text-white/50 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors">
              <PencilSquareIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete?.(id)} className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {!isEditing && medicationCatalog && (
        <div className="px-4 py-2 bg-black/20 border-b border-white/10">
          <div className="flex items-center gap-2 text-[10px] text-white/60">
            <CircleStackIcon className="w-4 h-4 text-emerald-400" />
            <span>
              {medicationCatalog.presentation && `${medicationCatalog.presentation}`}
              {medicationCatalog.concentration && ` • ${medicationCatalog.concentration}`}
              {medicationCatalog.generic_name && ` • ${medicationCatalog.generic_name}`}
            </span>
          </div>
        </div>
      )}
      {!isEditing && (doctor || institution || issuedAt) && (
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/60 px-4 py-2 border-b border-white/10">
          {doctor && (
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4" />
              <span>{doctor.full_name}</span>
              {doctor.is_verified && (
                <ShieldCheckIcon className="w-4 h-4 inline ml-1 text-emerald-500" />
              )}
            </div>
          )}
          {institution && (
            <div className="flex items-center gap-1">
              <BuildingOfficeIcon className="w-4 h-4" />
              <span>{institution.name}</span>
            </div>
          )}
          {issuedAt && (
            <div className="flex items-center gap-1 ml-auto">
              <CalendarIcon className="w-4 h-4" />
              <span>{formatDate(issuedAt)}</span>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <input
              type="text"
              value={editedMedication}
              onChange={(e) => setEditedMedication(e.target.value)}
              className="w-full bg-white/5 border border-white/15 px-3 py-2 text-[11px] outline-none focus:border-emerald-500/50 rounded-lg"
            />
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Composición</label>
              {editedComponents.length === 0 ? (
                <div className="text-[10px] text-white/50 italic">
                  Sin componentes definidos
                </div>
              ) : (
                editedComponents.map((comp, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={comp.substance}
                      onChange={(e) => {
                        const newComps = [...editedComponents];
                        newComps[index].substance = e.target.value;
                        setEditedComponents(newComps);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] outline-none rounded-lg"
                      placeholder="Sustancia"
                    />
                    <input
                      type="text"
                      value={comp.dosage}
                      onChange={(e) => {
                        const newComps = [...editedComponents];
                        newComps[index].dosage = e.target.value;
                        setEditedComponents(newComps);
                      }}
                      className="w-16 bg-white/5 border border-white/10 px-3 py-1.5 text-center text-[10px] outline-none rounded-lg"
                      placeholder="Dosis"
                    />
                    <button 
                      onClick={() => setEditedComponents(editedComponents.filter((_, i) => i !== index))}
                      className="text-red-400/60 hover:text-red-400 px-2"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
              <button
                type="button"
                onClick={() => setEditedComponents([...editedComponents, { substance: "", dosage: "", unit: "mg" }])}
                className="text-[10px] font-medium text-emerald-400 hover:opacity-80 uppercase"
              >
                + Agregar sustancia
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button onClick={() => setIsEditing(false)} className="text-[10px] font-medium text-white/60 hover:text-white transition-colors px-3 py-1.5">
                Cancelar
              </button>
              <button onClick={handleSave} className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-4 py-1.5 text-[10px] font-bold uppercase hover:bg-emerald-500/25 transition-all rounded-lg">
                Guardar Cambios
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`${components.length > 0 ? 'col-span-2' : 'col-span-4'}`}>
                {components.length > 0 ? (
                  <>
                    <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider block mb-2">Componentes</span>
                    <div className="space-y-1">
                      {components.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
                          <span className="text-white/80">{c.substance}</span>
                          <span className="text-emerald-400 font-medium">{c.dosage}{c.unit}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] text-white/50 italic">
                    Sin detalles de composición
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-white/60 flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" /> Frecuencia
                </span>
                <span className="text-[11px] text-white/80">
                  {FREQUENCY_LABELS[frequency] || frequency}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-white/60 flex items-center gap-1">
                  <ArrowsRightLeftIcon className="w-3.5 h-3.5" /> Vía
                </span>
                <span className="text-[11px] text-white/80">
                  {ROUTE_LABELS[route] || route}
                </span>
              </div>
            </div>
            {indications && (
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-start gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-medium text-white/60 block mb-1">Indicaciones</span>
                    <span className="text-[11px] text-white/80">{indications}</span>
                  </div>
                </div>
              </div>
            )}
            {duration && (
              <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-white/50" />
                <span className="text-[10px] text-white/60 uppercase tracking-wider">
                  Duración: <span className="text-white font-medium">{duration}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}