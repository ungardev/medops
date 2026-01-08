import { useState } from "react";
import { useAuthToken } from "../../hooks/useAuthToken";
import { useNavigate } from "react-router-dom";
import { queryClient } from "../../lib/reactQuery";
import axios from "axios";
import { api } from "../../lib/apiClient";
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
      // Normaliza raíz del API: debe terminar en /api
      const rawRoot = import.meta.env.VITE_API_URL || "/api";
      const apiRoot = rawRoot.replace(/\/+$/, ""); // quita trailing slash
      const url = `${apiRoot}/auth/login/`; // ✅ endpoint correcto

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const msg = res.status === 400 ? "Credenciales inválidas" : `Error ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();
      if (!data.token) throw new Error("Respuesta inválida del servidor");

      // Guarda token y configura headers globales
      saveToken(data.token);
      axios.defaults.headers.common["Authorization"] = `Token ${data.token}`;
      api.defaults.headers.common["Authorization"] = `Token ${data.token}`;

      // Invalida notificaciones (si tu backend las usa por token)
      queryClient.invalidateQueries({ queryKey: ["notifications", data.token] });

      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (err: any) {
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c10] text-slate-200 px-4 font-sans">
      <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <img
          src="/medopz_logo_blanco_solo.svg"
          alt="MedOpz Logo"
          className="h-24 w-24 mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
        />
        <img
          src="/medopz_fuente_blanco.svg"
          alt="MedOpz"
          className="h-7 w-auto opacity-90"
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-[#11141a] border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl p-8 w-full max-w-md backdrop-blur-md"
      >
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight text-white mb-1">
            Control de Acceso
          </h2>
          <p className="text-sm text-slate-400">
            Introduce tus credenciales operativas.
          </p>
        </div>

        <div className="space-y-5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
              <User size={18} />
            </div>
            <input
              type="text"
              placeholder="Identificador de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-xs text-center font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-all shadow-[0_5px_15px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">Secure_Terminal_Active</span>
        </div>
      </form>

      <footer className="mt-12 text-[10px] text-slate-600 uppercase tracking-[0.3em] opacity-60">
        © 2026 MedOpz Clinical OS // v1.2.0-Stable
      </footer>
    </div>
  );
}
