// src/pages/Diagnosis/components/AIAnalysisPanel.tsx
import { SparklesIcon, BeakerIcon, CodeBracketIcon, ExclamationTriangleIcon, ShieldCheckIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { type AIAnalysisResult } from "@/api/diagnosis";
import { useState } from "react";

interface Props {
  analysis: AIAnalysisResult;
  onClose?: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  mild: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  normal: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-emerald-400 font-medium w-10 text-right">{pct}%</span>
    </div>
  );
}

function ICDCodeRow({ code }: { code: AIAnalysisResult["suggested_icd_codes"][0] }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500/20 transition-colors">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
          <CodeBracketIcon className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono font-bold text-emerald-400">{code.code}</span>
          <span className="text-xs text-white/40">{code.description}</span>
        </div>
        <p className="text-xs text-white/50 mt-1 leading-relaxed">{code.justification}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.round(code.confidence * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-emerald-400/60">{(code.confidence * 100).toFixed(0)}% confianza</span>
        </div>
      </div>
    </div>
  );
}

function AbnormalFlagRow({ flag }: { flag: AIAnalysisResult["abnormal_lab_flags"][0] }) {
  const colors = SEVERITY_COLORS[flag.severity] ?? SEVERITY_COLORS.normal;
  return (
    <div className={`flex items-center gap-3 p-2.5 border rounded-xl ${colors}`}>
      <div className={`w-2 h-2 rounded-full ${flag.direction === "high" ? "bg-red-400" : flag.direction === "low" ? "bg-blue-400" : "bg-emerald-400"}`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-white truncate">{flag.test}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-bold text-white">{flag.value}</span>
        <span className="text-xs text-white/40 ml-1">{flag.unit}</span>
      </div>
      {flag.reference_range && (
        <span className="text-xs text-white/30 hidden sm:block">Ref: {flag.reference_range}</span>
      )}
      <span className="text-xs font-medium capitalize px-1.5 py-0.5 rounded border border-current/20">{flag.severity}</span>
    </div>
  );
}

function DrugRow({ drug }: { drug: AIAnalysisResult["drug_mentions"][0] }) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl">
      <div className="w-2 h-2 bg-purple-400 rounded-full" />
      <span className="text-sm font-medium text-white flex-1">{drug.name}</span>
      {drug.dosage && (
        <span className="text-xs text-white/50 font-mono bg-white/5 px-2 py-0.5 rounded">{drug.dosage}</span>
      )}
      {drug.route && (
        <span className="text-xs text-purple-400/80">{drug.route}</span>
      )}
      {drug.frequency && (
        <span className="text-xs text-white/40">{drug.frequency}</span>
      )}
    </div>
  );
}

export default function AIAnalysisPanel({ analysis, onClose }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <SparklesIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-emerald-400">Analisis IA — Centro de Diagnostico Inteligente</span>
            <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
              <span className="flex items-center gap-1">
                <BeakerIcon className="w-3 h-3" />
                MEDOPZ AI
              </span>
              <span>{(analysis.latency_ms / 1000).toFixed(1)}s</span>
              <span>{analysis.tokens_used} tokens</span>
              <span>${parseFloat(analysis.estimated_cost_usd).toFixed(6)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {new Date(analysis.performed_at).toLocaleString("es-VE")}
              </span>
            </div>
          </div>
        </div>

        {analysis.confidence_score !== null && (
          <div className="mb-3">
            <div className="text-xs text-white/50 mb-1">Confianza del analisis</div>
            <ConfidenceBar score={analysis.confidence_score} />
          </div>
        )}

        {analysis.clinical_summary && (
          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              Resumen Clinico
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{analysis.clinical_summary}</p>
          </div>
        )}

        {analysis.interpretation && (
          <div className="bg-black/30 border border-white/10 rounded-xl p-4 mt-3">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              Interpretacion Clinica
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{analysis.interpretation}</p>
          </div>
        )}
      </div>

      {analysis.abnormal_lab_flags.length > 0 && (
        <div>
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-400" />
            Valores Anormales Detectados ({analysis.abnormal_flags_count})
          </div>
          <div className="space-y-1.5">
            {analysis.abnormal_lab_flags.map((flag, i) => (
              <AbnormalFlagRow key={i} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {analysis.suggested_icd_codes.length > 0 && (
        <div>
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CodeBracketIcon className="w-3.5 h-3.5 text-emerald-400" />
            Codigos ICD-11 Sugeridos ({analysis.icd_codes_count})
          </div>
          <div className="space-y-2">
            {analysis.suggested_icd_codes.map((code, i) => (
              <ICDCodeRow key={i} code={code} />
            ))}
          </div>
        </div>
      )}

      {analysis.drug_mentions.length > 0 && (
        <div>
          <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BeakerIcon className="w-3.5 h-3.5 text-purple-400" />
            Medicamentos Detectados ({analysis.drug_mentions.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.drug_mentions.map((drug, i) => (
              <DrugRow key={i} drug={drug} />
            ))}
          </div>
        </div>
      )}

      {analysis.reasoning_trace && (
        <div>
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            {showTrace ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
            Traza de razonamiento
          </button>
          {showTrace && (
            <div className="mt-2 p-3 bg-black/30 border border-white/10 rounded-xl">
              <pre className="text-xs text-white/50 whitespace-pre-wrap leading-relaxed font-mono">
                {analysis.reasoning_trace}
              </pre>
            </div>
          )}
        </div>
      )}

      <div>
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          {showRaw ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          Respuesta cruda del modelo
        </button>
        {showRaw && (
          <div className="mt-2 p-3 bg-black/30 border border-white/10 rounded-xl overflow-auto max-h-64">
            <pre className="text-xs text-white/40 whitespace-pre-wrap leading-relaxed font-mono">
              {JSON.stringify(analysis.raw_response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
