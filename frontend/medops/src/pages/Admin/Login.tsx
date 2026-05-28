// src/pages/Admin/Login.tsx
import { useState } from "react";
import { useAdminAuthToken } from "@/hooks/useAdminAuthToken";
import { Link, useNavigate } from "react-router-dom";
import { Lock, User, Loader2, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const { saveToken } = useAdminAuthToken();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const rawRoot = import.meta.env.VITE_API_URL || "/api";
      const apiRoot = rawRoot.replace(/\/+$/, "");
      const url = `${apiRoot}/admin/login/`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "omit",
      });
      
      if (res.status === 403) {
        throw new Error("Esta cuenta no tiene acceso al panel de administración");
      }
      
      if (!res.ok) {
        const msg = res.status === 400 ? "Credenciales inválidas" : `Error ${res.status}`;
        throw new Error(msg);
      }
      
      const data = await res.json();
      if (!data.access) throw new Error("Respuesta inválida del servidor");
      
      saveToken(data.access, data.refresh, data.user);
      
      setTimeout(() => {
        navigate("/admin");
      }, 100);
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050608] flex flex-col lg:flex-row">
      {/* Micro-Grid Engineering Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1e23_1px,transparent_1px),linear-gradient(to_bottom,#1a1e23_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.03] pointer-events-none"></div>

      {/* Left Panel - Form Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 min-h-screen relative z-10">
        <div className="w-full max-w-[420px] bg-[#0c0e12]/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl shadow-2xl p-8 md:p-10 animate-in fade-in duration-500">
          {/* Logo - Centered, Large, Clickeable */}
          <Link to="https://www.medopz.com" className="block mb-6">
            <img
              src="/medopz_logo_blanco_solo.svg"
              alt="MedOpz Logo"
              className="h-16 w-16 mx-auto opacity-100"
            />
            <img
              src="/medopz_fuente_blanco.svg"
              alt="MEDOPZ"
              className="h-5 w-auto mx-auto mt-2 opacity-95"
            />
          </Link>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="text-emerald-400 text-xs uppercase tracking-wider font-medium">Admin Portal</span>
          </div>
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-white mb-1">
              Panel de Administración
            </h2>
            <p className="text-sm text-slate-300">
              Acceso exclusivo para administradores de MEDOPZ
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 group-focus-within:text-emerald-400 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Identificador de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#0c0e12]/60 border border-slate-800/60 rounded-lg text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#10b981]/60 focus:ring-1 focus:ring-[#10b981]/30 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 group-focus-within:text-emerald-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#0c0e12]/60 border border-slate-800/60 rounded-lg text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#10b981]/60 focus:ring-1 focus:ring-[#10b981]/30 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300"
              />
            </div>
            
            {error && (
              <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs text-center font-medium">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link
              to="/doctor"
              className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              ← Volver al portal doctor
            </Link>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Engineering Presence */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative min-h-screen">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1e23_1px,transparent_1px),linear-gradient(to_bottom,#1a1e23_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.03] pointer-events-none"></div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <img
            src="/medopz_logo_blanco_solo.svg"
            alt="MedOpz Logo"
            className="h-32 w-32 opacity-20"
          />
          <img
            src="/medopz_fuente_blanco.svg"
            alt="MEDOPZ"
            className="h-8 w-auto opacity-30"
          />
          <p className="text-slate-400/80 text-base mt-2 tracking-wide font-light">
            Plataforma Healthtech de Venezuela
          </p>
          <div className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-emerald-400/80 text-xs">
              Zona restringida - Solo personal autorizado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
