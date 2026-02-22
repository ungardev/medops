// src/components/Appointments/AppointmentDetail.tsx
import React, { useState } from "react";
import moment from "moment";
import { Appointment } from "../../types/appointments";
import { useAppointment } from "hooks/appointments";
import { 
  XMarkIcon, 
  PencilIcon, 
  InformationCircleIcon, 
  BanknotesIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentDetail({ appointment, onClose, onEdit }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "payments">("info");

  const { data: detail, isLoading, isError, error } = useAppointment(appointment.id);
  const appt = detail ?? appointment;

  const co = appt?.charge_order ?? null;
  const payments = Array.isArray(appt?.payments) ? appt.payments : [];

  const totalPagado = payments.reduce(
    (acc: number, p: any) => acc + Number(p.amount ?? p.total ?? 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Header Táctico */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--palantir-border)] bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-[var(--palantir-active)] text-[var(--palantir-active)] bg-[var(--palantir-active)]/5">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-[var(--palantir-active)] uppercase tracking-[0.3em]">
                Registry_Intelligence_Unit
              </span>
              <h2 className="text-lg font-black text-[var(--palantir-text)] uppercase">
                Record_Detail <span className="text-[var(--palantir-muted)] font-mono ml-2">#{appt.id.toString().padStart(6, '0')}</span>
              </h2>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              className="p-2 border border-[var(--palantir-border)] text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] hover:border-[var(--palantir-active)] transition-all"
              onClick={() => onEdit(appt)}
              title="MODIFY_RECORD"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="p-2 border border-[var(--palantir-border)] text-[var(--palantir-muted)] hover:text-red-500 hover:border-red-500 transition-all"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="p-10 text-center font-mono text-[10px] text-[var(--palantir-active)] animate-pulse tracking-widest">
            SYNCHRONIZING_REMOTE_DATA...
          </div>
        )}

        {/* Command Tabs */}
        <div className="flex border-b border-[var(--palantir-border)] bg-black/20">
          {[
            { id: "info", label: "INTEL_REPORT", icon: InformationCircleIcon },
            { id: "payments", label: "FISCAL_LEDGER", icon: BanknotesIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black tracking-widest transition-all border-b-2 ${
                activeTab === tab.id 
                  ? "bg-[var(--palantir-active)]/5 border-[var(--palantir-active)] text-[var(--palantir-active)]" 
                  : "border-transparent text-[var(--palantir-muted)] hover:text-[var(--palantir-text)]"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Subject_Name" value={appt.patient?.full_name} highlight />
                <DataField label="Op_Classification" value={appt.appointment_type} />
                <DataField label="Execution_Date" value={moment(appt.appointment_date).format("DD_MMM_YYYY").toUpperCase()} />
                <DataField label="Current_Status" value={appt.status?.toUpperCase()} color="text-[var(--palantir-active)]" />
              </div>
              
              <div className="mt-6 p-4 bg-black/30 border border-[var(--palantir-border)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Budget_Overview</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[8px] text-[var(--palantir-muted)] uppercase">Expected_Resources</span>
                    <p className="text-xl font-mono text-[var(--palantir-text)]">${appt.expected_amount || "0.00"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-[var(--palantir-muted)] uppercase">Collected_To_Date</span>
                    <p className="text-xl font-mono text-emerald-500">${totalPagado.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              <h3 className="text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em] mb-4">Transaction_History</h3>
              {payments.length > 0 ? (
                payments.map((p: any, idx: number) => (
                  <div key={p.id || idx} className="flex justify-between items-center p-3 bg-black/20 border border-[var(--palantir-border)] font-mono">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-500 font-bold">+ ${Number(p.amount ?? p.total ?? 0).toFixed(2)}</span>
                      <span className="text-[8px] text-[var(--palantir-muted)] uppercase">{p.method ?? "WIRE_TRANSFER"}</span>
                    </div>
                    <div className="text-right flex flex-col">
                      <span className="text-[9px] text-[var(--palantir-text)] uppercase">{p.status || "VERIFIED"}</span>
                      {p.reference_number && <span className="text-[8px] text-[var(--palantir-muted)]">REF: {p.reference_number}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border border-dashed border-[var(--palantir-border)]">
                  <span className="text-[10px] font-mono text-[var(--palantir-muted)]">-- NO_FISCAL_RECORDS_FOUND --</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Audit */}
        <div className="px-6 py-3 bg-black/40 border-t border-[var(--palantir-border)] flex justify-between items-center text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
          <span>Integrity_Hash: {Math.random().toString(36).substring(7).toUpperCase()}</span>
          <span>Security_Level: ALPHA-01</span>
        </div>
      </div>
    </div>
  );
}

// Sub-componente para campos de datos limpios
function DataField({ label, value, highlight, color }: { label: string, value: any, highlight?: boolean, color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest mb-0.5">{label}</span>
      <span className={`text-xs font-mono uppercase ${highlight ? 'text-[var(--palantir-text)] font-black' : 'text-[var(--palantir-text)]'} ${color}`}>
        {value || "---"}
      </span>
    </div>
  );
}
