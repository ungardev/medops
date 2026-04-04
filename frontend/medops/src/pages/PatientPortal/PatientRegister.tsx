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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl rounded-xl border border-white/15">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white/90 mb-2">MEDOPZ</h1>
          <p className="text-white/40">Registro de Paciente</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
              {success}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1.5">
              ID de Paciente
            </label>
            <input
              type="number"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
              placeholder="Tu número de paciente"
              required
            />
            <p className="mt-1 text-xs text-white/30">
              Lo encontrarás en tu factura o registro médico
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 pr-12"
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
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
            <label className="block text-sm font-medium text-white/50 mb-1.5">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
              placeholder="Repite tu contraseña"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/25"
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
          <Link to="/patient/login" className="text-sm text-emerald-400/70 hover:text-emerald-400">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <Link to="/login" className="text-sm text-white/30 hover:text-white/60">
            ← Volver al portal médico
          </Link>
        </div>
      </div>
    </div>
  );
}