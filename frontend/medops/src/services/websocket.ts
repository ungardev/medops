// src/services/websocket.ts
// =====================================================
// 🔧 INTERFACES WEBSOCKET CORE
// =====================================================
export interface WebSocketMessage {
  type: 'payment_update' | 'system_notification';
  data: any;
  timestamp: string;
  message_id: string;
}
export interface WebSocketConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}
// =====================================================
// 🔧 EVENTOS WEBSOCKET
// =====================================================
export type WebSocketEventType = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'message'
  | 'reconnecting'
  | 'max_reconnect_reached';
export interface WebSocketEvent {
  type: WebSocketEventType;
  data?: any;
  timestamp: string;
}
// =====================================================
// 🔧 SUSCRIPCIÓN WEBSOCKET
// =====================================================
export interface WebSocketSubscription {
  id: string;
  type: string;
  filter: Record<string, any>;
  callback: (data: any) => void;
  createdAt: Date;
}
// =====================================================
// 🚀 WEBSOCKET SERVICE CLASS
// =====================================================
export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private eventListeners: Map<WebSocketEventType, Set<(event: WebSocketEvent) => void>> = new Map();
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;
  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: this.getWebSocketUrl(),
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      debug: false,
      ...config
    };
  }
  // =====================================================
  // 🔧 CONEXIÓN Y MANEJO BÁSICO
  // =====================================================
  /**
   * Inicia la conexión WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.log('WebSocket ya está conectado');
        resolve();
        return;
      }
      this.isManualDisconnect = false;
      this.emitEvent({ type: 'connecting', timestamp: new Date().toISOString() });
      try {
        this.ws = new WebSocket(this.config.url);
        this.setupWebSocketHandlers(resolve, reject);
      } catch (error) {
        this.logError('Error creando WebSocket:', error);
        reject(error);
      }
    });
  }
  /**
   * Configura los handlers del WebSocket
   */
  private setupWebSocketHandlers(resolve: () => void, reject: (error: any) => void): void {
    if (!this.ws) return;
    this.ws.onopen = () => {
      this.log('WebSocket conectado exitosamente');
      this.reconnectAttempts = 0;
      this.emitEvent({ 
        type: 'connected', 
        timestamp: new Date().toISOString() 
      });
      
      // Re-suscribirse a todas las suscripciones existentes
      this.resubscribeAll();
      
      // Iniciar heartbeat
      this.startHeartbeat();
      
      resolve();
    };
    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
    this.ws.onclose = (event) => {
      this.log(`WebSocket desconectado: ${event.code} - ${event.reason}`);
      this.stopHeartbeat();
      this.emitEvent({ 
        type: 'disconnected', 
        data: { code: event.code, reason: event.reason },
        timestamp: new Date().toISOString() 
      });
      // Solo reintentar si no es desconexión manual
      if (!this.isManualDisconnect) {
        this.attemptReconnect();
      }
    };
    this.ws.onerror = (error) => {
      this.logError('WebSocket error:', error);
      this.emitEvent({ 
        type: 'error', 
        data: error,
        timestamp: new Date().toISOString() 
      });
      reject(error);
    };
  }
  /**
   * Maneja mensajes recibidos
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.log('Mensaje recibido:', message);
      this.emitEvent({ 
        type: 'message', 
        data: message,
        timestamp: new Date().toISOString() 
      });
      // Distribuir mensaje a suscripciones relevantes
      this.distributeMessage(message);
    } catch (error) {
      this.logError('Error parseando mensaje:', error);
    }
  }
  /**
   * Distribuye mensaje a suscripciones coincidentes
   */
  private distributeMessage(message: WebSocketMessage): void {
    this.subscriptions.forEach((subscription) => {
      if (this.messageMatchesSubscription(message, subscription)) {
        try {
          subscription.callback(message.data);
        } catch (error) {
          this.logError(`Error en callback de suscripción ${subscription.id}:`, error);
        }
      }
    });
  }
  /**
   * Verifica si un mensaje coincide con una suscripción
   */
  private messageMatchesSubscription(message: WebSocketMessage, subscription: WebSocketSubscription): boolean {
    if (message.type !== subscription.type) {
      return false;
    }
    // Verificar filtros
    for (const [key, value] of Object.entries(subscription.filter)) {
      if (message.data[key] !== value) {
        return false;
      }
    }
    return true;
  }
  // =====================================================
  // 🔧 SUSCRIPCIONES DE PAGOS
  // =====================================================
  subscribeToPayments(
    callback: (data: any) => void,
    institutionId?: number
  ): () => void {
    const subscriptionId = `payments_${Date.now()}`;
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      type: 'payment_update',
      filter: institutionId ? { institution_id: institutionId } : {},
      callback,
      createdAt: new Date()
    };
    this.subscriptions.set(subscriptionId, subscription);
    this.sendSubscriptionMessage(subscription);
    this.log('Suscrito a actualizaciones de pagos');
    return () => this.unsubscribe(subscriptionId);
  }
  // =====================================================
  // 🔧 GESTIÓN DE SUSCRIPCIONES
  // =====================================================
  /**
   * Envía mensaje de suscripción al servidor
   */
  private sendSubscriptionMessage(subscription: WebSocketSubscription): void {
    if (!this.isConnected()) return;
    const message = {
      type: 'subscribe',
      subscription: {
        id: subscription.id,
        type: subscription.type,
        filter: subscription.filter
      }
    };
    this.sendMessage(message);
  }
  /**
   * Re-suscribe a todas las suscripciones activas
   */
  private resubscribeAll(): void {
    this.log('Re-suscibiendo a todas las suscripciones...');
    
    this.subscriptions.forEach(subscription => {
      this.sendSubscriptionMessage(subscription);
    });
  }
  /**
   * Cancela una suscripción específica
   */
  private unsubscribe(subscriptionId: string): void {
    if (this.subscriptions.delete(subscriptionId)) {
      
      // Enviar mensaje de unsubscribe al servidor
      if (this.isConnected()) {
        this.sendMessage({
          type: 'unsubscribe',
          subscription_id: subscriptionId
        });
      }
      this.log(`Suscripción cancelada: ${subscriptionId}`);
    }
  }
  // =====================================================
  // 🔧 RECONEXIÓN Y HEARTBEAT
  // =====================================================
  /**
   * Intenta reconectar automáticamente
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.logError('Máximo número de intentos de reconexión alcanzado');
      this.emitEvent({ 
        type: 'max_reconnect_reached', 
        timestamp: new Date().toISOString() 
      });
      return;
    }
    this.reconnectAttempts++;
    this.emitEvent({ 
      type: 'reconnecting', 
      data: { attempt: this.reconnectAttempts },
      timestamp: new Date().toISOString() 
    });
    this.log(`Intentando reconectar (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.logError('Error en reconexión:', error);
      });
    }, this.config.reconnectInterval);
  }
  /**
   * Inicia heartbeat para mantener conexión activa
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }
    }, this.config.heartbeatInterval);
  }
  /**
   * Detiene heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  // =====================================================
  // 🔧 UTILIDADES Y CONTROL
  // =====================================================
  /**
   * Envía mensaje al servidor WebSocket
   */
  private sendMessage(message: any): void {
    if (!this.isConnected()) {
      this.logError('WebSocket no conectado - mensaje no enviado:', message);
      return;
    }
    try {
      this.ws!.send(JSON.stringify(message));
      this.log('Mensaje enviado:', message);
    } catch (error) {
      this.logError('Error enviando mensaje:', error);
    }
  }
  /**
   * Verifica si WebSocket está conectado
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  /**
   * Desconecta manualmente el WebSocket
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    // Limpiar suscripciones
    this.subscriptions.clear();
    
    this.log('WebSocket desconectado manualmente');
  }
  // =====================================================
  // 🔧 EVENT LISTENERS
  // =====================================================
  /**
   * Agrega listener para eventos WebSocket
   */
  addEventListener(type: WebSocketEventType, callback: (event: WebSocketEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
    // Retornar función de remoción
    return () => {
      this.eventListeners.get(type)?.delete(callback);
    };
  }
  /**
   * Emite evento a listeners
   */
  private emitEvent(event: WebSocketEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          this.logError(`Error en event listener para ${event.type}:`, error);
        }
      });
    }
  }
  // =====================================================
  // 🔧 UTILIDADES DE LOGGING
  // =====================================================
  /**
   * Obtiene URL de WebSocket desde configuración
   */
  private getWebSocketUrl(): string {
    const baseUrl = import.meta.env.VITE_WS_URL || 
                   (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
                   window.location.host;
    
    return `${baseUrl}/ws/payments/`;
  }
  /**
   * Logging con prefix
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocketService]', ...args);
    }
  }
  /**
   * Error logging con prefix
   */
  private logError(...args: any[]): void {
    console.error('[WebSocketService]', ...args);
  }
  // =====================================================
  // 🔧 ESTADO Y ESTADÍSTICAS
  // =====================================================
  /**
   * Obtiene estadísticas de conexión
   */
  getConnectionStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    activeSubscriptions: number;
    uptime?: number;
  } {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      activeSubscriptions: this.subscriptions.size,
      uptime: this.heartbeatTimer ? Date.now() : undefined
    };
  }
  /**
   * Obtiene lista de suscripciones activas
   */
  getActiveSubscriptions(): Array<{
    id: string;
    type: string;
    filter: Record<string, any>;
    createdAt: Date;
  }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      type: sub.type,
      filter: sub.filter,
      createdAt: sub.createdAt
    }));
  }
}
// =====================================================
// 🚀 INSTANCIA GLOBAL Y EXPORTACIONES
// =====================================================
// Instancia global para uso en toda la aplicación
export const wsService = new WebSocketService({
  debug: process.env.NODE_ENV === 'development'
});
// Exportaciones por defecto
export default wsService;
// Constantes útiles (sin reexports duplicados)
export const WEBSOCKET_EVENTS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  MESSAGE: 'message',
  RECONNECTING: 'reconnecting',
  MAX_RECONNECT_REACHED: 'max_reconnect_reached'
} as const;
export const WEBSOCKET_MESSAGE_TYPES = {
  PAYMENT_UPDATE: 'payment_update',
  SYSTEM_NOTIFICATION: 'system_notification',
  HEARTBEAT: 'heartbeat',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe'
} as const;