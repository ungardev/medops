// src/components/Consultation/TreatmentBadge.tsx
import React, { useState } from "react";
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  CalendarIcon,
  UserGroupIcon,        
  BuildingOfficeIcon,   
  CalendarDaysIcon,     
  ArrowPathIcon         
} from "@heroicons/react/24/outline";
import type { Treatment, TreatmentStatus, TreatmentType } from "../../types/consultation";
import type { UpdateTreatmentInput } from "../../types/consultation";
export interface TreatmentBadgeProps {
  treatment: Treatment;
  onEdit?: (id: number, newData: UpdateTreatmentInput) => void;
  onDelete?: (id: number) => void;
  showMetadata?: boolean;
}
export default function TreatmentBadge({
  treatment,
  onEdit,
  onDelete,
  showMetadata = false,
}: TreatmentBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [editedPlan, setEditedPlan] = useState(treatment.plan);
  const [editedStart, setEditedStart] = useState(treatment.start_date || "");
  const [editedEnd, setEditedEnd] = useState(treatment.end_date || "");
  const [editedStatus, setEditedStatus] = useState<TreatmentStatus>(treatment.status);
  const [editedType, setEditedType] = useState<TreatmentType>(treatment.treatment_type);
  
  const statusConfig = {
    active: { color: "text-emerald-400", icon: <ClockIcon className="w-3 h-3" />, label: "ACTIVE" },
    completed: { color: "text-blue-400", icon: <CheckCircleIcon className="w-3 h-3" />, label: "COMPLETED" },
    cancelled: { color: "text-red-400", icon: <XCircleIcon className="w-3 h-3" />, label: "CANCELLED" },
    suspended: { color: "text-amber-400", icon: <XCircleIcon className="w-3 h-3" />, label: "SUSPENDED" },
  };
  const typeConfig: Record<string, string> = {
    pharmacological: "FARMACOLÓGICO",
    surgical: "QUIRÚRGICO",
    rehabilitation: "REHABILITACIÓN",
    lifestyle: "ESTILO DE VIDA",
    psychological: "PSICOLÓGICO",
    other: "OTRO",
  };
  const getDisplayTitle = () => {
    if (treatment.title && treatment.title !== `Tratamiento para ${treatment.diagnosis}`) {
      return treatment.title;
    }
    // Si el título es genérico, usar el tipo + fecha
    const typeLabel = typeConfig[treatment.treatment_type] || treatment.treatment_type;
    const date = treatment.start_date 
      ? new Date(treatment.start_date).toLocaleDateString("es-VE") 
      : "Sin fecha";
    return `${typeLabel} (${date})`;
  };
  const handleSave = () => {
    const updateData: UpdateTreatmentInput = {
      id: treatment.id,
      plan: editedPlan.trim(),
      start_date: editedStart || undefined,
      end_date: editedEnd || undefined,
      status: editedStatus,
      treatment_type: editedType,
    };
    onEdit?.(treatment.id, updateData);
    setIsEditing(false);
  };
  return (
    <div className={`group relative border border-[var(--palantir-border)] bg-black/20 p-4 transition-all hover:bg-white/5 ${isEditing ? 'border-[var(--palantir-active)] bg-white/5' : ''}`}>
      
      {/* HEADER: Tipo y Acciones */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">
            Type__{typeConfig[treatment.treatment_type] || treatment.treatment_type}
          </span>
          <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 ${statusConfig[treatment.status]?.color || "text-gray-400"}`}>
            {statusConfig[treatment.status]?.icon || <ClockIcon className="w-3 h-3" />}
            {statusConfig[treatment.status]?.label || treatment.status}
          </div>
        </div>
        {!isEditing && (
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={() => setIsEditing(true)} className="text-[var(--palantir-muted)] hover:text-[var(--palantir-active)]">
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => window.confirm("Confirm_Delete?") && onDelete(treatment.id)} className="text-[var(--palantir-muted)] hover:text-red-400">
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-3 animate-in fade-in duration-200">
          <textarea
            value={editedPlan}
            onChange={(e) => setEditedPlan(e.target.value)}
            className="w-full bg-black/60 border border-[var(--palantir-border)] p-3 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none min-h-[80px]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={editedStart} onChange={(e) => setEditedStart(e.target.value)} className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none" />
            <input type="date" value={editedEnd} onChange={(e) => setEditedEnd(e.target.value)} className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none" />
            <select value={editedStatus} onChange={(e) => setEditedStatus(e.target.value as any)} className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none">
              <option value="active">ACTIVE</option>
              <option value="completed">COMPLETED</option>
              <option value="cancelled">CANCELLED</option>
              <option value="suspended">SUSPENDED</option>
            </select>
            <select value={editedType} onChange={(e) => setEditedType(e.target.value as any)} className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none">
              <option value="pharmacological">PHARMACOLOGICAL</option>
              <option value="surgical">SURGICAL</option>
              <option value="rehabilitation">REHABILITATION</option>
              <option value="lifestyle">LIFESTYLE</option>
              <option value="psychological">PSYCHOLOGICAL</option>
              <option value="other">OTHER</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-[var(--palantir-active)] text-white py-2 text-[9px] font-black uppercase tracking-widest">Update_Record</button>
            <button onClick={() => setIsEditing(false)} className="px-4 border border-[var(--palantir-border)] text-[var(--palantir-muted)] text-[9px] font-black uppercase">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TÍTULO DEL TRATAMIENTO */}
          <h3 className="font-semibold text-[12px] text-[var(--palantir-text)] leading-relaxed">
            {getDisplayTitle()}
          </h3>
          
          {/* PLAN */}
          <p className="text-[12px] text-[var(--palantir-text)] leading-relaxed font-medium">
            {treatment.plan}
          </p>
          
          {/* METADATA */}
          {showMetadata && (treatment.doctor || treatment.institution) && (
            <div className="flex items-center gap-3 text-xs font-mono text-[var(--palantir-muted)] mb-2 border-t border-white/5 pt-2">
              {treatment.doctor && (
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  <span>{treatment.doctor.full_name}</span>
                  {treatment.doctor.is_verified && (
                    <CheckCircleIcon className="w-3.5 h-3.5 inline ml-1 text-emerald-500" />
                  )}
                </div>
              )}
              {treatment.doctor && treatment.institution && <span className="text-white/20">•</span>}
              {treatment.institution && (
                <div className="flex items-center gap-1">
                  <BuildingOfficeIcon className="w-3.5 h-3.5" />
                  <span>{treatment.institution.name}</span>
                </div>
              )}
            </div>
          )}
          
          {/* CRONOLOGÍA */}
          <div className="flex items-center gap-6 border-t border-white/5 pt-3">
            {treatment.start_date && (
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-3.5 h-3.5 text-[var(--palantir-muted)]" />
                <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">Start: {treatment.start_date}</span>
              </div>
            )}
            {treatment.end_date && (
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-3.5 h-3.5 text-[var(--palantir-muted)]" />
                <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">End: {treatment.end_date}</span>
              </div>
            )}
            {!treatment.start_date && !treatment.end_date && treatment.is_permanent && (
              <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">
                Indefinite_Treatment
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}