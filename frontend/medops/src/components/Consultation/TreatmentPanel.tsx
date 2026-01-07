// src/components/Consultation/TreatmentPanel.tsx
import React, { useState } from "react";
import { Diagnosis, Treatment } from "../../types/consultation";
import TreatmentBadge, {
  TreatmentStatus,
  TreatmentType,
} from "./TreatmentBadge";
import { useUpdateTreatment } from "../../hooks/consultations/useUpdateTreatment";
import { useDeleteTreatment } from "../../hooks/consultations/useDeleteTreatment";
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

function normalizeStatus(status: TreatmentStatus | undefined): "active" | "completed" | "cancelled" | undefined {
  if (!status) return undefined;
  return status === "suspended" ? "cancelled" : status;
}

function normalizeType(type: TreatmentType | undefined): "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other" | undefined {
  if (!type) return undefined;
  if (type === "therapeutic") return "rehabilitation";
  return type;
}

const TreatmentPanel: React.FC<TreatmentPanelProps> = ({
  diagnoses,
  appointmentId,
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
          diagnoses.map((d) => (
            <div key={d.id} className="border-l border-[var(--palantir-border)] pl-4 py-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] px-2 py-0.5 rounded text-[9px] font-black font-mono border border-[var(--palantir-active)]/20">
                  {d.icd_code}
                </span>
                <h4 className="text-[11px] font-bold uppercase tracking-tight text-[var(--palantir-text)] opacity-80">
                  {d.title || "Untitled_Condition"}
                </h4>
              </div>

              <div className="grid gap-2 ml-4">
                {d.treatments && d.treatments.length > 0 ? (
                  d.treatments.map((t: Treatment) => (
                    <TreatmentBadge
                      key={t.id}
                      id={t.id}
                      plan={t.plan}
                      start_date={t.start_date}
                      end_date={t.end_date}
                      status={t.status as TreatmentStatus}
                      treatment_type={t.treatment_type as TreatmentType}
                      {...(!readOnly && {
                        onEdit: (id, newPlan, start, end, newStatus, newType) =>
                          updateTreatment({
                            id,
                            plan: newPlan,
                            start_date: start ?? undefined,
                            end_date: end ?? undefined,
                            status: normalizeStatus(newStatus),
                            treatment_type: normalizeType(newType),
                          }),
                        onDelete: (id) => deleteTreatment(id),
                      })}
                    />
                  ))
                ) : (
                  <span className="text-[9px] font-mono uppercase text-[var(--palantir-muted)] italic pl-2">
                    // No_Treatments_Assigned
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW TREATMENT FORM (Command Area) */}
      {!readOnly && diagnoses.length > 0 && (
        <div className="mt-10 pt-6 border-t border-[var(--palantir-border)]">
          <form onSubmit={handleSubmit} className="bg-white/5 border border-[var(--palantir-border)] p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <PlusIcon className="w-4 h-4 text-[var(--palantir-active)]" />
              <span className="text-[9px] font-black uppercase tracking-widest">Add_New_Procedure</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Diagnosis Link */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Condition_Link</label>
                <div className="relative">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--palantir-muted)]" />
                  <select
                    value={diagnosisId}
                    onChange={(e) => setDiagnosisId(Number(e.target.value))}
                    required
                    className="w-full bg-black/40 border border-[var(--palantir-border)] pl-10 pr-4 py-2.5 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none appearance-none"
                  >
                    <option value="">SELECT_DIAGNOSIS</option>
                    {diagnoses.map((d) => (
                      <option key={d.id} value={d.id}>[{d.icd_code}] {d.title || d.description}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Treatment Type */}
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Modality</label>
                <div className="relative">
                  <QueueListIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--palantir-muted)]" />
                  <select
                    value={treatmentType}
                    onChange={(e) => setTreatmentType(e.target.value as any)}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] pl-10 pr-4 py-2.5 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none appearance-none"
                  >
                    <option value="pharmacological">PHARMACOLOGICAL</option>
                    <option value="surgical">SURGICAL</option>
                    <option value="rehabilitation">REHABILITATION</option>
                    <option value="lifestyle">LIFESTYLE_MOD</option>
                    <option value="other">OTHER_PROCEDURE</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Plan Textarea */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Clinical_Plan_Details</label>
              <textarea
                placeholder="DEFINE_INTERVENTION_STEPS..."
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                required
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[11px] font-mono focus:border-[var(--palantir-active)] outline-none min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Start_Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--palantir-border)] px-4 py-2 text-[11px] font-mono outline-none focus:border-[var(--palantir-active)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-[var(--palantir-muted)] ml-1">Estimated_End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--palantir-border)] px-4 py-2 text-[11px] font-mono outline-none focus:border-[var(--palantir-active)]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-[var(--palantir-active)] hover:bg-blue-600 text-white h-[38px] flex items-center justify-center gap-2 transition-all group"
                >
                  <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Execute_Add</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TreatmentPanel;
