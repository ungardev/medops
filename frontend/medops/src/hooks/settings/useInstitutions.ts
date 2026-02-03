// src/hooks/settings/useInstitutions.ts
import { useState, useEffect } from "react";
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
  
  // Efecto para sincronizar cambios en localStorage con estado local
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("active_institution_id");
      const newId = saved ? parseInt(saved) : null;
      
      if (newId !== localActiveId) {
        setLocalActiveId(newId);
      }
    };
    // Escuchar cambios en localStorage (para sincronización entre pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar inmediatamente por si hay cambios externos
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [localActiveId]);
  
  // Query para obtener todas las instituciones
  const query = useQuery<InstitutionSettings[]>({
    queryKey: ["config", "institutions"],
    queryFn: async () => {
      const res = await api.get<InstitutionSettings[]>("config/institutions/");
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
  
  // Query para obtener institución activa del backend - optimizado
  const activeQuery = useQuery<InstitutionSettings | null>({
    queryKey: ["config", "institution", "active"],
    queryFn: async () => {
      const res = await api.get<InstitutionSettings>("config/institution/");
      return res.data || null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: false, // Deshabilitado, se activará según sea necesario
  });
  
  // Función para cambiar institución activa - MOVIDA ANTES para evitar hoisting issues
  const handleSetActiveInstitution = async (id: number): Promise<void> => {
    await setActiveMutation.mutateAsync(id);
  };
  
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
      await api.delete(`config/institutions/delete/`);
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
  
  // Mutation para cambiar institución activa - ahora acepta number | undefined
  const setActiveMutation = useMutation({
    mutationFn: async (id: number | undefined) => {
      if (id === undefined || id === null) {
        localStorage.removeItem("active_institution_id");
        setLocalActiveId(null);
        await api.put(`config/institution/clear-active/`);
        return;
      }
      
      localStorage.setItem("active_institution_id", String(id));
      setLocalActiveId(id);
      
      await api.put(`config/institution/set-active/`, { institution: id });
      api.defaults.headers.common["X-Institution-ID"] = String(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config", "institution", "active"] });
    },
  });
  
  // ✅ MEJORADA: Función robusta para obtener institución activa actual
  const getActiveInstitution = (): InstitutionSettings | null => {
    // 1. Prioridad 1: localStorage (persistencia del usuario)
    if (localActiveId) {
      const found = query.data?.find((inst: InstitutionSettings) => inst.id === localActiveId);
      if (found) return found;
    }
    
    // 2. Prioridad 2: backend activeQuery (estado del servidor)
    if (activeQuery.data && activeQuery.data.id !== undefined) {
      // Guardar en localStorage para persistencia
      localStorage.setItem("active_institution_id", String(activeQuery.data.id));
      setLocalActiveId(activeQuery.data.id);
      return activeQuery.data;
    }
    
    // 3. Prioridad 3: Primera institución disponible (auto-activación)
    if (query.data && query.data.length > 0) {
      const firstInstitution = query.data[0];
      if (firstInstitution.id !== undefined) {
        // ✅ CORREGIDO: Type guard explícito para satisfacer TypeScript
        const institutionId: number = firstInstitution.id;
        setTimeout(() => {
          handleSetActiveInstitution(institutionId);
        }, 0);
        return firstInstitution;
      }
    }
    
    return null;
  };
  
  // Efecto simplificado - sin dependencias problemáticas
  useEffect(() => {
    // La lógica de auto-activación está en getActiveInstitution()
    // No necesitamos refetch manual aquí
  }, []);
  
  return {
    ...query,
    institutions: query.data || [],
    activeInstitution: getActiveInstitution(),
    getActiveInstitution,
    createInstitution: createMutation.mutateAsync,
    addInstitution: addMutation.mutateAsync,
    deleteInstitution: deleteMutation.mutateAsync,
    setActiveInstitution: handleSetActiveInstitution,
    isCreating: createMutation.isPending,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingActive: setActiveMutation.isPending,
    isLoading: query.isLoading,
    error: query.error?.message || null,
  };
}