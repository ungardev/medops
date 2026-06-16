import React, { useState } from "react";
import { useIcdSearch, type IcdResult } from "@/hooks/diagnosis/useIcdSearch";
import type { DiagnosisType, DiagnosisStatus } from "@/types/consultation";
import DiagnosisBadge from "@/components/Consultation/DiagnosisBadge";
import { AlertTriangle, HashIcon, ClipboardListIcon, CheckCircleIcon, Plus, X } from "lucide-react";

export interface DiagnosisEntry {
  id: number;
  icd_code: string;
  title: string;
  type: DiagnosisType;
  status: DiagnosisStatus;
}

interface IcdDiagnosisSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (diagnosis: IcdResult) => void;
  onConfirm: () => void;
  onCancel: () => void;
  selectedDiagnosis: IcdResult | null;
  selectedType: DiagnosisType;
  selectedStatus: DiagnosisStatus;
  onTypeChange: (type: DiagnosisType) => void;
  onStatusChange: (status: DiagnosisStatus) => void;
  diagnoses: DiagnosisEntry[];
  onRemoveDiagnosis: (id: number) => void;
  onClearAll: () => void;
}

const TYPE_OPTIONS: { value: DiagnosisType; label: string }[] = [
  { value: "presumptive", label: "Presuntivo (Sospecha)" },
  { value: "definitive", label: "Definitivo (Confirmado)" },
  { value: "differential", label: "Diferencial (En estudio)" },
  { value: "provisional", label: "Provisional" },
];

const STATUS_OPTIONS: { value: DiagnosisStatus; label: string }[] = [
  { value: "under_investigation", label: "En Investigación" },
  { value: "awaiting_results", label: "Esperando Resultados" },
  { value: "confirmed", label: "Confirmado" },
  { value: "ruled_out", label: "Descartado" },
  { value: "chronic", label: "Crónico / Pre-existente" },
];

export default function IcdDiagnosisSearch({
  value,
  onChange,
  onSelect,
  onConfirm,
  onCancel,
  selectedDiagnosis,
  selectedType,
  selectedStatus,
  onTypeChange,
  onStatusChange,
  diagnoses,
  onRemoveDiagnosis,
  onClearAll,
}: IcdDiagnosisSearchProps) {
  const { data: icdResults = [], isLoading: icdLoading } = useIcdSearch(value);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400 uppercase">
            Diagnósticos (ICD-11)
          </span>
        </div>
        <span className="text-xs text-white/40">
          {diagnoses.length} registrado{diagnoses.length !== 1 ? "s" : ""}
        </span>
      </div>

      {diagnoses.length > 0 && (
        <div className="space-y-2">
          {diagnoses.map((diag) => (
            <DiagnosisBadge
              key={diag.id}
              id={diag.id}
              icd_code={diag.icd_code}
              title={diag.title}
              type={diag.type}
              status={diag.status}
              onDelete={onRemoveDiagnosis}
            />
          ))}
        </div>
      )}

      {!selectedDiagnosis && (
        <div className="relative">
          <input
            type="text"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-5 py-3 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar diagnóstico por código o descripción..."
          />
          {value.length >= 2 && icdResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-xl max-h-96 overflow-y-auto z-10 shadow-xl">
              {icdResults.map((diagnosis: any) => (
                <div
                  key={diagnosis.id}
                  className="px-4 py-2.5 hover:bg-white/15 cursor-pointer border-b border-white/10 last:border-b-0 transition-colors flex items-start gap-3"
                  onClick={() => {
                    onSelect(diagnosis);
                    onChange("");
                  }}
                >
                  <span className="text-xs font-bold text-emerald-400 shrink-0">
                    {diagnosis.icd_code}
                  </span>
                  <span className="text-xs text-white/80 leading-tight">
                    {diagnosis.title}
                  </span>
                </div>
              ))}
            </div>
          )}
          {value.length >= 2 && icdResults.length === 0 && icdLoading && (
            <div className="absolute left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/15 rounded-xl p-2 z-10 shadow-xl">
              <span className="text-white/50 text-[10px] flex items-center gap-2">
                <div className="w-3 h-3 border border-white/20 border-t-emerald-400 rounded-full animate-spin" />
                Buscando diagnósticos...
              </span>
            </div>
          )}
        </div>
      )}

      {selectedDiagnosis && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 rounded-xl">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <HashIcon className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                {selectedDiagnosis.icd_code}
              </span>
            </div>
            <span className="text-xs text-white/60">{selectedDiagnosis.title}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <ClipboardListIcon className="w-5 h-5" />
                Tipo de Diagnóstico
              </label>
              <select
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value as DiagnosisType)}
                className="w-full bg-white/5 border border-white/15 p-3 text-sm focus:border-emerald-500/50 outline-none rounded-xl"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                Estado
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value as DiagnosisStatus)}
                className="w-full bg-white/5 border border-white/15 p-3 text-sm focus:border-emerald-500/50 outline-none rounded-xl"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 flex items-center justify-center gap-2 transition-all rounded-xl"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Confirmar</span>
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/15 text-white/60 py-3 flex items-center justify-center gap-2 transition-all rounded-xl"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {diagnoses.length === 0 && !selectedDiagnosis && (
        <div className="p-4 border border-dashed border-white/15 text-center rounded-xl">
          <span className="text-xs text-white/40">No hay diagnósticos registrados</span>
        </div>
      )}
    </div>
  );
}

export { TYPE_OPTIONS, STATUS_OPTIONS };