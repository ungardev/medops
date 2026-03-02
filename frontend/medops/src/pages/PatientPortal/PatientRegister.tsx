import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientAuth } from '@/api/patient/client';
import { EyeIcon, EyeOffIcon, Loader2 } from 'lucide-react';
export function PatientRegister() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    patientId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setIsLoading(true);
    try {
      await patientAuth.register({
        email: formData.email,
        password: formData.password,
        patient_id: parseInt(formData.patientId),
      });
      setSuccess('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
      setTimeout(() => {
        navigate('/patient/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">MEDOPZ</h1>
          <p className="text-slate-400">Registro de Paciente</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ID de Paciente
            </label>
            <input
              type="number"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu número de paciente"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              Lo encontrarás en tu factura o registro médico
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Repite tu contraseña"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold tracking-widest uppercase transition-all shadow-[0_5px_15px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Creando cuenta...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/patient/login" className="text-sm text-blue-400 hover:text-blue-300">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
          <Link to="/login" className="text-sm text-slate-400 hover:text-white">
            ← Volver al portal médico
          </Link>
        </div>
      </div>
    </div>
  );
}