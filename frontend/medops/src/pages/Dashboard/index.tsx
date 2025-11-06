// src/pages/Dashboard/index.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardSummary } from '@/hooks/dashboard/useDashboard';
import { FinancialSummaryWidget } from '@/components/Dashboard/FinancialSummaryWidget';
import { ClinicalFlowWidget } from '@/components/Dashboard/ClinicalFlowWidget';
import NotificationsFeed from '@/components/Dashboard/NotificationsFeed';
import { TrendsWidget } from '@/components/Dashboard/TrendsWidget';
import { QuickActionsWidget } from '@/components/Dashboard/QuickActionsWidget';

const qc = new QueryClient();

export default function DashboardPage() {
  return (
    <QueryClientProvider client={qc}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

function DashboardContent() {
  const { data, isLoading, refetch } = useDashboardSummary();

  return (
    <main className="container">
      <header className="header">
        <h2>Dashboard MedOps</h2>
        <button onClick={() => refetch()} className="btn btn-outline">Actualizar</button>
      </header>

      <section className="grid">
        <FinancialSummaryWidget data={data} />
        <ClinicalFlowWidget data={data} />
        <NotificationsFeed />
        <TrendsWidget data={data} />
        <QuickActionsWidget />
      </section>
    </main>
  );
}
