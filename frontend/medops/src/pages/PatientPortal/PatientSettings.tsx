// src/pages/PatientPortal/PatientSettings.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { User, Bell, Lock, CreditCard } from "lucide-react";
export default function PatientSettings() {
  const [activeSection, setActiveSection] = useState("profile");
  const sections = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "security", label: "Seguridad", icon: Lock },
    { id: "subscription", label: "Suscripción", icon: CreditCard },
  ];
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
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
            {activeSection === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">Información del Perfil</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                      placeholder="tu@email.com"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                      placeholder="04121234567"
                    />
                  </div>
                </div>
                <button className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/90">
                  Guardar Cambios
                </button>
              </div>
            )}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">Notificaciones</h2>
                <div className="space-y-4">
                  {[
                    { id: "email", label: "Notificaciones por Email", desc: "Recibe recordatorios de citas por email" },
                    { id: "sms", label: "Notificaciones por SMS", desc: "Recibe recordatorios de citas por mensaje de texto" },
                    { id: "whatsapp", label: "Notificaciones por WhatsApp", desc: "Recibe mensajes de WhatsApp" },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5">
                      <div>
                        <p className="text-sm font-bold uppercase">{item.label}</p>
                        <p className="text-[10px] text-white/40">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold uppercase tracking-wide">Seguridad</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
                <button className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/90">
                  Cambiar Contraseña
                </button>
              </div>
            )}
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
                <button className="w-full px-6 py-3 border border-white/20 text-white/60 text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/5">
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