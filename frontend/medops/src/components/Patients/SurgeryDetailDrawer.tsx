// src/components/Patients/SurgeryDetailDrawer.tsx
import React from "react";
import type { Surgery } from "@/types/patients";
import { 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Heart,
  ShieldCheckIcon,
  AlertTriangle,
  Activity,
  FileText,
  Droplets,
  TestTube,
  CheckCircle,
  X,
  Pencil,
  Pause,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  surgery?: Surgery;
  onEdit?: (surgery: Surgery) => void;
  readOnly?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  scheduled: { label: "Programada", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  pre_op: { label: "Pre-operatorio", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  in_progress: { label: "En Curso", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  completed: { label: "Completada", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  canceled: { label: "Cancelada", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  postponed: { label: "Pospuesta", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
};

const riskConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Bajo Riesgo", color: "text-emerald-400" },
  moderate: { label: "Riesgo Moderado", color: "text-amber-400" },
  high: { label: "Alto Riesgo", color: "text-orange-400" },
  critical: { label: "Riesgo Crítico", color: "text-red-400" },
};

export default function SurgeryDetailDrawer({ open, onClose, surgery, onEdit, readOnly }: Props) {
  if (!open || !surgery) return null;

  const statusKey = surgery.status || "scheduled";
  const status = statusConfig[statusKey] || { label: surgery.status || "Desconocido", color: "text-white/60", bg: "bg-white/5", border: "border-white/10" };
  const risk = surgery.risk_level ? riskConfig[surgery.risk_level] : null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#1a1a1b] border-l border-white/15 z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/15 bg-[#1a1a1b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Scissors className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Detalle de Cirug\u00eda</h2>
              <p className="text-sm text-white/40">Informaci\u00f3n completa del procedimiento</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${status.bg} ${status.color} ${status.border}`}>
              {status.label}
            </span>
            {risk && (
              <span className={`text-xs font-medium ${risk.color}`}>
                {risk.label}
              </span>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Informaci\u00f3n del Procedimiento
            </h3>
            
            <div className="space-y-2">
              <div>
                <span className="text-xs text-white/40 uppercase">Procedimiento</span>
                <p className="text-base text-white/80 font-medium">{surgery.name || "Sin nombre"}</p>
              </div>
              
              {surgery.hospital && (
                <div>
                  <span className="text-xs text-white/40 uppercase">Centro M\u00e9dico</span>
                  <p className="text-sm text-white/70">{surgery.hospital}</p>
                </div>
              )}
              
              {surgery.surgery_type && (
                <div>
                  <span className="text-xs text-white/40 uppercase">Tipo de Cirug\u00eda</span>
                  <p className="text-sm text-white/70 capitalize">{surgery.surgery_type}</p>
                </div>
              )}
              
              {surgery.scheduled_date && (
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs text-white/40 uppercase flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      Fecha
                    </span>
                    <p className="text-sm text-white/70">
                      {new Date(surgery.scheduled_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {surgery.scheduled_time && (
                    <div>
                      <span className="text-xs text-white/40 uppercase flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Hora
                      </span>
                      <p className="text-sm text-white/70">{surgery.scheduled_time}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              Paciente
            </h3>
            <p className="text-base text-white/80">{surgery.patient_name || "Sin informaci\u00f3n del paciente"}</p>
          </div>

          {/* Surgical Team */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Equipo Quir\u00fargico
            </h3>
            
            <div className="space-y-2">
              {(surgery as any).surgeon_name && (
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-white/40" />
                  <div>
                    <span className="text-xs text-white/40 uppercase">Cirujano</span>
                    <p className="text-sm text-white/70">{(surgery as any).surgeon_name}</p>
                  </div>
                </div>
              )}
              
              {(surgery as any).anesthesiologist_name && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-white/40" />
                  <div>
                    <span className="text-xs text-white/40 uppercase">Anestesiólogo</span>
                    <p className="text-sm text-white/70">{(surgery as any).anesthesiologist_name}</p>
                  </div>
                </div>
              )}
              
              {(surgery as any).surgical_assistants_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-white/40" />
                  <div>
                    <span className="text-xs text-white/40 uppercase">Asistentes</span>
                    <p className="text-sm text-white/70">{(surgery as any).surgical_assistants_name}</p>
                  </div>
                </div>
              )}
              
              {!((surgery as any).surgeon_name || (surgery as any).anesthesiologist_name || (surgery as any).surgical_assistants_name) && (
                <p className="text-sm text-white/40">No hay informaci\u00f3n del equipo registrada</p>
              )}
            </div>
          </div>

          {/* Risk Classification */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5" />
              Clasificaci\u00f3n de Riesgo
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {surgery.asa_classification && (
                <div>
                  <span className="text-xs text-white/40 uppercase">Clasificaci\u00f3n ASA</span>
                  <p className="text-sm text-white/70">{surgery.asa_classification}</p>
                </div>
              )}
              {surgery.risk_level && (
                <div>
                  <span className="text-xs text-white/40 uppercase">Nivel de Riesgo</span>
                  <p className={`text-sm ${risk?.color || 'text-white/70'}`}>{surgery.risk_level_display}</p>
                </div>
              )}
              {!surgery.asa_classification && !surgery.risk_level && (
                <p className="text-sm text-white/40 col-span-2">No hay clasificaci\u00f3n de riesgo registrada</p>
              )}
            </div>
          </div>

          {/* Procedure Details */}
          {(surgery as any).procedure_description && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Descripci\u00f3n del Procedimiento
              </h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{(surgery as any).procedure_description}</p>
            </div>
          )}

          {/* Findings & Specimens */}
          {(surgery as any).findings && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Hallazgos
              </h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{(surgery as any).findings}</p>
            </div>
          )}

          {(surgery as any).specimens && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Espec\u00edmenes
              </h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{(surgery as any).specimens}</p>
            </div>
          )}

          {/* Blood Loss */}
          {(surgery as any).estimated_blood_loss && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                P\u00e9rdida Sangu\u00ednea
              </h3>
              <p className="text-sm text-white/70">{(surgery as any).estimated_blood_loss} ml</p>
            </div>
          )}

          {/* Complications */}
          {(surgery as any).complications && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Complicaciones
              </h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{(surgery as any).complications}</p>
            </div>
          )}

          {/* Post-op Instructions */}
          {(surgery as any).post_op_instructions && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Instrucciones Post-operatorias
              </h3>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{(surgery as any).post_op_instructions}</p>
            </div>
          )}

          {/* Follow-up */}
          {(surgery as any).follow_up_date && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Fecha de Seguimiento
              </h3>
              <p className="text-sm text-white/70">
                {new Date((surgery as any).follow_up_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="px-6 py-5 border-t border-white/15 bg-[#1a1a1b]">
            <button
              onClick={() => onEdit?.(surgery)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 rounded-xl transition-all text-sm font-medium"
            >
              <Pencil className="w-4 h-4" />
              Editar Cirugía
            </button>
          </div>
        )}
      </div>
    </>
  );
}