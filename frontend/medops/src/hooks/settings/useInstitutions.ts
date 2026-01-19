import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { InstitutionSettings } from "@/types/config";
export function useInstitutions() {
  const queryClient = useQueryClient();
  
  // State para override temporal en localStorage
  const [localActiveId, setLocalActiveId] = useState<number | null>(() => {
    const saved = localStorage.getItem("active_institution_id");
    return saved ? parseInt(saved) : null;
  });
  // Query para obtener todas las instituciones
  const query = useQuery<InstitutionSettings[]>({
    queryKey: ["config", "institutions"],
    queryFn: async () => {
      const res = await api.get<InstitutionSettings[]>("config/institutions/");
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  // Query para obtener institución activa del backend
  const activeQuery = useQuery<InstitutionSettings | null>({
    queryKey: ["config", "institution", "active"],
    queryFn: async () => {
      const res = await api.get<InstitutionSettings>("config/institution/");
      return res.data || null;
    },
    staleTime: 1000 * 60 * 5,
  });
  // Mutation para crear institución
  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (data.logo instanceof File) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        });
        
        const res = await api.post<InstitutionSettings>("config/institutions/create/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      }
      
      const res = await api.post<InstitutionSettings>("config/institutions/create/", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config", "institutions"], (old: any) => [...(old || []), data]);
      
      const currentList = queryClient.getQueryData(["config", "institutions"]) as InstitutionSettings[] | undefined;
      if (currentList && currentList.length === 1) {
        if (data.id !== undefined) {
          handleSetActiveInstitution(data.id);
        }
      }
    },
  });
  // Mutation para agregar institución existente
  const addMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post<InstitutionSettings>("config/institutions/add/", {
        institution_id: id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "institutions"] });
    },
  });
  // Mutation para eliminar institución
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`config/institutions//delete/`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(["config", "institutions"], (old: any) => 
        (old || []).filter((inst: InstitutionSettings) => inst.id !== deletedId)
      );
      
      if (localActiveId === deletedId) {
        const currentList = queryClient.getQueryData(["config", "institutions"]) as InstitutionSettings[] | undefined;
        const next = currentList?.find((inst: InstitutionSettings) => inst.id !== deletedId);
        if (next && next.id !== undefined) {
          handleSetActiveInstitution(next.id);
        }
      }
    },
  });
  // Mutation para cambiar institución activa
  const setActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      localStorage.setItem("active_institution_id", String(id));
      setLocalActiveId(id);
      
      await api.put(`config/institutions//set-active/`);
      
      api.defaults.headers.common["X-Institution-ID"] = String(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "institution", "active"] });
    },
  });
  // Función para obtener institución activa actual
  const getActiveInstitution = (): InstitutionSettings | null => {
    if (localActiveId) {
      const found = query.data?.find((inst: InstitutionSettings) => inst.id === localActiveId);
      if (found) return found;
    }
    
    if (activeQuery.data) return activeQuery.data;
    
    return query.data?.[0] || null;
  };
  // Función para cambiar institución activa
  const handleSetActiveInstitution = async (id: number): Promise<void> => {
    await setActiveMutation.mutateAsync(id);
  };
  return {
    ...query,
    institutions: query.data || [],
    activeInstitution: getActiveInstitution(),
    getActiveInstitution,
    setActiveInstitution: handleSetActiveInstitution,
    createInstitution: createMutation.mutateAsync,
    addInstitution: addMutation.mutateAsync,
    deleteInstitution: deleteMutation.mutateAsync,
    isLoading: query.isLoading,
    isCreating: createMutation.isPending,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingActive: setActiveMutation.isPending,
    error: query.error?.message || null,
  };
}