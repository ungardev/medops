// src/pages/Surgery/Surgery.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Clock,
  TrendingUp,
} from "lucide-react";

interface SurgeryStats {
  total: number;
  by_status: {
    scheduled: number;
    pre_op: number;
    in_progress: number;
    completed: number;
    canceled: number;
    postponed: number;
  };
  scheduled_today: number;
  scheduled_this_week: number;
  scheduled_this_month: number;
  by_surgery_type: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_asa_classification: Record<string, number>;
  with_complications_count: number;
  avg_duration_minutes: number | null;
  financial: {
    total_revenue: number;
    outstanding_balance: number;
    paid_count: number;
    pending_count: number;
    avg_revenue_per_surgery: number;
  };
  by_specialty: Record<string, number>;
  by_surgeon: Record<string, number>;
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
  const [editingSurgery, setEditingSurgery] = useState<Surgery | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

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
    queryKey: ["surgeries", activeTab, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      const queryString = params.toString();
      const response = await api.get<any>(`/surgeries/${queryString ? `?${queryString}` : ""}`);
      return (response.data.results || response.data) as Surgery[];
    },
  });

  const startSurgeryMutation = useMutation({
    mutationFn: async (surgeryId: number) => {
      const { data } = await api.patch(`/surgeries/${surgeryId}/`, { status: "in_progress" });
      return data;
    },
    onSuccess: () => {
      toast.success("Cirugía iniciada correctamente");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["surgery-stats"] });
    },
    onError: () => toast.error("Error al iniciar la cirugía"),
  });

  const completeSurgeryMutation = useMutation({
    mutationFn: async (surgeryId: number) => {
      const { data } = await api.patch(`/surgeries/${surgeryId}/`, { status: "completed" });
      return data;
    },
    onSuccess: () => {
      toast.success("Cirugía completada correctamente");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["surgery-stats"] });
    },
    onError: () => toast.error("Error al completar la cirugía"),
  });

  const cancelSurgeryMutation = useMutation({
    mutationFn: async (surgeryId: number) => {
      const { data } = await api.patch(`/surgeries/${surgeryId}/`, { status: "canceled" });
      return data;
    },
    onSuccess: () => {
      toast.success("Cirugía cancelada correctamente");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["surgery-stats"] });
    },
    onError: () => toast.error("Error al cancelar la cirugía"),
  });

  const handleSaveSurgery = async (payload: any) => {
    try {
      if (editingSurgery) {
        await api.patch(`/surgeries/${editingSurgery.id}/`, payload);
      } else {
        await api.post("/surgeries/", payload);
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ["surgery-stats"] });
    } catch (err) {
      console.error("Error saving surgery:", err);
    }
  };

  const byStatus = stats?.by_status;
  const financial = stats?.financial;

  const statsCards = [
    { label: "Programadas", value: byStatus?.scheduled ?? 0, icon: Calendar, color: "text-blue-400" },
    { label: "Pre-Op", value: byStatus?.pre_op ?? 0, icon: Clock, color: "text-amber-400" },
    { label: "En Curso", value: byStatus?.in_progress ?? 0, icon: PlayCircle, color: "text-purple-400" },
    { label: "Completadas", value: byStatus?.completed ?? 0, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Pospuestas", value: byStatus?.postponed ?? 0, icon: AlertTriangle, color: "text-gray-400" },
    { label: "Canceladas", value: byStatus?.canceled ?? 0, icon: X, color: "text-red-400" },
    { label: "Hoy", value: stats?.scheduled_today ?? 0, icon: Activity, color: "text-cyan-400" },
    { label: "Prom. Duración", value: stats?.avg_duration_minutes ? `${stats.avg_duration_minutes}m` : "—", icon: TrendingUp, color: "text-white/60" },
  ];

  const tabs = [
    { key: "all", label: "Todas" },
    { key: "scheduled", label: "Programadas" },
    { key: "pre_op", label: "Pre-Op" },
    { key: "in_progress", label: "En Curso" },
    { key: "completed", label: "Completadas" },
    { key: "canceled", label: "Canceladas" },
    { key: "postponed", label: "Pospuestas" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Cirugía", active: true },
        ]}
        stats={[
          { label: "Total", value: stats?.total ?? 0 },
          { label: "En Curso", value: byStatus?.in_progress ?? 0, color: "text-purple-400" },
          { label: "Completadas", value: byStatus?.completed ?? 0, color: "text-emerald-400" },
          { label: "Complicaciones", value: stats?.with_complications_count ?? 0, color: "text-red-400" },
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/15 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-semibold text-white mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {financial && (financial.total_revenue > 0 || financial.pending_count > 0) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
            <p className="text-xs text-emerald-400/60 uppercase tracking-wider">Ingresos Totales</p>
            <p className="text-xl font-semibold text-emerald-400 mt-1">
              ${financial.total_revenue.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
            <p className="text-xs text-amber-400/60 uppercase tracking-wider">Pendiente</p>
            <p className="text-xl font-semibold text-amber-400 mt-1">
              ${financial.outstanding_balance.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white/5 border border-white/15 rounded-xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider">Pagadas</p>
            <p className="text-xl font-semibold text-white mt-1">{financial.paid_count}</p>
          </div>
          <div className="bg-white/5 border border-white/15 rounded-xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider">Promedio</p>
            <p className="text-xl font-semibold text-white mt-1">
              ${financial.avg_revenue_per_surgery.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Calendar className="w-4 h-4" />
          Filtros:
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40">Desde</label>
          <input
            type="date"
            style={{ colorScheme: "dark" }}
            className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40">Hasta</label>
          <input
            type="date"
            style={{ colorScheme: "dark" }}
            className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="flex gap-3 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
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
                          {new Date(surgery.scheduled_date).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })}
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
                  {(surgery.status === "completed" || surgery.status === "canceled" || surgery.status === "postponed") && (
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