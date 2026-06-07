// src/components/Patients/NewPatientModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { PatientInput } from "../../types/patients";
import { X, Save, Loader2, UserIcon, AlertTriangle, SearchIcon, UserPlus } from "lucide-react";
import { apiFetch } from "../../api/client";
import CreateRepresentativeModal from "./CreateRepresentativeModal";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onPatientCreated?: (patientId: number) => void;
}

interface FormValues {
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  id_type: string;
  national_id: string;
  phone_number?: string;
  email?: string;
  gender?: "M" | "F" | "Other" | "Unknown";
  is_minor: boolean;
  relationship_type?: string;
  parental_consent: boolean;
}

interface PatientSearchResult {
  id: number;
  full_name: string;
  national_id: string;
  phone_number: string | null;
  email: string | null;
  is_minor: boolean;
}

const RELATIONSHIP_OPTIONS = [
  { value: "father", label: "Padre" },
  { value: "mother", label: "Madre" },
  { value: "legal_guardian", label: "Tutor Legal" },
  { value: "grandfather", label: "Abuelo" },
  { value: "grandmother", label: "Abuela" },
  { value: "other", label: "Otro" },
];

const NewPatientModal: React.FC<Props> = ({ open, onClose, onCreated, onPatientCreated }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      id_type: "V"
    }
  });
  const createPatient = useCreatePatient();
  const [isMinor, setIsMinor] = useState(false);
  const [parentalConsent, setParentalConsent] = useState(false);
  const [idType, setIdType] = useState("V");
  const [existingPatient, setExistingPatient] = useState<{id: number, full_name: string} | null>(null);
  const [checkingPatient, setCheckingPatient] = useState(false);

  // Representative search states
  const [representativeQuery, setRepresentativeQuery] = useState("");
  const [representativeResults, setRepresentativeResults] = useState<PatientSearchResult[]>([]);
  const [selectedRepresentative, setSelectedRepresentative] = useState<PatientSearchResult | null>(null);
  const [isSearchingRepresentative, setIsSearchingRepresentative] = useState(false);
  const [showCreateRepresentative, setShowCreateRepresentative] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const nationalIdValue = watch("national_id");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check for duplicate patient (national_id)
  useEffect(() => {
    if (!nationalIdValue || nationalIdValue.length < 5) {
      setExistingPatient(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingPatient(true);
      try {
        const normalizedId = nationalIdValue.replace(/[^0-9]/g, "");
        const response = await apiFetch<{exists: boolean, patient?: {id: number, full_name: string}}>(`/patients/check/?national_id=${normalizedId}&id_type=${idType}`);
        if (response.exists && response.patient) {
          setExistingPatient({
            id: response.patient.id,
            full_name: response.patient.full_name
          });
        } else {
          setExistingPatient(null);
        }
      } catch (error) {
        setExistingPatient(null);
      } finally {
        setCheckingPatient(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nationalIdValue, idType]);

  // Search representative when query changes
  useEffect(() => {
    if (!representativeQuery || representativeQuery.length < 3) {
      setRepresentativeResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingRepresentative(true);
      try {
        const data = await apiFetch<{ results: PatientSearchResult[] }>(
          `patients/search/?q=${encodeURIComponent(representativeQuery.trim())}`,
          { method: "GET" }
        );
        // Filter out minors and show only adults
        const adults = (data.results || []).filter((p: PatientSearchResult) => !p.is_minor);
        setRepresentativeResults(adults.slice(0, 5));
        setShowDropdown(true);
      } catch (error) {
        setRepresentativeResults([]);
      } finally {
        setIsSearchingRepresentative(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [representativeQuery]);

  const handleSelectRepresentative = (patient: PatientSearchResult) => {
    setSelectedRepresentative(patient);
    setRepresentativeQuery("");
    setRepresentativeResults([]);
    setShowDropdown(false);
  };

  const handleRepresentativeCreated = (patient: { id: number; full_name: string; national_id: string; phone_number: string | null; email: string | null }) => {
    const rep: PatientSearchResult = {
      ...patient,
      is_minor: false,
    };
    setSelectedRepresentative(rep);
    setShowCreateRepresentative(false);
  };

  const handleClearRepresentative = () => {
    setSelectedRepresentative(null);
  };

  if (!open) return null;

  const onSubmit = (values: FormValues) => {
    if (existingPatient) {
      return;
    }

    if (isMinor && !selectedRepresentative) {
      return;
    }

    const payload: PatientInput = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      id_type: idType,
      national_id: values.national_id.replace(/[^0-9]/g, "").trim(),
      ...(values.middle_name?.trim() && { middle_name: values.middle_name.trim() }),
      ...(values.second_last_name?.trim() && { second_last_name: values.second_last_name.trim() }),
      ...(values.phone_number?.trim() && { phone_number: values.phone_number.trim() }),
      ...(values.email?.trim() && { email: values.email.trim() }),
      ...(values.gender && { gender: values.gender }),
      is_minor: isMinor,
      ...(isMinor && selectedRepresentative && {
        representative_id: selectedRepresentative.id,
        relationship_type: values.relationship_type,
        parental_consent: parentalConsent,
      }),
    };

    createPatient.mutate(payload, {
      onSuccess: (data) => {
        if (onPatientCreated) {
          onPatientCreated(data.id);
        }
        onCreated();
        reset();
        setIsMinor(false);
        setParentalConsent(false);
        setSelectedRepresentative(null);
        onClose();
      },
    });
  };

  const inputClass = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelStyles = "text-xs font-medium text-white/60 uppercase tracking-wider mb-2 block";
  const sectionStyles = "bg-white/5 border border-white/10 rounded-xl p-5 space-y-4";
  const readonlyClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed";

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-[#1a1a1b] border border-white/15 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/15 bg-white/5 sticky top-0 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/25 rounded-xl">
                <Save className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Registrar Nuevo Paciente
                </h3>
                <p className="text-sm text-white/50 mt-0.5">Complete los datos del paciente</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className={sectionStyles}>
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Nombre Completo</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Nombre *</label>
                  <input 
                    {...register("first_name", { required: true })} 
                    className={inputClass} 
                    placeholder="Primer nombre" 
                  />
                </div>
                <div>
                  <label className={labelStyles}>Segundo Nombre</label>
                  <input {...register("middle_name")} className={inputClass} placeholder="Segundo nombre" />
                </div>
                <div>
                  <label className={labelStyles}>Apellido *</label>
                  <input 
                    {...register("last_name", { required: true })} 
                    className={inputClass} 
                    placeholder="Primer apellido" 
                  />
                </div>
                <div>
                  <label className={labelStyles}>Segundo Apellido</label>
                  <input {...register("second_last_name")} className={inputClass} placeholder="Segundo apellido" />
                </div>
              </div>
            </div>
            <div className={sectionStyles}>
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Identificación</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelStyles}>Tipo</label>
                  <select 
                    className={inputClass}
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                  >
                    <option value="V">V - Venezolano</option>
                    <option value="E">E - Extranjero</option>
                    <option value="J">J - Jurídico</option>
                    <option value="G">G - Gobierno</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelStyles}>Cédula de Identidad *</label>
                  <input {...register("national_id", { required: true })} className={inputClass} placeholder="Ej: 12345678" />
                </div>
              </div>
              {checkingPatient && (
                <div className="mt-2 text-xs text-white/40">Verificando...</div>
              )}
              {existingPatient && (
                <div className="mt-3 p-3 bg-red-500/15 border border-red-500/25 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-400 font-medium">Paciente ya existe</p>
                    <p className="text-xs text-white/60 mt-1">
                      Ya existe un paciente con esta cédula: <span className="text-white/80">{existingPatient.full_name}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className={sectionStyles}>
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Contacto</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Teléfono</label>
                  <input {...register("phone_number")} className={inputClass} placeholder="+58 412-1234567" />
                </div>
                <div>
                  <label className={labelStyles}>Correo Electrónico</label>
                  <input {...register("email")} className={inputClass} placeholder="correo@ejemplo.com" />
                </div>
              </div>
            </div>
            <div className={sectionStyles}>
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">Información Adicional</h4>
              <div>
                <label className={labelStyles}>Género</label>
                <select {...register("gender")} className={inputClass}>
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Other">Otro</option>
                  <option value="Unknown">Desconocido</option>
                </select>
              </div>
            </div>

            <div className={sectionStyles}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/15 border border-amber-500/25 rounded-lg">
                    <UserIcon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/70">Paciente Menor de Edad</h4>
                    <p className="text-xs text-white/40 mt-0.5">¿El paciente tiene menos de 18 años?</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isMinor}
                    onChange={(e) => {
                      setIsMinor(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedRepresentative(null);
                      }
                    }}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/30 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500/50 peer-checked:after:bg-emerald-400"></div>
                </label>
              </div>
            </div>

            {isMinor && (
              <div className={sectionStyles}>
                <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-4">Datos del Representante</h4>
                
                {!selectedRepresentative ? (
                  <div className="relative" ref={dropdownRef}>
                    <label className={labelStyles}>Buscar Representante *</label>
                    <div className="relative">
                      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={representativeQuery}
                        onChange={(e) => setRepresentativeQuery(e.target.value)}
                        onFocus={() => representativeQuery.length >= 3 && setShowDropdown(true)}
                        className={`${inputClass} pl-11`}
                        placeholder="Escribe nombre o cédula (mín. 3 caracteres)"
                        ref={searchInputRef}
                      />
                      {isSearchingRepresentative && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />
                      )}
                    </div>

                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-[#1a1a1b] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
                        {representativeResults.length > 0 ? (
                          <div className="py-1">
                            {representativeResults.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => handleSelectRepresentative(patient)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                              >
                                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                  <UserIcon className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{patient.full_name}</p>
                                  <p className="text-xs text-white/40">{patient.national_id}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2 px-4">
                            <p className="text-xs text-white/40 text-center mb-2">No se encontraron representantes</p>
                          </div>
                        )}
                        <div className="border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDropdown(false);
                              setShowCreateRepresentative(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                              <UserPlus className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-emerald-400">Crear nuevo representante</p>
                              <p className="text-xs text-white/40">Agregar un nuevo adulto al sistema</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center shrink-0">
                        <UserIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-400">{selectedRepresentative.full_name}</p>
                        <p className="text-xs text-white/40">{selectedRepresentative.national_id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearRepresentative}
                        className="text-xs text-white/40 hover:text-white"
                      >
                        Cambiar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className={labelStyles}>Nombre</label>
                        <input type="text" value={selectedRepresentative.full_name} readOnly className={readonlyClass} />
                      </div>
                      <div>
                        <label className={labelStyles}>Teléfono</label>
                        <input type="text" value={selectedRepresentative.phone_number || "—"} readOnly className={readonlyClass} />
                      </div>
                      <div>
                        <label className={labelStyles}>Email</label>
                        <input type="text" value={selectedRepresentative.email || "—"} readOnly className={readonlyClass} />
                      </div>
                    </div>

                    <div>
                      <label className={labelStyles}>Parentesco *</label>
                      <select 
                        {...register("relationship_type", { required: isMinor })} 
                        className={inputClass}
                      >
                        <option value="">Seleccionar parentesco</option>
                        {RELATIONSHIP_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-400 focus:ring-emerald-400 focus:ring-offset-0"
                          checked={parentalConsent}
                          onChange={(e) => setParentalConsent(e.target.checked)}
                        />
                        <div className="flex-1">
                          <span className="text-sm text-amber-400 font-medium">Consentimiento Parental</span>
                          <p className="text-xs text-white/50 mt-1">
                            Declaro que soy el representante legal del menor y autorizo la atención médica del paciente.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  createPatient.isPending || 
                  (isMinor && !parentalConsent) || 
                  (!isMinor && !!existingPatient) ||
                  (isMinor && !selectedRepresentative)
                }
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
              >
                {createPatient.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Paciente
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CreateRepresentativeModal
        isOpen={showCreateRepresentative}
        onClose={() => setShowCreateRepresentative(false)}
        onCreated={handleRepresentativeCreated}
      />
    </>
  );
};

export default NewPatientModal;