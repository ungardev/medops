// src/components/Settings/DoctorWhatsAppConfig.tsx
import React, { useState, useEffect } from "react";
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BellIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

interface DoctorWhatsAppConfigProps {
  whatsappEnabled: boolean;
  whatsappBusinessNumber: string;
  whatsappBusinessId: string;
  whatsappAccessToken: string;
  whatsappWebhookVerifyToken?: string;
  reminderHoursBefore: number;
  doctorId?: number;
  onUpdate: (data: {
    whatsapp_enabled: boolean;
    whatsapp_business_number: string;
    whatsapp_business_id: string;
    whatsapp_access_token: string;
    whatsapp_webhook_verify_token?: string;
    reminder_hours_before: number;
  }) => void;
}

// WhatsApp Message Templates Preview
const TemplatesPreview = ({ active }: { active: boolean }) => {
  if (!active) return null;
  
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <DocumentTextIcon className="w-4 h-4 text-white/30" />
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
          Plantillas de Notificación
        </span>
      </div>
      
      <div className="space-y-2">
        {/* Recordatorio de Cita */}
        <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <BellIcon className="w-3 h-3 text-blue-400/60" />
            <span className="text-[9px] text-blue-400/70 font-medium">Recordatorio de Cita</span>
          </div>
          <p className="text-[9px] text-white/40 italic">
            "Dr. [Nombre], su cita es mañana [Fecha] a las [Hora]. Confirme su asistencia respondiendo a este mensaje."
          </p>
        </div>
        
        {/* Confirmación de Pago */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CurrencyDollarIcon className="w-3 h-3 text-emerald-400/60" />
            <span className="text-[9px] text-emerald-400/70 font-medium">Confirmación de Pago</span>
          </div>
          <p className="text-[9px] text-white/40 italic">
            "Su pago de [Monto] USD ha sido confirmado. Gracias por confiar en MEDOPZ. Su turno #[Nro] está asegurado."
          </p>
        </div>
      </div>
    </div>
  );
};

