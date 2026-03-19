// src/utils/serviceStatusConfig.ts
export const SERVICE_STATUS_CONFIG = {
  APPOINTMENT: {
    states: ['all', 'pending', 'arrived', 'in_consultation', 'completed', 'canceled'],
    labels: {
      all: 'Todas',
      pending: 'Pendientes',
      arrived: 'Llegaron',
      in_consultation: 'En Consulta',
      completed: 'Completadas',
      canceled: 'Canceladas'
    }
  },
  PROCEDURE: {
    states: ['all', 'scheduled', 'preparing', 'in_progress', 'completed', 'cancelled'],
    labels: {
      all: 'Todas',
      scheduled: 'Programados',
      preparing: 'Preparando',
      in_progress: 'En Progreso',
      completed: 'Completados',
      cancelled: 'Cancelados'
    }
  },
  DIAGNOSTIC: {
    states: ['all', 'scheduled', 'in_progress', 'completed', 'cancelled'],
    labels: {
      all: 'Todas',
      scheduled: 'Programados',
      in_progress: 'En Proceso',
      completed: 'Completados',
      cancelled: 'Cancelados'
    }
  },
  PHARMACY: {
    states: ['all', 'pending', 'dispensed', 'completed', 'cancelled'],
    labels: {
      all: 'Todas',
      pending: 'Pendientes',
      dispensed: 'Dispensado',
      completed: 'Completado',
      cancelled: 'Cancelado'
    }
  },
  PACKAGE: {
    states: ['all', 'active', 'completed', 'cancelled'],
    labels: {
      all: 'Todos',
      active: 'Activos',
      completed: 'Completados',
      cancelled: 'Cancelados'
    }
  },
  ADMIN: {
    states: ['all', 'pending', 'completed', 'cancelled'],
    labels: {
      all: 'Todos',
      pending: 'Pendientes',
      completed: 'Completados',
      cancelled: 'Cancelados'
    }
  }
};