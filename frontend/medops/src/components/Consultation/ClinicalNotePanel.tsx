// src/components/Consultation/ClinicalNotePanel.tsx
import { useState, useEffect } from "react";
import { 
  useClinicalNote, 
  useUpdateClinicalNote, 
  useLockClinicalNote, 
  useUnlockClinicalNote,
  useCreateClinicalNote
} from "../../hooks/consultations/useClinicalNote";
import { 
  LockClosedIcon, 
  LockOpenIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  EyeIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import type { ClinicalNote } from "../../types/clinical";
export interface Props {
  appointmentId: number;
  readOnly?: boolean;
}
export default function ClinicalNotePanel({ appointmentId, readOnly = false }: Props) {
  const { data: clinicalNote, isLoading } = useClinicalNote(appointmentId);
  const updateNote = useUpdateClinicalNote(clinicalNote?.id, appointmentId);
  const lockNote = useLockClinicalNote(clinicalNote?.id);
  const unlockNote = useUnlockClinicalNote(clinicalNote?.id);
  const createNote = useCreateClinicalNote(appointmentId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [subjective, setSubjective] = useState(clinicalNote?.subjective || "");
  const [objective, setObjective] = useState(clinicalNote?.objective || "");
  const [analysis, setAnalysis] = useState(clinicalNote?.analysis || "");
  const [plan, setPlan] = useState(clinicalNote?.plan || "");
  
  useEffect(() => {
    if (clinicalNote) {
      setSubjective(clinicalNote.subjective || "");
      setObjective(clinicalNote.objective || "");
      setAnalysis(clinicalNote.analysis || "");
      setPlan(clinicalNote.plan || "");
    }
  }, [clinicalNote]);
  
  const handleSave = async () => {
    try {
      const noteData = {
        appointment: appointmentId,
        subjective: subjective.trim(),
        objective: objective.trim(), 
        analysis: analysis.trim(),
        plan: plan.trim()
      };
      if (clinicalNote) {
        await updateNote.mutateAsync(noteData);
      } else {
        await createNote.mutateAsync(noteData);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setSubjective(clinicalNote?.subjective || "");
    setObjective(clinicalNote?.objective || "");
    setAnalysis(clinicalNote?.analysis || "");
    setPlan(clinicalNote?.plan || "");
  };
  
  const handleLock = async () => {
    try {
      if (clinicalNote) {
        await lockNote.mutateAsync();
      }
    } catch (error) {
      console.error("Failed to lock note:", error);
    }
  };
  
  const handleUnlock = async () => {
    try {
      if (clinicalNote) {
        await unlockNote.mutateAsync();
      }
    } catch (error) {
      console.error("Failed to unlock note:", error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-[var(--palantir-active)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 bg-[var(--palantir-panel)] border border-white/10 rounded-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-5 h-5 text-[var(--palantir-active)]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-text)]">
            CLINICAL_NOTES
          </h3>
          {clinicalNote?.is_locked && (
            <LockClosedIcon className="w-4 h-4 text-red-500 animate-pulse" title="Note is locked" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              {clinicalNote && (
                <>
                  {clinicalNote.is_locked ? (
                    <button
                      onClick={handleUnlock}
                      disabled={unlockNote.isPending}
                      className="p-1.5 text-white/40 hover:text-green-400 disabled:opacity-30 transition-all"
                      title="Unlock note"
                    >
                      <LockOpenIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleLock}
                      disabled={lockNote.isPending}
                      className="p-1.5 text-white/40 hover:text-red-400 disabled:opacity-30 transition-all"
                      title="Lock note"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              
              {!clinicalNote?.is_locked && (
                <>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSave}
                        disabled={updateNote.isPending || createNote.isPending}
                        className="p-1.5 text-white/40 hover:text-emerald-400 disabled:opacity-30 transition-all"
                        title="Save note"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 text-white/40 hover:text-red-400 transition-all"
                        title="Cancel editing"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 text-white/40 hover:text-[var(--palantir-active)] disabled:opacity-30 transition-all"
                      title="Edit note"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </>
          )}
          
          {readOnly && clinicalNote?.is_locked && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-sm">
              <EyeIcon className="w-3 h-3 text-red-400" />
              <span className="text-[7px] font-mono text-red-400 uppercase tracking-wider">
                READ_ONLY
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="border border-white/10 bg-black/20 rounded-sm p-4">
        {isEditing && !clinicalNote?.is_locked && !readOnly ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-mono text-white/60 uppercase tracking-wider mb-2">
                  SUBJECTIVE_DATA
                </label>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  className="w-full h-24 p-3 bg-transparent border border-white/10 text-[var(--palantir-text)] text-[10px] font-mono placeholder:text-white/20 focus:outline-none focus:border-[var(--palantir-active)] rounded-sm transition-all resize-none"
                  placeholder="Patient's symptoms and complaints..."
                />
              </div>
              <div>
                <label className="block text-[8px] font-mono text-white/60 uppercase tracking-wider mb-2">
                  OBJECTIVE_DATA
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full h-24 p-3 bg-transparent border border-white/10 text-[var(--palantir-text)] text-[10px] font-mono placeholder:text-white/20 focus:outline-none focus:border-[var(--palantir-active)] rounded-sm transition-all resize-none"
                  placeholder="Clinical findings and measurements..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-mono text-white/60 uppercase tracking-wider mb-2">
                  CLINICAL_ANALYSIS
                </label>
                <textarea
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  className="w-full h-24 p-3 bg-transparent border border-white/10 text-[var(--palantir-text)] text-[10px] font-mono placeholder:text-white/20 focus:outline-none focus:border-[var(--palantir-active)] rounded-sm transition-all resize-none"
                  placeholder="Clinical interpretation..."
                />
              </div>
              <div>
                <label className="block text-[8px] font-mono text-white/60 uppercase tracking-wider mb-2">
                  TREATMENT_PLAN
                </label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full h-24 p-3 bg-transparent border border-white/10 text-[var(--palantir-text)] text-[10px] font-mono placeholder:text-white/20 focus:outline-none focus:border-[var(--palantir-active)] rounded-sm transition-all resize-none"
                  placeholder="Treatment and follow-up plan..."
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border-l-2 border-white/10 pl-3">
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">
                SUBJECTIVE
              </span>
              <p className="text-[10px] font-mono text-[var(--palantir-text)] mt-1 whitespace-pre-wrap leading-relaxed">
                {subjective || <span className="text-white/20 italic">No subjective data recorded</span>}
              </p>
            </div>
            <div className="border-l-2 border-white/10 pl-3">
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">
                OBJECTIVE
              </span>
              <p className="text-[10px] font-mono text-[var(--palantir-text)] mt-1 whitespace-pre-wrap leading-relaxed">
                {objective || <span className="text-white/20 italic">No objective findings recorded</span>}
              </p>
            </div>
            <div className="border-l-2 border-white/10 pl-3">
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">
                ANALYSIS
              </span>
              <p className="text-[10px] font-mono text-[var(--palantir-text)] mt-1 whitespace-pre-wrap leading-relaxed">
                {analysis || <span className="text-white/20 italic">No clinical analysis recorded</span>}
              </p>
            </div>
            <div className="border-l-2 border-[var(--palantir-active)]/30 pl-3">
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--palantir-active)]">
                PLAN
              </span>
              <p className="text-[10px] font-mono text-[var(--palantir-text)] mt-1 whitespace-pre-wrap leading-relaxed">
                {plan || <span className="text-white/20 italic">No treatment plan recorded</span>}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {clinicalNote && (
        <div className="flex items-center justify-between text-[8px] font-mono text-white/30 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-3 h-3" />
            <span>
              {clinicalNote.updated_at 
                ? new Date(clinicalNote.updated_at).toLocaleString('es-VE', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : "NEVER_UPDATED"
              }
            </span>
          </div>
          {clinicalNote.is_locked && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-sm">
              <LockClosedIcon className="w-3 h-3 text-red-400" />
              <span className="text-[7px] font-black uppercase tracking-wider text-red-400">
                SECURED
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}