// src/components/Consultation/TreatmentPanel.tsx
import React, { useState } from "react";
import { Diagnosis, Treatment } from "../../types/consultation";
import { useUpdateTreatment } from "../../hooks/consultations/useUpdateTreatment";
import { useDeleteTreatment } from "../../hooks/consultations/useDeleteTreatment";
import TreatmentBadge from "./TreatmentBadge";
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  CalendarDaysIcon,
  TagIcon,
  QueueListIcon
} from "@heroicons/react/24/outline";
export interface TreatmentPanelProps {
  diagnoses: Diagnosis[];
  appointmentId?: number;
  treatments?: Treatment[];
  readOnly?: boolean;
  onAdd?: (data: {
    appointment: number;
    diagnosis: number;
    plan: string;
    start_date?: string;
    end_date?: string;
    status: "active" | "completed" | "cancelled";
    treatment_type: "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other";
  }) => void;
}
function normalizeStatus(status: "active" | "completed" | "cancelled" | "suspended" | undefined): "active" | "completed" | "cancelled" | undefined {
  if (!status) return undefined;
  return status === "suspended" ? "cancelled" : status;
}
function normalizeType(type: "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "therapeutic" | "other" | undefined): "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other" | undefined {
  if (!type) return undefined;
  if (type === "therapeutic") return "rehabilitation";
  return type;
}
const TreatmentPanel: React.FC<TreatmentPanelProps> = ({
  diagnoses,
  appointmentId,
  treatments,
  readOnly,
  onAdd,
}) => {
  const [diagnosisId, setDiagnosisId] = useState<number | "">("");
  const [plan, setPlan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "cancelled">("active");
  const [treatmentType, setTreatmentType] = useState<
    "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other"
  >("pharmacological");
  
  const { mutate: updateTreatment } = useUpdateTreatment();
  const { mutate: deleteTreatment } = useDeleteTreatment();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisId || !plan.trim() || !appointmentId || !onAdd) return;
    
    onAdd({
      appointment: appointmentId,
      diagnosis: Number(diagnosisId),
      plan: plan.trim(),
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status,
      treatment_type: treatmentType,
    });
    
    setDiagnosisId("");
    setPlan("");
    setStartDate("");
    setEndDate("");
  };
  const handleEdit = (id: number, newData: any) => {
    if (!updateTreatment) return;
    updateTreatment(newData);
  };
  const handleDelete = (id: number) => {
    if (!deleteTreatment) return;
    if (window.confirm("Confirm_Delete_Treatment?")) {
      deleteTreatment(id);
    }
  };
  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-2 mb-6">
        <ClipboardDocumentListIcon className="w-5 h-5 text-[var(--palantir-active)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
          Clinical_Intervention_Matrix
        </span>
      </div>
      {/* RENDER DIAGNOSES AND THEIR TREATMENTS */}
      <div className="space-y-6">
        {diagnoses.length === 0 ? (
          <div className="p-8 border border-dashed border-[var(--palantir-border)] text-center opacity-40">
            <span className="text-[10px] font-mono uppercase italic">Awaiting_Diagnosis_Input...</span>
          </div>
        ) : (
          diagnoses.map((d) => {
            const diagnosisTreatments = treatments?.filter((t) => t.diagnosis === d.id) || [];
            return (
              <div key={d.id} className="space-y-3">
                {/* DIAGNOSIS HEADER */}
                <div className="flex items-start gap-3 pb-3 border-b border-white/5">
                  <div className="flex-shrink-0 w-8 h-8 bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 rounded-sm flex items-center justify-center">
                    <TagIcon className="w-4 h-4 text-[var(--palantir-active)]" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[var(--palantir-text)]">
                      {d.icd_code} {d.title}
                    </p>
                    <p className="text-[9px] font-mono text-[var(--palantir-muted)] mt-0.5 uppercase">
                      {d.type} • {d.status}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-[var(--palantir-muted)]">
                    {diagnosisTreatments.length} TX
                  </span>
                </div>
                {/* TREATMENTS GRID */}
                {diagnosisTreatments.length === 0 ? (
                  <div className="pl-11 opacity-30">
                    <span className="text-[9px] font-mono uppercase italic">No_Treatments_Assigned</span>
                  </div>
                ) : (
                  <div className="pl-11 grid grid-cols-1 gap-3">
                    {diagnosisTreatments.map((t) => (
                      <TreatmentBadge
                        key={t.id}
                        treatment={t}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        showMetadata={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* ADD TREATMENT FORM */}
      {!readOnly && (
        <div className="mt-8 pt-6 border-t border-[var(--palantir-border)]">
          <div className="flex items-center gap-2 mb-4">
            <PlusIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--palantir-active)]">
              Assign_New_Treatment
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* DIAGNOSIS SELECT */}
              <div className="col-span-2">
                <label className="block text-[9px] font-mono uppercase text-[var(--palantir-muted)] mb-1">
                  Target_Diagnosis
                </label>
                <select
                  value={diagnosisId}
                  onChange={(e) => setDiagnosisId(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)]"
                  required
                >
                  <option value="">SELECT_DIAGNOSIS</option>
                  {diagnoses.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icd_code} - {d.title}
                    </option>
                  ))}
                </select>
              </div>
              {/* TREATMENT TYPE */}
              <div>
                <label className="block text-[9px] font-mono uppercase text-[var(--palantir-muted)] mb-1">
                  Treatment_Class
                </label>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value as any)}
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)]"
                >
                  <option value="pharmacological">PHARMACOLOGICAL</option>
                  <option value="surgical">SURGICAL</option>
                  <option value="rehabilitation">REHABILITATION</option>
                  <option value="lifestyle">LIFESTYLE</option>
                  <option value="other">OTHER</option>
                </select>
              </div>
              {/* STATUS */}
              <div>
                <label className="block text-[9px] font-mono uppercase text-[var(--palantir-muted)] mb-1">
                  Status_Flag
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)]"
                >
                  <option value="active">ACTIVE</option>
                  <option value="completed">COMPLETED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </div>
              {/* FIXED DATE INPUTS: Proper styling for dark mode date picker */}
              <div>
                <label className="block text-[9px] font-mono uppercase text-[var(--palantir-muted)] mb-1">
                  Init_Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-900 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-mono uppercase text-[var(--palantir-muted)] mb-1">
                  End_Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-900 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)] text-[var(--palantir-text)] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>
              {/* PLAN TEXTAREA */}
              <div className="col-span-2">
                <label className="block text-[9px] font-mono uppercase text-[var(--palantir-muted)] mb-1">
                  Treatment_Protocol
                </label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="Enter treatment protocol..."
                  className="w-full bg-gray-900 border border-[var(--palantir-border)] p-3 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)] min-h-[80px] text-[var(--palantir-text)]"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 text-[var(--palantir-active)] py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[var(--palantir-active)]/20 transition-all"
            >
              Initialize_Treatment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
export default TreatmentPanel;