// src/components/Consultation/MedicalReferralsPanel.tsx
import { useState, useEffect } from "react";
import {
  useMedicalReferrals,
  useCreateMedicalReferral,
  useUpdateMedicalReferral,
  useDeleteMedicalReferral,
} from "../../hooks/consultations/useMedicalReferrals";
import { useSpecialties } from "../../hooks/consultations/useSpecialties";
import type { Specialty } from "../../types/config";
import type { MedicalReferral, Diagnosis } from "../../types/consultation";
import SpecialtyComboboxElegante from "./SpecialtyComboboxElegante";
import { 
  ArrowTopRightOnSquareIcon, 
  TrashIcon, 
  PencilSquareIcon,
  PlusIcon,
  TagIcon,
  ShieldCheckIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
const URGENCY_CONFIG = {
  routine: { label: "RUTINA", color: "text-slate-400", bgColor: "bg-slate-500/15", borderColor: "border-slate-500/25" },
  urgent: { label: "URGENTE", color: "text-amber-400", bgColor: "bg-amber-500/15", borderColor: "border-amber-500/25" },
  stat: { label: "STAT", color: "text-red-400", bgColor: "bg-red-500/15", borderColor: "border-red-500/25" },
};
const STATUS_CONFIG = {
  issued: { label: "EMITIDA", color: "text-blue-400", bgColor: "bg-blue-500/15", borderColor: "border-blue-500/25" },
  accepted: { label: "ACEPTADA", color: "text-emerald-400", bgColor: "bg-emerald-500/15", borderColor: "border-emerald-500/25" },
  rejected: { label: "RECHAZADA", color: "text-red-400", bgColor: "bg-red-500/15", borderColor: "border-red-500/25" },
  completed: { label: "COMPLETADA", color: "text-purple-400", bgColor: "bg-purple-500/15", borderColor: "border-purple-500/25" },
};
export interface MedicalReferralsPanelProps {
  appointmentId: number;
  diagnoses?: Diagnosis[];
  readOnly?: boolean;
}
export default function MedicalReferralsPanel({ 
  appointmentId, 
  diagnoses = [], 
  readOnly = false 
}: MedicalReferralsPanelProps) {
  const { data, isLoading } = useMedicalReferrals(appointmentId);
  const referrals = Array.isArray(data) ? data : [];
  
  const { mutateAsync: createReferral } = useCreateMedicalReferral();
  const { mutateAsync: updateReferralMutation } = useUpdateMedicalReferral();
  const { mutateAsync: deleteReferral } = useDeleteMedicalReferral();
  
  const [referredToExternal, setReferredToExternal] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<Specialty[]>([]);
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number | null>(null);
  const { data: specialties = [] } = useSpecialties("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"issued" | "accepted" | "rejected">("issued");
  const [editingReferral, setEditingReferral] = useState<MedicalReferral | null>(null);
  
  useEffect(() => {
    setReferredToExternal("");
    setReason("");
    setSelectedSpecialties([]);
    setSelectedDiagnosisId(null);
    setUrgency("routine");
    setStatus("issued");
    setEditingReferral(null);
  }, [appointmentId]);
  
  const handleAdd = async () => {
    if (!referredToExternal || readOnly) return;
    try {
      await createReferral({
        appointment: appointmentId,
        diagnosis: selectedDiagnosisId,
        referred_to_external: referredToExternal,
        reason,
        specialty_ids: selectedSpecialties.map((s) => s.id),
        urgency,
        status,
      });
      setReferredToExternal("");
      setReason("");
      setSelectedSpecialties([]);
      setSelectedDiagnosisId(null);
      setUrgency("routine");
    } catch (err: any) { console.error("Error creating referral:", err); }
  };
  
  const handleUpdate = async () => {
    if (!editingReferral || readOnly) return;
    try {
      await updateReferralMutation({
        id: editingReferral.id,
        appointment: appointmentId,
        diagnosis: editingReferral.diagnosis,
        referred_to_external: editingReferral.referred_to_external,
        reason: editingReferral.reason,
        specialty_ids: editingReferral.specialties?.map((s) => s.id) || [],
        urgency: editingReferral.urgency,
        status: editingReferral.status,
      });
      setEditingReferral(null);
    } catch (err: any) { console.error("Error updating referral:", err); }
  };
  
  const getReferredToDisplay = (r: MedicalReferral): string => {
    return r.referred_to || r.referred_to_external || "Sin destino especificado";
  };
  return (
    <div className="border border-white/15 bg-white/5 rounded-lg overflow-hidden">
      <div className="bg-white/5 px-5 py-3 border-b border-white/15 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowTopRightOnSquareIcon className="w-5 h-5 text-emerald-400" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-white">
            Protocolo de Referencia Externa
          </span>
        </div>
        {isLoading && <span className="text-[9px] animate-pulse text-emerald-400">Sincronizando...</span>}
      </div>
      
      <div className="p-5 space-y-4">
        <div className="space-y-3">
          {referrals.length === 0 ? (
            <div className="text-[11px] text-white/50 italic py-2">
              No hay referencias registradas
            </div>
          ) : (
            referrals.map((r) => {
              const urgencyConfig = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.routine;
              const statusConfig = STATUS_CONFIG[r.status] || STATUS_CONFIG.issued;
              
              return (
                <div key={r.id} className="border border-white/15 bg-white/5 p-4 rounded-lg space-y-3">
                  {editingReferral?.id === r.id ? (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <input
                        type="text"
                        value={editingReferral.referred_to_external || ""}
                        onChange={(e) => setEditingReferral({ ...editingReferral, referred_to_external: e.target.value })}
                        className="w-full bg-white/5 border border-emerald-500/30 p-3 text-[12px] text-white outline-none focus:border-emerald-500/50 rounded-lg"
                        placeholder="Destino de la referencia..."
                      />
                      <textarea
                        value={editingReferral.reason || ""}
                        onChange={(e) => setEditingReferral({ ...editingReferral, reason: e.target.value })}
                        className="w-full bg-white/5 border border-emerald-500/30 p-3 text-[12px] text-white min-h-[60px] outline-none focus:border-emerald-500/50 rounded-lg"
                        placeholder="Motivo clínico..."
                      />
                      <div className="flex gap-2">
                        <button onClick={handleUpdate} className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-4 py-2 text-[10px] font-bold uppercase rounded-lg">
                          <CheckIcon className="w-4 h-4" /> Guardar
                        </button>
                        <button onClick={() => setEditingReferral(null)} className="flex items-center gap-1.5 bg-white/5 text-white/60 px-4 py-2 text-[10px] font-bold uppercase rounded-lg hover:bg-white/10">
                          <XMarkIcon className="w-4 h-4" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-white uppercase">
                            → {getReferredToDisplay(r)}
                          </span>
                          {r.reason && (
                            <span className="text-[11px] text-white/60 leading-relaxed mt-1">
                              {r.reason}
                            </span>
                          )}
                          {r.clinical_summary && (
                            <span className="text-[10px] text-white/40 leading-relaxed mt-1 italic">
                              {r.clinical_summary}
                            </span>
                          )}
                        </div>
                        {!readOnly && (
                          <div className="flex gap-1">
                            <button onClick={() => setEditingReferral(r)} className="p-2 text-white/50 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors">
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteReferral({ id: r.id, appointment: appointmentId })} className="p-2 text-white/50 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {(r.doctor || r.institution) && (
                        <div className="flex items-center gap-3 text-[10px] text-white/60 mt-1 border-t border-white/10 pt-2">
                          {r.doctor && (
                            <div className="flex items-center gap-1">
                              <UserGroupIcon className="w-4 h-4" />
                              <span>{r.doctor.full_name}</span>
                              {r.doctor.is_verified && (
                                <ShieldCheckIcon className="w-4 h-4 inline ml-1 text-emerald-500" />
                              )}
                            </div>
                          )}
                          {r.doctor && r.institution && <span className="text-white/20">•</span>}
                          {r.institution && (
                            <div className="flex items-center gap-1">
                              <BuildingOfficeIcon className="w-4 h-4" />
                              <span>{r.institution.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 items-center">
                        {r.specialties?.map(s => (
                          <span key={s.id} className="flex items-center gap-1 text-[9px] font-medium bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25 uppercase">
                            <TagIcon className="w-3 h-3" /> {s.name}
                          </span>
                        ))}
                        
                        <span className={`flex items-center gap-1 text-[9px] font-medium ${urgencyConfig.bgColor} ${urgencyConfig.color} ${urgencyConfig.borderColor} border px-2 py-0.5 rounded uppercase`}>
                          {r.urgency === "stat" && <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
                          {r.urgency === "urgent" && <ClockIcon className="w-3.5 h-3.5" />}
                          {urgencyConfig.label}
                        </span>
                        
                        <span className={`text-[9px] font-medium ${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor} border px-2 py-0.5 rounded uppercase`}>
                          {statusConfig.label}
                        </span>
                        
                        {r.is_internal && (
                          <span className="text-[9px] font-medium text-purple-400 bg-purple-500/15 border border-purple-500/25 px-2 py-0.5 rounded uppercase">
                            INTERNA
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {!readOnly && (
          <div className="mt-6 pt-6 border-t border-white/15 space-y-4">
            {diagnoses.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
                  Diagnóstico Relacionado (Recomendado)
                </label>
                <select 
                  value={selectedDiagnosisId || ""} 
                  onChange={(e) => setSelectedDiagnosisId(Number(e.target.value) || null)}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-[12px] text-white/80 outline-none focus:border-emerald-500/50 rounded-lg"
                >
                  <option value="">Sin diagnóstico específico</option>
                  {diagnoses.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icd_code} - {d.title || d.name || "Sin título"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Especialista o Centro Destino</label>
                <input
                  type="text"
                  placeholder="Ej: Unidad de Oncología Clínica"
                  value={referredToExternal}
                  onChange={(e) => setReferredToExternal(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 p-2.5 text-[12px] text-white/80 focus:border-emerald-500/50 outline-none rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Especialidades</label>
                <SpecialtyComboboxElegante
                  value={selectedSpecialties}
                  onChange={setSelectedSpecialties}
                  options={specialties}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Justificación Clínica</label>
              <textarea
                placeholder="Describir la motivación para la interconsulta..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-white/5 border border-white/15 p-3 text-[12px] text-white/80 focus:border-emerald-500/50 outline-none min-h-[70px] resize-none rounded-lg"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-end justify-between">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Nivel de Urgencia</label>
                <select 
                  value={urgency} 
                  onChange={(e) => setUrgency(e.target.value as any)} 
                  className="bg-white/5 border border-white/15 p-2.5 text-[12px] text-white/80 outline-none focus:border-emerald-500/50 rounded-lg"
                >
                  <option value="routine">Rutina</option>
                  <option value="urgent">Urgente</option>
                  <option value="stat">STAT (Inmediato)</option>
                </select>
              </div>
              
              <button
                onClick={handleAdd}
                disabled={!referredToExternal}
                className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg"
              >
                <PlusIcon className="w-5 h-5" />
                Iniciar Referencia
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-black/20 px-5 py-3 border-t border-white/10 flex items-center gap-2">
        <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
        <span className="text-[9px] text-white/50 uppercase">
          Referencia encriptada y registrada para transferencia interinstitucional
        </span>
      </div>
    </div>
  );
}