// src/components/Patients/sections/ClinicalBackgroundModal.tsx
import React, { useState, useEffect } from "react";
import EliteModal from "../../Common/EliteModal";
import { apiFetch } from "../../../api/client";
import { 
  ClipboardList, 
  Users, 
  Dna, 
  AlertTriangle, 
  Activity, 
  X, 
  Save, 
  Loader2 
} from "lucide-react";
type BackgroundType = "personal" | "family" | "genetic" | "allergy" | "habit";
interface ClinicalBackgroundForm {
  type: BackgroundType;
  condition?: string;
  relation?: string;
  relative?: string;
  status?: "active" | "resolved" | "suspected" | "positive" | "negative";
  source?: string;
  notes?: string;
  personalType?: string;
  name?: string;
  severity?: string;
  description?: string;
  date?: string;
}
interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initial?: ClinicalBackgroundForm;
  type: BackgroundType;
}
const typeConfig: Record<BackgroundType, { label: string; icon: any; color: string; technicalLabel: string }> = {
  personal: { 
    label: "Antecedente Personal", 
    icon: ClipboardList, 
    color: "text-blue-400",
    technicalLabel: "PERSONAL_MEDICAL_PROTOCOL"
  },
  family: { 
    label: "Antecedente Familiar", 
    icon: Users, 
    color: "text-purple-400",
    technicalLabel: "FAMILY_MEDICAL_REGISTRY"
  },
  genetic: { 
    label: "Predisposición Genética", 
    icon: Dna, 
    color: "text-emerald-400",
    technicalLabel: "GENETIC_PREDISPOSITION_SYSTEM"
  },
  allergy: { 
    label: "Alergia / Reacción", 
    icon: AlertTriangle, 
    color: "text-orange-400",
    technicalLabel: "ALLERGY_RESPONSE_PROTOCOL"
  },
  habit: { 
    label: "Hábito / Estilo de Vida", 
    icon: Activity, 
    color: "text-cyan-400",
    technicalLabel: "LIFESTYLE_BEHAVIOR_TRACKER"
  },
};
const personalHistoryChoices = [
  { value: "patológico", label: "Patológico" },
  { value: "no_patológico", label: "No patológico" },
  { value: "quirúrgico", label: "Quirúrgico" },
  { value: "traumático", label: "Traumático" },
  { value: "alérgico", label: "Alérgico" },
  { value: "tóxico", label: "Tóxico" },
  { value: "gineco-obstétrico", label: "Gineco-obstétrico" },
];
const habitTypes = [
  { value: "tabaco", label: "Tabaco" },
  { value: "alcohol", label: "Alcohol" },
  { value: "actividad_física", label: "Actividad física" },
  { value: "dieta", label: "Dieta" },
  { value: "sueño", label: "Sueño" },
  { value: "drogas", label: "Drogas" },
];
const allergySeverityChoices = [
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "grave", label: "Grave" },
  { value: "anafiláctica", label: "Anafiláctica" },
];
const allergySourceChoices = [
  { value: "historia_clínica", label: "Historia clínica" },
  { value: "prueba_cutánea", label: "Prueba cutánea" },
  { value: "prueba_sanguínea", label: "Prueba sanguínea" },
  { value: "autorreporte", label: "Autorreporte" },
];
export default function ClinicalBackgroundModal({ open, onClose, onSave, initial, type }: Props) {
  const [form, setForm] = useState<ClinicalBackgroundForm>({
    type,
    condition: "",
    relation: "",
    relative: "",
    status: "active",
    source: "",
    notes: "",
    personalType: "patológico",
    name: "",
    severity: "",
    description: "",
    date: "",
  });
  const [options, setOptions] = useState<{ id: number; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const activeConfig = typeConfig[type];
  useEffect(() => {
    if (open) {
      setForm({
        type,
        condition: type === "habit" ? initial?.type ?? "" : initial?.condition ?? "",
        relation: initial?.relation ?? initial?.relative ?? "",
        relative: initial?.relative ?? "",
        status: initial?.status ?? "active",
        source: initial?.source ?? "",
        notes: initial?.notes ?? "",
        personalType: initial?.personalType ?? "patológico",
        name: initial?.name ?? "",
        severity: initial?.severity ?? "",
        description: initial?.description ?? "",
        date: initial?.date ?? "",
      });
      if (type === "genetic") {
        setLoadingOptions(true);
        const fetchAll = async () => {
          let all: { id: number; name: string }[] = [];
          let url: string | null = "genetic-predispositions/?limit=100";
          while (url) {
            const res: any = await apiFetch(url);
            const list = Array.isArray(res) ? res : res.results || [];
            all = [...all, ...list];
            url = res.next || null;
          }
          setOptions(all);
          setLoadingOptions(false);
        };
        fetchAll().catch(() => setLoadingOptions(false));
      }
    }
  }, [open, initial, type]);
  const setField = (field: keyof ClinicalBackgroundForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const handleSave = () => {
    let payload: any = {};
    if (type === "personal") {
      payload = { type: form.personalType, description: form.condition, date: form.date || new Date().toISOString().slice(0, 10), notes: form.notes };
    } else if (type === "family") {
      payload = { condition: form.condition, relative: form.relation || form.relative, notes: form.notes };
    } else if (type === "genetic") {
      payload = { name: form.name, description: form.notes || "" };
    } else if (type === "allergy") {
      payload = { name: form.name, severity: form.severity, source: form.source, notes: form.notes };
    } else if (type === "habit") {
      payload = { type: form.condition, description: form.description, notes: form.notes };
    }
    onSave(payload);
    onClose();
  };
  const inputStyles = "w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-white/30 transition-all";
  const labelStyles = "text-[9px] font-mono text-white/60 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-[#0a0a0a] border border-white/10 rounded-sm p-4 space-y-4";
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title={activeConfig.technicalLabel}
      subtitle={`${initial ? "EDIT_EXISTING_REGISTRY" : "INITIALIZE_NEW_ENTRY"} - ${activeConfig.label.toUpperCase()}`}
      maxWidth="2xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {type === "personal" && (
          <div className={sectionStyles}>
            <div className="space-y-2">
              <label className={labelStyles}>MEDICAL_CLASSIFICATION_PROTOCOL</label>
              <select
                className={inputStyles}
                value={form.personalType}
                onChange={(e) => setField("personalType", e.target.value)}
              >
                {personalHistoryChoices.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>MEDICAL_CONDITION_IDENTIFIER</label>
              <input
                className={inputStyles}
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
                placeholder="Ej: HIPERTENSION_ARTERIAL"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>INCIDENT_TIMESTAMP</label>
              <input
                type="date"
                className={inputStyles}
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
              />
            </div>
          </div>
        )}
        {type === "family" && (
          <div className={sectionStyles}>
            <div className="space-y-2">
              <label className={labelStyles}>FAMILY_RELATIONSHIP_CODE</label>
              <input
                className={inputStyles}
                value={form.relation}
                onChange={(e) => setField("relation", e.target.value)}
                placeholder="Ej: PADRE, ABUELA_MATERNA"
              />
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>DIAGNOSTIC_CONDITION_CODE</label>
              <input
                className={inputStyles}
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
                placeholder="Ej: DIABETES_TIPO_II"
              />
            </div>
          </div>
        )}
        {type === "genetic" && (
          <div className={sectionStyles}>
            <div className="space-y-2">
              <label className={labelStyles}>
                GENETIC_CATALOG_SELECTOR {loadingOptions && <Loader2 size={12} className="inline animate-spin ml-2" />}
              </label>
              <select
                className={inputStyles}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={loadingOptions}
              >
                <option value="">SELECT_GENETIC_PREDISPOSITION...</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {type === "allergy" && (
          <div className={sectionStyles}>
            <div className="space-y-2">
              <label className={labelStyles}>ALLERGEN_AGENT_IDENTIFIER</label>
              <input
                className={inputStyles}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="MEDICAMENTO, ALIMENTO, SUSTANCIA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelStyles}>REACTION_SEVERITY_LEVEL</label>
                <select
                  className={`${inputStyles} px-2 py-2`}
                  value={form.severity}
                  onChange={(e) => setField("severity", e.target.value)}
                >
                  <option value="">SEVERITY_LEVEL...</option>
                  {allergySeverityChoices.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelStyles}>SOURCE_VERIFICATION_METHOD</label>
                <select
                  className={`${inputStyles} px-2 py-2`}
                  value={form.source}
                  onChange={(e) => setField("source", e.target.value)}
                >
                  <option value="">VERIFICATION_SOURCE...</option>
                  {allergySourceChoices.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        {type === "habit" && (
          <div className={sectionStyles}>
            <div className="space-y-2">
              <label className={labelStyles}>BEHAVIOR_PATTERN_TYPE</label>
              <select
                className={inputStyles}
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
              >
                {habitTypes.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelStyles}>CONSUMPTION_BEHAVIOR_DATA</label>
              <textarea
                className={`${inputStyles} min-h-[80px] resize-none`}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="FREQUENCY, QUANTITY, DURATION_PATTERNS..."
              />
            </div>
          </div>
        )}
        <div className={`${sectionStyles} border-t border-white/20 pt-6`}>
          <div className="space-y-2">
            <label className={labelStyles}>CLINICAL_NOTES_REGISTRY</label>
            <textarea
              className={`${inputStyles} min-h-[100px] resize-none bg-black/60`}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="CLINICAL_RELEVANT_NOTES, OBSERVATIONS, METADATA..."
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors font-mono"
        >
          ABORT_OPERATION
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest text-white transition-all font-mono ${activeConfig.color.replace('text', 'bg').replace('-400', '-500/20')} border border-white/20 hover:brightness-110`}
        >
          <Save size={16} />
          {initial ? "UPDATE_REGISTRY_ENTRY" : "CREATE_REGISTRY_ENTRY"}
        </button>
      </div>
    </EliteModal>
  );
}