// src/components/Consultation/DiagnosisBadge.tsx
import React, { useState } from "react";
import { 
  PencilSquareIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

export interface DiagnosisBadgeProps {
  id: number;
  icd_code: string;
  title: string;
  description?: string;
  onEdit?: (id: number, newDescription: string) => void;
  onDelete?: (id: number) => void;
}

export default function DiagnosisBadge({
  id,
  icd_code,
  title,
  description,
  onEdit,
  onDelete,
}: DiagnosisBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description || "");

  const handleSave = () => {
    if (onEdit) {
      onEdit(id, editedDescription.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDescription(description || "");
    setIsEditing(false);
  };

  return (
    <div className="group border border-[var(--palantir-border)] bg-white/5 p-3 rounded-sm transition-all hover:border-[var(--palantir-active)]/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="bg-[var(--palantir-active)] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm font-mono tracking-tighter">
              {icd_code}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-tight text-[var(--palantir-text)]">
              {title}
            </span>
          </div>
          
          {!isEditing && description && (
            <div className="flex items-start gap-2 mt-1 opacity-70">
              <ChatBubbleLeftRightIcon className="w-3 h-3 mt-0.5 text-[var(--palantir-active)]" />
              <p className="text-[10px] font-mono leading-relaxed text-[var(--palantir-text)] whitespace-pre-line">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-white/10 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-colors"
                title="Edit Entry"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm("CONFIRM_DELETION: This action cannot be undone.")) {
                    onDelete(id);
                  }
                }}
                className="p-1 hover:bg-red-500/10 text-[var(--palantir-muted)] hover:text-red-400 transition-colors"
                title="Delete Entry"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline Editor */}
      {isEditing && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="ADD_CLINICAL_OBSERVATIONS..."
            className="w-full bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none min-h-[60px] resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase text-[var(--palantir-muted)] hover:text-white transition-colors"
            >
              <XMarkIcon className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 bg-[var(--palantir-active)]/20 text-[var(--palantir-active)] text-[9px] font-black uppercase border border-[var(--palantir-active)]/30 hover:bg-[var(--palantir-active)] hover:text-white transition-all"
            >
              <CheckIcon className="w-3 h-3" /> Commit_Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
