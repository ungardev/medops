// src/pages/DoctorPortal/DoctorActivate.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Lock, Loader2, User, Mail, Phone, Shield } from 'lucide-react';
import { apiFetch } from '@/api/client';

interface InvitationData {
  email: string;
  institution: string;
  specialty: string | null;
  is_valid: boolean;
  is_expired: boolean;
  is_used: boolean;
}

export default function DoctorActivate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState<'verify' | 'form' | 'success'>('verify');
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    confirmPassword: '',
    gender: 'M',
    phone: '',
    colegiado_id: '',
    license: '',
  });

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido');
      return;
    }

    const verifyInvitation = async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch<InvitationData>(
          `doctor/invitations/${token}/`,
          { method: 'GET' }
        );
        setInvitationData(data);
        
        if (data.is_valid) {
          setStep('form');
        } else if (data.is_expired) {
          setError('Esta invitación ha expirado. Solicita una nueva invitación.');
        } else if (data.is_used) {
          setError('Esta invitación ya fue utilizada.');
        }
      } catch (err) {
        setError('No se pudo verificar la invitación. El enlace puede ser inválido.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!formData.full_name || !formData.username || !formData.colegiado_id || !formData.license) {
      setError('Todos los campos son requeridos');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch<{
        access: string;
        refresh: string;
        user: { id: number; username: string; email: string; full_name: string };
        doctor: { id: number; Colegio_id: string; institution: string };
      }>('doctor/activate/', {
        method: 'POST',
        body: JSON.stringify({
          token,
          full_name: formData.full_name,
          username: formData.username,
          password: formData.password,
          gender: formData.gender,
          phone: formData.phone || undefined,
          colegiado_id: formData.colegiado_id,
          license: formData.license,
        }),
      });

      localStorage.setItem('doctor_access_token', response.access);
      if (response.refresh) {
        localStorage.setItem('doctor_refresh_token', response.refresh);
      }
      localStorage.setItem('auth_user', JSON.stringify(response.user));

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Error al activar cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white/80 px-4">
        <div className="max-w-md w-full bg-white/5 border border-white/15 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white/90 mb-2">¡Cuenta Activada!</h1>
          <p className="text-white/40 mb-6">
            Bienvenido a MEDOPZ, Dr. {formData.full_name}
          </p>
          <button
            onClick={() => navigate('/doctor')}
            className="inline-block bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-6 py-2.5 rounded-lg text-sm font-medium transition-all border border-emerald-500/25"
          >
            Ir al Portal del Médico
          </button>
        </div>
      </div>
    );
  }

  if (error && step === 'verify') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white/80 px-4">
        <div className="max-w-md w-full bg-white/5 border border-white/15 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white/90 mb-4">Invitación Inválida</h1>
          <p className="text-white/40 mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-block bg-white/5 hover:bg-white/10 text-white/60 px-6 py-2.5 rounded-lg text-sm transition-all border border-white/10"
          >
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white/80 px-4 py-12">
      <div className="flex flex-col items-center mb-10">
        <img src="/medopz_logo_blanco_solo.svg" alt="MEDOPZ" className="h-20 w-20 mb-4 opacity-60" />
        <img src="/medopz_fuente_blanco.svg" alt="MEDOPZ" className="h-6 opacity-60" />
      </div>

      <div className="w-full max-w-lg bg-white/5 border border-white/15 rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white/90">Activar Cuenta de Médico</h1>
            <p className="text-sm text-white/40">
              {invitationData ? invitationData.email : 'Cargando...'}
            </p>
          </div>
        </div>

        {invitationData && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/30 block">Institución</span>
                <span className="text-white/80">{invitationData.institution}</span>
              </div>
              {invitationData.specialty && (
                <div>
                  <span className="text-white/30 block">Especialidad</span>
                  <span className="text-white/80">{invitationData.specialty}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleActivate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                  placeholder="Dr. Juan Pérez"
                  required
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Nombre de Usuario *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                placeholder="juanperez"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Género
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                  placeholder="+58 412 1234567"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Número de Colegiado *
              </label>
              <input
                type="text"
                name="colegiado_id"
                value={formData.colegiado_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                placeholder="12345"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Licencia / MPPS *
              </label>
              <input
                type="text"
                name="license"
                value={formData.license}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                placeholder="MPPS-123456"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/40 uppercase mb-1.5">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50"
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || step !== 'form'}
            className="w-full mt-6 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 py-2.5 rounded-lg text-sm font-medium uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all border border-emerald-500/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Activando...
              </>
            ) : (
              'Activar Cuenta de Médico'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <Link to="/login" className="text-sm text-white/30 hover:text-white/60">
            ← Volver al Login
          </Link>
        </div>
      </div>
    </div>
  );
}