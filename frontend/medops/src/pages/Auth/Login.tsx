// src/pages/Auth/Login.tsx
import { useState } from "react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useNavigate } from "react-router-dom";
import { queryClient } from "@/lib/reactQuery";
import axios from "axios";
import { api } from "@/lib/apiClient";
import { Lock, User, Loader2 } from "lucide-react";
export default function Login() {
  const { saveToken } = useAuthToken();
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
      const url = `${apiRoot}/auth/doctor-login/`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "omit",
      });
      if (!res.ok) {
        const msg = res.status === 400 ? "Credenciales inválidas" : `Error ${res.status}`;
        throw new Error(msg);
      }
      const data = await res.json();
      if (!data.token) throw new Error("Respuesta inválida del servidor");
      saveToken(data.token);
      axios.defaults.headers.common["Authorization"] = `Token ${data.token}`;
      api.defaults.headers.common["Authorization"] = `Token ${data.token}`;
      queryClient.invalidateQueries({ queryKey: ["notifications", data.token] });
      
      setTimeout(() => {
        navigate("/doctor");
      }, 100);
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-black">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 min-h-screen">
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <img
            src="/medopz_logo_blanco_solo.svg"
            alt="MedOpz Logo"
            className="h-12 w-12 mb-8 opacity-60"
          />
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white/90 mb-1">
              Control de Acceso
            </h2>
            <p className="text-sm text-white/40">
              Introduce tus credenciales operativas.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-white/50 transition-colors">
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="Identificador de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 rounded-lg text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-white/50 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 rounded-lg text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
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
                "Iniciar Sesión"
              )}
            </button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/50"></div>
            <span className="text-[10px] text-white/30">Sistema seguro</span>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-white/5 to-black items-center justify-center relative min-h-screen">
        <img
          src="/medopz_logo_blanco_solo.svg"
          alt="MedOpz Logo"
          className="h-40 w-40 opacity-20"
        />
      </div>
    </div>
  );
}