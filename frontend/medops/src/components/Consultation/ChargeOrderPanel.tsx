// src/components/Consultation/ChargeOrderPanel.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChargeOrder } from "../../types/payments";
import { useChargeOrder } from "../../hooks/consultations/useChargeOrder";
import { apiFetch } from "../../api/client";
import type { DoctorService } from "../../types/services";
import ServiceSearchCombobox from "./ServiceSearchCombobox";
import { useInstitutions } from "../../hooks/settings/useInstitutions";
import { useQueryClient } from "@tanstack/react-query";
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
  
  const queryClient = useQueryClient();
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
  const handleSelectService = (service: DoctorService) => {
    if (!service.is_active || !service.is_visible_global) {
      alert("Este servicio no está disponible para facturación.");
      return;
    }
    
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
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    } catch (err) {
      console.error("Error al guardar items:", err);
      alert("Error al guardar los items. Por favor, intenta nuevamente.");
    } finally {
      setIsSavingItems(false);
    }
  };
  const handleDeleteItem = async (id: number) => {
    if (!confirm("¿Confirmar eliminación del ítem?")) return;
    try {
      await apiFetch(`charge-items/${id}/`, { method: "DELETE" });
      void refetch();
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    } catch (err) { 
      console.error("Error al eliminar:", err); 
      alert("Error al eliminar el item.");
    }
  };
  const handleGoToPayments = () => {
    if (order?.id) {
      navigate(`/payments/${order.id}`);
    }
  };
  if (isAppointmentMode(props) && isLoading) return (
    <div className="animate-pulse h-24 bg-white/5 border border-white/15 rounded-lg" />
  );
  const hasOrder = !!order;
  const hasBalance = hasOrder && Number(order.balance_due) > 0;
  const isPaid = hasOrder && !hasBalance;
  const hasItems = hasOrder && order.items && order.items.length > 0;
  return (
    <div className="space-y-4">
      {/* Resumen Financiero */}
      <div className={`relative overflow-hidden border p-5 rounded-lg ${
        !hasOrder ? 'border-white/15 bg-white/5' :
        isPaid ? 'border-emerald-500/25 bg-emerald-500/5' : 
        'border-amber-500/25 bg-amber-500/5'
      }`}>
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Resumen Financiero</span>
          <div className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase ${
            !hasOrder ? 'bg-white/10 text-white/60' :
            isPaid ? 'bg-emerald-500/15 text-emerald-400' : 
            'bg-amber-500/15 text-amber-400'
          }`}>
            {!hasOrder ? 'Sin Orden' : isPaid ? 'Pagado' : 'Pendiente'}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-white/50 uppercase">Total</p>
            <p className="text-xl font-semibold mt-0.5">
              ${hasOrder ? Number(order.total || 0).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase">Balance Pendiente</p>
            <p className={`text-xl font-semibold mt-0.5 ${
              !hasOrder ? 'text-white/30' :
              isPaid ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              ${hasOrder ? Number(order.balance_due || 0).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Sección de Ítems */}
      <div className="border border-white/15 bg-white/5 overflow-hidden rounded-lg">
        <button 
          onClick={() => setShowItems(!showItems)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ReceiptPercentIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-[12px] font-semibold text-white">Servicios y Facturación</span>
            {hasItems && (
              <span className="text-[10px] text-white/50">({order.items!.length})</span>
            )}
          </div>
          {showItems ? <ChevronDownIcon className="w-5 h-5 text-white/50" /> : <ChevronRightIcon className="w-5 h-5 text-white/50" />}
        </button>
        
        {showItems && (
          <div className="p-5 space-y-4 border-t border-white/15">
            {activeInstitution && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg w-fit">
                <BuildingOfficeIcon className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-medium text-purple-300">
                  {activeInstitution.name}
                </span>
              </div>
            )}
            {!readOnly && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
                    Agregar Servicio
                  </label>
                  <ServiceSearchCombobox onSelect={handleSelectService} />
                </div>
                
                {pendingItems.length > 0 && (
                  <div className="space-y-3 border border-emerald-500/25 bg-emerald-500/5 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
                        Ítems Pendientes
                      </span>
                      <span className="text-[12px] font-semibold">
                        Subtotal: ${pendingSubtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {pendingItems.map((p) => (
                        <div key={p.service.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 group rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">{p.service.name}</p>
                            <p className="text-[9px] text-white/50 mt-0.5">
                              [{p.service.code}] ${Number(p.service.price_usd).toFixed(2)} c/u
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-lg">
                              <button
                                type="button"
                                onClick={() => updatePendingQuantity(p.service.id, -1)}
                                className="p-1.5 hover:bg-white/10 rounded-l-lg"
                              >
                                <MinusIcon className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-[11px] font-semibold min-w-[32px] text-center">
                                {p.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updatePendingQuantity(p.service.id, 1)}
                                className="p-1.5 hover:bg-white/10 rounded-r-lg"
                              >
                                <PlusIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <span className="text-[11px] font-semibold w-20 text-right">
                              ${(Number(p.service.price_usd) * p.quantity).toFixed(2)}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => removePendingItem(p.service.id)}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <XMarkIcon className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSavePendingItems}
                      disabled={isSavingItems}
                      className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all disabled:opacity-50 rounded-lg"
                    >
                      {isSavingItems ? "Guardando..." : "Agregar a la Orden"}
                    </button>
                  </div>
                )}
              </>
            )}
            
            {/* Ítems Guardados */}
            <div className="space-y-2">
              {hasItems ? (
                order.items!.map((it) => (
                  <div key={it.id} className="group flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:border-white/20 transition-all rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium truncate">{it.description}</p>
                      <p className="text-[9px] text-white/50 mt-0.5">
                        {it.code} · {it.qty}u × ${Number(it.unit_price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold">${Number(it.subtotal).toFixed(2)}</span>
                      {!readOnly && (
                        <button 
                          onClick={() => handleDeleteItem(it.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/20 rounded-lg"
                        >
                          <TrashIcon className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[11px] text-white/50">
                  {readOnly ? "Sin ítems en la orden" : "Busca servicios para agregar a la orden"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Botón Navegar a Pagos */}
      {!readOnly && hasItems && (
        <button
          onClick={handleGoToPayments}
          className="w-full flex items-center justify-between p-4 border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-all group rounded-lg"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Gestionar Pagos
          </span>
          <div className="flex items-center gap-2">
            {hasBalance && (
              <span className="text-[10px]">
                ${Number(order!.balance_due).toFixed(2)} pendiente
              </span>
            )}
            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
    </div>
  );
};
export default ChargeOrderPanel;