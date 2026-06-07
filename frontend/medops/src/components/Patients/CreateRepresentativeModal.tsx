// src/components/Patients/CreateRepresentativeModal.tsx
import React, { useState } from "react";
import { X, UserPlus, Loader2, CheckCircleIcon } from "lucide-react";
import { apiFetch } from "@/api/client";
import { PatientInput } from "@/types/patients";

interface CreateRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (patient: { id: number; full_name: string; national_id: string; phone_number: string | null; email: string | null }) => void;
  prefillNationalId?: string;
}

interface CreateRepresentativeResponse {
  id: number;
  full_name: string;
  national_id: string;
  phone_number: string | null;
  email: string | null;
}

export default function CreateRepresentativeModal({ isOpen, onClose, onCreated, prefillNationalId }: CreateRepresentativeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    national_id: prefillNationalId || "",
    phone_number: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es requerido";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es requerido";
    }
    if (!formData.national_id.trim()) {
      newErrors.national_id = "La cédula es requerida";
    } else if (formData.national_id.replace(/[^0-9]/g, "").length < 5) {
      newErrors.national_id = "Cédula inválida";
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "El teléfono es requerido";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload: PatientInput = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        national_id: formData.national_id.replace(/[^0-9]/g, "").trim(),
        id_type: "V",
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim().toLowerCase(),
        is_minor: false,
      };

      const data = await apiFetch<CreateRepresentativeResponse>("patients/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      setTimeout(() => {
        onCreated({
          id: data.id,
          full_name: data.full_name,
          national_id: data.national_id,
          phone_number: data.phone_number,
          email: data.email,
        });
        handleClose();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.national_id?.[0] || 
                       err.response?.data?.email?.[0] ||
                       err.response?.data?.error ||
                       err.message ||
                       "Error al crear representante";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: "",
      last_name: "",
      national_id: prefillNationalId || "",
      phone_number: "",
      email: "",
    });
    setErrors({});
    setError("");
    setSuccess(false);
    onClose();
  };

  const inputClass = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelClass = "text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-[#1a1a1b] border border-white/15 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <X size={20} />
        </button>

        {!success ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Nuevo Representante</h3>
                <p className="text-sm text-white/40 mt-0.5">Crea un nuevo paciente adulto</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`${inputClass} ${errors.first_name ? "border-red-500/50" : ""}`}
                    placeholder="Primer nombre"
                  />
                  {errors.first_name && <p className="text-xs text-red-400 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className={labelClass}>Apellido *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`${inputClass} ${errors.last_name ? "border-red-500/50" : ""}`}
                    placeholder="Primer apellido"
                  />
                  {errors.last_name && <p className="text-xs text-red-400 mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <label className={labelClass}>Cédula *</label>
                <input
                  type="text"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  className={`${inputClass} ${errors.national_id ? "border-red-500/50" : ""}`}
                  placeholder="Ej: 12345678"
                />
                {errors.national_id && <p className="text-xs text-red-400 mt-1">{errors.national_id}</p>}
              </div>

              <div>
                <label className={labelClass}>Teléfono *</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className={`${inputClass} ${errors.phone_number ? "border-red-500/50" : ""}`}
                  placeholder="+58 412-1234567"
                />
                {errors.phone_number && <p className="text-xs text-red-400 mt-1">{errors.phone_number}</p>}
              </div>

              <div>
                <label className={labelClass}>Email * (usuario de acceso)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`${inputClass} ${errors.email ? "border-red-500/50" : ""}`}
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Crear
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">¡Representante creado!</h4>
            <p className="text-sm text-white/50">
              Ahora puedes continuar con el registro del menor
            </p>
          </div>
        )}
      </div>
    </div>
  );
}