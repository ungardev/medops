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
        // Guardar token
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c10] text-slate-200 px-4">
        <div className="max-w-md w-full bg-[#11141a] border border-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">¡Cuenta Activada!</h1>
          <p className="text-slate-400 mb-6">
            Bienvenido a MEDOPZ, {patientName}
          </p>
          <Link
            to="/patient"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-bold uppercase"
          >
            Ir al Portal del Paciente
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c10] text-slate-200 px-4 font-sans">
      <div className="flex flex-col items-center mb-10">
        <img src="/medopz_logo_blanco_solo.svg" alt="MEDOPZ" className="h-24 w-24 mb-4" />
        <img src="/medopz_fuente_blanco.svg" alt="MEDOPZ" className="h-7" />
      </div>
      <div className="w-full max-w-md bg-[#11141a] border border-slate-800 rounded-xl p-8">
        <h1 className="text-xl font-bold text-white mb-2">Activar Cuenta MEDOPZ</h1>
        <p className="text-sm text-slate-400 mb-6">
          Crea tu contraseña para acceder al Portal del Paciente.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white"
                placeholder="Repite tu contraseña"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <Link to="/patient/login" className="text-sm text-slate-400 hover:text-white">
            ← Volver
          </Link>
        </div>
      </div>
      <footer className="mt-12 text-[10px] text-slate-600 uppercase tracking-[0.3em]">
        © 2026 MedOpz Clinical OS
      </footer>
    </div>
  );
}