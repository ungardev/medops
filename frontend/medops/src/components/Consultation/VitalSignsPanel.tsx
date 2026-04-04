// src/components/Consultation/VitalSignsPanel.tsx
import { useState, useEffect } from "react";
import { 
  useVitalSigns, 
  useCreateVitalSigns, 
  useUpdateVitalSigns, 
  useDeleteVitalSigns 
} from "../../hooks/consultations/useVitalSigns";
import { 
  HeartIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  CalculatorIcon
} from "@heroicons/react/24/outline";
import type { VitalSigns } from "../../types/clinical";
interface Props {
  appointmentId: number;
  readOnly?: boolean;
}
export default function VitalSignsPanel({ appointmentId, readOnly = false }: Props) {
  const { data: vitalSigns, isLoading } = useVitalSigns(appointmentId);
  const createVitalSigns = useCreateVitalSigns(appointmentId);
  const updateVitalSigns = useUpdateVitalSigns(vitalSigns?.id, appointmentId);
  const deleteVitalSigns = useDeleteVitalSigns(appointmentId);
  
  const [form, setForm] = useState<Partial<VitalSigns>>({});
  useEffect(() => {
    if (vitalSigns) {
      setForm({
        weight: vitalSigns.weight,
        height: vitalSigns.height,
        temperature: vitalSigns.temperature,
        bp_systolic: vitalSigns.bp_systolic,
        bp_diastolic: vitalSigns.bp_diastolic,
        heart_rate: vitalSigns.heart_rate,
        respiratory_rate: vitalSigns.respiratory_rate,
        oxygen_saturation: vitalSigns.oxygen_saturation,
      });
    }
  }, [vitalSigns]);
  const calculateBMI = (weight?: number, height?: number): number | undefined => {
    if (!weight || !height) return undefined;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };
  const getBPStatus = (systolic?: number, diastolic?: number): "normal" | "warning" | "critical" => {
    if (!systolic || !diastolic) return "normal";
    if (systolic >= 180 || diastolic >= 120) return "critical";
    if (systolic >= 140 || diastolic >= 90) return "warning";
    return "normal";
  };
  const getTempStatus = (temp?: number): "normal" | "hypothermia" | "fever" | "critical" => {
    if (!temp) return "normal";
    if (temp < 35) return "hypothermia";
    if (temp >= 39) return "critical";
    if (temp >= 37.5) return "fever";
    return "normal";
  };
  const getOxygenStatus = (sat?: number): "normal" | "warning" | "critical" => {
    if (!sat) return "normal";
    if (sat < 90) return "critical";
    if (sat < 95) return "warning";
    return "normal";
  };
  const handleChange = (field: keyof VitalSigns, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setForm(prev => ({ ...prev, [field]: numValue }));
  };
  const handleSave = () => {
    if (vitalSigns?.id) {
      updateVitalSigns.mutate(form);
    } else {
      createVitalSigns.mutate(form as any);
    }
  };
  const handleDelete = () => {
    if (vitalSigns?.id && confirm("Delete vital signs record?")) {
      deleteVitalSigns.mutate(vitalSigns.id);
    }
  };
  if (isLoading) return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  const bmi = form.bmi || calculateBMI(form.weight, form.height);
  const bpStatus = getBPStatus(form.bp_systolic, form.bp_diastolic);
  const tempStatus = getTempStatus(form.temperature);
  const oxygenStatus = getOxygenStatus(form.oxygen_saturation);
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <HeartIcon className="w-5 h-5 text-red-400" />
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-red-400">
          Vital Signs Monitoring
        </h3>
        {vitalSigns?.updated_at && (
          <span className="text-[10px] text-white/50 ml-auto">
            Última actualización: {new Date(vitalSigns.updated_at).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/15 rounded-lg p-4 hover:bg-white/10 transition-colors">
          <label className="text-[11px] font-medium text-white/80 uppercase flex justify-between mb-2">
            <span>Peso (kg)</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">●</span>
          </label>
          <input
            type="number"
            step="0.1"
            value={form.weight || ""}
            onChange={(e) => handleChange("weight", e.target.value)}
            disabled={readOnly}
            className="w-full bg-transparent text-white text-[15px] font-mono outline-none placeholder:text-white/30"
            placeholder="0.0"
          />
        </div>
        
        <div className="bg-white/5 border border-white/15 rounded-lg p-4 hover:bg-white/10 transition-colors">
          <label className="text-[11px] font-medium text-white/80 uppercase flex justify-between mb-2">
            <span>Talla (cm)</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">●</span>
          </label>
          <input
            type="number"
            value={form.height || ""}
            onChange={(e) => handleChange("height", e.target.value)}
            disabled={readOnly}
            className="w-full bg-transparent text-white text-[15px] font-mono outline-none placeholder:text-white/30"
            placeholder="0"
          />
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/25 rounded-lg p-4">
          <label className="text-[11px] font-medium text-blue-300 uppercase flex justify-between mb-2">
            <span>IMC</span>
            <div className="flex items-center gap-1">
              <CalculatorIcon className="w-4 h-4 text-blue-400/60" />
              <span className="text-blue-400/60">AUTO</span>
            </div>
          </label>
          <div className="text-xl font-mono text-blue-300 tabular-nums">
            {bmi?.toFixed(1) || "--"}
          </div>
          {bmi && (
            <div className="text-[10px] font-medium text-blue-300/80 mt-1">
              {bmi < 18.5 ? "BAJO PESO" : bmi < 25 ? "NORMAL" : bmi < 30 ? "SOBREPESO" : "OBESIDAD"}
            </div>
          )}
        </div>
        
        <div className={`border rounded-lg p-4 transition-colors ${
          tempStatus === 'critical' ? 'bg-red-500/10 border-red-500/30' :
          tempStatus === 'fever' ? 'bg-yellow-500/10 border-yellow-500/30' :
          tempStatus === 'hypothermia' ? 'bg-cyan-500/10 border-cyan-500/30' :
          'bg-white/5 border-white/15'
        }`}>
          <label className="text-[11px] font-medium uppercase flex justify-between mb-2">
            <span className={
              tempStatus === 'critical' ? 'text-red-400' :
              tempStatus === 'fever' ? 'text-yellow-400' :
              tempStatus === 'hypothermia' ? 'text-cyan-400' :
              'text-white/80'
            }>
              Temperatura (°C)
            </span>
            <div className="flex items-center gap-1">
              {tempStatus === 'critical' && <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />}
              {tempStatus === 'fever' && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />}
              {tempStatus === 'hypothermia' && <ExclamationTriangleIcon className="w-4 h-4 text-cyan-400" />}
              {tempStatus === 'normal' && <CheckCircleIcon className="w-4 h-4 text-emerald-400" />}
            </div>
          </label>
          <input
            type="number"
            step="0.1"
            value={form.temperature || ""}
            onChange={(e) => handleChange("temperature", e.target.value)}
            disabled={readOnly}
            className={`w-full bg-transparent text-[15px] font-mono outline-none placeholder:text-white/30 ${
              tempStatus === 'critical' ? 'text-red-400' :
              tempStatus === 'fever' ? 'text-yellow-400' :
              tempStatus === 'hypothermia' ? 'text-cyan-400' :
              'text-white'
            }`}
            placeholder="36.5"
          />
          {tempStatus === 'hypothermia' && (
            <div className="text-[10px] font-medium text-cyan-400 mt-1 uppercase">
              HIPOTERMIA
            </div>
          )}
        </div>
      </div>
      <div className={`border rounded-lg p-5 transition-colors ${
        bpStatus === 'critical' ? 'bg-red-500/10 border-red-500/30' :
        bpStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
        'bg-white/5 border-white/15'
      }`}>
        <label className="text-[11px] font-medium uppercase flex justify-between mb-3">
          <span className={
            bpStatus === 'critical' ? 'text-red-400' :
            bpStatus === 'warning' ? 'text-yellow-400' :
            'text-white/80'
          }>
            Presión Arterial (mmHg)
          </span>
          <div className="flex items-center gap-2">
            {bpStatus === 'critical' && <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />}
            {bpStatus === 'warning' && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />}
            {bpStatus === 'normal' && <CheckCircleIcon className="w-4 h-4 text-emerald-400" />}
            <span className="text-[10px] font-medium text-white/60 uppercase">
              {bpStatus === 'normal' ? 'NORMAL' : bpStatus === 'warning' ? 'ELEVADA' : 'CRÍTICA'}
            </span>
          </div>
        </label>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="text-[10px] font-medium text-white/60 uppercase mb-1">Sistólica</label>
            <input
              type="number"
              value={form.bp_systolic || ""}
              onChange={(e) => handleChange("bp_systolic", e.target.value)}
              disabled={readOnly}
              className="w-full bg-transparent text-white text-[18px] font-mono outline-none placeholder:text-white/30"
              placeholder="120"
            />
          </div>
          <span className="text-white/50 text-2xl font-mono self-center">/</span>
          <div className="flex-1">
            <label className="text-[10px] font-medium text-white/60 uppercase mb-1">Diastólica</label>
            <input
              type="number"
              value={form.bp_diastolic || ""}
              onChange={(e) => handleChange("bp_diastolic", e.target.value)}
              disabled={readOnly}
              className="w-full bg-transparent text-white text-[18px] font-mono outline-none placeholder:text-white/30"
              placeholder="80"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/15 rounded-lg p-4">
          <label className="text-[11px] font-medium text-white/80 uppercase flex justify-between mb-2">
            <span>Frec. Cardíaca (bpm)</span>
          </label>
          <input
            type="number"
            value={form.heart_rate || ""}
            onChange={(e) => handleChange("heart_rate", e.target.value)}
            disabled={readOnly}
            className="w-full bg-transparent text-white text-[15px] font-mono outline-none placeholder:text-white/30"
            placeholder="72"
          />
        </div>
        <div className="bg-white/5 border border-white/15 rounded-lg p-4">
          <label className="text-[11px] font-medium text-white/80 uppercase flex justify-between mb-2">
            <span>Frec. Respiratoria (/min)</span>
          </label>
          <input
            type="number"
            value={form.respiratory_rate || ""}
            onChange={(e) => handleChange("respiratory_rate", e.target.value)}
            disabled={readOnly}
            className="w-full bg-transparent text-white text-[15px] font-mono outline-none placeholder:text-white/30"
            placeholder="16"
          />
        </div>
        <div className={`border rounded-lg p-4 transition-colors ${
          oxygenStatus === 'critical' ? 'bg-red-500/10 border-red-500/30' :
          oxygenStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
          'bg-white/5 border-white/15'
        }`}>
          <label className="text-[11px] font-medium uppercase flex justify-between mb-2">
            <span className={
              oxygenStatus === 'critical' ? 'text-red-400' :
              oxygenStatus === 'warning' ? 'text-yellow-400' :
              'text-white/80'
            }>
              Saturación O₂ (%)
            </span>
            <div className="flex items-center gap-1">
              {oxygenStatus === 'critical' && <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />}
              {oxygenStatus === 'warning' && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />}
              {oxygenStatus === 'normal' && <CheckCircleIcon className="w-4 h-4 text-emerald-400" />}
            </div>
          </label>
          <input
            type="number"
            value={form.oxygen_saturation || ""}
            onChange={(e) => handleChange("oxygen_saturation", e.target.value)}
            disabled={readOnly}
            className={`w-full bg-transparent text-[15px] font-mono outline-none placeholder:text-white/30 ${
              oxygenStatus === 'critical' ? 'text-red-400' :
              oxygenStatus === 'warning' ? 'text-yellow-400' :
              'text-white'
            }`}
            placeholder="98"
          />
        </div>
      </div>
      {!readOnly && (
        <div className="flex justify-between items-center pt-4 border-t border-white/15">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={createVitalSigns.isPending || updateVitalSigns.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all disabled:opacity-50 rounded-lg"
            >
              <HeartIcon className="w-4 h-4" />
              {vitalSigns?.id ? "Actualizar" : "Registrar"}
            </button>
            
            {vitalSigns?.id && (
              <button
                onClick={handleDelete}
                disabled={deleteVitalSigns.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/15 text-white/70 text-[11px] font-medium uppercase tracking-wider hover:bg-white/10 transition-all disabled:opacity-50 rounded-lg"
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
                Eliminar
              </button>
            )}
          </div>
          <div className="text-[10px] text-white/50">
            {vitalSigns?.id ? `ID: ${vitalSigns.id}` : "Nuevo registro"}
          </div>
        </div>
      )}
    </div>
  );
}