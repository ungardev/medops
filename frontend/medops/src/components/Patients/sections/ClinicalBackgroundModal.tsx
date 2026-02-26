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
  // COMMON
  notes?: string;
  // PERSONAL
  personalType?: string;
  condition?: string;
  date?: string;
  // FAMILY
  relation?: string;
  age_at_diagnosis?: number | null;
  // GENETIC
  name?: string;
  // ALLERGY
  allergen?: string;
  severity?: string;
  source?: string;
  // HABIT
  habitType?: string;
  // Tabaco
  smokes_currently?: string;
  tobacco_type?: string;
  smoking_frequency?: string;
  cigarettes_per_day?: number | null;
  smoking_start_age?: number | null;
  // Alcohol
  drinks_alcohol?: string;
  alcohol_frequency?: string;
  alcohol_quantity?: string;
  binge_frequency?: string;
  // Actividad Física
  exercise_frequency?: string;
  exercise_intensity?: string;
  activity_description?: string;
  // Dieta
  diet_type?: string;
  diet_restrictions?: string;
  // Sueño
  sleep_hours?: number | null;
  sleep_quality?: string;
  // Drogas
  uses_drugs?: string;
  drug_description?: string;
  drug_frequency?: string;
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
    label: "SUBJECT_PERSONAL_HISTORY", 
    icon: ClipboardList, 
    color: "text-blue-400",
    technicalLabel: "PERSONAL_MEDICAL_PROTOCOL"
  },
  family: { 
    label: "LINEAGE_FAMILY_HISTORY", 
    icon: Users, 
    color: "text-purple-400",
    technicalLabel: "FAMILY_MEDICAL_REGISTRY"
  },
  genetic: { 
    label: "GENOMIC_PREDISPOSITIONS", 
    icon: Dna, 
    color: "text-emerald-400",
    technicalLabel: "GENETIC_PREDISPOSITION_SYSTEM"
  },
  allergy: { 
    label: "IMMUNOLOGICAL_SENSITIVITY", 
    icon: AlertTriangle, 
    color: "text-orange-400",
    technicalLabel: "ALLERGY_RESPONSE_PROTOCOL"
  },
  habit: { 
    label: "LIFESTYLE_HABITS", 
    icon: Activity, 
    color: "text-cyan-400",
    technicalLabel: "LIFESTYLE_BEHAVIOR_TRACKER"
  },
};
// === OPCIONES CERRADAS ===
// Personal History Types
const personalHistoryChoices = [
  { value: "patologico", label: "PATOLOGICO" },
  { value: "no_patologico", label: "NO_PATOLOGICO" },
  { value: "quirurgico", label: "QUIRURGICO" },
  { value: "traumatico", label: "TRAUMATICO" },
  { value: "alergico", label: "ALERGICO" },
  { value: "toxico", label: "TOXICO" },
  { value: "gineco_obstetrico", label: "GINECO_OBSTETRICO" },
];
// ✅ FAMILY - Relationship cerrado (primera y segunda línea)
const relationshipChoices = [
  { value: "mother", label: "MADRE" },
  { value: "father", label: "PADRE" },
  { value: "sibling", label: "HERMANO/A" },
  { value: "child", label: "HIJO/A" },
  { value: "maternal_grandmother", label: "ABUELA_MATERNA" },
  { value: "maternal_grandfather", label: "ABUELO_MATERNO" },
  { value: "paternal_grandmother", label: "ABUELA_PATENA" },
  { value: "paternal_grandfather", label: "ABUELO_PATENO" },
  { value: "uncle", label: "TIO/A" },
  { value: "aunt", label: "TIA" },
  { value: "cousin", label: "PRIMO/A" },
  { value: "nephew", label: "SOBRINO/A" },
  { value: "niece", label: "SOBRINA/A" },
];
// Allergy
const allergySeverityChoices = [
  { value: "leve", label: "LEVE" },
  { value: "moderada", label: "MODERADA" },
  { value: "grave", label: "GRAVE" },
  { value: "anafilactica", label: "ANAFILACTICA" },
];
const allergySourceChoices = [
  { value: "historia_clinica", label: "HISTORIA_CLINICA" },
  { value: "prueba_cutanea", label: "PRUEBA_CUTANEA" },
  { value: "prueba_sanguinea", label: "PRUEBA_SANGUINEA" },
  { value: "autorreporte", label: "AUTORREPORTE" },
];
// ✅ HABIT TYPES
const habitTypes = [
  { value: "tabaco", label: "TABACO" },
  { value: "alcohol", label: "ALCOHOL" },
  { value: "actividad_fisica", label: "ACTIVIDAD_FISICA" },
  { value: "dieta", label: "DIETA" },
  { value: "sueno", label: "SUENO" },
  { value: "drogas", label: "DROGAS" },
];
// === TABACO ===
const smokingStatusChoices = [
  { value: "yes", label: "SI_FUMA" },
  { value: "no", label: "NO_FUMA" },
  { value: "former", label: "EX_FUMADOR" },
];
const tobaccoTypeChoices = [
  { value: "cigarettes", label: "CIGARRILLOS" },
  { value: "pipe", label: "PIPA" },
  { value: "electronic", label: "ELECTRONICO" },
  { value: "other", label: "OTROS" },
];
const frequencyLevelsChoices = [
  { value: "daily", label: "DIARIO" },
  { value: "weekly", label: "SEMANAL" },
  { value: "occasional", label: "OCASIONAL" },
];
// === ALCOHOL ===
const alcoholStatusChoices = [
  { value: "yes", label: "SI_CONSUME" },
  { value: "no", label: "NO_CONSUME" },
];
const alcoholFrequencyChoices = [
  { value: "never", label: "NUNCA" },
  { value: "monthly_or_less", label: "MENSUAL_O_MENOS" },
  { value: "2_4_month", label: "2-4_VECES_MES" },
  { value: "2_3_week", label: "2-3_VECES_SEMANA" },
  { value: "4_plus_week", label: "4+_VECES_SEMANA" },
];
const alcoholQuantityChoices = [
  { value: "1_2", label: "1-2" },
  { value: "3_4", label: "3-4" },
  { value: "5_6", label: "5-6" },
  { value: "7_9", label: "7-9" },
  { value: "10_plus", label: "10+" },
];
const bingeFrequencyChoices = [
  { value: "never", label: "NUNCA" },
  { value: "less_monthly", label: "MENOS_MENSUAL" },
  { value: "monthly", label: "MENSUAL" },
  { value: "weekly", label: "SEMANAL" },
  { value: "daily", label: "DIARIO" },
];
// === ACTIVIDAD FÍSICA ===
const exerciseFrequencyChoices = [
  { value: "sedentary", label: "SEDENTARIO" },
  { value: "1_2_week", label: "1-2_VECES_SEMANA" },
  { value: "3_4_week", label: "3-4_VECES_SEMANA" },
  { value: "5_plus_week", label: "5+_VECES_SEMANA" },
];
const exerciseIntensityChoices = [
  { value: "light", label: "LEVE" },
  { value: "moderate", label: "MODERADA" },
  { value: "intense", label: "INTENSA" },
];
// === DIETA ===
const dietTypeChoices = [
  { value: "omnivore", label: "OMNIVORA" },
  { value: "vegetarian", label: "VEGETARIANA" },
  { value: "vegan", label: "VEGANA" },
  { value: "mediterranean", label: "MEDITERRANEA" },
  { value: "other", label: "OTRA" },
];
// === SUEÑO ===
const sleepQualityChoices = [
  { value: "good", label: "BUENA" },
  { value: "fair", label: "REGULAR" },
  { value: "poor", label: "MALA" },
];
// === DROGAS ===
const drugsStatusChoices = [
  { value: "yes", label: "SI" },
  { value: "no", label: "NO" },
];
export default function ClinicalBackgroundModal({ open, onClose, onSave, initial, type }: Props) {
  const [form, setForm] = useState<ClinicalBackgroundForm>({
    type,
    notes: "",
    // PERSONAL
    personalType: "patologico",
    condition: "",
    date: new Date().toISOString().slice(0, 10),
    // FAMILY
    relation: "",
    age_at_diagnosis: null,
    // GENETIC
    name: "",
    // ALLERGY
    allergen: "",
    severity: "",
    source: "",
    // HABIT
    habitType: "tabaco",
    smokes_currently: "no",
    tobacco_type: "",
    smoking_frequency: "",
    cigarettes_per_day: null,
    smoking_start_age: null,
    drinks_alcohol: "no",
    alcohol_frequency: "",
    alcohol_quantity: "",
    binge_frequency: "",
    exercise_frequency: "",
    exercise_intensity: "",
    activity_description: "",
    diet_type: "",
    diet_restrictions: "",
    sleep_hours: null,
    sleep_quality: "",
    uses_drugs: "no",
    drug_description: "",
    drug_frequency: "",
  });
  
  const [options, setOptions] = useState<{ id: number; name: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const activeConfig = typeConfig[type];
  useEffect(() => {
    if (open) {
      setForm({
        type,
        notes: initial?.notes || "",
        // PERSONAL
        personalType: initial?.personalType || "patologico",
        condition: initial?.condition || "",
        date: initial?.date || new Date().toISOString().slice(0, 10),
        // FAMILY
        relation: initial?.relation || "",
        age_at_diagnosis: initial?.age_at_diagnosis ?? null,
        // GENETIC
        name: initial?.name || "",
        // ALLERGY
        allergen: initial?.allergen || initial?.name || "",
        severity: initial?.severity || "",
        source: initial?.source || "",
        // HABIT
        habitType: initial?.habitType || "tabaco",
        smokes_currently: initial?.smokes_currently || "no",
        tobacco_type: initial?.tobacco_type || "",
        smoking_frequency: initial?.smoking_frequency || "",
        cigarettes_per_day: initial?.cigarettes_per_day ?? null,
        smoking_start_age: initial?.smoking_start_age ?? null,
        drinks_alcohol: initial?.drinks_alcohol || "no",
        alcohol_frequency: initial?.alcohol_frequency || "",
        alcohol_quantity: initial?.alcohol_quantity || "",
        binge_frequency: initial?.binge_frequency || "",
        exercise_frequency: initial?.exercise_frequency || "",
        exercise_intensity: initial?.exercise_intensity || "",
        activity_description: initial?.activity_description || "",
        diet_type: initial?.diet_type || "",
        diet_restrictions: initial?.diet_restrictions || "",
        sleep_hours: initial?.sleep_hours ?? null,
        sleep_quality: initial?.sleep_quality || "",
        uses_drugs: initial?.uses_drugs || "no",
        drug_description: initial?.drug_description || "",
        drug_frequency: initial?.drug_frequency || "",
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
  const setField = (field: keyof ClinicalBackgroundForm, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const handleSave = () => {
    let payload: any = {};
    
    if (type === "personal") {
      payload = { 
        type: form.personalType, 
        description: form.condition, 
        date: form.date || new Date().toISOString().slice(0, 10), 
        notes: form.notes 
      };
    } else if (type === "family") {
      payload = { 
        condition: form.condition, 
        relative: form.relation,
        age_at_diagnosis: form.age_at_diagnosis,
        notes: form.notes 
      };
    } else if (type === "genetic") {
      payload = { 
        name: form.name, 
        description: form.notes || "" 
      };
    } else if (type === "allergy") {
      payload = { 
        name: form.allergen, 
        severity: form.severity, 
        source: form.source, 
        notes: form.notes 
      };
    } else if (type === "habit") {
      // Construir payload según tipo de hábito
      payload = { 
        type: form.habitType,
        notes: form.notes 
      };
      
      if (form.habitType === "tabaco") {
        payload.smokes_currently = form.smokes_currently;
        payload.tobacco_type = form.tobacco_type;
        payload.smoking_frequency = form.smoking_frequency;
        payload.cigarettes_per_day = form.cigarettes_per_day;
        payload.smoking_start_age = form.smoking_start_age;
      } else if (form.habitType === "alcohol") {
        payload.drinks_alcohol = form.drinks_alcohol;
        payload.alcohol_frequency = form.alcohol_frequency;
        payload.alcohol_quantity = form.alcohol_quantity;
        payload.binge_frequency = form.binge_frequency;
      } else if (form.habitType === "actividad_fisica") {
        payload.exercise_frequency = form.exercise_frequency;
        payload.exercise_intensity = form.exercise_intensity;
        payload.activity_description = form.activity_description;
      } else if (form.habitType === "dieta") {
        payload.diet_type = form.diet_type;
        payload.diet_restrictions = form.diet_restrictions;
      } else if (form.habitType === "sueno") {
        payload.sleep_hours = form.sleep_hours;
        payload.sleep_quality = form.sleep_quality;
      } else if (form.habitType === "drogas") {
        payload.uses_drugs = form.uses_drugs;
        payload.drug_description = form.drug_description;
        payload.drug_frequency = form.drug_frequency;
      }
    }
    
    onSave(payload);
    onClose();
  };
  const inputStyles = "w-full bg-black/40 border border-white/20 rounded-sm px-4 py-3 text-[13px] text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all";
  const labelStyles = "text-[11px] font-bold text-white/70 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-white/[0.02] border border-white/10 rounded-sm p-5 space-y-4";
  const grid2Cols = "grid grid-cols-2 gap-4";
  const grid3Cols = "grid grid-cols-3 gap-4";
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#0a0a0b] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
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
          
          {/* === PERSONAL HISTORY === */}
          {type === "personal" && (
            <>
              <div className={sectionStyles}>
                <div>
                  <label className={labelStyles}>Type</label>
                  <select className={inputStyles} value={form.personalType} onChange={(e) => setField("personalType", e.target.value)}>
                    {personalHistoryChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelStyles}>Condition</label>
                  <input className={inputStyles} value={form.condition} onChange={(e) => setField("condition", e.target.value)} placeholder="HIPERTENSION, DIABETES, ETC..." />
                </div>
                <div>
                  <label className={labelStyles}>Date</label>
                  <input type="date" style={{colorScheme: 'dark'}} className={inputStyles} value={form.date} onChange={(e) => setField("date", e.target.value)} />
                </div>
              </div>
            </>
          )}
          {/* === FAMILY HISTORY === */}
          {type === "family" && (
            <>
              <div className={sectionStyles}>
                <div className={grid2Cols}>
                  <div>
                    <label className={labelStyles}>Relationship</label>
                    <select className={inputStyles} value={form.relation} onChange={(e) => setField("relation", e.target.value)}>
                      <option value="">SELECT...</option>
                      {relationshipChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Age at Diagnosis</label>
                    <input 
                      type="number" 
                      className={inputStyles} 
                      value={form.age_at_diagnosis || ""} 
                      onChange={(e) => setField("age_at_diagnosis", e.target.value ? parseInt(e.target.value) : null)} 
                      placeholder="EDAD"
                      min="0"
                      max="120"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelStyles}>Condition</label>
                  <input className={inputStyles} value={form.condition} onChange={(e) => setField("condition", e.target.value)} placeholder="DIABETES, CANCER, CARDIOPATIA..." />
                </div>
              </div>
            </>
          )}
          {/* === GENETIC PREDISPOSITION === */}
          {type === "genetic" && (
            <div className={sectionStyles}>
              <div>
                <label className={labelStyles}>
                  Predisposition {loadingOptions && <Loader2 size={14} className="inline animate-spin ml-2" />}
                </label>
                <select className={inputStyles} value={form.name} onChange={(e) => setField("name", e.target.value)} disabled={loadingOptions}>
                  <option value="">SELECT...</option>
                  {options.map((opt) => (<option key={opt.id} value={opt.name}>{opt.name}</option>))}
                </select>
              </div>
            </div>
          )}
          {/* === ALLERGY / IMMUNOLOGICAL === */}
          {type === "allergy" && (
            <div className={sectionStyles}>
              <div>
                <label className={labelStyles}>Allergen</label>
                <input className={inputStyles} value={form.allergen} onChange={(e) => setField("allergen", e.target.value)} placeholder="MEDICAMENTO, ALIMENTO, AMBIENTAL" />
              </div>
              <div className={grid2Cols}>
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
          {/* === LIFESTYLE / HABITS === */}
          {type === "habit" && (
            <>
              <div className={sectionStyles}>
                <div>
                  <label className={labelStyles}>Habit_Type</label>
                  <select className={inputStyles} value={form.habitType} onChange={(e) => setField("habitType", e.target.value)}>
                    {habitTypes.map((h) => (<option key={h.value} value={h.value}>{h.label}</option>))}
                  </select>
                </div>
              </div>
              {/* === TABACO === */}
              {form.habitType === "tabaco" && (
                <div className={sectionStyles}>
                  <div className={grid2Cols}>
                    <div>
                      <label className={labelStyles}>Status</label>
                      <select className={inputStyles} value={form.smokes_currently} onChange={(e) => setField("smokes_currently", e.target.value)}>
                        {smokingStatusChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyles}>Type</label>
                      <select className={inputStyles} value={form.tobacco_type} onChange={(e) => setField("tobacco_type", e.target.value)}>
                        <option value="">SELECT...</option>
                        {tobaccoTypeChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className={grid2Cols}>
                    <div>
                      <label className={labelStyles}>Frequency</label>
                      <select className={inputStyles} value={form.smoking_frequency} onChange={(e) => setField("smoking_frequency", e.target.value)}>
                        <option value="">SELECT...</option>
                        {frequencyLevelsChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyles}>Quantity (per day)</label>
                      <input 
                        type="number" 
                        className={inputStyles} 
                        value={form.cigarettes_per_day || ""} 
                        onChange={(e) => setField("cigarettes_per_day", e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="# CIGARROS"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>Start Age</label>
                    <input 
                      type="number" 
                      className={inputStyles} 
                      value={form.smoking_start_age || ""} 
                      onChange={(e) => setField("smoking_start_age", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="EDAD DE INICIO"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              )}
              {/* === ALCOHOL === */}
              {form.habitType === "alcohol" && (
                <div className={sectionStyles}>
                  <div>
                    <label className={labelStyles}>Status</label>
                    <select className={inputStyles} value={form.drinks_alcohol} onChange={(e) => setField("drinks_alcohol", e.target.value)}>
                      {alcoholStatusChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div className={grid2Cols}>
                    <div>
                      <label className={labelStyles}>Frequency</label>
                      <select className={inputStyles} value={form.alcohol_frequency} onChange={(e) => setField("alcohol_frequency", e.target.value)}>
                        <option value="">SELECT...</option>
                        {alcoholFrequencyChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyles}>Quantity (per occasion)</label>
                      <select className={inputStyles} value={form.alcohol_quantity} onChange={(e) => setField("alcohol_quantity", e.target.value)}>
                        <option value="">SELECT...</option>
                        {alcoholQuantityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>Binge Frequency</label>
                    <select className={inputStyles} value={form.binge_frequency} onChange={(e) => setField("binge_frequency", e.target.value)}>
                      <option value="">SELECT...</option>
                      {bingeFrequencyChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                </div>
              )}
              {/* === ACTIVIDAD FÍSICA === */}
              {form.habitType === "actividad_fisica" && (
                <div className={sectionStyles}>
                  <div className={grid2Cols}>
                    <div>
                      <label className={labelStyles}>Frequency</label>
                      <select className={inputStyles} value={form.exercise_frequency} onChange={(e) => setField("exercise_frequency", e.target.value)}>
                        <option value="">SELECT...</option>
                        {exerciseFrequencyChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyles}>Intensity</label>
                      <select className={inputStyles} value={form.exercise_intensity} onChange={(e) => setField("exercise_intensity", e.target.value)}>
                        <option value="">SELECT...</option>
                        {exerciseIntensityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelStyles}>Activity Description</label>
                    <input className={inputStyles} value={form.activity_description} onChange={(e) => setField("activity_description", e.target.value)} placeholder="CAMINAR, GIMNASIO, DEPORTES, LABORAL..." />
                  </div>
                </div>
              )}
              {/* === DIETA === */}
              {form.habitType === "dieta" && (
                <div className={sectionStyles}>
                  <div>
                    <label className={labelStyles}>Diet Type</label>
                    <select className={inputStyles} value={form.diet_type} onChange={(e) => setField("diet_type", e.target.value)}>
                      <option value="">SELECT...</option>
                      {dietTypeChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={labelStyles}>Restrictions</label>
                    <textarea className={`${inputStyles} min-h-[80px] resize-none`} value={form.diet_restrictions} onChange={(e) => setField("diet_restrictions", e.target.value)} placeholder="RENAL, DIABETICA, CELIACA, ETC..." />
                  </div>
                </div>
              )}
              {/* === SUEÑO === */}
              {form.habitType === "sueno" && (
                <div className={sectionStyles}>
                  <div className={grid2Cols}>
                    <div>
                      <label className={labelStyles}>Hours per Night</label>
                      <input 
                        type="number" 
                        step="0.5"
                        className={inputStyles} 
                        value={form.sleep_hours || ""} 
                        onChange={(e) => setField("sleep_hours", e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="HORAS"
                        min="0"
                        max="24"
                      />
                    </div>
                    <div>
                      <label className={labelStyles}>Quality</label>
                      <select className={inputStyles} value={form.sleep_quality} onChange={(e) => setField("sleep_quality", e.target.value)}>
                        <option value="">SELECT...</option>
                        {sleepQualityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {/* === DROGAS === */}
              {form.habitType === "drogas" && (
                <div className={sectionStyles}>
                  <div>
                    <label className={labelStyles}>Status</label>
                    <select className={inputStyles} value={form.uses_drugs} onChange={(e) => setField("uses_drugs", e.target.value)}>
                      {drugsStatusChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div className={grid2Cols}>
                    <div>
                      <label className={labelStyles}>Drug Type</label>
                      <input className={inputStyles} value={form.drug_description} onChange={(e) => setField("drug_description", e.target.value)} placeholder="TIPO_DE_DROGA" />
                    </div>
                    <div>
                      <label className={labelStyles}>Frequency</label>
                      <input className={inputStyles} value={form.drug_frequency} onChange={(e) => setField("drug_frequency", e.target.value)} placeholder="FRECUENCIA" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Clinical Notes (común para todos) */}
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