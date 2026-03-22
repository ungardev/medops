import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChargeOrder } from "../../types/payments";
import { useChargeOrder } from "../../hooks/consultations/useChargeOrder";
import { apiFetch } from "../../api/client";
import type { DoctorService } from "../../types/services";
import ServiceSearchCombobox from "./ServiceSearchCombobox";
import { useInstitutions } from "../../hooks/settings/useInstitutions";
import { useQueryClient } from "@tanstack/react-query"; // ✅ NUEVO: Importar useQueryClient
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  TrashIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  ReceiptPercentIcon,
  ArrowRightIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
export type ChargeOrderPanelProps =
  | { appointmentId: number; readOnly?: boolean }
  | { chargeOrder: ChargeOrder; readOnly?: boolean };
function isAppointmentMode(props: ChargeOrderPanelProps): props is { appointmentId: number; readOnly?: boolean } {
  return (props as any).appointmentId !== undefined;
}
interface PendingItem {
  service: DoctorService;
  quantity: number;
}
const ChargeOrderPanel: React.FC<ChargeOrderPanelProps> = (props) => {
  const readOnly = props.readOnly ?? false;
  const navigate = useNavigate();
  const [order, setOrder] = useState<ChargeOrder | null>(null);
  const [showItems, setShowItems] = useState(true);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isSavingItems, setIsSavingItems] = useState(false);
  
  // ✅ NUEVO: Inicializar query client para invalidación de caché
  const queryClient = useQueryClient();
  
  // ⚠️ NUEVO: Obtener institución activa
  const { activeInstitution } = useInstitutions();
  
  const { data, isLoading, refetch } = isAppointmentMode(props)
    ? useChargeOrder(props.appointmentId)
    : { data: null, isLoading: false, refetch: async () => {} };
  useEffect(() => {
    if (!isAppointmentMode(props)) {
      setOrder(props.chargeOrder ?? null);
      return;
    }
    setOrder(data ?? null);
  }, [props, data]);
  // Validación de servicio activo y visible
  const handleSelectService = (service: DoctorService) => {
    if (!service.is_active || !service.is_visible_global) {
      alert("Este servicio no está disponible para facturación.");
      return;
    }
    
    // ⚠️ NUEVO: Validar que el servicio pertenezca a la institución activa
    if (activeInstitution && service.institution && service.institution !== activeInstitution.id) {
      alert(`Este servicio no pertenece a la institución activa: ${activeInstitution.name}`);
      return;
    }
    const existing = pendingItems.find(p => p.service.id === service.id);
    if (existing) {
      setPendingItems(pendingItems.map(p => 
        p.service.id === service.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setPendingItems([...pendingItems, { service: service, quantity: 1 }]);
    }
  };
  const MAX_QUANTITY = 100;
  const updatePendingQuantity = (serviceId: number, delta: number) => {
    setPendingItems(pendingItems.map(p => {
      if (p.service.id === serviceId) {
        const newQty = Math.max(1, Math.min(p.quantity + delta, MAX_QUANTITY));
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };
  const removePendingItem = (serviceId: number) => {
    setPendingItems(pendingItems.filter(p => p.service.id !== serviceId));
  };
  const pendingSubtotal = useMemo(() => {
    return pendingItems.reduce(
      (sum, p) => sum + (Number(p.service.price_usd) * p.quantity),
      0
    );
  }, [pendingItems]);
  const handleSavePendingItems = async () => {
    if (pendingItems.length === 0) return;
    if (!isAppointmentMode(props)) return;
    setIsSavingItems(true);
    try {
      const itemsPayload = pendingItems.map(p => ({
        service_id: p.service.id,
        qty: p.quantity,
      }));
      
      await apiFetch(`appointments/${props.appointmentId}/charge-order/add-items/`, {
        method: "POST",
        body: JSON.stringify({ items: itemsPayload }),
      });
      
      setPendingItems([]);
      void refetch();
      
      // ✅ FIX CRÍTICO: Invalidar query de la cita para actualizar modal inmediatamente
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    } catch (err) {
      console.error("Save_Items_Fault:", err);
      alert("Error al guardar los items. Por favor, intenta nuevamente.");
    } finally {
      setIsSavingItems(false);
    }
  };
  const handleDeleteItem = async (id: number) => {
    if (!confirm("Confirmar eliminación del ítem?")) return;
    try {
      await apiFetch(`charge-items/${id}/`, { method: "DELETE" });
      void refetch();
      
      // ✅ FIX CRÍTICO: Invalidar query de la cita para actualizar modal inmediatamente
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    } catch (err) { 
      console.error("Delete_Fault:", err); 
      alert("Error al eliminar el item.");
    }
  };
  const handleGoToPayments = () => {
    if (order?.id) {
      navigate(`/payments/${order.id}`);
    }
  };
  if (isAppointmentMode(props) && isLoading) return (
    <div className="animate-pulse h-20 bg-white/5 border border-[var(--palantir-border)]" />
  );
  const hasOrder = !!order;
  const hasBalance = hasOrder && Number(order.balance_due) > 0;
  const isPaid = hasOrder && !hasBalance;
  const hasItems = hasOrder && order.items && order.items.length > 0;
  return (
    <div className="space-y-4">
      {/* 01. RESUMEN FINANCIERO */}
      <div className={`relative overflow-hidden border p-3 ${
        !hasOrder ? 'border-white/10 bg-white/5' :
        isPaid ? 'border-emerald-500/30 bg-emerald-500/5' : 
        'border-amber-500/30 bg-amber-500/5'
      }`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Libro_Financiero</span>
          <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
            !hasOrder ? 'bg-white/10 text-white/60' :
            isPaid ? 'bg-emerald-500 text-black' : 
            'bg-amber-500 text-black'
          }`}>
            {!hasOrder ? 'SIN_ORDEN' : order.status}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[var(--palantir-muted)] font-mono uppercase">Total_Debido</p>
            <p className="text-lg font-black tracking-tighter">
              ${hasOrder ? Number(order.total || 0).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--palantir-muted)] font-mono uppercase italic">Balance_Rem</p>
            <p className={`text-lg font-black tracking-tighter ${
              !hasOrder ? 'text-white/40' :
              isPaid ? 'text-emerald-500' : 'text-amber-500'
            }`}>
              ${hasOrder ? Number(order.balance_due || 0).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>
      
      {/* 02. SECCIÓN DE ÍTEMS */}
      <div className="border border-[var(--palantir-border)] bg-black/20 overflow-hidden">
        <button 
          onClick={() => setShowItems(!showItems)}
          className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ReceiptPercentIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Items_Facturacion</span>
            {hasItems && (
              <span className="text-[8px] font-mono text-[var(--palantir-muted)]">({order.items!.length})</span>
            )}
          </div>
          {showItems ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>
        
        {showItems && (
          <div className="p-3 space-y-3 border-t border-[var(--palantir-border)]">
            {/* ⚠️ NUEVO: Indicador de Institución Activa */}
            {activeInstitution && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-sm w-fit">
                <BuildingOfficeIcon className="w-3 h-3 text-purple-400" />
                <span className="text-[8px] font-mono text-purple-300 uppercase tracking-[0.2em]">
                  {activeInstitution.name}
                </span>
              </div>
            )}
            {!readOnly && (
              <>
                {/* BUSCADOR DE CATÁLOGO */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">
                    Agregar_Servicio_Catalogo
                  </label>
                  <ServiceSearchCombobox onSelect={handleSelectService} />
                </div>
                
                {/* ÍTEMS PENDIENTES */}
                {pendingItems.length > 0 && (
                  <div className="space-y-2 border border-[var(--palantir-active)]/30 bg-[var(--palantir-active)]/5 p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--palantir-active)]">
                        Items_Pendientes
                      </span>
                      <span className="text-[10px] font-mono font-black">
                        Subtotal: ${pendingSubtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {pendingItems.map((p) => (
                        <div key={p.service.id} className="flex items-center justify-between p-2 bg-black/30 border border-white/5 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate uppercase">{p.service.name}</p>
                            <p className="text-[8px] font-mono text-[var(--palantir-muted)]">
                              [{p.service.code}] ${Number(p.service.price_usd).toFixed(2)} c/u
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-black/40 border border-[var(--palantir-border)]">
                              <button
                                type="button"
                                onClick={() => updatePendingQuantity(p.service.id, -1)}
                                className="p-1 hover:bg-white/10"
                              >
                                <MinusIcon className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-[10px] font-mono font-black min-w-[24px] text-center">
                                {p.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updatePendingQuantity(p.service.id, 1)}
                                className="p-1 hover:bg-white/10"
                              >
                                <PlusIcon className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <span className="text-[10px] font-black font-mono w-16 text-right">
                              ${(Number(p.service.price_usd) * p.quantity).toFixed(2)}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => removePendingItem(p.service.id)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                            >
                              <XMarkIcon className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSavePendingItems}
                      disabled={isSavingItems}
                      className="w-full bg-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/80 text-black py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                      {isSavingItems ? "Guardando..." : "Agregar_a_Orden"}
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* ÍTEMS GUARDADOS EN LA ORDEN */}
            <div className="space-y-1">
              {hasItems ? (
                order.items!.map((it) => (
                  <div key={it.id} className="group flex items-center justify-between p-2 bg-white/5 border border-transparent hover:border-[var(--palantir-border)] transition-all">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold truncate uppercase">{it.description}</p>
                      <p className="text-[8px] font-mono text-[var(--palantir-muted)] italic">
                        {it.code} // {it.qty}u × ${Number(it.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black font-mono">${Number(it.subtotal).toFixed(2)}</span>
                      {!readOnly && (
                        <button 
                          onClick={() => handleDeleteItem(it.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20"
                        >
                          <TrashIcon className="w-3 h-3 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-[10px] font-mono text-[var(--palantir-muted)]">
                  {readOnly ? "Sin items en la orden" : "Busca servicios para agregar a la orden"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 03. BOTÓN NAVEGAR A PAGOS */}
      {!readOnly && hasItems && (
        <button
          onClick={handleGoToPayments}
          className="w-full flex items-center justify-between p-3 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all group"
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            Gestionar_Pagos
          </span>
          <div className="flex items-center gap-2">
            {hasBalance && (
              <span className="text-[9px] font-mono">
                ${Number(order!.balance_due).toFixed(2)} pendiente
              </span>
            )}
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
    </div>
  );
};
export default ChargeOrderPanel;