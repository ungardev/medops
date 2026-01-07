// src/components/Appointments/AppointmentEditForm.tsx
import React, { useState } from "react";
import { Appointment, AppointmentInput } from "../../types/appointments"; // Verifica que la ruta sea correcta
import { XMarkIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

interface Props {
  appointment: Appointment; // Corregido: 'A' mayúscula
  onClose: () => void;
  onSubmit?: (id: number, data: AppointmentInput) => void;
}

export default function AppointmentEditForm({ appointment, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<AppointmentInput>({
    patient: appointment?.patient?.id ?? 0,
    appointment_date: appointment?.appointment_date ?? "",
    appointment_type: appointment?.appointment_type ?? "general",
    expected_amount: String(appointment?.expected_amount ?? ""),
    notes: appointment?.notes ?? "", // Añadido para consistencia
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "patient") return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AppointmentInput = {
      ...form,
      expected_amount: form.expected_amount ? String(form.expected_amount) : "",
    };
    if (onSubmit && appointment?.id) {
      onSubmit(appointment.id, payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 font-sans">
      <div className="max-w-lg w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] shadow-2xl overflow-hidden text-[var(--palantir-text)]">
        
        {/* Header Táctico */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--palantir-border)] bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] border border-[var(--palantir-active)]/20">
              <PencilSquareIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-[var(--palantir-active)] uppercase tracking-[0.3em]">
                Record_Modification_Mode
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight">
                Edit_Entry <span className="text-[var(--palantir-muted)] font-mono ml-2">#ID-{appointment?.id}</span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="p-1 hover:bg-red-500/20 text-[var(--palantir-muted)] hover:text-red-500 transition-all"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Cuerpo del Protocolo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="bg-blue-500/5 border-l-2 border-blue-500 p-3 mb-4">
            <p className="text-[10px] font-mono text-blue-400 leading-tight italic">
              SYSTEM_NOTE: Modifications to historical records are logged for auditing purposes. 
              Subject identity is locked and cannot be altered in this view.
            </p>
          </div>

          <div className="space-y-1.5 opacity-80">
            <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">
              Locked_Subject_Identity
            </label>
            <div className="w-full bg-black/20 border border-[var(--palantir-border)]/50 px-3 py-2 text-sm font-mono text-[var(--palantir-muted)] cursor-not-allowed uppercase">
              {appointment?.patient?.full_name ?? "UNKNOWN_SUBJECT"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Re-Schedule_Date</label>
              <input
                type="date"
                name="appointment_date"
                value={form.appointment_date}
                onChange={handleChange}
                required
                className="w-full bg-black/40 border border-[var(--palantir-border)] px-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Op_Classification</label>
              <select
                name="appointment_type"
                value={form.appointment_type}
                onChange={handleChange}
                className="w-full bg-black/40 border border-[var(--palantir-border)] px-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all appearance-none"
              >
                <option value="general" className="bg-gray-900">GENERAL_DEPLOYMENT</option>
                <option value="specialized" className="bg-gray-900">SPECIALIZED_OP</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Resource_Reallocation (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-[var(--palantir-active)] font-mono text-sm font-bold">$</span>
              <input
                type="text"
                name="expected_amount"
                value={form.expected_amount}
                onChange={handleChange}
                className="w-full bg-black/40 border border-[var(--palantir-border)] pl-8 pr-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-[var(--palantir-border)] mt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)] hover:text-white transition-colors"
            >
              Discard_Changes
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-[var(--palantir-active)] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(30,136,229,0.2)] hover:shadow-[0_0_30px_rgba(30,136,229,0.4)] transition-all"
            >
              Update_System_Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
