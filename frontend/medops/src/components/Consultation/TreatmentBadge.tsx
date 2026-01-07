// src/components/Consultation/TreatmentBadge.tsx
import React, { useState } from "react";
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

export type TreatmentStatus = "active" | "completed" | "cancelled" | "suspended";
export type TreatmentType = "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "therapeutic" | "other";

export interface TreatmentBadgeProps {
  id: number;
  plan: string;
  start_date?: string | null;
  end_date?: string | null;
  status: TreatmentStatus;
  treatment_type: TreatmentType;
  onEdit?: (id: number, newPlan: string, start?: string | null, end?: string | null, status?: TreatmentStatus, type?: TreatmentType) => void;
  onDelete?: (id: number) => void;
}

export default function TreatmentBadge({
  id, plan, start_date, end_date, status, treatment_type, onEdit, onDelete,
}: TreatmentBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);
  const [editedStart, setEditedStart] = useState(start_date || "");
  const [editedEnd, setEditedEnd] = useState(end_date || "");
  const [editedStatus, setEditedStatus] = useState<TreatmentStatus>(status);
  const [editedType, setEditedType] = useState<TreatmentType>(treatment_type);

  const statusConfig = {
    active: { color: "text-emerald-400", icon: <ClockIcon className="w-3 h-3" />, label: "ACTIVE" },
    completed: { color: "text-blue-400", icon: <CheckCircleIcon className="w-3 h-3" />, label: "COMPLETED" },
    cancelled: { color: "text-red-400", icon: <XCircleIcon className="w-3 h-3" />, label: "CANCELLED" },
    suspended: { color: "text-amber-400", icon: <XCircleIcon className="w-3 h-3" />, label: "SUSPENDED" },
  };

  const handleSave = () => {
    onEdit?.(id, editedPlan.trim(), editedStart || null, editedEnd || null, editedStatus, editedType);
    setIsEditing(false);
  };

  return (
    <div className={`group relative border border-[var(--palantir-border)] bg-black/20 p-4 transition-all hover:bg-white/5 ${isEditing ? 'border-[var(--palantir-active)] bg-white/5' : ''}`}>
      
      {/* HEADER: Tipo y Acciones */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">
            Type__{treatment_type}
          </span>
          <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 ${statusConfig[status].color}`}>
            {statusConfig[status].icon}
            {statusConfig[status].label}
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
              <button onClick={() => window.confirm("Confirm_Delete?") && onDelete(id)} className="text-[var(--palantir-muted)] hover:text-red-400">
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
              <option value="therapeutic">THERAPEUTIC</option>
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
          <p className="text-[12px] text-[var(--palantir-text)] leading-relaxed font-medium">
            {plan}
          </p>
          
          <div className="flex items-center gap-6 border-t border-white/5 pt-3">
            {start_date && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 text-[var(--palantir-muted)]" />
                <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">Start: {start_date}</span>
              </div>
            )}
            {end_date && (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-3.5 h-3.5 text-[var(--palantir-muted)]" />
                <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">End: {end_date}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
