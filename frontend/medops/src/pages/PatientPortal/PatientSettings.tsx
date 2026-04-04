// src/pages/PatientPortal/PatientSettings.tsx
import { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useUpdatePatientProfile } from "@/hooks/patient/useUpdatePatientProfile";
import { patientClient } from "@/api/patient/client";
import { usePatientPaymentMethod, useUpdatePatientPaymentMethod } from "@/hooks/patient/usePatientPaymentMethod";
import { VENEZUELAN_BANKS } from "@/constants/banks";
import { 
  User, 
  Bell, 
  Lock, 
  CreditCard,
  Mail,
  PhoneIcon,
  SaveIcon,
  Loader2,
  AlertCircle
} from "lucide-react";
interface PatientProfile {
  patient: {
    id: number;
    full_name: string;
    national_id?: string;
    phone?: string;
    birthdate?: string;
    age?: number;
    gender?: string;
    address?: string;
    is_pediatric: boolean;
  };
  user: {
    email: string;
    phone?: string;
    is_verified: boolean;
    two_factor_enabled: boolean;
    notifications_email: boolean;
    notifications_sms: boolean;
    notifications_whatsapp: boolean;
  };
}
function PaymentMethodsSection() {
  const { data: paymentMethod, isLoading } = usePatientPaymentMethod();
  const updateMutation = useUpdatePatientPaymentMethod();
  
  const [formData, setFormData] = useState({
    mobile_phone: "",
    mobile_national_id: "",
    preferred_bank: "",
    crypto_wallet: "",
    crypto_type: "",
  });
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    if (paymentMethod) {
      setFormData({
        mobile_phone: paymentMethod.mobile_phone || "",
        mobile_national_id: paymentMethod.mobile_national_id || "",
        preferred_bank: paymentMethod.preferred_bank || "",
        crypto_wallet: paymentMethod.crypto_wallet || "",
        crypto_type: paymentMethod.crypto_type || "",
      });
    }
  }, [paymentMethod]);
  
  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving:", err);
    }
  };
  
  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-white/30" />;
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white/90">Métodos de Pago</h2>
      
      <div className="p-5 bg-white/5 border border-white/15 rounded-lg">
        <h3 className="text-[10px] font-medium text-white/40 mb-4">Pago Móvil Venezuela</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-medium text-white/40 mb-1.5">Teléfono</label>
            <input
              type="tel"
              value={formData.mobile_phone}
              onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
              placeholder="04121234567"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-white/40 mb-1.5">Cédula</label>
            <input
              type="text"
              value={formData.mobile_national_id}
              onChange={(e) => setFormData({ ...formData, mobile_national_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
              placeholder="V-12345678"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-[10px] font-medium text-white/40 mb-1.5">Banco Preferido</label>
            <select
              value={formData.preferred_bank}
              onChange={(e) => setFormData({ ...formData, preferred_bank: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">Seleccionar banco</option>
              {VENEZUELAN_BANKS.map(bank => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-5 bg-white/5 border border-white/15 rounded-lg opacity-60">
        <h3 className="text-[10px] font-medium text-white/40 mb-4">Criptomonedas (Próximamente)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-medium text-white/40 mb-1.5">Wallet</label>
            <input
              type="text"
              value={formData.crypto_wallet}
              disabled
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/30"
              placeholder="Próximamente"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/40 mb-1.5">Tipo</label>
            <select
              value={formData.crypto_type}
              disabled
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/30"
            >
              <option value="">Próximamente</option>
            </select>
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className={`flex items-center gap-2 px-6 py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium rounded-lg hover:bg-emerald-500/25 transition-all border border-emerald-500/25 ${
          updateMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
        {saved ? "Guardado" : "Guardar Métodos de Pago"}
      </button>
    </div>
  );
}
export default function PatientSettings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [profileData, setProfileData] = useState<PatientProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    whatsapp: true,
  });
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  
  const updateProfileMutation = useUpdatePatientProfile();
  const sections = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "security", label: "Seguridad", icon: Lock },
    { id: "subscription", label: "Suscripción", icon: CreditCard },
    { id: "payment-methods", label: "Métodos de Pago", icon: CreditCard },
  ];
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await patientClient.getProfile();
      const data = response.data;
      setProfileData(data);
      
      setFormData({
        email: data.user.email || "",
        phone: data.user.phone || data.patient.phone || "",
      });
      
      setNotifications({
        email: data.user.notifications_email ?? true,
        sms: data.user.notifications_sms ?? true,
        whatsapp: data.user.notifications_whatsapp ?? true,
      });
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  const handleSaveProfile = async () => {
    setPasswordError("");
    setSaveError("");
    
    if (!currentPassword) {
      setPasswordError("La contraseña es obligatoria para guardar cambios");
      return;
    }
    
    try {
      await updateProfileMutation.mutateAsync({
        email: formData.email,
        phone: formData.phone,
        current_password: currentPassword,
      });
      setSaveSuccess(true);
      setCurrentPassword("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      if (err.response?.data?.error) {
        setSaveError(err.response.data.error);
      } else if (err.response?.data?.current_password) {
        setPasswordError(err.response.data.current_password[0]);
      } else {
        setSaveError("Error al guardar. Verifica tu contraseña.");
      }
    }
  };
  
  const handleNotificationChange = async (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    
    try {
      await updateProfileMutation.mutateAsync({
        [`notifications_${key}`]: value,
      });
    } catch (err) {
      console.error("Error updating notification:", err);
      setNotifications(notifications);
    }
  };
  
  if (isLoadingProfile) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
        <PageHeader 
          breadcrumbs={[
            { label: "MEDOPZ", path: "/patient" },
            { label: "Configuración", active: true }
          ]}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-emerald-400/60 animate-spin" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Configuración", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5">
              <h3 className="text-[10px] font-medium text-white/40">
                Ajustes
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                    activeSection === id 
                      ? "bg-white/10 text-white/90" 
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white/5 border border-white/15 rounded-lg p-6">
            
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white/90">Información del Perfil</h2>
                
                <div className="flex items-center gap-4 p-5 bg-white/5 border border-white/15 rounded-lg">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/15 flex items-center justify-center">
                    <User className="w-7 h-7 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/90">
                      {profileData?.patient.full_name || "Paciente"}
                    </p>
                    <p className="text-[10px] text-white/30">
                      ID: {profileData?.patient.id}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-medium text-white/40 mb-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
                    />
                    <p className="text-[9px] text-white/20 mt-1">Este email se usa para iniciar sesión</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-medium text-white/40 mb-1.5">
                      <PhoneIcon className="w-3.5 h-3.5" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
                      placeholder="04121234567"
                    />
                  </div>
                </div>
                
                <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <label className="flex items-center gap-2 text-[10px] font-medium text-amber-400/80 mb-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Confirmar cambios con tu contraseña
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full px-4 py-2.5 bg-white/5 border border-amber-500/20 rounded-lg text-white/80 focus:outline-none focus:border-amber-500/50 placeholder:text-white/20"
                    placeholder="••••••••"
                  />
                  {passwordError && (
                    <p className="flex items-center gap-1 text-[10px] text-red-400 mt-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {passwordError}
                    </p>
                  )}
                </div>
                
                {saveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-[10px] text-red-400">{saveError}</p>
                  </div>
                )}
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium rounded-lg hover:bg-emerald-500/25 transition-all border border-emerald-500/25 ${
                    updateProfileMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SaveIcon className="w-4 h-4" />
                  )}
                  {saveSuccess ? "Guardado" : "Guardar Cambios"}
                </button>
              </div>
            )}
            
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white/90">Notificaciones</h2>
                <div className="space-y-4">
                  {[
                    { id: "email", label: "Notificaciones por Email", desc: "Recibe recordatorios de citas por email", key: "email" },
                    { id: "sms", label: "Notificaciones por SMS", desc: "Recibe recordatorios de citas por mensaje de texto", key: "sms" },
                    { id: "whatsapp", label: "Notificaciones por WhatsApp", desc: "Recibe mensajes de WhatsApp", key: "whatsapp" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white/80">{item.label}</p>
                        <p className="text-[10px] text-white/30">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications[item.key as keyof typeof notifications]}
                          onChange={(e) => handleNotificationChange(item.key, e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeSection === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white/90">Seguridad</h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-medium text-white/40 mb-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-white/25 placeholder:text-white/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-medium text-white/40 mb-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-white/25 placeholder:text-white/20"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-medium text-white/40 mb-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-white/25 placeholder:text-white/20"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button className="px-6 py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium rounded-lg hover:bg-emerald-500/25 transition-all border border-emerald-500/25">
                  Cambiar Contraseña
                </button>
              </div>
            )}
            
            {activeSection === "subscription" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white/90">Mi Suscripción</h2>
                <div className="p-6 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-emerald-400/70 font-medium">Plan Actual</p>
                      <p className="text-2xl font-semibold text-white/90 mt-1">Free</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/30">Próxima facturación</p>
                      <p className="text-sm font-medium text-white/70">--</p>
                    </div>
                  </div>
                </div>
                <button className="w-full px-6 py-2.5 border border-white/15 text-white/50 text-[11px] font-medium rounded-lg hover:bg-white/5 transition-all">
                  Ver Planes Disponibles
                </button>
              </div>
            )}
            
            {activeSection === "payment-methods" && <PaymentMethodsSection />}
          </div>
        </div>
      </div>
    </div>
  );
}