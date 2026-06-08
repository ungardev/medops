// src/pages/PatientPortal/PatientSettings.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { useUpdatePatientProfile } from "@/hooks/patient/useUpdatePatientProfile";
import { usePatientProfile } from "@/hooks/patient/usePatientProfile";
import { usePatientPaymentMethod, useUpdatePatientPaymentMethod } from "@/hooks/patient/usePatientPaymentMethod";
import { usePatient, FamilyMember } from "@/context/PatientContext";
import { VENEZUELAN_BANKS } from "@/constants/banks";
import AddFamilyMember from "@/components/Patients/AddFamilyMember";
import { 
  User, 
  Bell, 
  Lock, 
  CreditCard,
  Mail,
  Phone,
  Save,
  Loader2,
  AlertCircle,
  UsersIcon,
  PlusIcon,
  TrashIcon,
  UserIcon
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

function FamilySection() {
  const { familyMembers, removeFamilyMember, refreshFamilyMembers, setActivePatient } = usePatient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  
  const navigate = useNavigate();

  const handleRemove = async (linkId: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este vínculo familiar?")) return;
    setRemovingId(linkId);
    try {
      const token = localStorage.getItem("patient_access_token") || localStorage.getItem("patient_drf_token");
      await fetch(`/api/patient-family-links/${linkId}/unlink/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
      removeFamilyMember(linkId);
    } catch (err) {
      console.error("Error removing family link:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdded = () => {
    refreshFamilyMembers();
  };

  const getRelationshipLabel = (type: string) => {
    switch (type) {
      case "self": return "Yo mismo";
      case "child": return "Hijo/Hija";
      case "dependent": return "Dependiente";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white/90">Mis Familiares</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-lg transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {familyMembers.length === 0 ? (
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
          <UsersIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">No tienes familiares vinculados</p>
          <p className="text-xs text-white/30 mt-1">Agrega menores o dependientes para gestionar sus citas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {familyMembers.map((member) => (
            <div
              key={member.link_id}
              className={`flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl ${member.relationship_type !== "self" ? "cursor-pointer hover:bg-white/10 hover:border-emerald-500/30 transition-all" : ""}`}
              onClick={() => {
                if (member.relationship_type !== "self") {
                  setActivePatient(member.patient_id);
                  navigate('/patient/record?tab=info');
                }
              }}
            >
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{member.full_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/40">
                    {getRelationshipLabel(member.relationship_type)}
                  </span>
                  {member.is_minor && (
                    <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 rounded-md">
                      Menor
                    </span>
                  )}
                  {!member.national_id && member.is_minor && (
                    <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 rounded-md">
                      Sin ID
                    </span>
                  )}
                  {member.age && (
                    <span className="text-xs text-white/30">
                      {member.age} años
                    </span>
                  )}
                </div>
              </div>
              {member.relationship_type !== "self" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(member.link_id);
                  }}
                  disabled={removingId === member.link_id}
                  className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {removingId === member.link_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddFamilyMember
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleAdded}
      />
    </div>
  );
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
      <h2 className="text-xl font-semibold text-white/90">Métodos de Pago</h2>
      
      <div className="p-5 bg-white/10 border border-white/20 rounded-xl">
        <h3 className="text-xs font-medium text-white/40 mb-4">Pago Móvil Venezuela</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Teléfono</label>
            <input
              type="tel"
              value={formData.mobile_phone}
              onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
              placeholder="04121234567"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Cédula</label>
            <input
              type="text"
              value={formData.mobile_national_id}
              onChange={(e) => setFormData({ ...formData, mobile_national_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20"
              placeholder="V-12345678"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-white/40 mb-1.5">Banco Preferido</label>
            <select
              value={formData.preferred_bank}
              onChange={(e) => setFormData({ ...formData, preferred_bank: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">Seleccionar banco</option>
              {VENEZUELAN_BANKS.map(bank => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-5 bg-white/10 border border-white/20 rounded-xl opacity-60">
        <h3 className="text-xs font-medium text-white/40 mb-4">Criptomonedas (Próximamente)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Wallet</label>
            <input
              type="text"
              value={formData.crypto_wallet}
              disabled
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/30"
              placeholder="Próximamente"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Tipo</label>
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
        className={`flex items-center gap-2 px-6 py-2.5 bg-emerald-500/15 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/25 transition-all border border-emerald-500/25 ${
          updateMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? "Guardado" : "Guardar Métodos de Pago"}
      </button>
    </div>
  );
}

export default function PatientSettings() {
  const [activeSection, setActiveSection] = useState("profile");
  const { data: profileData, isLoading: isLoadingProfile } = usePatientProfile();
  
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
    { id: "family", label: "Familiares", icon: UsersIcon },
  ];
  
  useEffect(() => {
    if (profileData && formData.email === "" && formData.phone === "") {
      setFormData({
        email: profileData.user.email || "",
        phone: profileData.user.phone || profileData.patient.phone || "",
      });
      setNotifications({
        email: profileData.user.notifications_email ?? true,
        sms: profileData.user.notifications_sms ?? true,
        whatsapp: profileData.user.notifications_whatsapp ?? true,
      });
    }
  }, [profileData]);
  
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
      <div className="space-y-6">
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
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Configuración", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white/10 border border-white/20 rounded-xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 relative ${
                    activeSection === id 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  {activeSection === id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
                  )}
                  <Icon size={18} className={activeSection === id ? "text-emerald-400" : "text-white/40"} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            
            {activeSection === "profile" && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white/90">Información del Perfil</h2>
                
                <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white/90">
                      {profileData?.patient.full_name || "Paciente"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/40">ID: {profileData?.patient.id}</span>
                      {profileData?.user.is_verified && (
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium">
                          Verificado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-400/60" />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 placeholder:text-white/20 transition-all"
                    />
                    <p className="text-xs text-white/30 mt-1.5">Este email se usa para iniciar sesión</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-400/60" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 placeholder:text-white/20 transition-all"
                      placeholder="04121234567"
                    />
                  </div>
                </div>
                
                <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <label className="flex items-center gap-2 text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">
                    <Lock className="w-3.5 h-3.5" />
                    Confirmar Cambios con tu Contraseña
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-amber-500/20 rounded-lg text-white/90 focus:outline-none focus:border-amber-500/50 placeholder:text-white/20 transition-all"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  {passwordError && (
                    <p className="flex items-center gap-1 text-xs text-red-400 mt-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {passwordError}
                    </p>
                  )}
                </div>
                
                {saveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-xs text-red-400">{saveError}</p>
                  </div>
                )}
                
                <button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className={`flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-400 transition-all ${
                    updateProfileMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saveSuccess ? "Guardado" : "Guardar Cambios"}
                </button>
              </div>
            )}
            
            {activeSection === "notifications" && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white/90">Preferencias de Notificación</h2>
                <div className="bg-white/5 border border-white/15 rounded-xl overflow-hidden">
                  {[
                    { id: "email", label: "Notificaciones por Email", desc: "Recibe recordatorios de citas y actualizaciones importantes", key: "email", icon: Mail },
                    { id: "sms", label: "Notificaciones por SMS", desc: "Recibe alertas rápidas a tu teléfono", key: "sms", icon: Phone },
                    { id: "whatsapp", label: "Notificaciones por WhatsApp", desc: "Mensajes directos a tu WhatsApp registrado", key: "whatsapp", icon: Bell },
                  ].map((item, idx) => {
                    const IconComponent = item.icon;
                    const isLast = idx === 2;
                    return (
                      <div key={item.id} className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-white/5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <IconComponent className="w-4 h-4 text-white/40" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/80">{item.label}</p>
                            <p className="text-xs text-white/30">{item.desc}</p>
                          </div>
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
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeSection === "security" && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white/90">Seguridad de la Cuenta</h2>
                <div className="bg-white/5 border border-white/15 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400/60" />
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400/60" />
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400/60" />
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white/90 focus:outline-none focus:border-emerald-500/50 placeholder:text-white/20 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button className="flex items-center gap-2 px-5 py-3 bg-emerald-500/15 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/25 transition-all border border-emerald-500/25">
                  <Lock className="w-4 h-4" />
                  Cambiar Contraseña
                </button>
              </div>
            )}
            
            {activeSection === "subscription" && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white/90">Mi Suscripción</h2>
                <div className="p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-emerald-400/70 font-semibold uppercase tracking-wider">Plan Actual</p>
                      <p className="text-3xl font-bold text-white/90 mt-1">Free</p>
                    </div>
                    <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-emerald-400/60" />
                    </div>
                  </div>
                  <div className="h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent mb-4" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Próxima facturación</span>
                    <span className="text-white/60 font-medium">--</span>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white/5 border border-white/15 text-white/70 text-sm font-medium rounded-lg hover:bg-white/10 transition-all">
                  <CreditCard className="w-4 h-4" />
                  Ver Planes Disponibles
                </button>
              </div>
            )}
            
            {activeSection === "payment-methods" && <PaymentMethodsSection />}

            {activeSection === "family" && <FamilySection />}
          </div>
        </div>
      </div>
    </div>
  );
}