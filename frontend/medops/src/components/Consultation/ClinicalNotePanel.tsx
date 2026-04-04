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
  DocumentTextIcon,
  PencilSquareIcon,
  EyeIcon,
  ClockIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import type { ClinicalNote } from "../../types/clinical";
export interface Props {
  appointmentId: number;
  readOnly?: boolean;
}
export default function ClinicalNotePanel({ appointmentId, readOnly = false }: Props) {
  const { data: clinicalNote, isLoading } = useClinicalNote(appointmentId);
  const updateNote = useUpdateClinicalNote(appointmentId);
  const lockNote = useLockClinicalNote(appointmentId);
  const unlockNote = useUnlockClinicalNote(appointmentId);
  const createNote = useCreateClinicalNote();
  
  const [isEditing, setIsEditing] = useState(false);
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [plan, setPlan] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    if (clinicalNote) {
      setSubjective(clinicalNote.subjective || "");
      setObjective(clinicalNote.objective || "");
      setAnalysis(clinicalNote.analysis || "");
      setPlan(clinicalNote.plan || "");
    }
  }, [clinicalNote]);
  
  const handleSave = async () => {
    if (!appointmentId) {
      setSaveError("Error: Appointment ID is missing");
      return;
    }
    try {
      setSaveError(null);
      setSaveSuccess(false);
      
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      setSaveError(error?.response?.data?.error || error?.message || "Error al guardar la nota");
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    setSubjective(clinicalNote?.subjective || "");
    setObjective(clinicalNote?.objective || "");
    setAnalysis(clinicalNote?.analysis || "");
    setPlan(clinicalNote?.plan || "");
  };
  
  const handleLock = async () => {
    if (!appointmentId) return;
    try {
      await lockNote.mutateAsync();
    } catch (error) { 
      console.error("Failed to lock note:", error); 
    }
  };
  
  const handleUnlock = async () => {
    if (!appointmentId) return;
    try {
      await unlockNote.mutateAsync();
    } catch (error) { 
      console.error("Failed to unlock note:", error); 
    }
  };
  
  const isSaving = updateNote.isPending || createNote.isPending;
  
  const labelStyles = "text-[12px] font-bold text-white/80 uppercase tracking-wider mb-2 block";
  const sublabelStyles = "text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1 block";
  const inputStyles = "w-full min-h-[100px] p-3 bg-white/5 border border-white/15 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 rounded-lg transition-all resize-none";
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="border border-white/15 rounded-lg">
      <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/15">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-5 h-5 text-emerald-400" />
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-white">
            Nota Clínica
          </h3>
          {clinicalNote?.is_locked && (
            <LockClosedIcon className="w-4 h-4 text-red-400 animate-pulse" />
          )}
          {saveSuccess && (
            <span className="text-[11px] text-emerald-400 font-bold">✓ Guardado</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!readOnly && clinicalNote && (
            clinicalNote.is_locked ? (
              <button 
                onClick={handleUnlock} 
                disabled={unlockNote.isPending}
                className="p-2 text-white/50 hover:text-emerald-400 disabled:opacity-50 rounded-lg hover:bg-white/5 transition-colors"
                title="Desbloquear nota"
              >
                <LockOpenIcon className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleLock} 
                disabled={lockNote.isPending}
                className="p-2 text-white/50 hover:text-red-400 disabled:opacity-50 rounded-lg hover:bg-white/5 transition-colors"
                title="Bloquear nota"
              >
                <LockClosedIcon className="w-5 h-5" />
              </button>
            )
          )}
          
          {!readOnly && !clinicalNote?.is_locked && (
            isEditing ? (
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className={`p-2 rounded-lg transition-colors ${
                    isSaving 
                      ? 'text-white/20 cursor-not-allowed' 
                      : 'text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title="Guardar"
                >
                  <CheckCircleIcon className={`w-5 h-5 ${isSaving ? 'animate-pulse' : ''}`} />
                </button>
                <button 
                  onClick={handleCancel} 
                  disabled={isSaving}
                  className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-2 text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                title="Editar"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            )
          )}
          
          {readOnly && clinicalNote && (
            <button className="p-2 text-white/50 hover:text-blue-400 rounded-lg hover:bg-white/5 transition-colors" title="Ver">
              <EyeIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {saveError && (
        <div className="px-5 py-3 bg-red-500/15 border-b border-red-500/30">
          <span className="text-[11px] text-red-400">{saveError}</span>
        </div>
      )}
      
      <div className="p-5">
        {isEditing && !clinicalNote?.is_locked && !readOnly ? (
          <div className="space-y-5">
            <div>
              <label className={labelStyles}>Exploración</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className={sublabelStyles}>Subjetivo (Síntomas)</span>
                  <textarea 
                    value={subjective} 
                    onChange={(e) => setSubjective(e.target.value)} 
                    className={inputStyles} 
                    placeholder="Descripción de los síntomas del paciente..." 
                  />
                </div>
                <div>
                  <span className={sublabelStyles}>Objetivo (Hallazgos)</span>
                  <textarea 
                    value={objective} 
                    onChange={(e) => setObjective(e.target.value)} 
                    className={inputStyles} 
                    placeholder="Hallazgos del examen físico..." 
                  />
                </div>
              </div>
            </div>
            <div>
              <label className={labelStyles}>Evaluación</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className={sublabelStyles}>Análisis</span>
                  <textarea 
                    value={analysis} 
                    onChange={(e) => setAnalysis(e.target.value)} 
                    className={inputStyles} 
                    placeholder="Interpretación clínica..." 
                  />
                </div>
                <div>
                  <span className={sublabelStyles}>Plan</span>
                  <textarea 
                    value={plan} 
                    onChange={(e) => setPlan(e.target.value)} 
                    className={inputStyles} 
                    placeholder="Plan de tratamiento..." 
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <span className="text-[12px] font-bold text-emerald-400 uppercase tracking-wider">Exploración</span>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <span className={sublabelStyles}>Subjetivo</span>
                  <p className="text-[13px] text-white leading-relaxed">{subjective || '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <span className={sublabelStyles}>Objetivo</span>
                  <p className="text-[13px] text-white leading-relaxed">{objective || '—'}</p>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[12px] font-bold text-blue-400 uppercase tracking-wider">Evaluación</span>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <span className={sublabelStyles}>Análisis</span>
                  <p className="text-[13px] text-white leading-relaxed">{analysis || '—'}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <span className={sublabelStyles}>Plan</span>
                  <p className="text-[13px] text-white leading-relaxed">{plan || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {clinicalNote && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-[10px] text-white/60">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            <span>{clinicalNote.updated_at ? new Date(clinicalNote.updated_at).toLocaleString('es-VE') : 'Nunca'}</span>
          </div>
          {clinicalNote.is_locked && (
            <span className="text-red-400 font-bold">BLOQUEADA</span>
          )}
        </div>
      )}
    </div>
  );
}