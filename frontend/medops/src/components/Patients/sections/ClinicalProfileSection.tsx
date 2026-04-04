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
  readOnly?: boolean;
}
const backgroundLabels: Record<BackgroundType, string> = {
  personal: "Antecedentes Personales",
  family: "Antecedentes Familiares",
  genetic: "Predisposiciones Genéticas",
  habit: "Hábitos y Estilo de Vida",
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
  readOnly = false,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>("personal");
  const [modalOpen, setModalOpen] = useState(false);
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
    if (!confirm("¿Estás seguro de eliminar este registro?")) return;
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
      console.error("Error al eliminar registro:", err);
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
    const url = isEdit ? `${endpoint}${modalInitial.id}/` : endpoint;
    try {
      await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setModalOpen(false);
      onRefresh?.();
    } catch (err) {
      console.error("Error al guardar registro:", err);
    }
  };
  const renderSection = (type: ModalType, title: string, items: any[], Icon: any) => {
    const isExpanded = expanded === type;
    return (
      <div className={`border-b border-white/10 last:border-0 transition-all ${isExpanded ? 'bg-white/[0.02]' : ''}`}>
        <button
          onClick={() => setExpanded(isExpanded ? null : type)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${isExpanded ? 'text-emerald-400' : 'text-white/30'}`} />
            <span className={`text-[11px] font-medium ${isExpanded ? 'text-white/80' : 'text-white/40'}`}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30">
              {items.length}
            </span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : 'text-white/30'}`} />
          </div>
        </button>
        {isExpanded && (
          <div className="px-5 pb-5 pt-2 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-[11px] text-white/30 py-4 border border-dashed border-white/10 rounded-lg text-center">
                  Sin registros
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="group flex items-center justify-between p-4 border border-white/10 bg-white/5 hover:border-white/20 transition-all rounded-lg">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-medium text-white">
                          {item.condition || item.name || item.type}
                        </span>
                        {item.severity && (
                          <span className={`text-[9px] px-2 py-0.5 border rounded-full font-medium ${
                            item.severity.toLowerCase().includes('grave') || item.severity.toLowerCase().includes('anafil')
                              ? 'border-red-500/25 text-red-400 bg-red-500/10'
                              : item.severity.toLowerCase().includes('moder')
                              ? 'border-amber-500/25 text-amber-400 bg-amber-500/10'
                              : 'border-white/15 text-white/50 bg-white/5'
                          }`}>
                            {item.severity}
                          </span>
                        )}
                        {item.status && (
                          <span className="text-[9px] text-white/30 italic">
                            [{item.status}]
                          </span>
                        )}
                      </div>
                      {(item.notes || item.description) && (
                        <p className="text-[10px] text-white/40 leading-relaxed max-w-xl">
                          {item.notes || item.description}
                        </p>
                      )}
                    </div>
                    
                    {!readOnly && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setModalType(type); setModalInitial(item); setModalOpen(true); }}
                          className="p-2 text-white/30 hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item, type)}
                          className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {!readOnly && (
                <button
                  onClick={() => { setModalType(type); setModalInitial(undefined); setModalOpen(true); }}
                  className="w-full py-3 border border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group flex justify-center items-center gap-2 rounded-lg"
                >
                  <PlusIcon className="w-4 h-4 text-white/30 group-hover:text-emerald-400" />
                  <span className="text-[10px] font-medium text-white/30 group-hover:text-emerald-400">
                    Agregar registro
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
      <div className="bg-white/5 px-5 py-3 border-b border-white/15">
        <span className="text-[11px] font-medium text-white/70 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          Perfil Clínico
        </span>
      </div>
      <div className="flex flex-col">
        {renderSection("personal", backgroundLabels.personal, grouped.personal, backgroundIcons.personal)}
        {renderSection("family", backgroundLabels.family, grouped.family, backgroundIcons.family)}
        {renderSection("genetic", backgroundLabels.genetic, grouped.genetic, backgroundIcons.genetic)}
        {renderSection("allergy", "Alergias", allergies, backgroundIcons.allergy)}
        {renderSection("habit", backgroundLabels.habit, habits, backgroundIcons.habit)}
      </div>
      
      {!readOnly && (
        <ClinicalBackgroundModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={(payload) => handleSave(modalType, payload)}
          initial={modalInitial}
          type={modalType}
        />
      )}
    </div>
  );
}