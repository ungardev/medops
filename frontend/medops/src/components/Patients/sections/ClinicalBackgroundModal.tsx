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
  notes?: string;
  personalType?: string;
  condition?: string;
  date?: string;
  relation?: string;
  age_at_diagnosis?: number | null;
  name?: string;
  allergen?: string;
  severity?: string;
  source?: string;
  habitType?: string;
  smokes_currently?: string;
  tobacco_type?: string;
  smoking_frequency?: string;
  cigarettes_per_day?: number | null;
  smoking_start_age?: number | null;
  drinks_alcohol?: string;
  alcohol_frequency?: string;
  alcohol_quantity?: string;
  binge_frequency?: string;
  exercise_frequency?: string;
  exercise_intensity?: string;
  activity_description?: string;
  diet_type?: string;
  diet_restrictions?: string;
  sleep_hours?: number | null;
  sleep_quality?: string;
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
const typeConfig: Record<BackgroundType, { label: string; icon: any; color: string }> = {
  personal: { label: "Antecedentes Personales", icon: ClipboardList, color: "text-blue-400" },
  family: { label: "Antecedentes Familiares", icon: Users, color: "text-purple-400" },
  genetic: { label: "Predisposiciones Genéticas", icon: Dna, color: "text-emerald-400" },
  allergy: { label: "Alergias", icon: AlertTriangle, color: "text-orange-400" },
  habit: { label: "Hábitos y Estilo de Vida", icon: Activity, color: "text-cyan-400" },
};
const personalHistoryChoices = [
  { value: "patologico", label: "Patológico" },
  { value: "no_patologico", label: "No Patológico" },
  { value: "quirurgico", label: "Quirúrgico" },
  { value: "traumatico", label: "Traumático" },
  { value: "alergico", label: "Alérgico" },
  { value: "toxico", label: "Tóxico" },
  { value: "gineco_obstetrico", label: "Gineco-Obstétrico" },
];
const relationshipChoices = [
  { value: "mother", label: "Madre" },
  { value: "father", label: "Padre" },
  { value: "sibling", label: "Hermano/a" },
  { value: "child", label: "Hijo/a" },
  { value: "maternal_grandmother", label: "Abuela materna" },
  { value: "maternal_grandfather", label: "Abuelo materno" },
  { value: "paternal_grandmother", label: "Abuela paterna" },
  { value: "paternal_grandfather", label: "Abuelo paterno" },
  { value: "uncle", label: "Tío/a" },
  { value: "aunt", label: "Tía" },
  { value: "cousin", label: "Primo/a" },
  { value: "nephew", label: "Sobrino/a" },
  { value: "niece", label: "Sobrina" },
];
const allergySeverityChoices = [
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "grave", label: "Grave" },
  { value: "anafilactica", label: "Anafiláctica" },
];
const allergySourceChoices = [
  { value: "historia_clinica", label: "Historia Clínica" },
  { value: "prueba_cutanea", label: "Prueba Cutánea" },
  { value: "prueba_sanguinea", label: "Prueba Sanguínea" },
  { value: "autorreporte", label: "Autorreporte" },
];
const habitTypes = [
  { value: "tabaco", label: "Tabaco" },
  { value: "alcohol", label: "Alcohol" },
  { value: "actividad_fisica", label: "Actividad Física" },
  { value: "dieta", label: "Dieta" },
  { value: "sueno", label: "Sueño" },
  { value: "drogas", label: "Drogas" },
];
const smokingStatusChoices = [
  { value: "yes", label: "Fuma" },
  { value: "no", label: "No fuma" },
  { value: "former", label: "Ex fumador" },
];
const tobaccoTypeChoices = [
  { value: "cigarettes", label: "Cigarrillos" },
  { value: "pipe", label: "Pipa" },
  { value: "electronic", label: "Electrónico" },
  { value: "other", label: "Otros" },
];
const frequencyLevelsChoices = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "occasional", label: "Ocasional" },
];
const alcoholStatusChoices = [
  { value: "yes", label: "Consume" },
  { value: "no", label: "No consume" },
];
const alcoholFrequencyChoices = [
  { value: "never", label: "Nunca" },
  { value: "monthly_or_less", label: "Mensual o menos" },
  { value: "2_4_month", label: "2-4 veces al mes" },
  { value: "2_3_week", label: "2-3 veces por semana" },
  { value: "4_plus_week", label: "4+ veces por semana" },
];
const alcoholQuantityChoices = [
  { value: "1_2", label: "1-2" },
  { value: "3_4", label: "3-4" },
  { value: "5_6", label: "5-6" },
  { value: "7_9", label: "7-9" },
  { value: "10_plus", label: "10+" },
];
const bingeFrequencyChoices = [
  { value: "never", label: "Nunca" },
  { value: "less_monthly", label: "Menos de mensual" },
  { value: "monthly", label: "Mensual" },
  { value: "weekly", label: "Semanal" },
  { value: "daily", label: "Diario" },
];
const exerciseFrequencyChoices = [
  { value: "sedentary", label: "Sedentario" },
  { value: "1_2_week", label: "1-2 veces/semana" },
  { value: "3_4_week", label: "3-4 veces/semana" },
  { value: "5_plus_week", label: "5+ veces/semana" },
];
const exerciseIntensityChoices = [
  { value: "light", label: "Leve" },
  { value: "moderate", label: "Moderada" },
  { value: "intense", label: "Intensa" },
];
const dietTypeChoices = [
  { value: "omnivore", label: "Omnívora" },
  { value: "vegetarian", label: "Vegetariana" },
  { value: "vegan", label: "Vegana" },
  { value: "mediterranean", label: "Mediterránea" },
  { value: "other", label: "Otra" },
];
const sleepQualityChoices = [
  { value: "good", label: "Buena" },
  { value: "fair", label: "Regular" },
  { value: "poor", label: "Mala" },
];
const drugsStatusChoices = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
];
export default function ClinicalBackgroundModal({ open, onClose, onSave, initial, type }: Props) {
  const [form, setForm] = useState<ClinicalBackgroundForm>({
    type,
    notes: "",
    personalType: "patologico",
    condition: "",
    date: new Date().toISOString().slice(0, 10),
    relation: "",
    age_at_diagnosis: null,
    name: "",
    allergen: "",
    severity: "",
    source: "",
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
        personalType: initial?.personalType || "patologico",
        condition: initial?.condition || "",
        date: initial?.date || new Date().toISOString().slice(0, 10),
        relation: initial?.relation || "",
        age_at_diagnosis: initial?.age_at_diagnosis ?? null,
        name: initial?.name || "",
        allergen: initial?.allergen || initial?.name || "",
        severity: initial?.severity || "",
        source: initial?.source || "",
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
  const inputClass = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelClass = "text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block";
  const sectionClass = "bg-white/5 border border-white/10 rounded-lg p-5 space-y-4";
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5 sticky top-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-white/5 border border-white/10 rounded-lg`}>
              <activeConfig.icon className={`h-4 w-4 ${activeConfig.color}`} />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-white">
                {initial ? "Editar Registro" : "Nuevo Registro"}
              </h3>
              <p className="text-[10px] text-white/40 mt-0.5">{activeConfig.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {type === "personal" && (
            <div className={sectionClass}>
              <div>
                <label className={labelClass}>Tipo</label>
                <select className={inputClass} value={form.personalType} onChange={(e) => setField("personalType", e.target.value)}>
                  {personalHistoryChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Condición</label>
                <input className={inputClass} value={form.condition} onChange={(e) => setField("condition", e.target.value)} placeholder="Ej: Hipertensión, Diabetes..." />
              </div>
              <div>
                <label className={labelClass}>Fecha</label>
                <input type="date" style={{colorScheme: 'dark'}} className={inputClass} value={form.date} onChange={(e) => setField("date", e.target.value)} />
              </div>
            </div>
          )}
          {type === "family" && (
            <div className={sectionClass}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Parentesco</label>
                  <select className={inputClass} value={form.relation} onChange={(e) => setField("relation", e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {relationshipChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Edad al diagnóstico</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    value={form.age_at_diagnosis || ""} 
                    onChange={(e) => setField("age_at_diagnosis", e.target.value ? parseInt(e.target.value) : null)} 
                    placeholder="Edad"
                    min="0"
                    max="120"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Condición</label>
                <input className={inputClass} value={form.condition} onChange={(e) => setField("condition", e.target.value)} placeholder="Ej: Diabetes, Cáncer..." />
              </div>
            </div>
          )}
          {type === "genetic" && (
            <div className={sectionClass}>
              <div>
                <label className={labelClass}>
                  Predisposición {loadingOptions && <Loader2 size={14} className="inline animate-spin ml-2" />}
                </label>
                <select className={inputClass} value={form.name} onChange={(e) => setField("name", e.target.value)} disabled={loadingOptions}>
                  <option value="">Seleccionar...</option>
                  {options.map((opt) => (<option key={opt.id} value={opt.name}>{opt.name}</option>))}
                </select>
              </div>
            </div>
          )}
          {type === "allergy" && (
            <div className={sectionClass}>
              <div>
                <label className={labelClass}>Alérgeno</label>
                <input className={inputClass} value={form.allergen} onChange={(e) => setField("allergen", e.target.value)} placeholder="Ej: Medicamento, alimento..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Severidad</label>
                  <select className={inputClass} value={form.severity} onChange={(e) => setField("severity", e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {allergySeverityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Fuente</label>
                  <select className={inputClass} value={form.source} onChange={(e) => setField("source", e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {allergySourceChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                  </select>
                </div>
              </div>
            </div>
          )}
          {type === "habit" && (
            <>
              <div className={sectionClass}>
                <div>
                  <label className={labelClass}>Tipo de hábito</label>
                  <select className={inputClass} value={form.habitType} onChange={(e) => setField("habitType", e.target.value)}>
                    {habitTypes.map((h) => (<option key={h.value} value={h.value}>{h.label}</option>))}
                  </select>
                </div>
              </div>
              {form.habitType === "tabaco" && (
                <div className={sectionClass}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Estado</label>
                      <select className={inputClass} value={form.smokes_currently} onChange={(e) => setField("smokes_currently", e.target.value)}>
                        {smokingStatusChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Tipo</label>
                      <select className={inputClass} value={form.tobacco_type} onChange={(e) => setField("tobacco_type", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {tobaccoTypeChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Frecuencia</label>
                      <select className={inputClass} value={form.smoking_frequency} onChange={(e) => setField("smoking_frequency", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {frequencyLevelsChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Cantidad (por día)</label>
                      <input 
                        type="number" 
                        className={inputClass} 
                        value={form.cigarettes_per_day || ""} 
                        onChange={(e) => setField("cigarettes_per_day", e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="#"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Edad de inicio</label>
                    <input 
                      type="number" 
                      className={inputClass} 
                      value={form.smoking_start_age || ""} 
                      onChange={(e) => setField("smoking_start_age", e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Edad"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              )}
              {form.habitType === "alcohol" && (
                <div className={sectionClass}>
                  <div>
                    <label className={labelClass}>Estado</label>
                    <select className={inputClass} value={form.drinks_alcohol} onChange={(e) => setField("drinks_alcohol", e.target.value)}>
                      {alcoholStatusChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Frecuencia</label>
                      <select className={inputClass} value={form.alcohol_frequency} onChange={(e) => setField("alcohol_frequency", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {alcoholFrequencyChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Cantidad (por ocasión)</label>
                      <select className={inputClass} value={form.alcohol_quantity} onChange={(e) => setField("alcohol_quantity", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {alcoholQuantityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Frecuencia de consumo excesivo</label>
                    <select className={inputClass} value={form.binge_frequency} onChange={(e) => setField("binge_frequency", e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {bingeFrequencyChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                </div>
              )}
              {form.habitType === "actividad_fisica" && (
                <div className={sectionClass}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Frecuencia</label>
                      <select className={inputClass} value={form.exercise_frequency} onChange={(e) => setField("exercise_frequency", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {exerciseFrequencyChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Intensidad</label>
                      <select className={inputClass} value={form.exercise_intensity} onChange={(e) => setField("exercise_intensity", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {exerciseIntensityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Descripción de la actividad</label>
                    <input className={inputClass} value={form.activity_description} onChange={(e) => setField("activity_description", e.target.value)} placeholder="Ej: Caminar, gimnasio, deportes..." />
                  </div>
                </div>
              )}
              {form.habitType === "dieta" && (
                <div className={sectionClass}>
                  <div>
                    <label className={labelClass}>Tipo de dieta</label>
                    <select className={inputClass} value={form.diet_type} onChange={(e) => setField("diet_type", e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {dietTypeChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Restricciones</label>
                    <textarea className={`${inputClass} min-h-[80px] resize-none`} value={form.diet_restrictions} onChange={(e) => setField("diet_restrictions", e.target.value)} placeholder="Ej: Renal, diabética, celíaca..." />
                  </div>
                </div>
              )}
              {form.habitType === "sueno" && (
                <div className={sectionClass}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Horas por noche</label>
                      <input 
                        type="number" 
                        step="0.5"
                        className={inputClass} 
                        value={form.sleep_hours || ""} 
                        onChange={(e) => setField("sleep_hours", e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Horas"
                        min="0"
                        max="24"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Calidad</label>
                      <select className={inputClass} value={form.sleep_quality} onChange={(e) => setField("sleep_quality", e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {sleepQualityChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {form.habitType === "drogas" && (
                <div className={sectionClass}>
                  <div>
                    <label className={labelClass}>Estado</label>
                    <select className={inputClass} value={form.uses_drugs} onChange={(e) => setField("uses_drugs", e.target.value)}>
                      {drugsStatusChoices.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Tipo de sustancia</label>
                      <input className={inputClass} value={form.drug_description} onChange={(e) => setField("drug_description", e.target.value)} placeholder="Tipo" />
                    </div>
                    <div>
                      <label className={labelClass}>Frecuencia</label>
                      <input className={inputClass} value={form.drug_frequency} onChange={(e) => setField("drug_frequency", e.target.value)} placeholder="Frecuencia" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div className={`${sectionClass} border-t border-white/10 pt-5`}>
            <label className={labelClass}>Notas Clínicas</label>
            <textarea className={`${inputClass} min-h-[100px] resize-none`} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Observaciones adicionales..." />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/15 bg-white/5 rounded-b-lg">
          <button onClick={onClose} className="px-5 py-2.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-medium text-white bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all">
            <Save size={16} />
            {initial ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}