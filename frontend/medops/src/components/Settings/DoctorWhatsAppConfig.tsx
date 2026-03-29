// src/components/Settings/DoctorWhatsAppConfig.tsx
import React, { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
interface DoctorWhatsAppConfigProps {
  whatsappEnabled: boolean;
  whatsappBusinessNumber: string;
  whatsappBusinessId: string;
  whatsappAccessToken: string;
  reminderHoursBefore: number;
  onUpdate: (data: {
    whatsapp_enabled: boolean;
    whatsapp_business_number: string;
    whatsapp_business_id: string;
    whatsapp_access_token: string;
    reminder_hours_before: number;
  }) => void;
}
const labelStyles = `text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2 block`;
const inputStyles = `w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all`;
const WhatsAppIcon = () => (
  <img 
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'%3E%3Cpath d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/%3E%3C/svg%3E" 
    className="w-4 h-4" 
    alt="WhatsApp" 
  />
);
export default function DoctorWhatsAppConfig({
  whatsappEnabled,
  whatsappBusinessNumber,
  whatsappBusinessId,
  whatsappAccessToken,
  reminderHoursBefore,
  onUpdate,
}: DoctorWhatsAppConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    whatsapp_enabled: whatsappEnabled,
    whatsapp_business_number: whatsappBusinessNumber || "",
    whatsapp_business_id: whatsappBusinessId || "",
    whatsapp_access_token: whatsappAccessToken || "",
    reminder_hours_before: reminderHoursBefore || 24,
  });
  const isComplete = form.whatsapp_enabled && form.whatsapp_business_number && form.whatsapp_business_id;
  const handleSave = async () => {
    await onUpdate(form);
    setIsEditing(false);
  };
  // ✅ MODO VISTA
  if (!isEditing) {
    return (
      <div className="bg-[#080808] border border-white/10 p-6 rounded-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WhatsAppIcon />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              WhatsApp Business
            </h4>
          </div>
          <div className={`px-2 py-0.5 rounded text-[8px] font-bold ${
            isComplete 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {form.whatsapp_enabled ? (isComplete ? 'ACTIVO' : 'INCOMPLETO') : 'DESACTIVADO'}
          </div>
        </div>
        
        {form.whatsapp_enabled ? (
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="text-white/30">Número:</span>
              <span className="text-white/80 font-bold font-mono ml-2">{form.whatsapp_business_number || "—"}</span>
            </div>
            <div>
              <span className="text-white/30">Business ID:</span>
              <span className="text-white/80 font-bold font-mono ml-2">{form.whatsapp_business_id || "—"}</span>
            </div>
            <div>
              <span className="text-white/30">Recordatorio:</span>
              <span className="text-white/80 font-bold ml-2">{form.reminder_hours_before}h</span>
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-white/30 font-mono">
            WhatsApp no configurado. Los pacientes no recibirán notificaciones.
          </p>
        )}
        
        <button 
          onClick={() => setIsEditing(true)}
          className="w-full py-3 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-green-500/20 transition-all"
        >
          {form.whatsapp_enabled ? 'Editar Configuración' : 'Configurar WhatsApp'}
        </button>
      </div>
    );
  }
  // ✅ MODO EDICIÓN
  return (
    <div className="bg-[#080808] border border-white/10 p-6 rounded-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WhatsAppIcon />
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            Editar WhatsApp Business
          </h4>
        </div>
        <button 
          onClick={() => setIsEditing(false)}
          className="text-white/40 hover:text-white text-[9px]"
        >
          Cancelar
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.whatsapp_enabled}
          onChange={(e) => setForm({...form, whatsapp_enabled: e.target.checked})}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-600"
        />
        <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
          Habilitar WhatsApp
        </label>
      </div>
      
      {form.whatsapp_enabled && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelStyles}>Business Number</label>
            <input
              type="text"
              value={form.whatsapp_business_number}
              onChange={(e) => setForm({...form, whatsapp_business_number: e.target.value})}
              placeholder="+58 412-123-4567"
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Business ID</label>
            <input
              type="text"
              value={form.whatsapp_business_id}
              onChange={(e) => setForm({...form, whatsapp_business_id: e.target.value})}
              placeholder="1234567890"
              className={inputStyles}
            />
          </div>
          <div className="col-span-2">
            <label className={labelStyles}>Access Token</label>
            <input
              type="password"
              value={form.whatsapp_access_token}
              onChange={(e) => setForm({...form, whatsapp_access_token: e.target.value})}
              placeholder="EA..."
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Recordatorio (horas)</label>
            <select
              value={form.reminder_hours_before}
              onChange={(e) => setForm({...form, reminder_hours_before: parseInt(e.target.value)})}
              className={inputStyles}
            >
              <option value={12}>12 horas</option>
              <option value={24}>24 horas</option>
              <option value={48}>48 horas</option>
            </select>
          </div>
        </div>
      )}
      
      <button 
        onClick={handleSave}
        className="w-full py-3 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-green-500/20 transition-all"
      >
        Guardar Configuración WhatsApp
      </button>
    </div>
  );
}