// Test Connection Status Component
const TestConnectionStatus = ({ 
  isComplete, 
  isEditing 
}: { 
  isComplete: boolean; 
  isEditing: boolean;
}) => {
  if (!isEditing) return null;
  
  const validationSteps = [
    { label: "Business Number", complete: isComplete },
    { label: "Business ID", complete: isComplete },
    { label: "Access Token", complete: isComplete },
  ];
  
  return (
    <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircleIcon className="w-4 h-4 text-white/30" />
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
          Validación Local
        </span>
      </div>
      <div className="space-y-1">
        {validationSteps.map((step) => (
          <div key={step.label} className="flex items-center gap-2 text-[10px]">
            {step.complete ? (
              <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
            ) : (
              <ClockIcon className="w-3 h-3 text-white/20" />
            )}
            <span className={step.complete ? 'text-emerald-400/70' : 'text-white/30'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-white/10">
        <p className="text-[9px] text-white/30">
          {isComplete 
            ? "✓ Credenciales completas. Listo para diagnóstico de conexión." 
            : "○ Complete todos los campos para validar la conexión."}
        </p>
      </div>
    </div>
  );
};

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
  whatsappWebhookVerifyToken = "",
  reminderHoursBefore,
  doctorId,
  onUpdate,
}: DoctorWhatsAppConfigProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    whatsapp_enabled: whatsappEnabled,
    whatsapp_business_number: whatsappBusinessNumber || "",
    whatsapp_business_id: whatsappBusinessId || "",
    whatsapp_access_token: whatsappAccessToken || "",
    whatsapp_webhook_verify_token: whatsappWebhookVerifyToken || "",
    reminder_hours_before: reminderHoursBefore || 24,
  });

  useEffect(() => {
    setForm({
      whatsapp_enabled: whatsappEnabled,
      whatsapp_business_number: whatsappBusinessNumber || "",
      whatsapp_business_id: whatsappBusinessId || "",
      whatsapp_access_token: whatsappAccessToken || "",
      whatsapp_webhook_verify_token: whatsappWebhookVerifyToken || "",
      reminder_hours_before: reminderHoursBefore || 24,
    });
  }, [whatsappEnabled, whatsappBusinessNumber, whatsappBusinessId, whatsappAccessToken, whatsappWebhookVerifyToken, reminderHoursBefore]);

  const isLocallyComplete = Boolean(form.whatsapp_enabled && 
                            form.whatsapp_business_number && 
                            form.whatsapp_business_id && 
                            form.whatsapp_access_token);

  const isConfigured = form.whatsapp_enabled && 
                       form.whatsapp_business_number && 
                       form.whatsapp_business_id;

  const callbackUrl = doctorId 
    ? `https://api.medopz.com/api/webhooks/whatsapp/${doctorId}/`
    : "https://api.medopz.com/api/webhooks/whatsapp/<doctor_id>/";

  const handleSave = async () => {
    await onUpdate(form);
    setIsEditing(false);
  };

  const labelStyles = `text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block`;
  const inputStyles = `w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30`;

  // =====================================================
  // EMPTY STATE - No configuration
  // =====================================================
  if (!isEditing && !form.whatsapp_enabled) {
    return (
      <div className="bg-white/5 border border-white/15 p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WhatsAppIcon />
            <h4 className="text-[11px] font-medium text-white/60">
              WhatsApp Business
            </h4>
          </div>
          <div className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-white/5 text-white/30 border border-white/10">
            Inactivo
          </div>
        </div>
        
        <div className="bg-white/5 border border-dashed border-white/10 p-6 rounded-lg text-center">
          <WhatsAppIcon />
          <p className="text-[11px] text-white/40 mt-3 mb-1">
            Sin actividad registrada
          </p>
          <p className="text-[9px] text-white/25">
            Vincule su cuenta de Meta Business para comenzar
          </p>
        </div>

        <button 
          onClick={() => setIsEditing(true)}
          className="w-full py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium hover:bg-green-500/15 transition-all rounded-lg"
        >
          Configurar WhatsApp
        </button>
      </div>
    );
  }

  // =====================================================
  // VIEW MODE - Show configuration
  // =====================================================
  if (!isEditing) {
    return (
      <div className="bg-white/5 border border-white/15 p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WhatsAppIcon />
            <h4 className="text-[11px] font-medium text-white/60">
              WhatsApp Business
            </h4>
          </div>
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-medium ${
            isConfigured 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isConfigured ? 'Configurado' : 'Incompleto'}
          </div>
        </div>

        {isConfigured ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <span className="text-white/30">Número:</span>
                <span className="text-white/70 font-medium font-mono ml-2">{form.whatsapp_business_number}</span>
              </div>
              <div>
                <span className="text-white/30">Business ID:</span>
                <span className="text-white/70 font-medium font-mono ml-2">{form.whatsapp_business_id}</span>
              </div>
              <div>
                <span className="text-white/30">Recordatorio:</span>
                <span className="text-white/70 font-medium ml-2">{form.reminder_hours_before}h</span>
              </div>
              <div>
                <span className="text-white/30">Webhook:</span>
                <span className={`ml-2 ${form.whatsapp_webhook_verify_token ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {form.whatsapp_webhook_verify_token ? 'Verificado' : 'Pendiente'}
                </span>
              </div>
            </div>

            {/* Templates Preview */}
            <TemplatesPreview active={true} />

            {/* Webhook URL */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="w-3 h-3 text-white/30" />
                <span className="text-[9px] text-white/40 font-medium uppercase tracking-wider">
                  Webhook URL de Producción
                </span>
              </div>
              <div className="bg-black/20 p-2 rounded font-mono text-[9px] text-emerald-400/70 break-all">
                {callbackUrl}
              </div>
              <p className="text-[8px] text-white/25 mt-1">
                Configure esta URL en su Meta Business Dashboard → Webhooks
              </p>
            </div>
          </>
        ) : (
          <p className="text-[10px] text-white/30">
            WhatsApp habilitado pero incomplete. Complete los campos para activar.
          </p>
        )}
        
        <button 
          onClick={() => setIsEditing(true)}
          className="w-full py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium hover:bg-green-500/15 transition-all rounded-lg"
        >
          Editar Configuración
        </button>
      </div>
    );
  }

  // =====================================================
  // EDIT MODE - Configuration form
  // =====================================================
  return (
    <div className="bg-white/5 border border-white/15 p-5 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WhatsAppIcon />
          <h4 className="text-[11px] font-medium text-white/60">
            Configurar WhatsApp Business
          </h4>
        </div>
        <button 
          onClick={() => setIsEditing(false)}
          className="text-white/40 hover:text-white/70 text-[10px] transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="whatsapp_enabled"
          checked={form.whatsapp_enabled}
          onChange={(e) => setForm({...form, whatsapp_enabled: e.target.checked})}
          className="w-4 h-4 rounded border-white/20 bg-white/5"
        />
        <label htmlFor="whatsapp_enabled" className="text-white/60 text-[11px] font-medium">
          Habilitar WhatsApp Business
        </label>
      </div>

      {form.whatsapp_enabled && (
        <>
          {/* Local Validation Status */}
          <TestConnectionStatus isComplete={isLocallyComplete} isEditing={isEditing} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyles}>Número de Business</label>
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
              <label className={labelStyles}>Access Token (Meta Business)</label>
              <input
                type="password"
                value={form.whatsapp_access_token}
                onChange={(e) => setForm({...form, whatsapp_access_token: e.target.value})}
                placeholder="EA..."
                className={inputStyles}
              />
            </div>
            <div className="col-span-2">
              <label className={labelStyles}>Webhook Verify Token</label>
              <input
                type="text"
                value={form.whatsapp_webhook_verify_token}
                onChange={(e) => setForm({...form, whatsapp_webhook_verify_token: e.target.value})}
                placeholder="Token de verificación para webhook Meta"
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

          {/* Webhook Callback URL Display */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-3 h-3 text-white/30" />
              <span className="text-[9px] text-white/40 font-medium uppercase tracking-wider">
                Webhook URL de Producción (solo lectura)
              </span>
            </div>
            <div className="bg-black/20 p-2 rounded font-mono text-[9px] text-emerald-400/70 break-all">
              {callbackUrl}
            </div>
            <p className="text-[8px] text-white/25 mt-1">
              Copie esta URL en Meta Business Dashboard → Webhooks
            </p>
          </div>

          {/* Templates Preview */}
          <TemplatesPreview active={Boolean(form.whatsapp_enabled && isLocallyComplete)} />
        </>
      )}

      <button 
        onClick={handleSave}
        className="w-full py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-medium hover:bg-green-500/15 transition-all rounded-lg"
      >
        Guardar Configuración WhatsApp
      </button>
    </div>
  );
}