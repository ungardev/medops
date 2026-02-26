// src/components/Patients/sections/ClinicalBackgroundModal.tsx
import React, { useState, useEffect } from "react";
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
  // ✅ ESTILOS MODERNOS MEDOPZ/PALANTIR - Más legibles
  const inputStyles = "w-full bg-black/40 border border-white/20 rounded-sm px-4 py-3 text-[13px] text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all";
  const labelStyles = "text-[11px] font-bold text-white/70 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-white/[0.02] border border-white/10 rounded-sm p-5 space-y-4";
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${activeConfig.color.replace('text', 'bg').replace('-400', '-500/20')} border ${activeConfig.color.replace('text', 'border').replace('-400', '-400/30')}`}>
              <activeConfig.icon className={`h-4 w-4 ${activeConfig.color}`} />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-white">
                {initial ? "EDIT_REGISTRY" : "NEW_ENTRY"}
              </h3>
              <p className="text-[10px] font-mono text-white/50 uppercase">{activeConfig.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 space-y-5">
          {type === "personal" && (
            <div className={sectionStyles}>
              <div>
                <label className={labelStyles}>Type</label>
                <select className={inputStyles} value={form.personalType} onChange={(e) => setField("personalType", e.target.value)}>
                  {personalHistoryChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Condition</label>
                <input className={inputStyles} value={form.condition} onChange={(e) => setField("condition", e.target.value)} placeholder="Ej: HIPERTENSION" />
              </div>
              <div>
                <label className={labelStyles}>Date</label>
                <input type="date" style={{colorScheme: 'dark'}} className={inputStyles} value={form.date} onChange={(e) => setField("date", e.target.value)} />
              </div>
            </div>
          )}
          {type === "family" && (
            <div className={sectionStyles}>
              <div>
                <label className={labelStyles}>Relationship</label>
                <input className={inputStyles} value={form.relation} onChange={(e) => setField("relation", e.target.value)} placeholder="Ej: PADRE, MADRE" />
              </div>
              <div>
                <label className={labelStyles}>Condition</label>
                <input className={inputStyles} value={form.condition} onChange={(e) => setField("condition", e.target.value)} placeholder="Ej: DIABETES" />
              </div>
            </div>
          )}
          {type === "genetic" && (
            <div className={sectionStyles}>
              <div>
                <label className={labelStyles}>
                  Genetic_Predisposition {loadingOptions && <Loader2 size={14} className="inline animate-spin ml-2" />}
                </label>
                <select className={inputStyles} value={form.name} onChange={(e) => setField("name", e.target.value)} disabled={loadingOptions}>
                  <option value="">SELECT...</option>
                  {options.map((opt) => (<option key={opt.id} value={opt.name}>{opt.name}</option>))}
                </select>
              </div>
            </div>
          )}
          {type === "allergy" && (
            <div className={sectionStyles}>
              <div>
                <label className={labelStyles}>Allergen</label>
                <input className={inputStyles} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="MEDICAMENTO, ALIMENTO" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Severity</label>
                  <select className={inputStyles} value={form.severity} onChange={(e) => setField("severity", e.target.value)}>
                    <option value="">SELECT...</option>
                    {allergySeverityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelStyles}>Source</label>
                  <select className={inputStyles} value={form.source} onChange={(e) => setField("source", e.target.value)}>
                    <option value="">SELECT...</option>
                    {allergySourceChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}
          {type === "habit" && (
            <div className={sectionStyles}>
              <div>
                <label className={labelStyles}>Habit_Type</label>
                <select className={inputStyles} value={form.condition} onChange={(e) => setField("condition", e.target.value)}>
                  {habitTypes.map((h) => (<option key={h.value} value={h.value}>{h.label}</option>))}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Description</label>
                <textarea className={`${inputStyles} min-h-[80px] resize-none`} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="FREQUENCY, QUANTITY..." />
              </div>
            </div>
          )}
          <div className={`${sectionStyles} border-t border-white/20 pt-5`}>
            <label className={labelStyles}>Clinical_Notes</label>
            <textarea className={`${inputStyles} min-h-[100px] resize-none bg-black/60`} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="OBSERVATIONS..." />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-black/40">
          <button onClick={onClose} className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white transition-all ${activeConfig.color.replace('text', 'bg').replace('-400', '-500/20')} border border-white/20 hover:brightness-110`}>
            <Save size={16} />
            {initial ? "UPDATE" : "CREATE"}
          </button>
        </div>
      </div>
    </div>
  );
}