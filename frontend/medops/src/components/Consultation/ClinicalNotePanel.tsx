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
      if (clinicalNote) await lockNote.mutateAsync();
    } catch (error) { console.error("Failed to lock note:", error); }
  };
  
  const handleUnlock = async () => {
    try {
      if (clinicalNote) await unlockNote.mutateAsync();
    } catch (error) { console.error("Failed to unlock note:", error); }
  };
  
  // ✅ ESTILOS UNIFICADOS AL MISMO NIVEL QUE OTROS PANELES
  const labelStyles = "text-[9px] font-bold text-white/50 uppercase tracking-wider mb-2 block";
  const inputStyles = "w-full h-24 p-3 bg-black/40 border border-white/10 text-white text-[11px] font-mono placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 rounded-sm transition-all resize-none";
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // ✅ CONTENEDOR UNIFICADO - Mismo nivel que VitalSignsPanel
  return (
    <div className="border border-white/10 rounded-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/10">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-4 h-4 text-emerald-400" />
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-white">
            CLINICAL_NOTES
          </h3>
          {clinicalNote?.is_locked && (
            <LockClosedIcon className="w-3 h-3 text-red-500 animate-pulse" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!readOnly && clinicalNote && (
            clinicalNote.is_locked ? (
              <button onClick={handleUnlock} disabled={unlockNote.isPending} className="p-1 text-white/40 hover:text-green-400">
                <LockOpenIcon className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleLock} disabled={lockNote.isPending} className="p-1 text-white/40 hover:text-red-400">
                <LockClosedIcon className="w-4 h-4" />
              </button>
            )
          )}
          
          {!readOnly && !clinicalNote?.is_locked && (
            isEditing ? (
              <div className="flex items-center gap-1">
                <button onClick={handleSave} disabled={updateNote.isPending || createNote.isPending} className="p-1 text-white/40 hover:text-emerald-400">
                  <CheckCircleIcon className="w-4 h-4" />
                </button>
                <button onClick={handleCancel} className="p-1 text-white/40 hover:text-red-400">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-1 text-white/40 hover:text-emerald-400">
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>
      
      {/* CONTENIDO - ✅ Simplificado, mismo nivel */}
      <div className="p-4">
        {isEditing && !clinicalNote?.is_locked && !readOnly ? (
          <div className="space-y-4">
            {/* EXPLORATION */}
            <div>
              <label className={labelStyles}>EXPLORATION</label>
              <div className="grid grid-cols-2 gap-3">
                <textarea value={subjective} onChange={(e) => setSubjective(e.target.value)} className={inputStyles} placeholder="Symptoms..." />
                <textarea value={objective} onChange={(e) => setObjective(e.target.value)} className={inputStyles} placeholder="Findings..." />
              </div>
            </div>
            {/* EVALUATION */}
            <div>
              <label className={labelStyles}>EVALUATION</label>
              <div className="grid grid-cols-2 gap-3">
                <textarea value={analysis} onChange={(e) => setAnalysis(e.target.value)} className={inputStyles} placeholder="Analysis..." />
                <textarea value={plan} onChange={(e) => setPlan(e.target.value)} className={inputStyles} placeholder="Plan..." />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-[9px] font-bold text-emerald-400 uppercase">EXPLORATION</span>
              <div className="mt-1 grid grid-cols-2 gap-3 text-[11px]">
                <div><span className="text-white/30 text-[8px] block">SUBJECTIVE</span><span className="text-white">{subjective || '—'}</span></div>
                <div><span className="text-white/30 text-[8px] block">OBJECTIVE</span><span className="text-white">{objective || '—'}</span></div>
              </div>
            </div>
            <div>
              <span className="text-[9px] font-bold text-blue-400 uppercase">EVALUATION</span>
              <div className="mt-1 grid grid-cols-2 gap-3 text-[11px]">
                <div><span className="text-white/30 text-[8px] block">ANALYSIS</span><span className="text-white">{analysis || '—'}</span></div>
                <div><span className="text-white/30 text-[8px] block">PLAN</span><span className="text-white">{plan || '—'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* FOOTER */}
      {clinicalNote && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-[8px] text-white/30">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-3 h-3" />
            <span>{clinicalNote.updated_at ? new Date(clinicalNote.updated_at).toLocaleString('es-VE') : 'NEVER'}</span>
          </div>
          {clinicalNote.is_locked && (
            <span className="text-red-400 font-bold">SECURED</span>
          )}
        </div>
      )}
    </div>
  );
}