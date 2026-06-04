// src/components/Settings/DoctorBankConfig.tsx
import React, { useState, useEffect } from "react";
import { VENEZUELAN_BANKS } from "@/constants/banks";
import { 
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  ArrowsRightLeftIcon,
  CurrencyDollarIcon,
  WifiIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

interface DoctorBankConfigProps {
  bankName: string;
  bankRif: string;
  bankPhone: string;
  bankAccount: string;
  binanceCryptoWalletAddress?: string;
  binanceNetwork?: string;
  paymentMobileEnabled?: boolean;
  bankTransferEnabled?: boolean;
  cryptoEnabled?: boolean;
  commissionDoctorPercent?: number;
  onUpdate: (data: any) => void;
}

const CommissionSimulator = ({ 
  amount, 
  commissionPercent = 3.0 
}: { 
  amount: number; 
  commissionPercent?: number; 
}) => {
  if (!amount || amount <= 0) return null;
  
  const commission = amount * (commissionPercent / 100);
  const net = amount - commission;
  
  return (
    <div className="bg-black/20 border border-white/10 p-4 rounded-xl mt-4">
      <p className="text-xs text-white/40 font-medium mb-2">SIMULADOR DE COMISIONES</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/50">Monto bruto:</span>
          <span className="text-white/70 font-mono">${amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Comisión ({commissionPercent}%):</span>
          <span className="text-amber-400/70 font-mono">-${commission.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
          <span className="text-emerald-400/70 font-medium">Neto a recibir:</span>
          <span className="text-emerald-400 font-mono font-bold">${net.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

const PaymentMethodBadge = ({ 
  enabled, 
  label, 
  icon 
}: { 
  enabled?: boolean | string; 
  label: string; 
  icon: React.ReactNode;
}) => {
  const isActive = Boolean(enabled);
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      isActive 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
        : 'bg-white/5 border-white/10 text-white/30'
    }`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
      <span className={`ml-auto text-sm ${isActive ? 'text-emerald-400' : 'text-white/20'}`}>
        {isActive ? '● Activo' : '○ Inactivo'}
      </span>
    </div>
  );
};

export default function DoctorBankConfig({ 
  bankName, 
  bankRif, 
  bankPhone, 
  bankAccount,
  binanceCryptoWalletAddress = "",
  binanceNetwork = "TRC20",
  paymentMobileEnabled = true,
  bankTransferEnabled = false,
  cryptoEnabled = false,
  commissionDoctorPercent = 3.0,
  onUpdate 
}: DoctorBankConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [simulatorAmount, setSimulatorAmount] = useState<string>("");
  const [form, setForm] = useState({
    bank_name: bankName || "",
    bank_rif: bankRif || "",
    bank_phone: bankPhone || "",
    bank_account: bankAccount || "",
    binance_crypto_wallet_address: binanceCryptoWalletAddress || "",
    binance_network: binanceNetwork || "TRC20",
    payment_mobile_enabled: paymentMobileEnabled ?? true,
    bank_transfer_enabled: bankTransferEnabled ?? false,
    crypto_enabled: cryptoEnabled ?? false,
  });

  useEffect(() => {
    setForm({
      bank_name: bankName || "",
      bank_rif: bankRif || "",
      bank_phone: bankPhone || "",
      bank_account: bankAccount || "",
      binance_crypto_wallet_address: binanceCryptoWalletAddress || "",
      binance_network: binanceNetwork || "TRC20",
      payment_mobile_enabled: paymentMobileEnabled ?? true,
      bank_transfer_enabled: bankTransferEnabled ?? false,
      crypto_enabled: cryptoEnabled ?? false,
    });
  }, [bankName, bankRif, bankPhone, bankAccount, binanceCryptoWalletAddress, binanceNetwork, paymentMobileEnabled, bankTransferEnabled, cryptoEnabled]);

  const filledFields = [form.bank_name, form.bank_rif, form.bank_phone, form.bank_account].filter(Boolean).length;
  const totalFields = 4;
  const isComplete = filledFields === totalFields;
  
  const hasAnyPaymentMethod = form.bank_name || form.bank_account || form.binance_crypto_wallet_address;

  const handleSave = async () => {
    await onUpdate({
      bank_name: form.bank_name,
      bank_rif: form.bank_rif,
      bank_phone: form.bank_phone,
      bank_account: form.bank_account,
      binance_crypto_wallet_address: form.binance_crypto_wallet_address,
      binance_network: form.binance_network,
      payment_mobile_enabled: form.payment_mobile_enabled,
      bank_transfer_enabled: form.bank_transfer_enabled,
      crypto_enabled: form.crypto_enabled,
    });
    setIsEditing(false);
  };

  const labelStyles = `text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block`;
  const inputStyles = `w-full bg-white/5 border border-white/15 rounded-xl px-5 py-3 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30`;

  if (!isEditing && !hasAnyPaymentMethod) {
    return (
      <div className="bg-white/5 border border-white/15 p-6 rounded-xl space-y-5">
        <div className="flex items-center gap-3">
          <BuildingOfficeIcon className="w-5 h-5 text-white/30" />
          <h4 className="text-sm font-medium text-white/60">
            Datos de Pago
          </h4>
        </div>
        
        <div className="bg-white/5 border border-dashed border-white/10 p-6 rounded-xl text-center">
          <CurrencyDollarIcon className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <p className="text-sm text-white/40 mb-2">
            Sin métodos de pago configurados
          </p>
          <p className="text-xs text-white/25">
            Configure al menos un método para recibir pagos de pacientes
          </p>
        </div>

        <button 
          onClick={() => setIsEditing(true)}
          className="w-full py-3 px-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/15 transition-all rounded-xl"
        >
          Configurar Métodos de Pago
        </button>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="bg-white/5 border border-white/15 p-6 rounded-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-5 h-5 text-white/30" />
            <h4 className="text-sm font-medium text-white/60">
              Métodos de Pago
            </h4>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            isComplete 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isComplete ? 'Completo' : `${filledFields}/${totalFields}`}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <PaymentMethodBadge 
            enabled={form.payment_mobile_enabled && form.bank_phone}
            label="Pago Móvil"
            icon={<DevicePhoneMobileIcon className="w-4 h-4" />}
          />
          <PaymentMethodBadge 
            enabled={form.bank_transfer_enabled && form.bank_account}
            label="Transferencia"
            icon={<ArrowsRightLeftIcon className="w-4 h-4" />}
          />
          <PaymentMethodBadge 
            enabled={form.crypto_enabled && form.binance_crypto_wallet_address}
            label="USDT"
            icon={<CurrencyDollarIcon className="w-4 h-4" />}
          />
        </div>

        {form.payment_mobile_enabled && form.bank_phone && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <DevicePhoneMobileIcon className="w-4 h-4 text-emerald-400/60" />
              <span className="text-xs text-emerald-400/60 font-medium">PAGO MÓVIL</span>
              <span className="ml-auto text-sm text-emerald-400">● Configurado</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {form.bank_name && (
                <div>
                  <span className="text-white/30">Banco:</span>
                  <span className="text-white/70 font-medium ml-2">{form.bank_name}</span>
                </div>
              )}
              {form.bank_phone && (
                <div>
                  <span className="text-white/30">Teléfono:</span>
                  <span className="text-white/70 font-mono ml-2">{form.bank_phone}</span>
                </div>
              )}
              {form.bank_rif && (
                <div>
                  <span className="text-white/30">RIF:</span>
                  <span className="text-white/70 font-mono ml-2">{form.bank_rif}</span>
                </div>
              )}
              {form.bank_account && (
                <div>
                  <span className="text-white/30">Cuenta:</span>
                  <span className="text-white/70 font-mono ml-2">{form.bank_account}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {form.bank_transfer_enabled && form.bank_account && (
          <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <ArrowsRightLeftIcon className="w-4 h-4 text-blue-400/60" />
              <span className="text-xs text-blue-400/60 font-medium">TRANSFERENCIA BANCARIA</span>
              <span className="ml-auto text-sm text-blue-400">● Configurado</span>
            </div>
            <div className="text-sm">
              <span className="text-white/30">Cuenta:</span>
              <span className="text-white/70 font-mono ml-2">{form.bank_account}</span>
            </div>
          </div>
        )}

        {form.crypto_enabled && form.binance_crypto_wallet_address && (
          <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <CurrencyDollarIcon className="w-4 h-4 text-amber-400/60" />
              <span className="text-xs text-amber-400/60 font-medium">USDT ({form.binance_network})</span>
              <span className="ml-auto text-sm text-amber-400">● Configurado</span>
            </div>
            <div className="text-sm">
              <span className="text-white/30">Wallet:</span>
              <span className="text-white/70 font-mono ml-2 text-xs break-all">
                {form.binance_crypto_wallet_address}
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-4">
          <label className={labelStyles}>Simulador de Comisiones</label>
          <input
            type="number"
            value={simulatorAmount}
            onChange={(e) => setSimulatorAmount(e.target.value)}
            placeholder="Ingrese monto en USD"
            className={inputStyles}
          />
          {simulatorAmount && parseFloat(simulatorAmount) > 0 && (
            <CommissionSimulator 
              amount={parseFloat(simulatorAmount)} 
              commissionPercent={commissionDoctorPercent} 
            />
          )}
        </div>

        <button 
          onClick={() => setIsEditing(true)}
          className="w-full py-3 px-5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/15 transition-all rounded-xl"
        >
          Editar Métodos de Pago
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/15 p-6 rounded-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BuildingOfficeIcon className="w-5 h-5 text-white/30" />
          <h4 className="text-sm font-medium text-white/60">
            Configurar Métodos de Pago
          </h4>
        </div>
        <button 
          onClick={() => setIsEditing(false)}
          className="text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Métodos de Pago</p>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.payment_mobile_enabled}
              onChange={(e) => setForm({...form, payment_mobile_enabled: e.target.checked})}
              className="w-5 h-5 rounded border-white/20 bg-white/5"
            />
            <span className="text-sm text-white/70">Pago Móvil</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.bank_transfer_enabled}
              onChange={(e) => setForm({...form, bank_transfer_enabled: e.target.checked})}
              className="w-5 h-5 rounded border-white/20 bg-white/5"
            />
            <span className="text-sm text-white/70">Transferencia</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.crypto_enabled}
              onChange={(e) => setForm({...form, crypto_enabled: e.target.checked})}
              className="w-5 h-5 rounded border-white/20 bg-white/5"
            />
            <span className="text-sm text-white/70">USDT</span>
          </label>
        </div>
      </div>

      {form.payment_mobile_enabled && (
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <DevicePhoneMobileIcon className="w-5 h-5 text-emerald-400/60" />
            <span className="text-sm text-emerald-400/70 font-semibold">PAGO MÓVIL</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
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
              <label className={labelStyles}>Teléfono Pago Móvil</label>
              <input
                className={inputStyles}
                value={form.bank_phone}
                onChange={(e) => setForm({...form, bank_phone: e.target.value})}
                placeholder="04121234567"
              />
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
          </div>
        </div>
      )}

      {form.bank_transfer_enabled && (
        <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <ArrowsRightLeftIcon className="w-5 h-5 text-blue-400/60" />
            <span className="text-sm text-blue-400/70 font-semibold">TRANSFERENCIA BANCARIA</span>
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
      )}

      {form.crypto_enabled && (
        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-5 h-5 text-amber-400/60" />
            <span className="text-sm text-amber-400/70 font-semibold">USDT (BINANCE)</span>
          </div>
          <div>
            <label className={labelStyles}>Dirección Wallet (USDT-TRC20)</label>
            <input
              className={inputStyles}
              value={form.binance_crypto_wallet_address}
              onChange={(e) => setForm({...form, binance_crypto_wallet_address: e.target.value})}
              placeholder="TN3W4H6rK2ce4vX9YnFQHwKENnHqyYB8XZ"
            />
          </div>
          <div>
            <label className={labelStyles}>Red Blockchain</label>
            <select
              className={inputStyles}
              value={form.binance_network}
              onChange={(e) => setForm({...form, binance_network: e.target.value})}
            >
              <option value="TRC20">TRC20 (Tron) - Recomendado</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
              <option value="BEP20">BEP20 (BNB Chain)</option>
            </select>
          </div>
        </div>
      )}

      {form.bank_name && (
        <div className="border-t border-white/10 pt-4">
          <label className={labelStyles}>Simulador de Comisiones</label>
          <input
            type="number"
            value={simulatorAmount}
            onChange={(e) => setSimulatorAmount(e.target.value)}
            placeholder="Ingrese monto en USD"
            className={inputStyles}
          />
          {simulatorAmount && parseFloat(simulatorAmount) > 0 && (
            <CommissionSimulator 
              amount={parseFloat(simulatorAmount)} 
              commissionPercent={commissionDoctorPercent} 
            />
          )}
        </div>
      )}

      <button 
        onClick={handleSave}
        className="w-full py-3 px-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/15 transition-all rounded-xl"
      >
        Guardar Métodos de Pago
      </button>
    </div>
  );
}