// src/pages/Hospitalization/Hospitalization.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import type { Hospitalization } from "@/types/patients";
import HospitalizationsModal from "@/components/Patients/HospitalizationsModal";
import PatientSearchModal from "@/components/Common/PatientSearchModal";
import { 
  Bed, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Calendar,
  Stethoscope,
  Heart,
  LogOut,
  Plus,
} from "lucide-react";
interface HospitalizationStats {
  total: number;
  admitted: number;
  critical: number;
  discharged_today: number;
}
const statusColors: Record<string, string> = {
  admitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  improving: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  awaiting_discharge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  discharged: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  transferred: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deceased: "bg-red-900/20 text-red-500 border-red-900/30",
};
export default function Hospitalization() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
  const [editingHosp, setEditingHosp] = useState<Hospitalization | undefined>(undefined);
  const { data: stats } = useQuery<HospitalizationStats>({
    queryKey: ["hospitalization-stats"],
    queryFn: async () => {
      const { data } = await api.get("/api/hospitalizations/stats/");
      return data as HospitalizationStats;
    },
  });
  const { data: hospitalizations, isLoading, refetch } = useQuery<Hospitalization[]>({
    queryKey: ["hospitalizations", activeTab],
    queryFn: async () => {
      const params = activeTab !== "all" ? `?status=${activeTab}` : "";
      const { data } = await api.get(`/api/hospitalizations/${params}`);
      return data as Hospitalization[];
    },
  });
  const handleSaveHospitalization = async (payload: any) => {
    try {
      if (editingHosp) {
        await api.patch(`/api/hospitalizations/${editingHosp.id}/`, payload);
      } else {
        await api.post("/api/hospitalizations/", payload);
      }
      refetch();
    } catch (err) {
      console.error("Error saving hospitalization:", err);
    }
  };
  const statsCards = [
    { label: "Admitidos", value: stats?.admitted ?? 0, icon: Bed, color: "text-blue-400" },
    { label: "Críticos", value: stats?.critical ?? 0, icon: AlertTriangle, color: "text-red-400" },
    { label: "Altas Hoy", value: stats?.discharged_today ?? 0, icon: LogOut, color: "text-emerald-400" },
    { label: "Total Estancia", value: stats?.total ?? 0, icon: Clock, color: "text-white/60" },
  ];
  const tabs = [
    { key: "all", label: "Todos" },
    { key: "admitted", label: "Admitidos" },
    { key: "stable", label: "Estables" },
    { key: "critical", label: "Críticos" },
    { key: "improving", label: "En Mejoría" },
    { key: "discharged", label: "Dados de Alta" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Hospitalización", active: true }
        ]}
        stats={[
          { label: "Admitidos", value: stats?.admitted ?? 0, color: "text-blue-400" },
          { label: "Críticos", value: stats?.critical ?? 0, color: "text-red-400" },
          { label: "Altas Hoy", value: stats?.discharged_today ?? 0, color: "text-emerald-400" },
        ]}
        actions={
          <button
            onClick={() => setPatientSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Admisión
          </button>
        }
      />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/15 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-[12px] font-medium transition-all border-b-2 ${
              activeTab === tab.key
                ? "text-white border-white"
                : "text-white/40 border-transparent hover:text-white/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
            <p className="text-[11px] text-white/30 mt-3">Cargando hospitalizaciones...</p>
          </div>
        ) : !hospitalizations || hospitalizations.length === 0 ? (
          <div className="p-20 text-center">
            <Bed className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-[12px] text-white/30">No hay hospitalizaciones activas</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {hospitalizations.map((hosp: Hospitalization) => (
              <div key={hosp.id} className="px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="mt-1">
                    <Bed className="w-5 h-5 text-white/30" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-[13px] font-medium text-white/80 truncate">{hosp.patient_name}</p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-white/40">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {hosp.attending_doctor_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {hosp.ward} - Cama {hosp.bed_number}
                        {hosp.room_number && ` / Hab. ${hosp.room_number}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Ingreso: {new Date(hosp.admission_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {hosp.status && (
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-medium rounded-md border ${statusColors[hosp.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                          {hosp.status_display}
                        </span>
                      )}
                      {hosp.length_of_stay !== undefined && (
                        <span className="text-[9px] text-white/30">
                          {hosp.length_of_stay} {hosp.length_of_stay === 1 ? "día" : "días"} de estancia
                        </span>
                      )}
                      {hosp.admission_diagnosis_title && (
                        <span className="text-[9px] text-white/30">Dx: {hosp.admission_diagnosis_title}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hosp.status !== "discharged" && (
                    <button className="px-3 py-1.5 text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Evolución
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingHosp(hosp); setModalOpen(true); }}
                    className="px-3 py-1.5 text-[10px] font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all"
                  >
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <HospitalizationsModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingHosp(undefined); setSelectedPatientId(0); }}
        onSave={handleSaveHospitalization}
        initial={editingHosp}
        patientId={selectedPatientId}
      />
      <PatientSearchModal
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={(patientId) => {
          setSelectedPatientId(patientId);
          setPatientSearchOpen(false);
          setEditingHosp(undefined);
          setModalOpen(true);
        }}
      />
    </div>
  );
}