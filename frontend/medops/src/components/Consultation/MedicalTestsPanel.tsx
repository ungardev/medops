// src/components/Consultation/MedicalTestsPanel.tsx
import { useState, useEffect } from "react";
import {
  useMedicalTest,
  useCreateMedicalTest,
  useDeleteMedicalTest,
} from "../../hooks/consultations/useMedicalTest";
import { 
  BeakerIcon, 
  TrashIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";
export interface MedicalTestsPanelProps {
  appointmentId: number;
  diagnosisId?: number;
  readOnly?: boolean;
}
export default function MedicalTestsPanel({ appointmentId, diagnosisId, readOnly = false }: MedicalTestsPanelProps) {
  const { data, isLoading } = useMedicalTest(appointmentId);
  const { mutateAsync: createTest } = useCreateMedicalTest();
  const { mutateAsync: deleteTest } = useDeleteMedicalTest();
  const tests = Array.isArray(data) ? data : [];
  const [testType, setTestType] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"pending" | "completed" | "cancelled">("pending");
  // ✅ FIX: Limpiar formulario cuando cambia la consulta
  useEffect(() => {
    setTestType("");
    setDescription("");
    setUrgency("routine");
    setStatus("pending");
  }, [appointmentId]);
  const handleAdd = async () => {
    if (!testType || readOnly) return;
    const payload: any = {
      appointment: appointmentId,
      test_type: testType,
      description,
      urgency,
      status,
    };
    if (diagnosisId) payload.diagnosis = diagnosisId;
    try {
      await createTest(payload);
      setTestType("");
      setDescription("");
      setUrgency("routine");
      setStatus("pending");
    } catch (err: any) {
      console.error("❌ Error:", err.message);
    }
  };
  return (
    <div className="border border-[var(--palantir-border)] bg-white/5 rounded-sm overflow-hidden">
      {/* HEADER TÉCNICO */}
      <div className="bg-white/5 px-4 py-3 border-b border-[var(--palantir-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BeakerIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
            Diagnostic_Orders_Queue
          </span>
        </div>
        <span className="text-[9px] font-mono text-[var(--palantir-muted)]">
          COUNT: {tests.length}
        </span>
      </div>
      <div className="p-4 space-y-4">
        {/* LISTA DE EXÁMENES */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-[10px] font-mono text-[var(--palantir-muted)] animate-pulse">FETCHING_TEST_DATA...</div>
          ) : tests.length === 0 ? (
            <div className="text-[10px] font-mono text-[var(--palantir-muted)] opacity-50 italic">NO_ACTIVE_ORDERS_RECORDED</div>
          ) : (
            tests.map((t: any) => (
              <div key={t.id} className="group flex items-center justify-between p-2 border border-white/5 bg-white/[0.02] hover:border-[var(--palantir-active)]/30 transition-all">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.urgency === 'stat' ? 'bg-red-500 animate-ping' : t.urgency === 'urgent' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <span className="text-[11px] font-bold text-[var(--palantir-text)] uppercase">{t.test_type_display || t.test_type}</span>
                    <span className="text-[8px] font-black px-1 bg-white/10 text-[var(--palantir-muted)] rounded-sm">
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--palantir-muted)] pl-3.5">
                    {t.description || "NO_DESCRIPTION_PROVIDED"}
                  </div>
                </div>
                {!readOnly && (
                  <button 
                    onClick={() => deleteTest({ id: t.id, appointment: appointmentId })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--palantir-muted)] hover:text-red-400 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {/* FORMULARIO DE ENTRADA (SOLO SI NO ES READONLY) */}
        {!readOnly && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Selector de Tipo */}
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Select_Procedure</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                >
                  <option value="">-- NULL_SELECT --</option>
                  <optgroup label="Laboratory" className="bg-gray-900">
                    <option value="blood_test">Análisis de sangre</option>
                    <option value="urine_test">Análisis de orina</option>
                    <option value="biopsy">Biopsia</option>
                  </optgroup>
                  <optgroup label="Imaging" className="bg-gray-900">
                    <option value="xray">Rayos X</option>
                    <option value="ultrasound">Ecografía</option>
                    <option value="ct_scan">Tomografía (TC)</option>
                    <option value="mri">Resonancia magnética</option>
                  </optgroup>
                  <optgroup label="Functional" className="bg-gray-900">
                    <option value="ecg">Electrocardiograma</option>
                    <option value="spirometry">Espirometría</option>
                  </optgroup>
                </select>
              </div>
              {/* Selector de Urgencia */}
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Priority_Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                >
                  <option value="routine">Routine_Procedure</option>
                  <option value="urgent">Urgent_Priority</option>
                  <option value="stat">STAT_Immediate</option>
                </select>
              </div>
            </div>
            {/* Notas del Examen */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Procedure_Directives</label>
              <textarea
                placeholder="ADD_SPECIFIC_INSTRUCTIONS_FOR_LAB_PERSONNEL..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none min-h-[60px] resize-none"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!testType}
              className="flex items-center gap-2 bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] border border-[var(--palantir-active)]/30 px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[var(--palantir-active)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Initialize_Order
            </button>
          </div>
        )}
      </div>
      {/* FOOTER METADATA */}
      <div className="bg-black/20 px-4 py-2 border-t border-[var(--palantir-border)] flex justify-between">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-3 h-3 text-orange-400" />
          <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
            Orders are synced with hospital laboratory information system (LIS)
          </span>
        </div>
      </div>
    </div>
  );
}