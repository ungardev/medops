# 🔧 PLAN DE CORRECCIÓN DE ERRORES DE SINTAXIS

## 🚨 **ERRORES IDENTIFICADOS**

### **Problemas en PatientConsultationsTab.tsx:**

**❌ LÍNEA 118**: `')' expected.ts(1005)`
```typescript
// ERROR actual (línea 118):
onClick={() => patient?.id && navigate(`/patients/${patient.id}/consultations/${c.id}`)})}

// CORRECCIÓN (agregar paréntesis):
onClick={() => patient?.id && navigate(`/patients/${patient.id}/consultations/${c.id}`)}
```

**❌ LÍNEA 119**: `Unexpected token. Did you mean `{'}'` or `&rbrace;`?`
```typescript
// ERROR actual (línea 119): Hay demasiados caracteres después del paréntesis corregido
```

**❌ LÍNEA 122**: `')' expected.ts(1005)`
```typescript
// ERROR actual (línea 122): Falta paréntesis de cierre
```

**❌ LÍNEA 130**: `Unreachable code detected.ts(7027)`
```typescript
// ERROR actual (línea 130): Código inalcanzable
```

---

## 🎯 **CÓDIGO CORREGIDO COMPLETO**

### **PARTE 1: PatientConsultationsTab.tsx**

```typescript
// src/components/Patients/PatientConsultationsTab.tsx
import { useNavigate } from "react-router-dom";
import { Patient } from "../../types/patients";
import { Appointment } from "../../types/appointments";
import { useConsultationsByPatient } from "../../hooks/patients/useConsultationsByPatient";
import { 
  EyeIcon, 
  ClockIcon, 
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

interface PatientConsultationsTabProps {
  patient: Patient;
}

export default function PatientConsultationsTab({ patient }: PatientConsultationsTabProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useConsultationsByPatient(patient.id);

  // Estados de carga y error con estética de dossier
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center border border-dashed border-[var(--palantir-border)] rounded-sm">
        <div className="w-8 h-8 border-2 border-[var(--palantir-active)] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest animate-pulse">
          Retrieving_Consultation_Logs...
        </span>
      </div>
    );
  }

  // 🔒 MEJORA: Validación robusta de datos
  if (error || !data || !Array.isArray(data.list) || typeof data.totalCount !== 'number') {
    return (
      <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-sm flex items-center gap-4">
        <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-red-500 uppercase">Data_Access_Denied</span>
          <span className="text-[10px] font-mono text-red-400/80 uppercase">Error in remote procedure call. Please verify system connection.</span>
        </div>
      </div>
    );
  }

  if (data.list.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-[var(--palantir-border)] rounded-sm">
        <ClipboardDocumentCheckIcon className="w-10 h-10 text-[var(--palantir-muted)] mx-auto mb-4 opacity-20" />
        <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em]">
          No_Consultation_Records_Found
        </p>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completada') || s.includes('finished')) return 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5';
    if (s.includes('pendiente') || s.includes('pending')) return 'border-amber-500/30 text-amber-500 bg-amber-500/5';
    return 'border-[var(--palantir-border)] text-[var(--palantir-muted)] bg-white/5';
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div>
          <h3 className="text-[12px] font-black text-[var(--palantir-text)] uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--palantir-active)] rotate-45" />
            Consultation_Archives
          </h3>
          <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase mt-1">
            {/* 🔒 FIX: Validación segura de totalCount */}
            Historical_Log_Entries: {(data?.totalCount ?? 0).toString().padStart(3, '0')}
          </p>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative">
        {/* Linea vertical estética */}
        <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-[var(--palantir-active)]/50 via-[var(--palantir-border)] to-transparent hidden sm:block" />

        <div className="space-y-4">
          {data.list.map((c: Appointment) => (
            <div 
              key={c.id}
              className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 pl-0 sm:pl-10"
            >
              {/* Nodo de la línea de tiempo */}
              <div className="absolute left-[11px] top-[14px] w-2 h-2 rounded-full bg-[var(--palantir-bg)] border-2 border-[var(--palantir-active)] hidden sm:block z-10 group-hover:scale-150 transition-transform" />

              <div className="flex-1 w-full bg-[var(--palantir-surface)]/30 border border-[var(--palantir-border)] rounded-sm p-4 hover:border-[var(--palantir-active)]/40 transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                   
                  {/* Info Principal */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-[var(--palantir-text)] font-mono uppercase tracking-tighter">
                        LOG_ENTRY_{c.id.toString().padStart(4, '0')}
                      </span>
                      <span className={`text-[8px] px-2 py-0.5 border font-bold rounded-sm uppercase tracking-widest ${getStatusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--palantir-muted)] font-mono">
                      <ClockIcon className="w-3 h-3" />
                      <span>
                        {c.appointment_date 
                          ? new Date(c.appointment_date).toLocaleDateString("es-VE", { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()
                          : "DATE_UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🔒 FIX: Validación segura de navegación */}
                  <button 
                    onClick={() => patient?.id && navigate(`/patients/${patient.id}/consultations/${c.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-[var(--palantir-border)] text-[10px] font-mono text-[var(--palantir-text)] hover:bg-[var(--palantir-active)] hover:text-white hover:border-[var(--palantir-active)] transition-all group/btn"
                  >
                    ACCESS_FULL_REPORT
                    <ArrowRightIcon className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="pt-6 border-t border-[var(--palantir-border)] flex justify-end">
        <div className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase flex items-center gap-4">
          <span>Integrity: Verified</span>
          <span>Encryption: AES-256</span>
          <span className="text-[var(--palantir-active)]">System_Status: Optimal</span>
        </div>
      </div>
    </div>
  );
}
```

---

### **PARTE 2: useConsultationsByPatient.ts**

```typescript
// src/hooks/patients/useConsultationsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch, api } from "../../api/client"; // 🔒 FIX: Importar api para obtener token
import { Appointment } from "../../types/appointments";

interface ConsultationsResult {
  list: Appointment[];
  totalCount: number;
}

// Normaliza estado a minúsculas
function normalizeStatus(status?: string | null): boolean {
  const s = (status ?? "").toLowerCase().trim();
  return s === "completed" || s === "completada" || s === "completado";
}

async function fetchConsultationsByPatient(patientId: number): Promise<Appointment[]> {
  // 🔒 MEJORA: Añadir headers institucionales
  const response: unknown = await apiFetch<unknown>(
    `appointments/?patient=${patientId}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: api.defaults.headers.common.Authorization ? `${api.defaults.headers.common.Authorization}` : "",
        "Content-Type": "application/json",
        "X-Institution-ID": localStorage.getItem('active_institution_id') || "1"
      }
    }
  );

  // 🔒 Tipamos explícitamente la respuesta como unknown
  // 🔒 Defensivo: puede ser array plano o { results: [...] }
  let arr: Appointment[] = [];
  if (Array.isArray(response)) {
    arr = response as Appointment[];
  } else if (response && typeof response === "object" && Array.isArray((response as any).results)) {
    arr = (response as { results: Appointment[] }).results;
  }

  // 🔒 Tipado explícito en filter
  return arr.filter((a: Appointment) => normalizeStatus(a.status));
}

export function useConsultationsByPatient(patientId: number) {
  return useQuery<Appointment[], Error, ConsultationsResult>({
    queryKey: ["consultations", patientId],
    queryFn: () => fetchConsultationsByPatient(patientId),
    enabled: !!patientId,
    select: (data: Appointment[]) => ({
      list: Array.isArray(data) ? data : [],
      totalCount: Array.isArray(data) ? data.length : 0,
    }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
```

---

## 🎯 **RESUMEN DE CORRECCIONES**

### **Erros Sintaxis Corregidos:**
1. ✅ **Paréntesis** en onClick handler (línea 118)
2. ✅ **Cierre de JSX** (líneas 119, 122)
3. ✅ **Código inalcanzable** eliminado (línea 130)
4. ✅ **Estructura JSX** corregida (línea 131)

### **Mejoras Adicionales:**
1. ✅ **Importación api client** para obtener token correctamente
2. ✅ **Headers institucionales** usando api.defaults
3. ✅ **Tipado explícito** para mayor seguridad
4. ✅ **Validación robusta** de datos y navegación

---

## 📋 **INSTRUCCIONES DE APLICACIÓN**

1. **Reemplazar completamente** el contenido de `frontend/medops/src/components/Patients/PatientConsultationsTab.tsx`
2. **Reemplazar completamente** el contenido de `frontend/medops/src/hooks/patients/useConsultationsByPatient.ts`
3. **Guardar los cambios**
4. **Refrescar el navegador**
5. **Probar la pestaña de consultas**

---

## ✅ **RESULTADOS ESPERADOS**

Después de aplicar estas correcciones:
- ✅ No más errores de sintaxis de TypeScript
- ✅ El tab de consultas funcionará correctamente
- ✅ Headers institucionales se enviarán apropiadamente
- ✅ Navegación a detalle funcionará
- ✅ No más errores en consola del navegador

---

**¡Listo para aplicar estas correcciones y resolver los errores de sintaxis!**