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
  habits?: any[];
  surgeries: any[];
  vaccinations: any[];
  vaccinationSchedule: any[];
  readOnly?: boolean;
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
  habits = [],
  surgeries,
  vaccinations,
  vaccinationSchedule,
  readOnly = false,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ManualAlert | null>(null);
  const { list, create, update, remove } = useClinicalAlerts(patient.id);
  const autoAlerts: AutoAlert[] = useMemo(() => {
    const alerts: AutoAlert[] = [];
    if (allergies.length > 0) {
      alerts.push({
        type: "danger",
        message: (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Alergias críticas detectadas:</span>
            <span className="opacity-80">{allergies.map((a) => a.name).join(", ")}</span>
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
            <span className="font-semibold">Antecedentes médicos relevantes:</span>
            <span className="opacity-80">{medicalHistory.map((a) => a.condition).join(", ")}</span>
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
            <span className="font-semibold">Factores de riesgo:</span>
            <span className="opacity-80">{riskyHabits.map((h) => h.type === 'smoking' ? 'Tabaquismo' : h.type === 'alcohol' ? 'Alcohol' : 'Drogas').join(", ")}</span>
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
            <span className="font-semibold">Seguimiento post-quirúrgico:</span>
            <span className="opacity-80">{recentSurgeries.map((s) => s.name).join(", ")}</span>
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
            <span className="font-semibold">Esquema de vacunación incompleto:</span>
            <span className="opacity-80">{missing.length} dosis pendiente{missing.length > 1 ? 's' : ''}</span>
          </div>
        ),
      });
    }
    return alerts;
  }, [backgrounds, allergies, habits, surgeries, vaccinations, vaccinationSchedule]);
  const manualAlerts: ManualAlert[] = (list.data as ManualAlert[]) ?? [];
  const allAlerts = [...autoAlerts, ...manualAlerts];
  const alertStyles: Record<AlertType, { bg: string; text: string; border: string; icon: any }> = {
    danger: { 
      bg: "bg-red-500/10", border: "border-red-500/20", 
      text: "text-red-400", icon: ExclamationTriangleIcon 
    },
    warning: { 
      bg: "bg-amber-500/10", border: "border-amber-500/20", 
      text: "text-amber-400", icon: BoltIcon 
    },
    info: { 
      bg: "bg-blue-500/10", border: "border-blue-500/20", 
      text: "text-blue-400", icon: InformationCircleIcon 
    },
  };
  return (
    <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
      <div className="bg-white/5 px-5 py-3 flex justify-between items-center border-b border-white/15">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
          <span className="text-[11px] font-medium text-white/70">
            Alertas Clínicas
          </span>
        </div>
        
        {!readOnly && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-emerald-400"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="p-5">
        {allAlerts.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/15 rounded-lg">
            <span className="text-[11px] text-white/40">Sin alertas registradas</span>
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
                  className={`${style.bg} ${style.border} border p-4 rounded-lg flex items-start gap-4 transition-all`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${style.text}`} />
                  
                  <div className="flex-1">
                    <div className={`text-[11px] leading-relaxed ${style.text}`}>
                      {alert.message}
                    </div>                     
                    <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                      <span className="text-[8px] text-white/30">
                        {isManual ? 'Agregado por personal' : 'Generado automáticamente'}
                      </span>
                        
                      {!readOnly && isManual && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => { setEditing(alert as ManualAlert); setModalOpen(true); }}
                            className="text-[9px] text-emerald-400 hover:underline"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => remove.mutate((alert as ManualAlert).id)}
                            className="text-[9px] text-red-400/60 hover:text-red-400"
                          >
                            Eliminar
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
      
      {!readOnly && (
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
      )}
    </div>
  );
}