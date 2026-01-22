// src/components/Consultation/MedicalReferralsPanel.tsx
import { useState } from "react";
import {
  useMedicalReferrals,
  useCreateMedicalReferral,
  useUpdateMedicalReferral,
  useDeleteMedicalReferral,
} from "../../hooks/consultations/useMedicalReferrals";
import { useSpecialties } from "../../hooks/consultations/useSpecialties";
import type { Specialty } from "../../types/config";
import type { MedicalReferral } from "../../types/consultation";
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
  UserGroupIcon,         // ✅ AGREGADO: Icono para doctor
  BuildingOfficeIcon     // ✅ AGREGADO: Icono para institución
} from "@heroicons/react/24/outline";
export interface MedicalReferralsPanelProps {
  appointmentId: number;
  readOnly?: boolean;
}
export default function MedicalReferralsPanel({ appointmentId, readOnly = false }: MedicalReferralsPanelProps) {
  const { data, isLoading } = useMedicalReferrals(appointmentId);
  const referrals = Array.isArray(data) ? data : [];
  // Hooks con nombres de mutación claros para evitar colisiones
  const { mutateAsync: createReferral } = useCreateMedicalReferral();
  const { mutateAsync: updateReferralMutation } = useUpdateMedicalReferral();
  const { mutateAsync: deleteReferral } = useDeleteMedicalReferral();
  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<Specialty[]>([]);
  const { data: specialties = [] } = useSpecialties("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"issued" | "accepted" | "rejected">("issued");
  
  // Estado para manejar la edición
  const [editingReferral, setEditingReferral] = useState<MedicalReferral | null>(null);
  
  const handleAdd = async () => {
    if (!referredTo || readOnly) return;
    try {
      await createReferral({
        appointment: appointmentId,
        referred_to: referredTo,
        reason,
        specialty_ids: selectedSpecialties.map((s) => s.id),
        urgency,
        status,
      });
      setReferredTo("");
      setReason("");
      setSelectedSpecialties([]);
      setUrgency("routine");
    } catch (err: any) { console.error("Error creating referral:", err); }
  };
  
  const handleUpdate = async () => {
    if (!editingReferral || readOnly) return;
    try {
      await updateReferralMutation({
        id: editingReferral.id,
        appointment: appointmentId,
        referred_to: editingReferral.referred_to,
        reason: editingReferral.reason,
        specialty_ids: editingReferral.specialties?.map((s) => s.id) || [],
        urgency: editingReferral.urgency,
        status: editingReferral.status,
      });
      setEditingReferral(null);
    } catch (err: any) { console.error("Error updating referral:", err); }
  };
  
  return (
    <div className="border border-[var(--palantir-border)] bg-white/5 rounded-sm overflow-hidden">
      {/* HEADER */}
      <div className="bg-white/5 px-4 py-3 border-b border-[var(--palantir-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowTopRightOnSquareIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
            External_Referral_Protocol
          </span>
        </div>
        {isLoading && <span className="text-[8px] animate-pulse font-mono text-[var(--palantir-active)]">SYNCING_DATA...</span>}
      </div>
      <div className="p-4 space-y-4">
        {/* LISTA DE REFERENCIAS */}
        <div className="space-y-3">
          {referrals.length === 0 ? (
            <div className="text-[10px] font-mono text-[var(--palantir-muted)] opacity-50 italic py-2">
              NO_OUTGOING_REFERRALS_REGISTERED
            </div>
          ) : (
            referrals.map((r) => (
              <div key={r.id} className="border border-white/5 bg-white/[0.02] p-3 rounded-sm space-y-3">
                {editingReferral?.id === r.id ? (
                  /* MODO EDICIÓN DENTRO DE LA LISTA */
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <input
                      type="text"
                      value={editingReferral.referred_to}
                      onChange={(e) => setEditingReferral({ ...editingReferral, referred_to: e.target.value })}
                      className="w-full bg-black/60 border border-[var(--palantir-active)]/50 p-2 text-[10px] font-mono text-white outline-none"
                    />
                    <textarea
                      value={editingReferral.reason || ""}
                      onChange={(e) => setEditingReferral({ ...editingReferral, reason: e.target.value })}
                      className="w-full bg-black/60 border border-[var(--palantir-active)]/50 p-2 text-[10px] font-mono text-white min-h-[60px] outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleUpdate} className="flex items-center gap-1 bg-[var(--palantir-active)] text-white px-3 py-1 text-[9px] font-black uppercase">
                        <CheckIcon className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => setEditingReferral(null)} className="flex items-center gap-1 bg-white/10 text-white px-3 py-1 text-[9px] font-black uppercase">
                        <XMarkIcon className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* MODO VISTA */
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[var(--palantir-text)] uppercase tracking-tight">
                          To: {r.referred_to}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--palantir-muted)] leading-relaxed mt-1">
                          {r.reason}
                        </span>
                      </div>
                      {!readOnly && (
                        <div className="flex gap-1">
                          <button onClick={() => setEditingReferral(r)} className="p-1 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-colors">
                            <PencilSquareIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteReferral({ id: r.id, appointment: appointmentId })} className="p-1 text-[var(--palantir-muted)] hover:text-red-400 transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* ✅ AGREGADO: METADATA DE DOCTOR E INSTITUCIÓN (FASE 1) */}
                    {(r.doctor || r.institution) && (
                      <div className="flex items-center gap-3 text-xs font-mono text-[var(--palantir-muted)] mt-1 border-t border-white/5 pt-2">
                        {r.doctor && (
                          <div className="flex items-center gap-1">
                            <UserGroupIcon className="w-3.5 h-3.5" />
                            <span>{r.doctor.full_name}</span>
                            {r.doctor.is_verified && (
                              <ShieldCheckIcon className="w-3.5 h-3.5 inline ml-1 text-emerald-500" />
                            )}
                          </div>
                        )}
                        {r.doctor && r.institution && <span className="text-white/20">•</span>}
                        {r.institution && (
                          <div className="flex items-center gap-1">
                            <BuildingOfficeIcon className="w-3.5 h-3.5" />
                            <span>{r.institution.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      {r.specialties?.map(s => (
                        <span key={s.id} className="flex items-center gap-1 text-[8px] font-black bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] px-1.5 py-0.5 rounded border border-[var(--palantir-active)]/20 uppercase">
                          <TagIcon className="w-2.5 h-2.5" /> {s.name}
                        </span>
                      ))}
                      <span className="text-[8px] font-mono text-[var(--palantir-muted)] border border-white/10 px-1.5 py-0.5 rounded uppercase">
                        {r.urgency}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* FORMULARIO DE NUEVA REFERENCIA */}
        {!readOnly && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Target_Facility_Specialist</label>
                <input
                  type="text"
                  placeholder="E.G. CLINICAL_ONCOLOGY_UNIT"
                  value={referredTo}
                  onChange={(e) => setReferredTo(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--palantir-border)] p-2.5 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Referral_Specialties</label>
                <SpecialtyComboboxElegante
                  value={selectedSpecialties}
                  onChange={setSelectedSpecialties}
                  options={specialties}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Clinical_Justification</label>
              <textarea
                placeholder="DESCRIBE_MOTIVATION_FOR_INTERCONSULTATION..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none min-h-[70px] resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-4 items-end justify-between">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Urgency_Level</label>
                <select 
                  value={urgency} 
                  onChange={(e) => setUrgency(e.target.value as any)} 
                  className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono text-[var(--palantir-text)] outline-none focus:border-[var(--palantir-active)]"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={!referredTo}
                className="flex items-center gap-2 bg-[var(--palantir-active)] hover:bg-blue-600 text-white px-5 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Initialize_Referral
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="bg-black/20 px-4 py-2 border-t border-[var(--palantir-border)] flex items-center gap-2">
        <ShieldCheckIcon className="w-3 h-3 text-[var(--palantir-active)]" />
        <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
          Referral encrypted and logged for inter-institutional transfer
        </span>
      </div>
    </div>
  );
}