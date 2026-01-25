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
// 🔧 CORRECCIÓN OPCIÓN 1: Exportar la interfaz Props
export interface Props {              // ✅ AGREGADO: 'export' para hacer disponible la interfaz
  appointmentId: number;
  readOnly?: boolean;
}
export default function ClinicalNotePanel({ appointmentId, readOnly = false }: Props) {
  const { data: clinicalNote, isLoading } = useClinicalNote(appointmentId);
  const updateNote = useUpdateClinicalNote(clinicalNote?.id, appointmentId);
  const lockNote = useLockClinicalNote(clinicalNote?.id);
  const unlockNote = useUnlockClinicalNote(clinicalNote?.id);
  const createNote = useCreateClinicalNote(appointmentId);
  // 🔧 CORRECCIÓN: Estructura SOAP en lugar de content simple
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
      // 🔧 CORRECCIÓN: Agregar campo 'appointment' requerido por CreateClinicalNoteInput
      const noteData = {
        appointment: appointmentId,  // ✅ AGREGADO: Campo requerido
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
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-blue-500" />
          <h3 className="text-sm font-medium text-gray-900">Clinical Notes (SOAP)</h3>
          {clinicalNote?.is_locked && (
            <LockClosedIcon className="w-4 h-4 text-red-500" title="Note is locked" />
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
                      className="p-1 text-gray-500 hover:text-green-600 disabled:opacity-50"
                      title="Unlock note"
                    >
                      <LockOpenIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleLock}
                      disabled={lockNote.isPending}
                      className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
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
                        className="p-1 text-gray-500 hover:text-green-600 disabled:opacity-50"
                        title="Save note"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
                        title="Cancel editing"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
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
            <div className="flex items-center gap-1 text-xs text-red-600">
              <EyeIcon className="w-3 h-3" />
              Read-only
            </div>
          )}
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        {isEditing && !clinicalNote?.is_locked && !readOnly ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subjective</label>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  className="w-full h-20 p-2 border rounded resize-none text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Patient's symptoms and complaints..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Objective</label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full h-20 p-2 border rounded resize-none text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clinical findings and measurements..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Analysis</label>
                <textarea
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  className="w-full h-20 p-2 border rounded resize-none text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clinical interpretation..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full h-20 p-2 border rounded resize-none text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Treatment and follow-up plan..."
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Subjective:</span>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {subjective || <span className="text-gray-400 italic">No subjective notes</span>}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Objective:</span>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {objective || <span className="text-gray-400 italic">No objective findings</span>}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Analysis:</span>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {analysis || <span className="text-gray-400 italic">No analysis</span>}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Plan:</span>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {plan || <span className="text-gray-400 italic">No plan</span>}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {clinicalNote && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-3 h-3" />
            Last updated: {clinicalNote.updated_at ? new Date(clinicalNote.updated_at).toLocaleString() : "Never"}
          </div>
          {clinicalNote.is_locked && (
            <span className="text-red-600 font-medium">
              Locked for editing
            </span>
          )}
        </div>
      )}
    </div>
  );
}