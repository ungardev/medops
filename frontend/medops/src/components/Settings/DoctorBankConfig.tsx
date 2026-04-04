// src/components/Settings/DoctorBankConfig.tsx
import React, { useState, useEffect } from "react";
import { VENEZUELAN_BANKS } from "@/constants/banks";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
interface DoctorBankConfigProps {
  bankName: string;
  bankRif: string;
  bankPhone: string;
  bankAccount: string;
  onUpdate: (data: { bank_name: string; bank_rif: string; bank_phone: string; bank_account: string }) => void;
}
export default function DoctorBankConfig({ bankName, bankRif, bankPhone, bankAccount, onUpdate }: DoctorBankConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    bank_name: bankName || "",
    bank_rif: bankRif || "",
    bank_phone: bankPhone || "",
    bank_account: bankAccount || "",
  });
  useEffect(() => {
    setForm({
      bank_name: bankName || "",
      bank_rif: bankRif || "",
      bank_phone: bankPhone || "",
      bank_account: bankAccount || "",
    });
  }, [bankName, bankRif, bankPhone, bankAccount]);
  const filledFields = [form.bank_name, form.bank_rif, form.bank_phone, form.bank_account].filter(Boolean).length;
  const totalFields = 4;
  const isComplete = filledFields === totalFields;
  const handleSave = async () => {
    await onUpdate(form);
    setIsEditing(false);
  };
  const labelStyles = `text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block`;
  const inputStyles = `w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30`;
  if (!isEditing) {
    return (
      <div className="bg-white/5 border border-white/15 p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-4 h-4 text-white/30" />
            <h4 className="text-[11px] font-medium text-white/60">
              Datos Bancarios
            </h4>
          </div>
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-medium ${
            isComplete 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isComplete ? 'Completo' : `${filledFields}/${totalFields}`}
          </div>
        </div>
        
        {form.bank_name ? (
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="text-white/30">Banco:</span>
              <span className="text-white/70 font-medium ml-2">{form.bank_name}</span>
            </div>
            {form.bank_rif && (
              <div>
                <span className="text-white/30">Cédula:</span>
                <span className="text-white/70 font-medium font-mono ml-2">{form.bank_rif}</span>
              </div>
            )}
            {form.bank_phone && (
              <div>
                <span className="text-white/30">Teléfono:</span>
                <span className="text-white/70 font-medium font-mono ml-2">{form.bank_phone}</span>
              </div>
            )}
            {form.bank_account && (
              <div>
                <span className="text-white/30">Cuenta:</span>
                <span className="text-white/70 font-medium font-mono ml-2">{form.bank_account}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-white/30">
            No configurado. Los pacientes no podrán ver tus datos de pago.
          </p>
        )}
        
        <button 
          onClick={() => setIsEditing(true)}
          className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium hover:bg-amber-500/15 transition-all rounded-lg"
        >
          {form.bank_name ? 'Editar Datos Bancarios' : 'Configurar Datos Bancarios'}
        </button>
      </div>
    );
  }
  return (
    <div className="bg-white/5 border border-white/15 p-5 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-4 h-4 text-white/30" />
          <h4 className="text-[11px] font-medium text-white/60">
            Editar Datos Bancarios
          </h4>
        </div>
        <button 
          onClick={() => setIsEditing(false)}
          className="text-white/40 hover:text-white/70 text-[10px] transition-colors"
        >
          Cancelar
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelStyles}>Banco</label>
          <select
            className={inputStyles}
            value={form.bank_name}
            onChange={(e) => setForm({...form, bank_name: e.target.value})}
          >
            <option value="">Seleccionar banco</option>
            {VENEZUELAN_BANKS.map(bank => (
              <option key={bank.code} value={bank.name}>{bank.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelStyles}>Cédula/RIF</label>
          <input
            className={inputStyles}
            value={form.bank_rif}
            onChange={(e) => setForm({...form, bank_rif: e.target.value})}
            placeholder="V-12345678"
          />
        </div>
        <div>
          <label className={labelStyles}>Teléfono Pago Móvil</label>
          <input
            className={inputStyles}
            value={form.bank_phone}
            onChange={(e) => setForm({...form, bank_phone: e.target.value})}
            placeholder="04121234567"
          />
        </div>
        <div>
          <label className={labelStyles}>Número de Cuenta</label>
          <input
            className={inputStyles}
            value={form.bank_account}
            onChange={(e) => setForm({...form, bank_account: e.target.value})}
            placeholder="0105-XXXX-XXXX-XXXX"
          />
        </div>
      </div>
      
      <button 
        onClick={handleSave}
        className="w-full py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium hover:bg-amber-500/15 transition-all rounded-lg"
      >
        Guardar Datos Bancarios
      </button>
    </div>
  );
}