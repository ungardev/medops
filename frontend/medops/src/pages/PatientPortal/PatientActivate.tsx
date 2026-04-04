// src/pages/PatientPortal/PatientActivate.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Lock, Loader2 } from 'lucide-react';
export default function PatientActivate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState('');
  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
    }
  }, [token]);
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/patient-activate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPatientName(data.patient.full_name);
        localStorage.setItem('patient_access_token', data.token);
        localStorage.setItem('patient_id', data.patient.id);
        localStorage.setItem('userRole', 'patient');
        setSuccess(true);
      } else {
        setError(data.error || 'Error al activar cuenta');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white/80 px-4">
        <div className="max-w-md w-full bg-white/5 border border-white/15 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white/90 mb-2">¡Cuenta Activada!</h1>
          <p className="text-white/40 mb-6">
            Bienvenido a MEDOPZ, {patientName}
          </p>
          <Link
            to="/patient"
            className="inline-block bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-6 py-2.5 rounded-lg text-sm font-medium transition-all border border-emerald-500/25"
          >
            Ir al Portal del Paciente
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white/80 px-4">
      <div className="flex flex-col items-center mb-10">
        <img src="/medopz_logo_blanco_solo.svg" alt="MEDOPZ" className="h-20 w-20 mb-4 opacity-60" />
        <img src="/medopz_fuente_blanco.svg" alt="MEDOPZ" className="h-6 opacity-60" />
      </div>
      <div className="w-full max-w-md bg-white/5 border border-white/15 rounded-xl p-8">
        <h1 className="text-xl font-semibold text-white/90 mb-2">Activar Cuenta MEDOPZ</h1>
        <p className="text-sm text-white/40 mb-6">
          Crea tu contraseña para acceder al Portal del Paciente.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                placeholder="Repite tu contraseña"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full mt-6 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 py-2.5 rounded-lg text-sm font-medium uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all border border-emerald-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Activando...
              </>
            ) : (
              'Activar Cuenta'
            )}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <Link to="/patient/login" className="text-sm text-white/30 hover:text-white/60">
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  );
}