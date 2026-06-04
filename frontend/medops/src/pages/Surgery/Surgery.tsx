// src/pages/Surgery/Surgery.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import type { Surgery } from "@/types/patients";
import SurgeriesModal from "@/components/Patients/SurgeriesModal";
import PatientSearchModal from "@/components/Common/PatientSearchModal";
import SurgeryDetailDrawer from "@/components/Patients/SurgeryDetailDrawer";
import { toast } from "react-hot-toast";
import { 
  Scissors, 
  Calendar,
  User,
  Stethoscope,
  Activity,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Plus,
  X,
  Eye,
  Pencil,
} from "lucide-react";
interface SurgeryStats {
  total: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  canceled: number;
}
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pre_op: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  canceled: "bg-red-500/10 text-red-400 border-red-500/20",
  postponed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};
const riskColors: Record<string, string> = {
  low: "text-emerald-400",
  moderate: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};
export default function Surgery() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
  const [editingSurgery, setEditingSurgery] = useState<Surgery | undefined>(undefined);
  
  // Drawer de detalles
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | undefined>(undefined);
  const { data: stats } = useQuery<SurgeryStats>({
    queryKey: ["surgery-stats"],
    queryFn: async () => {
      const { data } = await api.get("/surgeries/stats/");
      return data as SurgeryStats;
    },
  });
  const { data: surgeries, isLoading, refetch } = useQuery<Surgery[]>({
    queryKey: ["surgeries", activeTab],
    queryFn: async () => {
      const params = activeTab !== "all" ? `?status=${activeTab}` : "";
      const response = await api.get<any>(`/surgeries/${params}`);
      // Handle DRF pagination: response.data.results || response.data (fallback for non-paginated)
      return (response.data.results || response.data) as Surgery[];
    },
  });
  
  // Mutaciones para cambiar estado de cirugía
  const startSurgeryMutation = useMutation({
    mutationFn: async (surgeryId: number) => {
      const { data } = await api.patch(`/surgeries/${surgeryId}/`, { status: "in_progress" });
      return data;
    },
    onSuccess: () => {
      toast.success("Cirugía iniciada correctamente");
      refetch();
    },
    onError: () => {
      toast.error("Error al iniciar la cirugía");
    },
  });
  
  const completeSurgeryMutation = useMutation({
    mutationFn: async (surgeryId: number) => {
      const { data } = await api.patch(`/surgeries/${surgeryId}/`, { status: "completed" });
      return data;
    },
    onSuccess: () => {
      toast.success("Cirugía completada correctamente");
      refetch();
    },
    onError: () => {
      toast.error("Error al completar la cirugía");
    },
  });
  
  const cancelSurgeryMutation = useMutation({
    mutationFn: async (surgeryId: number) => {
      const { data } = await api.patch(`/surgeries/${surgeryId}/`, { status: "canceled" });
      return data;
    },
    onSuccess: () => {
      toast.success("Cirugía cancelada correctamente");
      refetch();
    },
    onError: () => {
      toast.error("Error al cancelar la cirugía");
    },
  });
  const handleSaveSurgery = async (payload: any) => {
    try {
      if (editingSurgery) {
        await api.patch(`/surgeries/${editingSurgery.id}/`, payload);
      } else {
        await api.post("/surgeries/", payload);
      }
      refetch();
    } catch (err) {
      console.error("Error saving surgery:", err);
    }
  };
  const statsCards = [
    { label: "Programadas", value: stats?.scheduled ?? 0, icon: Calendar, color: "text-blue-400" },
    { label: "En Curso", value: stats?.in_progress ?? 0, icon: PlayCircle, color: "text-purple-400" },
    { label: "Completadas", value: stats?.completed ?? 0, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Canceladas", value: stats?.canceled ?? 0, icon: AlertTriangle, color: "text-red-400" },
  ];
  const tabs = [
    { key: "all", label: "Todas" },
    { key: "scheduled", label: "Programadas" },
    { key: "in_progress", label: "En Curso" },
    { key: "completed", label: "Completadas" },
    { key: "canceled", label: "Canceladas" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Cirugía", active: true }
        ]}
        stats={[
          { label: "Programadas", value: stats?.scheduled ?? 0, color: "text-blue-400" },
          { label: "En Curso", value: stats?.in_progress ?? 0, color: "text-purple-400" },
          { label: "Completadas", value: stats?.completed ?? 0, color: "text-emerald-400" },
        ]}
        actions={
          <button
            onClick={() => setPatientSearchOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Cirugía
          </button>
        }
      />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/15 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-semibold text-white mt-2">{stat.value}</p>
              </div>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.key
                ? "text-white border-white"
                : "text-white/40 border-transparent hover:text-white/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white/5 border border-white/15 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-white/30 mt-4">Cargando cirugías...</p>
          </div>
        ) : !surgeries || surgeries.length === 0 ? (
          <div className="p-24 text-center">
            <Scissors className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-white/30">No hay cirugías registradas</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {surgeries.map((surgery: Surgery) => (
              <div key={surgery.id} className="px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="mt-1">
                    <Scissors className="w-5 h-5 text-white/30" />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <p className="text-base font-medium text-white/80 truncate">{surgery.name}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-white/40">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {surgery.patient_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4" />
                        {surgery.surgeon_name}
                      </span>
                      {surgery.scheduled_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {new Date(surgery.scheduled_date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {surgery.status && (
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border ${statusColors[surgery.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                          {surgery.status_display}
                        </span>
                      )}
                      {surgery.risk_level && (
                        <span className={`text-sm font-medium ${riskColors[surgery.risk_level] || "text-white/40"}`}>
                          {surgery.risk_level_display}
                        </span>
                      )}
                      {surgery.asa_classification && (
                        <span className="text-sm text-white/30">ASA: {surgery.asa_classification}</span>
                      )}
                      {surgery.specialty_name && (
                        <span className="text-sm text-white/30">{surgery.specialty_name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {surgery.status === "scheduled" && (
                    <>
                      <button 
                        onClick={() => startSurgeryMutation.mutate(surgery.id)}
                        disabled={startSurgeryMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Activity className="w-4 h-4" />
                        Iniciar
                      </button>
                      <button 
                        onClick={() => { setSelectedSurgery(surgery); setDetailDrawerOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button 
                        onClick={() => cancelSurgeryMutation.mutate(surgery.id)}
                        disabled={cancelSurgeryMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {surgery.status === "in_progress" && (
                    <>
                      <button 
                        onClick={() => completeSurgeryMutation.mutate(surgery.id)}
                        disabled={completeSurgeryMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Completar
                      </button>
                      <button 
                        onClick={() => { setSelectedSurgery(surgery); setDetailDrawerOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button 
                        onClick={() => { setEditingSurgery(surgery); setModalOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                      <button 
                        onClick={() => cancelSurgeryMutation.mutate(surgery.id)}
                        disabled={cancelSurgeryMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {(surgery.status === "completed" || surgery.status === "canceled") && (
                    <button 
                      onClick={() => { setSelectedSurgery(surgery); setDetailDrawerOpen(true); }}
                      className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SurgeriesModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSurgery(undefined); setSelectedPatientId(0); }}
        onSave={handleSaveSurgery}
        initial={editingSurgery}
        patientId={selectedPatientId}
      />
      <PatientSearchModal
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={(patientId) => {
          setSelectedPatientId(patientId);
          setPatientSearchOpen(false);
          setEditingSurgery(undefined);
          setModalOpen(true);
        }}
      />
      <SurgeryDetailDrawer
        open={detailDrawerOpen}
        onClose={() => { setDetailDrawerOpen(false); setSelectedSurgery(undefined); }}
        surgery={selectedSurgery}
        onEdit={(surgery) => {
          setDetailDrawerOpen(false);
          setEditingSurgery(surgery);
          setSelectedPatientId((surgery as any).patient || 0);
          setModalOpen(true);
        }}
      />
    </div>
  );
}