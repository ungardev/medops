// src/pages/PatientPortal/PatientLogin.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/hooks/patient/usePatientAuth'; 
import { Lock, User, Loader2 } from 'lucide-react';
export default function PatientLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = usePatientAuth(); // ✅ CORREGIDO
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/patient');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0a0c10]">
      {/* Columna Izquierda: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0a0c10] min-h-screen">
        <div className="w-full max-w-md animate-in fade-in duration-500">
          <img
            src="/medopz_logo_blanco_solo.svg"
            alt="MedOpz Logo"
            className="h-12 w-12 mb-8 opacity-80"
          />
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
              Portal del Paciente
            </h2>
            <p className="text-sm text-gray-400">
              Accede a tu historial médico y citas.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-white transition-colors">
                <User size={18} />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all"
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-white transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all"
              />
            </div>
          </form>
          {(error || errorMsg) && (
            <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs text-center font-medium">{error || errorMsg}</p>
            </div>
          )}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-8 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/patient/register"
              className="block text-sm text-blue-300 hover:text-blue-200 transition-colors"
            >
              ¿No tienes cuenta? Regístrate
            </Link>
            <Link
              to="/patient/forgot-password"
              className="block text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Volver al portal médico
            </Link>
          </div>
          <footer className="mt-12 text-[10px] text-gray-600 uppercase tracking-[0.3em] text-center">
            © 2026 MedOpz Clinical OS // v1.2.0-Stable
          </footer>
        </div>
      </div>
      {/* Columna Derecha: Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#111827] to-[#0a0c10] items-center justify-center relative min-h-screen">
        <img
          src="/medopz_logo_blanco_solo.svg"
          alt="MedOpz Logo"
          className="h-40 w-40 opacity-60 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        />
      </div>
    </div>
  );
}