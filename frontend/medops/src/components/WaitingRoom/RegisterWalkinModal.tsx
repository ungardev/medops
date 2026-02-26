// src/components/WaitingRoom/RegisterWalkinModal.tsx
import React, { useEffect, useState } from "react";
import { searchPatients } from "../../api/patients";
import { PatientRef } from "../../types/patients";
import type { WaitingRoomEntry } from "../../types/waitingRoom";
import { UserPlusIcon, Search, CheckIcon, X } from "lucide-react";
import NewPatientModal from "../Patients/NewPatientModal";
interface Props {
  onClose: () => void;
  onSuccess: (patientId: number, institutionId: number | null) => void;
  existingEntries: WaitingRoomEntry[];
  institutionId?: number | null;
}
const RegisterWalkinModal: React.FC<Props> = ({ 
  onClose, 
  onSuccess, 
  existingEntries,
  institutionId 
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientRef[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
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
  };
  const handleProceedWithPatient = () => {
    if (selectedPatient) {
      onSuccess(selectedPatient.id, institutionId || null);
      onClose();
    }
  };
  const handleNewPatientCreated = (patientId: number) => {
    setShowNewPatientModal(false);
    onSuccess(patientId, institutionId || null);
    onClose();
  };
  const alreadyInWaitingRoom = selectedPatient
    ? existingEntries.some((e) => e.patient.id === selectedPatient.id && !["completed", "canceled"].includes(e.status))
    : false;
  const inputStyles = "w-full bg-black/40 border border-white/20 rounded-sm px-4 py-3 text-[13px] text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all";
  const labelStyles = "text-[11px] font-bold text-white/70 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-white/[0.02] border border-white/10 rounded-sm p-5 space-y-4";
  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 border border-blue-400/30">
                <Search className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-white">
                  PATIENT IDENTIFICATION
                </h3>
                <p className="text-[10px] font-mono text-white/50 uppercase">Search Existing Database</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Content */}
          <div className="p-6 space-y-5">
            <div className={sectionStyles}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  autoFocus
                  className={`${inputStyles} pl-12`}
                  placeholder="Search by name or ID..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedPatient(null); }}
                />
              </div>
              {results.length > 0 && !selectedPatient && (
                <div className="border border-white/10 rounded-sm divide-y divide-white/5 max-h-48 overflow-y-auto bg-black">
                  {results.map((p, index) => (
                    <div
                      key={p.id}
                      className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${index === highlightedIndex ? "bg-white/10" : "hover:bg-white/5"}`}
                      onClick={() => handlePatientSelected(p)}
                    >
                      <span className="text-xs font-bold uppercase tracking-tight text-white">{p.full_name}</span>
                      <span className="text-[10px] font-mono text-white/40">{p.national_id || "NO_ID"}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedPatient && (
                <div className={`p-5 border rounded-sm transition-all ${alreadyInWaitingRoom ? "border-red-500/30 bg-red-500/5" : "border-white/20 bg-white/5"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">SUBJECT IDENTIFIED</p>
                      {/* ✅ FIX: Removed italic from patient name */}
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">{selectedPatient.full_name}</h3>
                      <p className="text-xs font-mono text-white/50 mt-1">{selectedPatient.national_id}</p>
                    </div>
                    {!alreadyInWaitingRoom && <CheckIcon className="w-6 h-6 text-white" />}
                  </div>
                  {alreadyInWaitingRoom ? (
                    <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                      ⚠ ACTIVE REGISTRY DETECTED
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-6">
                      <button 
                        onClick={handleProceedWithPatient}
                        className="flex-1 bg-white text-black text-[11px] font-bold uppercase py-2.5 rounded-sm hover:bg-white/90 transition-all tracking-wider font-mono"
                      >
                        PROCEED
                      </button>
                      <button 
                        onClick={() => setSelectedPatient(null)}
                        className="px-4 border border-white/10 text-white/60 text-[11px] font-bold uppercase rounded-sm hover:bg-white/5 transition-colors font-mono"
                      >
                        CANCEL
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button 
                onClick={() => setShowNewPatientModal(true)}
                className="w-full py-4 border border-dashed border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/[0.02] transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
              >
                <UserPlusIcon className="w-4 h-4" />
                Initialize New Subject
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