// src/pages/PatientPortal/PatientSettings.tsx
import { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useUpdatePatientProfile } from "@/hooks/patient/useUpdatePatientProfile";
import { patientClient } from "@/api/patient/client";
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
export default function PatientSettings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [profileData, setProfileData] = useState<PatientProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
  });
  
  // Password confirmation
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
  ];
  // Cargar datos del perfil
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
    
    // Validar contraseña
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
            { label: "CONFIGURACIÓN", active: true }
          ]}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "CONFIGURACIÓN", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Ajustes
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeSection === id 
                      ? "bg-white/[0.08] text-white" 
                      : "text-white/40 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
            
            {/* PERFIL */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">Información del Perfil</h2>
                
                {/* Avatar + Nombre */}
                <div className="flex items-center gap-4 p-4 bg-black/20 border border-white/5 rounded-sm">
                  <div className="w-14 h-14 rounded-sm bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center">
                    <User className="w-7 h-7 text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase">
                      {profileData?.patient.full_name || "Paciente"}
                    </p>
                    <p className="text-[10px] text-white/40">
                      ID: {profileData?.patient.id}
                    </p>
                  </div>
                </div>
                
                {/* Campos del formulario */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      <Mail className="w-3 h-3" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                    <p className="text-[9px] text-white/30 mt-1">Este email se usa para iniciar sesión</p>
                  </div>
                  
                  {/* Teléfono */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      <PhoneIcon className="w-3 h-3" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-blue-500/50"
                      placeholder="04121234567"
                    />
                  </div>
                </div>
                
                {/* Campo contraseña (obligatorio para guardar) */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-sm">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                    <Lock className="w-3 h-3" />
                    Confirmar cambios con tu contraseña
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full px-4 py-2.5 bg-black/40 border border-amber-500/30 rounded-sm text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="••••••••"
                  />
                  {passwordError && (
                    <p className="flex items-center gap-1 text-[10px] text-red-400 mt-2">
                      <AlertCircle className="w-3 h-3" />
                      {passwordError}
                    </p>
                  )}
                </div>
                
                {/* Error al guardar */}
                {saveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-[10px] text-red-400">{saveError}</p>
                  </div>
                )}
                
                {/* Botón guardar */}
                <button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/90 transition-all ${
                    updateProfileMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <SaveIcon className="w-4 h-4" />
                  )}
                  {saveSuccess ? "Guardado!" : "Guardar Cambios"}
                </button>
              </div>
            )}
            
            {/* NOTIFICACIONES */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">Notificaciones</h2>
                <div className="space-y-4">
                  {[
                    { id: "email", label: "Notificaciones por Email", desc: "Recibe recordatorios de citas por email", key: "email" },
                    { id: "sms", label: "Notificaciones por SMS", desc: "Recibe recordatorios de citas por mensaje de texto", key: "sms" },
                    { id: "whatsapp", label: "Notificaciones por WhatsApp", desc: "Recibe mensajes de WhatsApp", key: "whatsapp" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5">
                      <div>
                        <p className="text-sm font-bold uppercase">{item.label}</p>
                        <p className="text-[10px] text-white/40">{item.desc}</p>
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
            
            {/* SEGURIDAD */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">Seguridad</h2>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      <Lock className="w-3 h-3" />
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      <Lock className="w-3 h-3" />
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      <Lock className="w-3 h-3" />
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/90">
                  Cambiar Contraseña
                </button>
              </div>
            )}
            
            {/* SUSCRIPCIÓN */}
            {activeSection === "subscription" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">Mi Suscripción</h2>
                <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Plan Actual</p>
                      <p className="text-2xl font-black uppercase mt-1">Free</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-white/40">Próxima facturación</p>
                      <p className="text-sm font-bold">--</p>
                    </div>
                  </div>
                </div>
                <button className="w-full px-6 py-2.5 border border-white/20 text-white/60 text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/5">
                  Ver Planes Disponibles
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}