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
    active: { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25", icon: <ClockIcon className="w-4 h-4" />, label: "ACTIVO" },
    completed: { color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/25", icon: <CheckCircleIcon className="w-4 h-4" />, label: "COMPLETADO" },
    cancelled: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/25", icon: <XCircleIcon className="w-4 h-4" />, label: "CANCELADO" },
    suspended: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25", icon: <XCircleIcon className="w-4 h-4" />, label: "SUSPENDIDO" },
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
    <div className={`group relative border border-white/15 bg-white/5 p-4 transition-all hover:border-white/25 rounded-lg ${isEditing ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
            {typeConfig[treatment.treatment_type] || treatment.treatment_type}
          </span>
          <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg border ${statusConfig[treatment.status]?.bg || "bg-white/10"} ${statusConfig[treatment.status]?.border || "border-white/15"} ${statusConfig[treatment.status]?.color || "text-gray-400"}`}>
            {statusConfig[treatment.status]?.icon || <ClockIcon className="w-4 h-4" />}
            {statusConfig[treatment.status]?.label || treatment.status}
          </div>
        </div>
        {!isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={() => setIsEditing(true)} className="p-2 text-white/50 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors">
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button onClick={() => window.confirm("¿Confirmar eliminación?") && onDelete(treatment.id)} className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <textarea
            value={editedPlan}
            onChange={(e) => setEditedPlan(e.target.value)}
            className="w-full bg-white/5 border border-white/15 p-3 text-[12px] focus:border-emerald-500/50 outline-none min-h-[80px] rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={editedStart} onChange={(e) => setEditedStart(e.target.value)} className="bg-white/5 border border-white/15 p-2.5 text-[11px] outline-none rounded-lg [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
            <input type="date" value={editedEnd} onChange={(e) => setEditedEnd(e.target.value)} className="bg-white/5 border border-white/15 p-2.5 text-[11px] outline-none rounded-lg [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
            <select value={editedStatus} onChange={(e) => setEditedStatus(e.target.value as any)} className="bg-white/5 border border-white/15 p-2.5 text-[11px] outline-none rounded-lg">
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
              <option value="suspended">Suspendido</option>
            </select>
            <select value={editedType} onChange={(e) => setEditedType(e.target.value as any)} className="bg-white/5 border border-white/15 p-2.5 text-[11px] outline-none rounded-lg">
              <option value="pharmacological">Farmacológico</option>
              <option value="surgical">Quirúrgico</option>
              <option value="rehabilitation">Rehabilitación</option>
              <option value="lifestyle">Estilo de Vida</option>
              <option value="psychological">Psicológico</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 py-2.5 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/25 transition-colors rounded-lg">
              Actualizar
            </button>
            <button onClick={() => setIsEditing(false)} className="px-4 border border-white/15 text-white/60 text-[10px] font-bold uppercase hover:bg-white/5 transition-colors rounded-lg">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-medium text-[12px] text-white leading-relaxed">
            {getDisplayTitle()}
          </h3>
          
          <p className="text-[12px] text-white/80 leading-relaxed">
            {treatment.plan}
          </p>
          
          {showMetadata && (treatment.doctor || treatment.institution) && (
            <div className="flex items-center gap-3 text-[10px] text-white/60 mb-2 border-t border-white/10 pt-2">
              {treatment.doctor && (
                <div className="flex items-center gap-1">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>{treatment.doctor.full_name}</span>
                  {treatment.doctor.is_verified && (
                    <CheckCircleIcon className="w-4 h-4 inline ml-1 text-emerald-500" />
                  )}
                </div>
              )}
              {treatment.doctor && treatment.institution && <span className="text-white/20">•</span>}
              {treatment.institution && (
                <div className="flex items-center gap-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>{treatment.institution.name}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-6 border-t border-white/10 pt-3">
            {treatment.start_date && (
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-white/50" />
                <span className="text-[10px] text-white/60">Inicio: {treatment.start_date}</span>
              </div>
            )}
            {treatment.end_date && (
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 text-white/50" />
                <span className="text-[10px] text-white/60">Fin: {treatment.end_date}</span>
              </div>
            )}
            {!treatment.start_date && !treatment.end_date && treatment.is_permanent && (
              <span className="text-[10px] text-white/60">
                Tratamiento Indefinido
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}