// src/components/WaitingRoom/RegisterWalkinModal.tsx
import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { searchPatients } from "../../api/patients";
import { PatientRef } from "../../types/patients";
import type { WaitingRoomEntry } from "../../types/waitingRoom";
import { UserPlusIcon, Search, CheckIcon, X } from "lucide-react";
import NewPatientModal from "../Patients/NewPatientModal";
interface ServiceOption {
  id: number;
  name: string;
  category_id?: number;
}
interface Props {
  onClose: () => void;
  onSuccess: (patientId: number, institutionId: number | null, serviceId: number | null) => void;
  existingEntries: WaitingRoomEntry[];
  institutionId?: number | null;
  services: ServiceOption[];
}
const RegisterWalkinModal: React.FC<Props> = ({ 
  onClose, 
  onSuccess, 
  existingEntries,
  institutionId,
  services 
}) => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 1) {
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }
      try {
        const response = await searchPatients(query);
        const safeResults: PatientRef[] = Array.isArray(response?.results) ? response.results : [];
        setResults(safeResults);
        setHighlightedIndex(safeResults.length > 0 ? 0 : -1);
      } catch (e) {
        setResults([]);
      }
    };
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);
  const handlePatientSelected = (patient: PatientRef) => {
    setSelectedPatient(patient);
    setQuery("");
    setResults([]);
    setSelectedServiceId(null);
  };
  const handleProceedWithPatient = () => {
    if (selectedPatient) {
      onSuccess(selectedPatient.id, institutionId || null, selectedServiceId);
      onClose();
    }
  };
  const handleNewPatientCreated = (patientId: number) => {
    setShowNewPatientModal(false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    onSuccess(patientId, institutionId || null, selectedServiceId);
    onClose();
  };
  const alreadyInWaitingRoom = selectedPatient
    ? existingEntries.some((e) => e.patient.id === selectedPatient.id && !["completed", "canceled"].includes(e.status))
    : false;
  const inputStyles = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelStyles = "text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block";
  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-[12px] font-semibold text-white">
                  Identificar Paciente
                </h3>
                <p className="text-[10px] text-white/40 mt-0.5">Buscar en la base de datos</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="bg-white/5 border border-white/15 rounded-lg p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  autoFocus
                  className={`${inputStyles} pl-10`}
                  placeholder="Buscar por nombre o cédula..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedPatient(null); }}
                />
              </div>
              {results.length > 0 && !selectedPatient && (
                <div className="border border-white/15 rounded-lg divide-y divide-white/5 max-h-48 overflow-y-auto bg-black/20">
                  {results.map((p, index) => (
                    <div
                      key={p.id}
                      className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${index === highlightedIndex ? "bg-white/5" : "hover:bg-white/5"}`}
                      onClick={() => handlePatientSelected(p)}
                    >
                      <span className="text-[11px] font-medium text-white/80">{p.full_name}</span>
                      <span className="text-[9px] text-white/30">{p.national_id || "Sin ID"}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className={`p-5 border rounded-lg transition-all ${alreadyInWaitingRoom ? "border-red-500/20 bg-red-500/5" : "border-white/15 bg-white/5"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Paciente Identificado</p>
                      <h3 className="text-lg font-medium text-white/90">{selectedPatient.full_name}</h3>
                      <p className="text-xs font-mono text-white/40 mt-1">{selectedPatient.national_id}</p>
                    </div>
                    {!alreadyInWaitingRoom && <CheckIcon className="w-6 h-6 text-emerald-400" />}
                  </div>
                  
                  <div className="mt-4">
                    <label className={labelStyles}>Tipo de Servicio</label>
                    <select
                      value={selectedServiceId ?? ''}
                      onChange={(e) => setSelectedServiceId(e.target.value ? Number(e.target.value) : null)}
                      className={inputStyles}
                    >
                      <option value="">Seleccionar Servicio</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {alreadyInWaitingRoom ? (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-medium text-center rounded-lg">
                      ⚠ El paciente ya tiene un registro activo
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-6">
                      <button 
                        onClick={handleProceedWithPatient}
                        className="flex-1 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium py-2.5 rounded-lg hover:bg-emerald-500/25 transition-all border border-emerald-500/25"
                      >
                        Continuar
                      </button>
                      <button 
                        onClick={() => setSelectedPatient(null)}
                        className="px-4 border border-white/15 text-white/40 text-[11px] font-medium rounded-lg hover:bg-white/5 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button 
                onClick={() => setShowNewPatientModal(true)}
                className="w-full py-3 border border-dashed border-white/15 text-white/30 hover:text-white/50 hover:border-white/25 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-[10px] font-medium"
              >
                <UserPlusIcon className="w-4 h-4" />
                Registrar Nuevo Paciente
              </button>
            </div>
          </div>
        </div>
      </div>
      <NewPatientModal
        open={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onCreated={() => {}}
        onPatientCreated={handleNewPatientCreated}
      />
    </>
  );
};
export default RegisterWalkinModal;