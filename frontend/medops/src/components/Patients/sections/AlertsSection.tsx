// src/components/Patients/sections/AlertsSection.tsx
import React, { useMemo, useState } from "react";
import { PlusIcon, ExclamationTriangleIcon, InformationCircleIcon, BoltIcon } from "@heroicons/react/24/outline";
import AlertModal from "./AlertModal";
import { useClinicalAlerts } from "../../../hooks/patients/useClinicalAlerts";

type AlertType = "danger" | "warning" | "info";

interface AutoAlert {
  type: AlertType;
  message: React.ReactNode;
}

interface ManualAlert {
  id: number;
  type: AlertType;
  message: string;
}

interface Props {
  patient: any;
  backgrounds: any[];
  allergies?: any[];
  habits: any[];
  surgeries: any[];
  vaccinations: any[];
  vaccinationSchedule: any[];
  onChangeTab?: (id: string) => void;
}

function isRecent(date?: string) {
  if (!date) return false;
  const diffMonths = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30);
  return diffMonths < 6;
}

export default function AlertsSection({
  patient,
  backgrounds,
  allergies = [],
  habits,
  surgeries,
  vaccinations,
  vaccinationSchedule,
  onChangeTab,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManualAlert | null>(null);

  const { list, create, update, remove } = useClinicalAlerts(patient.id);

  // --- LÓGICA DE ALERTAS AUTOMÁTICAS (CORE INTELLIGENCE) ---
  const autoAlerts: AutoAlert[] = useMemo(() => {
    const alerts: AutoAlert[] = [];

    if (allergies.length > 0) {
      alerts.push({
        type: "danger",
        message: (
          <div className="flex flex-col gap-1">
            <span className="font-black">CRITICAL_ALLERGIES_DETECTED:</span>
            <span className="opacity-80 uppercase">{allergies.map((a) => a.name).join(", ")}</span>
          </div>
        ),
      });
    }

    const medicalHistory = backgrounds.filter((a) => a.type === "personal" || a.type === "family");
    if (medicalHistory.length > 0) {
      alerts.push({
        type: "warning",
        message: (
          <div className="flex flex-col gap-1">
            <span className="font-black">RELEVANT_MEDICAL_HISTORY:</span>
            <span className="opacity-80 uppercase">{medicalHistory.map((a) => a.condition).join(", ")}</span>
          </div>
        ),
      });
    }

    const riskyHabits = habits.filter((h) => ["smoking", "alcohol", "drugs"].includes(h.type));
    if (riskyHabits.length > 0) {
      alerts.push({
        type: "warning",
        message: (
          <div className="flex flex-col gap-1">
            <span className="font-black">LIFESTYLE_RISK_FACTORS:</span>
            <span className="opacity-80 uppercase">{riskyHabits.map((h) => h.type).join(", ")}</span>
          </div>
        ),
      });
    }

    const recentSurgeries = surgeries.filter((s) => isRecent(s.date));
    if (recentSurgeries.length > 0) {
      alerts.push({
        type: "warning",
        message: (
          <div className="flex flex-col gap-1">
            <span className="font-black">POST_SURGICAL_MONITORING:</span>
            <span className="opacity-80 uppercase">{recentSurgeries.map((s) => s.name).join(", ")}</span>
          </div>
        ),
      });
    }

    const missing = vaccinationSchedule.filter(
      (dose: any) => !vaccinations.some((v: any) => v.vaccine.id === dose.vaccine.id && v.dose_number === dose.dose_number)
    );
    if (missing.length > 0) {
      alerts.push({
        type: "info",
        message: (
          <div className="flex flex-col gap-1">
            <span className="font-black">IMMUNIZATION_PROTOCOL_INCOMPLETE:</span>
            <span className="opacity-80 uppercase">{missing.length} FAILED_OR_PENDING_DOSES</span>
          </div>
        ),
      });
    }

    return alerts;
  }, [backgrounds, allergies, habits, surgeries, vaccinations, vaccinationSchedule]);

  const manualAlerts: ManualAlert[] = (list.data as ManualAlert[]) ?? [];
  const allAlerts = [...autoAlerts, ...manualAlerts];

  // Configuración visual táctica
  const alertStyles: Record<AlertType, { bg: string; text: string; border: string; icon: any }> = {
    danger: { 
      bg: "bg-red-500/5", border: "border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]", 
      text: "text-red-500", icon: ExclamationTriangleIcon 
    },
    warning: { 
      bg: "bg-orange-500/5", border: "border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]", 
      text: "text-orange-500", icon: BoltIcon 
    },
    info: { 
      bg: "bg-blue-500/5", border: "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]", 
      text: "text-blue-400", icon: InformationCircleIcon 
    },
  };

  return (
    <div className="bg-[var(--palantir-surface)]/20 border border-[var(--palantir-border)] rounded-sm overflow-hidden">
      {/* Header Táctico */}
      <div className="bg-[var(--palantir-border)]/20 px-4 py-3 flex justify-between items-center border-b border-[var(--palantir-border)]">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-mono font-black text-[var(--palantir-text)] uppercase tracking-widest">
            Clinical_Risk_Signals
          </span>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="p-1 hover:bg-white/5 rounded-sm transition-colors text-[var(--palantir-active)]"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5">
        {allAlerts.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-[var(--palantir-border)] rounded-sm">
            <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">Status: Zero_Alerts_Logged</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allAlerts.map((alert, index) => {
              const type = alert.type as AlertType;
              const style = alertStyles[type];
              const Icon = style.icon;
              const isManual = "id" in alert;
              const key = isManual ? `manual-${alert.id}` : `auto-${index}`;

              return (
                <div 
                  key={key}
                  className={`${style.bg} ${style.border} border p-4 rounded-sm flex items-start gap-4 transition-all hover:brightness-125`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${style.text}`} />
                  
                  <div className="flex-1">
                    <div className={`text-[11px] font-mono leading-relaxed ${style.text}`}>
                      {alert.message}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                      <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">
                        Origin: {isManual ? `STAFF_ID_${(alert as any).created_by || 'USR'}` : 'SYSTEM_AUTO_GEN'}
                      </span>
                      
                      {isManual && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => { setEditing(alert as ManualAlert); setModalOpen(true); }}
                            className="text-[9px] font-mono text-[var(--palantir-active)] hover:underline uppercase"
                          >
                            [Override]
                          </button>
                          <button 
                            onClick={() => remove.mutate((alert as ManualAlert).id)}
                            className="text-[9px] font-mono text-red-500/60 hover:text-red-500 uppercase"
                          >
                            [Purge]
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={(data) => {
          editing ? update.mutate({ id: editing.id, data }) : create.mutate(data);
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing || undefined}
      />
    </div>
  );
}
