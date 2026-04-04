// src/pages/PatientPortal/PatientLogin.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/hooks/patient/usePatientAuth'; 
import { Lock, User, Loader2 } from 'lucide-react';
export default function PatientLogin() {
  const navigate = useNavigate();
  const { login, isLoading, error } = usePatientAuth();
  
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
              Portal del Paciente
            </h2>
            <p className="text-sm text-white/40">
              Accede a tu historial médico y citas.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/20 group-focus-within:text-white/50 transition-colors">
                <User size={18} />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
          <div className="mt-6 text-center space-y-2">
            <Link
              to="/patient/register"
              className="block text-sm text-emerald-400/70 hover:text-emerald-400 transition-colors"
            >
              ¿No tienes cuenta? Regístrate
            </Link>
            <Link
              to="/patient/forgot-password"
              className="block text-sm text-white/30 hover:text-white/50 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link
              to="/login"
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              ← Volver al portal médico
            </Link>
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