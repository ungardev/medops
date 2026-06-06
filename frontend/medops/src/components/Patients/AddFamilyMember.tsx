// src/components/Patients/AddFamilyMember.tsx
import { useState } from "react";
import { X, UserPlus, Loader2, UserIcon, CheckCircleIcon } from "lucide-react";
import { apiFetch } from "@/api/client";
import { FamilyMember } from "@/context/PatientContext";
interface AddFamilyMemberProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (member: FamilyMember) => void;
}
interface CreateFamilyLinkRequest {
  patient: number;
  relationship_type: "child" | "dependent";
}
interface CreateFamilyLinkResponse {
  id: number;
  patient_id: number;
  full_name: string;
  national_id: string | null;
  age: number | null;
  is_minor: boolean;
  birthdate: string | null;
  relationship_type: "child" | "dependent";
  relationship_type_display: string;
  created_at: string;
}
const RELATIONSHIP_OPTIONS = [
  { value: "child", label: "Hijo/Hija", description: "Menor de edad bajo tu representación" },
  { value: "dependent", label: "Dependiente", description: "Persona dependiente bajo tu cuidado" },
];
export default function AddFamilyMember({ isOpen, onClose, onAdded }: AddFamilyMemberProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [relationshipType, setRelationshipType] = useState<"child" | "dependent">("child");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  if (!isOpen) return null;
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    setIsLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ results: any[] }>(
        `patients/search/?q=${encodeURIComponent(searchQuery.trim())}`,
        { method: "GET" }
      );
      setSearchResults(data.results || []);
    } catch (err) {
      setError("Error al buscar pacientes");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery("");
    setHasSearched(false);
  };
  const handleCreate = async () => {
    if (!selectedPatient) return;
    setIsLoading(true);
    setError("");
    try {
      const payload: CreateFamilyLinkRequest = {
        patient: selectedPatient.id,
        relationship_type: relationshipType,
      };
      const data = await apiFetch<CreateFamilyLinkResponse>(
        "patient-family-links/family/",
        { method: "POST", body: JSON.stringify(payload) }
      );
      setSuccess(true);
      const newMember: FamilyMember = {
        link_id: data.id,
        patient_id: data.patient_id,
        full_name: data.full_name,
        national_id: data.national_id,
        age: data.age,
        is_minor: data.is_minor,
        birthdate: data.birthdate,
        relationship_type: data.relationship_type,
        relationship_type_display: data.relationship_type_display,
        created_at: data.created_at,
      };
      setTimeout(() => {
        onAdded(newMember);
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Error al crear vínculo");
    } finally {
      setIsLoading(false);
    }
  };
  const handleClose = () => {
    setSelectedPatient(null);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setRelationshipType("child");
    setError("");
    setSuccess(false);
    onClose();
  };
  const inputClass = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelStyles = "text-xs font-medium text-white/60 uppercase tracking-wider mb-2 block";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-[#1a1a1b] border border-white/15 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Agregar Familiar</h3>
            <p className="text-sm text-white/40 mt-0.5">Vincula un menor a tu cuenta</p>
          </div>
        </div>
        {!selectedPatient && !success ? (
          <>
            <div className="mb-5">
              <label className={labelStyles}>Buscar Paciente</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Buscar por nombre o cédula..."
                  className={inputClass}
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                  className="px-4 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 rounded-xl disabled:opacity-50 transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                </button>
              </div>
            </div>
            {hasSearched && searchResults.length === 0 && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                <p className="text-sm text-white/50">No se encontraron pacientes</p>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/30 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                      <UserIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{patient.full_name}</p>
                      <p className="text-xs text-white/40">{patient.national_id || "Sin cédula"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : selectedPatient && !success ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-400">{selectedPatient.full_name}</p>
                  <p className="text-xs text-white/40">{selectedPatient.national_id || "Sin cédula"}</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-white/40 hover:text-white"
                >
                  Cambiar
                </button>
              </div>
            </div>
            <div>
              <label className={labelStyles}>Tipo de Relación *</label>
              <div className="grid grid-cols-2 gap-3">
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRelationshipType(opt.value as "child" | "dependent")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      relationshipType === opt.value
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-white/40 mt-1">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Vincular Familiar
                </>
              )}
            </button>
          </div>
        ) : success ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">¡Familiar vinculado!</h4>
            <p className="text-sm text-white/50">
              Ahora puedes gestionar las citas y registros de {selectedPatient?.full_name}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}