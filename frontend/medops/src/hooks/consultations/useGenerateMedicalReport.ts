import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import MedicalReportSuccessToast from "../../components/Common/MedicalReportSuccessToast";
import { apiFetch } from "../../api/client";

const API_BASE = import.meta.env.VITE_API_URL;

interface GenerateReportSuccess {
  file_url: string;
  audit_code: string;
}

export function useGenerateMedicalReport(): UseMutationResult<GenerateReportSuccess, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<GenerateReportSuccess, Error, number>({
    mutationFn: async (appointmentId: number): Promise<GenerateReportSuccess> => {
      const token = localStorage.getItem("doctor_access_token") || "";
      const activeInstitutionId = localStorage.getItem("active_institution_id");
      
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(activeInstitutionId ? { "X-Institution-ID": activeInstitutionId } : {}),
      };
      
      const response = await fetch(
        `${API_BASE}/consultations/${appointmentId}/generate-report/`,
        {
          method: "POST",
          headers,
        }
      );
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medical_report_${appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { file_url: url, audit_code: "" };
    },
    onMutate: () => {
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-in fade-in slide-in-from-right-5' : 'animate-out fade-out slide-out-to-right-5'} max-w-md w-full bg-[#1a1a1b] shadow-2xl pointer-events-auto flex ring-1 ring-white/15 rounded-lg border-l-4 border-l-blue-500/50`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="ml-3 flex-1">
                <p className="mt-1 text-[12px] font-medium text-white/80">
                  Generando informe médico...
                </p>
              </div>
            </div>
          </div>
        </div>
      ), { duration: Infinity });
    },
    onSuccess: () => {
      toast.dismiss();
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["patient-documents"] });
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-in fade-in slide-in-from-right-5' : 'animate-out fade-out slide-out-to-right-5'} max-w-md w-full bg-[#1a1a1b] shadow-2xl pointer-events-auto flex ring-1 ring-white/15 rounded-lg border-l-4 border-l-emerald-500/50`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <span className="text-emerald-400 text-lg">✓</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="mt-1 text-[12px] font-medium text-white/80">
                  Informe médico generado y descargado
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-white/10">
            <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      ), { duration: 4000 });
    },
    onError: (error) => {
      toast.dismiss();
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-in fade-in slide-in-from-right-5' : 'animate-out fade-out slide-out-to-right-5'} max-w-md w-full bg-[#1a1a1b] shadow-2xl pointer-events-auto flex ring-1 ring-white/15 rounded-lg border-l-4 border-l-red-500/50`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <span className="text-red-400 text-lg">✕</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="mt-1 text-[12px] font-medium text-white/80">
                  Error: {error.message || "No se pudo generar el informe"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-white/10">
            <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      ), { duration: 4000 });
    },
  });
}