// src/components/Patients/sections/ClinicalProfileSection.tsx
import React, { useState } from "react";
import {
  UserIcon,
  UsersIcon,
  SparklesIcon,
  FireIcon,
  PlusIcon,
  ChevronDownIcon,
  TrashIcon,
  PencilIcon
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../../api/client";
import ClinicalBackgroundModal from "./ClinicalBackgroundModal";
type BackgroundType = "personal" | "family" | "genetic" | "habit";
type ModalType = BackgroundType | "allergy";
interface ClinicalBackground {
  id: number;
  type: BackgroundType;
  condition: string;
  relative?: string;
  status?: string;
  source?: string;
  notes?: string;
}
interface Habit {
  id: number;
  type: string;
  frequency: string;
  impact?: string;
  description?: string;
  notes?: string;
}
interface Allergy {
  id: number;
  name: string;
  severity?: string;
  source?: string;
  notes?: string;
}
interface Props {
  backgrounds?: ClinicalBackground[];
  allergies?: Allergy[];
  habits?: Habit[];
  patientId: number;
  onRefresh?: () => void;
}
const backgroundLabels: Record<BackgroundType, string> = {
  personal: "SUBJECT_PERSONAL_HISTORY",
  family: "LINEAGE_FAMILY_HISTORY",
  genetic: "GENOMIC_PREDISPOSITIONS",
  habit: "LIFESTYLE_HABITS",
};
const backgroundIcons: Record<string, React.ElementType> = {
  personal: UserIcon,
  family: UsersIcon,
  genetic: SparklesIcon,
  habit: FireIcon,
  allergy: SparklesIcon,
};
export default function ClinicalProfileSection({
  backgrounds = [],
  allergies = [],
  habits = [],
  patientId,
  onRefresh,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>("personal");
  // 🔍 DIAGNOSTIC LOG: Verificar estado del modal en esta sección
  const [modalOpen, setModalOpen] = useState(false);
  console.log('ClinicalProfileSection modalOpen:', modalOpen);
  
  const [modalType, setModalType] = useState<ModalType>("personal");
  const [modalInitial, setModalInitial] = useState<any>(undefined);
  const grouped: Record<BackgroundType, ClinicalBackground[]> = {
    personal: [],
    family: [],
    genetic: [],
    habit: [],
  };
  backgrounds.forEach((item) => {
    if (grouped[item.type]) grouped[item.type].push(item);
  });
  const handleDelete = async (item: any, type: string) => {
    if (!confirm("CONFIRM_DATA_PURGE: Are you sure?")) return;
    try {
      let endpoint = "";
      if (type === "habit") endpoint = `patients/${patientId}/habits/${item.id}/`;
      else if (type === "allergy") endpoint = `patients/${patientId}/allergies/${item.id}/`;
      else if (type === "personal") endpoint = `personal-history/${item.id}/`;
      else if (type === "family") endpoint = `family-history/${item.id}/`;
      else if (type === "genetic") endpoint = `genetic-predispositions/${item.id}/`;
      await apiFetch(endpoint, { method: "DELETE" });
      onRefresh?.();
    } catch (err) {
      console.error("ERRO_DELETING_RECORD:", err);
    }
  };
  const handleSave = async (type: ModalType, payload: any) => {
    const isEdit = modalInitial?.id;
    let endpoint = "";
    if (type === "personal") endpoint = "personal-history/";
    if (type === "family") endpoint = "family-history/";
    if (type === "genetic") endpoint = "genetic-predispositions/";
    if (type === "habit") endpoint = `patients/${patientId}/habits/`;
    if (type === "allergy") endpoint = `patients/${patientId}/allergies/`;
    const method = isEdit ? "PATCH" : "POST";
    const url = isEdit
      ? (type === "habit" || type === "allergy") 
        ? `${endpoint}${modalInitial.id}/` 
        : `${endpoint}${modalInitial.id}/`
      : endpoint;
    try {
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("ERROR_SAVING_RECORD:", err);
    }
  };
  const renderSection = (type: ModalType, title: string, items: any[], Icon: any) => {
    const isExpanded = expanded === type;
    return (
      <div className={`border-b border-[var(--palantir-border)] last:border-0 transition-all ${isExpanded ? 'bg-white/[0.02]' : ''}`}>
        <button
          onClick={() => setExpanded(isExpanded ? null : type)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <Icon className={`w-4 h-4 ${isExpanded ? 'text-[var(--palantir-active)]' : 'text-[var(--palantir-muted)]'}`} />
            <span className={`text-[10px] font-mono tracking-[0.2em] uppercase ${isExpanded ? 'text-[var(--palantir-text)]' : 'text-[var(--palantir-muted)]'}`}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-mono text-[var(--palantir-muted)] opacity-50">
              COUNT: {items.length.toString().padStart(2, '0')}
            </span>
            <ChevronDownIcon className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[var(--palantir-active)]' : 'text-[var(--palantir-muted)]'}`} />
          </div>
        </button>
        {isExpanded && (
          <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-[10px] font-mono text-[var(--palantir-muted)] py-4 border border-dashed border-[var(--palantir-border)] rounded-sm text-center">
                  NO_RECORDS_FOUND_FOR_{type.toUpperCase()}
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between p-3 border border-[var(--palantir-border)] bg-[var(--palantir-bg)]/40 hover:border-[var(--palantir-active)]/50 transition-all rounded-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-[var(--palantir-text)] uppercase tracking-tight">
                          {item.condition || item.name || item.type}
                        </span>
                        {item.severity && (
                          <span className="text-[8px] px-2 py-0.5 border border-red-500/30 text-red-500 font-black rounded-full uppercase">
                            {item.severity}
                          </span>
                        )}
                        {item.status && (
                          <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase italic">
                            [{item.status}]
                          </span>
                        )}
                      </div>
                      {(item.notes || item.description) && (
                        <p className="text-[10px] text-[var(--palantir-muted)] font-mono leading-relaxed max-w-xl">
                          {">"} {item.notes || item.description}
                        </p>
                      )}
                    </div>
                     
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setModalType(type); setModalInitial(item); setModalOpen(true); }}
                        className="p-1.5 text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item, type)}
                        className="p-1.5 text-[var(--palantir-muted)] hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
               
              <button
                onClick={() => { setModalType(type); setModalInitial(undefined); setModalOpen(true); }}
                className="w-full py-2 border border-dashed border-[var(--palantir-border)] hover:border-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/5 transition-all group flex justify-center items-center gap-2"
              >
                <PlusIcon className="w-3 h-3 text-[var(--palantir-muted)] group-hover:text-[var(--palantir-active)]" />
                <span className="text-[9px] font-mono text-[var(--palantir-muted)] group-hover:text-[var(--palantir-active)] uppercase">Add_Entry</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="bg-[var(--palantir-surface)]/20 border border-[var(--palantir-border)] rounded-sm overflow-hidden">
      <div className="bg-[var(--palantir-border)]/20 px-6 py-3 border-b border-[var(--palantir-border)]">
        <span className="text-[10px] font-mono font-black text-[var(--palantir-text)] uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-1 bg-[var(--palantir-active)] animate-pulse" />
          Clinical_Bio_Profile
        </span>
      </div>
      <div className="flex flex-col">
        {renderSection("personal", backgroundLabels.personal, grouped.personal, backgroundIcons.personal)}
        {renderSection("family", backgroundLabels.family, grouped.family, backgroundIcons.family)}
        {renderSection("genetic", backgroundLabels.genetic, grouped.genetic, backgroundIcons.genetic)}
        {renderSection("allergy", "IMMUNOLOGICAL_SENSITIVITY", allergies, backgroundIcons.allergy)}
        {renderSection("habit", backgroundLabels.habit, habits, backgroundIcons.habit)}
      </div>
      <ClinicalBackgroundModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => handleSave(modalType, payload)}
        initial={modalInitial}
        type={modalType}
      />
    </div>
  );
}