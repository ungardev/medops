// src/components/Consultation/DiagnosisBadge.tsx
import React from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DiagnosisType, DiagnosisStatus } from "../../types/consultation";
interface DiagnosisBadgeProps {
  id: number;
  icd_code: string;
  title: string;
  description?: string;
  type?: DiagnosisType;
  status?: DiagnosisStatus;
  onEdit?: (id: number, description: string) => void;
  onDelete?: (id: number) => void;
}
const TYPE_LABELS: Record<DiagnosisType, string> = {
  presumptive: "PRESUNTIVO",
  definitive: "DEFINITIVO",
  differential: "DIFERENCIAL",
  provisional: "PROVISIONAL",
};
const STATUS_COLORS: Record<DiagnosisStatus, string> = {
  under_investigation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  awaiting_results: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  ruled_out: "bg-red-500/20 text-red-400 border-red-500/30",
  chronic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
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
  onEdit,
  onDelete,
}: DiagnosisBadgeProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editDesc, setEditDesc] = React.useState(description || "");
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.under_investigation;
  const typeLabel = TYPE_LABELS[type] || TYPE_LABELS.presumptive;
  const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.under_investigation;
  return (
    <div className="group relative bg-[var(--palantir-panel)] border border-[var(--palantir-border)] p-3 hover:border-[var(--palantir-active)]/50 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black font-mono text-[var(--palantir-active)] bg-[var(--palantir-active)]/10 px-1.5 py-0.5 rounded border border-[var(--palantir-active)]/20">
              {icd_code}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--palantir-text)]">
              {title}
            </span>
            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase ${type === "definitive" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/10 text-white/60 border-white/10"}`}>
              {typeLabel}
            </span>
            <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded border uppercase ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          {description && (
            <p className="text-[10px] font-mono text-[var(--palantir-muted)] mt-1.5 pl-1 border-l-2 border-[var(--palantir-border)]">
              {description}
            </p>
          )}
        </div>
        {onEdit && onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/10 rounded transition-colors"
              title="Edit diagnosis"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-1.5 text-[var(--palantir-muted)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Delete diagnosis"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-[var(--palantir-border)] animate-in fade-in slide-in-from-top-2">
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="w-full bg-black/40 border border-[var(--palantir-active)]/30 p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)] min-h-[60px]"
            placeholder="Edit description..."
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                onEdit?.(id, editDesc);
                setIsEditing(false);
              }}
              className="flex-1 bg-[var(--palantir-active)] text-white py-1.5 text-[9px] font-black uppercase tracking-wider hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditDesc(description || "");
                setIsEditing(false);
              }}
              className="flex-1 bg-white/5 text-[var(--palantir-muted)] py-1.5 text-[9px] font-black uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}