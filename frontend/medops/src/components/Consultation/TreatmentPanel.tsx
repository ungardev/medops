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
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  
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
    if (window.confirm("¿Confirmar eliminación del tratamiento?")) {
      setDeletingIds(prev => new Set(prev).add(id));
      Promise.resolve(deleteTreatment(id)).finally(() => {
        setDeletingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <ClipboardDocumentListIcon className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold uppercase tracking-wider text-white">
          Matriz de Intervención Clínica
        </span>
      </div>
      <div className="space-y-6">
        {diagnoses.length === 0 ? (
          <div className="p-8 border border-dashed border-white/15 text-center opacity-50 rounded-xl">
            <span className="text-xs text-white/70">Esperando diagnóstico...</span>
          </div>
        ) : (
          diagnoses.map((d) => {
            const diagnosisTreatments = treatments?.filter((t) => t.diagnosis === d.id) || [];
            return (
              <div key={d.id} className="space-y-3">
                <div className="flex items-start gap-3 pb-3 border-b border-white/15">
                  <div className="flex-shrink-0 w-9 h-9 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center justify-center">
                    <TagIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold uppercase tracking-wider text-white">
                      {d.icd_code} {d.title}
                    </p>
                    <p className="text-xs text-white/70 mt-0.5">
                      {d.type} • {d.status}
                    </p>
                  </div>
                  <span className="text-xs text-white/70">
                    {diagnosisTreatments.length} tratamiento{diagnosisTreatments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {diagnosisTreatments.length === 0 ? (
                  <div className="pl-11 opacity-40">
                    <span className="text-xs text-white/70 italic">Sin tratamientos asignados</span>
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
                        isOptimistic={(t as any).isOptimistic}
                        isDeleting={deletingIds.has(t.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {!readOnly && (
        <div className="mt-8 pt-6 border-t border-white/15">
          <div className="flex items-center gap-2 mb-4">
            <PlusIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Asignar Nuevo Tratamiento
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Diagnóstico Objetivo
                </label>
                <select
                  value={diagnosisId}
                  onChange={(e) => setDiagnosisId(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                  required
                >
                  <option value="">Seleccionar diagnóstico</option>
                  {diagnoses.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icd_code} - {d.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Tipo de Tratamiento
                </label>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                >
                  <option value="pharmacological">Farmacológico</option>
                  <option value="surgical">Quirúrgico</option>
                  <option value="rehabilitation">Rehabilitación</option>
                  <option value="lifestyle">Estilo de Vida</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                >
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Fecha de Inicio
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 p-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 rounded-xl [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Fecha de Fin
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 p-2.5 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 rounded-xl [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-1">
                  Protocolo de Tratamiento
                </label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="Describir el protocolo de tratamiento..."
                  className="w-full bg-white/5 border border-white/15 p-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 min-h-[80px] rounded-xl"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 py-3 text-xs font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-all rounded-xl"
            >
              Iniciar Tratamiento
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
export default TreatmentPanel;