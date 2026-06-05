// src/components/Consultation/DiagnationBadge.tsx
import React from "react";
import { PencilSquareIcon, TrashIcon, CloudIcon } from "@heroicons/react/24/outline";
import { DiagnosisType, DiagnosisStatus } from "../../types/consultation";

interface DiagnosisBadgeProps {
  id: number | string;
  icd_code: string;
  title: string;
  description?: string;
  type: DiagnosisType;
  status: DiagnosisStatus;
  catalog?: "icd11" | "snomed";
  isOptimistic?: boolean;
  isDeleting?: boolean;
  onEdit?: (id: number, desc: string) => void;
  onDelete?: (id: number) => void;
}

const TYPE_LABELS: Record<DiagnosisType, string> = {
  presumptive: "PRESUNTIVO",
  definitive: "DEFINITIVO",
  differential: "DIFERENCIAL",
  provisional: "PROVISIONAL",
};

const STATUS_COLORS: Record<DiagnosisStatus, string> = {
  under_investigation: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  awaiting_results: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  ruled_out: "bg-red-500/15 text-red-400 border-red-500/25",
  chronic: "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

const STATUS_LABELS: Record<DiagnosisStatus, string> = {
  under_investigation: "EN ESTUDIO",
  awaiting_results: "ESPERANDO RESULTADOS",
  confirmed: "CONFIRMADO",
  ruled_out: "DESCARTADO",
  chronic: "CRÓNICO",
};

export default function DiagnosisBadge({
  id,
  icd_code,
  title,
  description,
  type = "presumptive",
  status = "under_investigation",
  catalog = "icd11",
  isOptimistic = false,
  isDeleting = false,
  onEdit,
  onDelete,
}: DiagnosisBadgeProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editDesc, setEditDesc] = React.useState(description || "");
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.under_investigation;
  const typeLabel = TYPE_LABELS[type] || TYPE_LABELS.presumptive;
  const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.under_investigation;
  
  return (
    <div 
      className={`group relative bg-white/5 border border-white/15 p-4 hover:border-white/25 transition-all rounded-xl ${
        isOptimistic ? "animate-pulse opacity-80 border-emerald-500/30" : ""
      } ${isDeleting ? "animate-pulse opacity-50 border-red-500/30" : ""}`}
    >
      {(isOptimistic || isDeleting) && (
        <div className={`absolute -top-2 -right-2 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border z-10 ${
          isDeleting ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        }`}>
          <CloudIcon className="w-3 h-3 animate-bounce" />
          <span>{isDeleting ? "Eliminando..." : "Guardando..."}</span>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold bg-emerald-500/20 px-2 py-0.5 rounded-lg border ${
              isOptimistic ? "border-emerald-500/40 text-emerald-300" : "border-emerald-500/20 text-emerald-400"
            }`}>
              {icd_code}
            </span>
            <span className={`text-sm font-medium ${isOptimistic ? "text-white/70" : "text-white"}`}>
              {title}
            </span>
            {catalog === "snomed" && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded border bg-purple-500/20 text-purple-400 border-purple-500/50 uppercase tracking-wider">
                SNOMED
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded border uppercase ${
              type === "definitive" 
                ? isOptimistic 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" 
                : "bg-white/10 text-white/80 border-white/15"
            }`}>
              {typeLabel}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded border uppercase ${isOptimistic ? "bg-white/10 text-white/60 border-white/20" : statusColor}`}>
              {statusLabel}
            </span>
          </div>
          {description && (
            <p className={`text-sm mt-2 pl-3 border-l-2 ${
              isOptimistic ? "text-white/40 border-white/10" : "text-white/60 border-white/15"
            }`}>
              {description}
            </p>
          )}
        </div>
        {!isOptimistic && !isDeleting && onEdit && onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              title="Editar diagnóstico"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(Number(id))}
              className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Eliminar diagnóstico"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {isEditing && !isOptimistic && (
        <div className="mt-4 pt-4 border-t border-white/15 animate-in fade-in slide-in-from-top-2">
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full bg-white/5 border border-emerald-500/30 p-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 min-h-[60px] rounded-xl"
            placeholder="Editar descripción..."
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                onEdit?.(Number(id), editDesc);
                setIsEditing(false);
              }}
              className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 py-2 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-colors rounded-xl"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setEditDesc(description || "");
                setIsEditing(false);
              }}
              className="flex-1 bg-white/5 text-white/80 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}