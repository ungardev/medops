// src/pages/Hospitalization/Hospitalization.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import type { Hospitalization } from "@/types/patients";
import HospitalizationsModal from "@/components/Patients/HospitalizationsModal";
import PatientSearchModal from "@/components/Common/PatientSearchModal";
import HospitalizationDetailDrawer from "@/components/Patients/HospitalizationDetailDrawer";
import { toast } from "react-hot-toast";
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
  X,
  Eye,
  Pencil,
  User,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface HospitalizationStats {
  total: number;
  by_status: {
    admitted: number;
    stable: number;
    critical: number;
    improving: number;
    awaiting_discharge: number;
    discharged: number;
    transferred: number;
    deceased: number;
  };
  current_inpatients: number;
  critical: number;
  discharged_today: number;
  discharged_this_week: number;
  avg_length_of_stay_days: number | null;
  overdue_discharges: number;
  with_complications_count: number;
  by_admission_type: Record<string, number>;
  by_ward: Record<string, number>;
  by_attending_doctor: Record<string, number>;
}

const statusColors: Record<string, string> = {
  admitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  stable: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  critical: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
  improving: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  awaiting_discharge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  discharged: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  transferred: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deceased: "bg-red-900/20 text-red-500 border-red-900/30",
};

export default function Hospitalization() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
  const [editingHosp, setEditingHosp] = useState<Hospitalization | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedHospitalization, setSelectedHospitalization] = useState<Hospitalization | undefined>(undefined);

  const { data: stats } = useQuery<HospitalizationStats>({
    queryKey: ["hospitalization-stats"],
    queryFn: async () => {
      const { data } = await api.get("/hospitalizations/stats/");
      return data as HospitalizationStats;
    },
  });

  const { data: hospitalizations, isLoading, refetch } = useQuery<Hospitalization[]>({
    queryKey: ["hospitalizations", activeTab, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      const queryString = params.toString();
      const response = await api.get<any>(`/hospitalizations/${queryString ? `?${queryString}` : ""}`);
      return (response.data.results || response.data) as Hospitalization[];
    },
  });

  const handleSaveHospitalization = async (payload: any) => {
    try {
      if (editingHosp) {
        await api.patch(`/hospitalizations/${editingHosp.id}/`, payload);
      } else {
        await api.post("/hospitalizations/", payload);
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ["hospitalization-stats"] });
    } catch (err) {
      console.error("Error saving hospitalization:", err);
    }
  };

  const dischargeMutation = useMutation({
    mutationFn: async (hospId: number) => {
      const { data } = await api.patch(`/hospitalizations/${hospId}/`, { status: "discharged" });
      return data;
    },
    onSuccess: () => {
      toast.success("Paciente dado de alta correctamente");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["hospitalization-stats"] });
    },
    onError: () => toast.error("Error al dar de alta al paciente"),
  });

  const transferMutation = useMutation({
    mutationFn: async (hospId: number) => {
      const { data } = await api.patch(`/hospitalizations/${hospId}/`, { status: "transferred" });
      return data;
    },
    onSuccess: () => {
      toast.success("Paciente transferido correctamente");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["hospitalization-stats"] });
    },
    onError: () => toast.error("Error al transferir al paciente"),
  });

  const criticalMutation = useMutation({
    mutationFn: async (hospId: number) => {
      const { data } = await api.patch(`/hospitalizations/${hospId}/`, { status: "critical" });
      return data;
    },
    onSuccess: () => {
      toast.success("Paciente marcado como crítico");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["hospitalization-stats"] });
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const stableMutation = useMutation({
    mutationFn: async (hospId: number) => {
      const { data } = await api.patch(`/hospitalizations/${hospId}/`, { status: "stable" });
      return data;
    },
    onSuccess: () => {
      toast.success("Paciente marcado como estable");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["hospitalization-stats"] });
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const improveMutation = useMutation({
    mutationFn: async (hospId: number) => {
      const { data } = await api.patch(`/hospitalizations/${hospId}/`, { status: "improving" });
      return data;
    },
    onSuccess: () => {
      toast.success("Paciente marcado en mejora");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["hospitalization-stats"] });
    },
    onError: () => toast.error("Error al cambiar estado"),
  });

  const byStatus = stats?.by_status;

  const statsCards = [
    { label: "Hospitalizados", value: stats?.current_inpatients ?? 0, icon: Bed, color: "text-blue-400" },
    { label: "Críticos", value: byStatus?.critical ?? 0, icon: AlertTriangle, color: "text-red-400" },
    { label: "Estables", value: byStatus?.stable ?? 0, icon: CheckCircle, color: "text-emerald-400" },
    { label: "En Mejoría", value: byStatus?.improving ?? 0, icon: ArrowUp, color: "text-amber-400" },
    { label: "Altas Hoy", value: stats?.discharged_today ?? 0, icon: LogOut, color: "text-purple-400" },
    { label: "Esta Semana", value: stats?.discharged_this_week ?? 0, icon: Calendar, color: "text-cyan-400" },
    { label: "Prom. Estancia", value: stats?.avg_length_of_stay_days ? `${stats.avg_length_of_stay_days}d` : "—", icon: Clock, color: "text-white/60" },
    { label: "Altas Vencidas", value: stats?.overdue_discharges ?? 0, icon: AlertTriangle, color: stats?.overdue_discharges ? "text-red-400" : "text-white/30" },
  ];

  const tabs = [
    { key: "all", label: "Todos" },
    { key: "admitted", label: "Admitidos" },
    { key: "stable", label: "Estables" },
    { key: "critical", label: "Críticos" },
    { key: "improving", label: "En Mejoría" },
    { key: "awaiting_discharge", label: "Esperando Alta" },
    { key: "discharged", label: "Dados de Alta" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Hospitalización", active: true },
        ]}
        stats={[
          { label: "Hospitalizados", value: stats?.current_inpatients ?? 0, color: "text-blue-400" },
          { label: "Críticos", value: byStatus?.critical ?? 0, color: "text-red-400" },
          { label: "Altas Hoy", value: stats?.discharged_today ?? 0, color: "text-emerald-400" },
          { label: "Complicaciones", value: stats?.with_complications_count ?? 0, color: "text-red-400" },
        ]}
        actions={
          <button
            onClick={() => setPatientSearchOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-sm font-medium rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Admisión
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className={`bg-white/5 border rounded-xl p-4 ${stat.label === "Críticos" && typeof stat.value === "number" && stat.value > 0 ? "border-red-500/30 bg-red-500/5" : "border-white/15"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${stat.label === "Críticos" && typeof stat.value === "number" && stat.value > 0 ? "text-red-400" : "text-white"}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

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
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-emerald-400 hover:text-emerald-300">
            Limpiar
          </button>
        )}
      </div>

      <div className="flex gap-3 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
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
            <p className="text-sm text-white/30 mt-4">Cargando hospitalizaciones...</p>
          </div>
        ) : !hospitalizations || hospitalizations.length === 0 ? (
          <div className="p-24 text-center">
            <Bed className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-white/30">No hay hospitalizaciones activas</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {hospitalizations.map((hosp: Hospitalization) => (
              <div key={hosp.id} className={`px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-colors ${hosp.status === "critical" ? "border-l-2 border-red-500" : ""}`}>
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="mt-1">
                    <Bed className="w-5 h-5 text-white/30" />
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
                    <p className="text-base font-medium text-white/80 truncate">{hosp.patient_name}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-white/40">
                      <span className="flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4" />
                        {hosp.attending_doctor_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4" />
                        {hosp.ward} - Cama {hosp.bed_number}
                        {hosp.room_number && ` / Hab. ${hosp.room_number}`}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Ingreso: {new Date(hosp.admission_date).toLocaleDateString("es-VE", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {hosp.status && (
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border ${statusColors[hosp.status] || "bg-white/5 text-white/40 border-white/10"}`}>
                          {hosp.status_display}
                        </span>
                      )}
                      {hosp.length_of_stay !== undefined && (
                        <span className="text-sm text-white/30">
                          {hosp.length_of_stay} {hosp.length_of_stay === 1 ? "día" : "días"} de estancia
                        </span>
                      )}
                      {hosp.admission_diagnosis_title && (
                        <span className="text-sm text-white/30">Dx: {hosp.admission_diagnosis_title}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hosp.status === "admitted" && (
                    <>
                      <button
                        onClick={() => criticalMutation.mutate(hosp.id)}
                        disabled={criticalMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Marcar como crítico"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Crítico
                      </button>
                      <button
                        onClick={() => improveMutation.mutate(hosp.id)}
                        disabled={improveMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Marcar en mejora"
                      >
                        <ArrowUp className="w-4 h-4" />
                        Mejorar
                      </button>
                      <button
                        onClick={() => { setSelectedHospitalization(hosp); setDetailDrawerOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => { setEditingHosp(hosp); setModalOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                    </>
                  )}
                  {hosp.status === "critical" && (
                    <>
                      <button
                        onClick={() => stableMutation.mutate(hosp.id)}
                        disabled={stableMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Estabilizar"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Estabilizar
                      </button>
                      <button
                        onClick={() => { setSelectedHospitalization(hosp); setDetailDrawerOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                    </>
                  )}
                  {(hosp.status === "stable" || hosp.status === "improving") && (
                    <>
                      <button
                        onClick={() => improveMutation.mutate(hosp.id)}
                        disabled={improveMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <ArrowUp className="w-4 h-4" />
                        Mejorar
                      </button>
                      <button
                        onClick={() => dischargeMutation.mutate(hosp.id)}
                        disabled={dischargeMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        title="Dar de alta"
                      >
                        <LogOut className="w-4 h-4" />
                        Alta
                      </button>
                      <button
                        onClick={() => { setSelectedHospitalization(hosp); setDetailDrawerOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => { setEditingHosp(hosp); setModalOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                    </>
                  )}
                  {hosp.status === "awaiting_discharge" && (
                    <>
                      <button
                        onClick={() => dischargeMutation.mutate(hosp.id)}
                        disabled={dischargeMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Confirmar Alta
                      </button>
                      <button
                        onClick={() => { setSelectedHospitalization(hosp); setDetailDrawerOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => { setEditingHosp(hosp); setModalOpen(true); }}
                        className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                    </>
                  )}
                  {hosp.status === "discharged" && (
                    <button
                      onClick={() => { setSelectedHospitalization(hosp); setDetailDrawerOpen(true); }}
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
      <HospitalizationDetailDrawer
        open={detailDrawerOpen}
        onClose={() => { setDetailDrawerOpen(false); setSelectedHospitalization(undefined); }}
        hospitalization={selectedHospitalization}
        onEdit={(hosp) => {
          setDetailDrawerOpen(false);
          setEditingHosp(hosp);
          setSelectedPatientId((hosp as any).patient || 0);
          setModalOpen(true);
        }}
      />
    </div>
  );
}