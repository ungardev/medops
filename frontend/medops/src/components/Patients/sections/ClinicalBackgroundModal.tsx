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
  relative?: string; // 🔹 Agregado para resolver error ts(2339)
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
const typeConfig: Record<BackgroundType, { label: string; icon: any; color: string }> = {
  personal: { label: "Antecedente Personal", icon: ClipboardList, color: "text-blue-400" },
  family: { label: "Antecedente Familiar", icon: Users, color: "text-purple-400" },
  genetic: { label: "Predisposición Genética", icon: Dna, color: "text-emerald-400" },
  allergy: { label: "Alergia / Reacción", icon: AlertTriangle, color: "text-orange-400" },
  habit: { label: "Hábito / Estilo de Vida", icon: Activity, color: "text-cyan-400" },
};
const personalHistoryChoices = [
  { value: "patologico", label: "Patológico" },
  { value: "no_patologico", label: "No patológico" },
  { value: "quirurgico", label: "Quirúrgico" },
  { value: "traumatico", label: "Traumático" },
  { value: "alergico", label: "Alérgico" },
  { value: "toxico", label: "Tóxico" },
  { value: "gineco_obstetrico", label: "Gineco-obstétrico" },
];
const habitTypes = [
  { value: "tabaco", label: "Tabaco" },
  { value: "alcohol", label: "Alcohol" },
  { value: "actividad_fisica", label: "Actividad física" },
  { value: "dieta", label: "Dieta" },
  { value: "sueno", label: "Sueño" },
  { value: "drogas", label: "Drogas" },
];
const allergySeverityChoices = [
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "grave", label: "Grave" },
  { value: "anafilactica", label: "Anafiláctica" },
];
const allergySourceChoices = [
  { value: "historia_clinica", label: "Historia clínica" },
  { value: "prueba_cutanea", label: "Prueba cutánea" },
  { value: "prueba_sanguinea", label: "Prueba sanguínea" },
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
    personalType: "patologico",
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
        personalType: initial?.personalType ?? "patologico",
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
  if (!open) return null;
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
  return (
    <div 
      className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
      onClick={onClose} // ⭐ CRITICAL FIX: Agregar onClick al backdrop
    >
      <div 
        className="bg-[#11141a] border border-[var(--palantir-border)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // ⭐ CRITICAL FIX: Prevenir cerrar al hacer clic en el contenido
      >
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-[var(--palantir-border)] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 ${activeConfig.color}`}>
              <activeConfig.icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {initial ? "Editar Registro" : "Nuevo Registro"}
              </h3>
              <p className={`text-[10px] font-mono uppercase tracking-widest ${activeConfig.color}`}>
                {activeConfig.label}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        {/* Formulario */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {type === "personal" && (
            <div className="space-y-4 animate-in slide-in-from-right-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Clasificación</label>
                <select
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
                  value={form.personalType}
                  onChange={(e) => setField("personalType", e.target.value)}
                >
                  {personalHistoryChoices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Condición Médica</label>
                <input
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                  placeholder="Ej: Hipertensión Arterial"
                />
              </div>
            </div>
          )}
          {type === "family" && (
            <div className="space-y-4 animate-in slide-in-from-right-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Parentesco</label>
                <input
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
                  value={form.relation}
                  onChange={(e) => setField("relation", e.target.value)}
                  placeholder="Padre, Abuela materna, etc."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Condición / Diagnóstico</label>
                <input
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                  placeholder="Ej: Diabetes Tipo II"
                />
              </div>
            </div>
          )}
          {type === "genetic" && (
            <div className="space-y-4 animate-in slide-in-from-right-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex justify-between">
                  Catálogo Genético {loadingOptions && <Loader2 size={12} className="animate-spin" />}
                </label>
                <select
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                >
                  <option value="">Seleccione predisposición...</option>
                  {options.map((opt) => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
                </select>
              </div>
            </div>
          )}
          {type === "allergy" && (
            <div className="space-y-4 animate-in slide-in-from-right-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Agente Alérgeno</label>
                <input
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Medicamento, alimento, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Severidad</label>
                  <select
                    className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2 text-sm text-white focus:border-[var(--palantir-active)] outline-none px-2"
                    value={form.severity}
                    onChange={(e) => setField("severity", e.target.value)}
                  >
                    <option value="">Nivel...</option>
                    {allergySeverityChoices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Fuente</label>
                  <select
                    className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2 text-sm text-white focus:border-[var(--palantir-active)] outline-none px-2"
                    value={form.source}
                    onChange={(e) => setField("source", e.target.value)}
                  >
                    <option value="">Origen...</option>
                    {allergySourceChoices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          {type === "habit" && (
            <div className="space-y-4 animate-in slide-in-from-right-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Tipo de Hábito</label>
                <select
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
                  value={form.condition}
                  onChange={(e) => setField("condition", e.target.value)}
                >
                  {habitTypes.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Descripción de consumo</label>
                <textarea
                  className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none min-h-[60px] resize-none"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="Frecuencia, cantidad, tiempo..."
                />
              </div>
            </div>
          )}
          <div className="space-y-1.5 pt-2 border-t border-[var(--palantir-border)]/30">
            <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Observaciones adicionales</label>
            <textarea
              className="w-full bg-[#0d1117]/50 border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none min-h-[80px] resize-none"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Detalles clínicos relevantes..."
            />
          </div>
        </div>
        {/* Acciones */}
        <div className="p-6 bg-black/20 border-t border-[var(--palantir-border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg ${activeConfig.color.replace('text', 'bg').replace('-400', '-600')} hover:brightness-110 shadow-black/40`}
          >
            <Save size={16} />
            {initial ? "Actualizar Registro" : "Guardar Registro"}
          </button>
        </div>
      </div>
    </div>
  );
}